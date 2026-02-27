# Drift Conventions

Drift（旧 moor）を使ったローカルデータベースの実装規約。

---

## テーブル定義

```dart
// ✅ Good: Drift のテーブル定義
import 'package:drift/drift.dart';

// テーブル名は PascalCase（単数形）
class Users extends Table {
  // 主キーは autoIncrement() または text()
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text().withLength(min: 1, max: 100)();
  TextColumn get email => text().unique()();
  TextColumn get passwordHash => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().nullable()();
}

// ✅ Good: 外部キーの設定
class Orders extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get userId => integer().references(Users, #id)();
  RealColumn get amount => real().check(amount.isBiggerThan(const Constant(0)))();
  DateTimeColumn get orderedAt => dateTime().withDefault(currentDateAndTime)();
}
```

---

## データベース定義

```dart
// ✅ Good: @DriftDatabase アノテーション
@DriftDatabase(tables: [Users, Orders])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  // スキーマバージョン（マイグレーションで更新）
  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator migrator) async {
        await migrator.createAll();
      },
      onUpgrade: (Migrator migrator, int from, int to) async {
        if (from < 2) {
          // v1 -> v2: users テーブルに email カラムを追加
          await migrator.addColumn(users, users.email);
        }
      },
    );
  }
}
```

---

## DAO（Data Access Object）

```dart
// ✅ Good: DAO に CRUD 操作をカプセル化
part 'user_dao.g.dart';

@DriftAccessor(tables: [Users])
class UserDao extends DatabaseAccessor<AppDatabase> with _$UserDaoMixin {
  UserDao(super.db);

  // ✅ Good: Stream で変更を監視
  Stream<List<User>> watchAllUsers() => select(users).watch();

  // ✅ Good: パラメータ化クエリ（SQL インジェクション防止）
  Future<User?> getUserById(int id) {
    return (select(users)..where((user) => user.id.equals(id))).getSingleOrNull();
  }

  // ✅ Good: トランザクション
  Future<void> insertUserAndOrders(
    UsersCompanion user,
    List<OrdersCompanion> orders,
  ) {
    return transaction(() async {
      final userId = await into(users).insert(user);
      for (final order in orders) {
        await into(this.orders).insert(order.copyWith(userId: Value(userId)));
      }
    });
  }

  // ✅ Good: upsert（INSERT OR REPLACE）
  Future<void> upsertUser(UsersCompanion user) {
    return into(users).insertOnConflictUpdate(user);
  }

  Future<bool> deleteUser(int id) async {
    final count = await (delete(users)..where((user) => user.id.equals(id))).go();
    return count > 0;
  }
}
```

---

## マイグレーション戦略

```dart
// ✅ Good: 段階的なマイグレーション
@override
MigrationStrategy get migration {
  return MigrationStrategy(
    onCreate: (Migrator migrator) async {
      await migrator.createAll();
      // 初期データの投入
      await _insertInitialData();
    },
    onUpgrade: (Migrator migrator, int from, int to) async {
      // 各バージョン間の差分を適用
      for (var version = from + 1; version <= to; version++) {
        await _migrateToVersion(migrator, version);
      }
    },
    beforeOpen: (OpenedDatabase database) async {
      // WAL モードを有効化（パフォーマンス改善）
      await database.customStatement('PRAGMA journal_mode=WAL');
      // 外部キー制約を有効化
      await database.customStatement('PRAGMA foreign_keys=ON');
    },
  );
}

Future<void> _migrateToVersion(Migrator migrator, int version) async {
  switch (version) {
    case 2:
      await migrator.addColumn(users, users.email);
    case 3:
      await migrator.createTable(orders);
    default:
      throw StateError('Unknown migration version: $version');
  }
}
```

---

## TypeConverter

```dart
// ✅ Good: カスタム型のコンバーター
class ColorConverter extends TypeConverter<Color, int> {
  const ColorConverter();

  @override
  Color fromSql(int fromDb) => Color(fromDb);

  @override
  int toSql(Color value) => value.value;
}

// テーブルでの使用
class Settings extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get themeColor => integer().map(const ColorConverter())();
}
```

---

## クエリ最適化

```dart
// ✅ Good: 必要なカラムのみ取得
Future<List<UserPreview>> getUserPreviews() {
  return (select(users)
    ..orderBy([(user) => OrderingTerm.asc(user.name)])
  ).map((user) => UserPreview(id: user.id, name: user.name)).get();
}

// ✅ Good: JOIN クエリ
Future<List<OrderWithUser>> getOrdersWithUsers() {
  final query = select(orders).join([
    innerJoin(users, users.id.equalsExp(orders.userId)),
  ]);

  return query.map((row) {
    return OrderWithUser(
      order: row.readTable(orders),
      user: row.readTable(users),
    );
  }).get();
}

// ✅ Good: ページネーション
Future<List<User>> getUsersPaginated({required int page, int pageSize = 20}) {
  return (select(users)
    ..limit(pageSize, offset: page * pageSize)
    ..orderBy([(user) => OrderingTerm.asc(user.id)])
  ).get();
}

// ❌ Bad: 全件取得してから Dart でフィルタリング
Future<List<User>> getAdultUsers() async {
  final allUsers = await select(users).get();
  return allUsers.where((user) => user.age >= 18).toList();
  // ↑ SQLで絞るべき
}
```

---

## テスト

```dart
// ✅ Good: インメモリデータベースでテスト
void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
  });

  tearDown(() => database.close());

  group('UserDao', () {
    test('ユーザーを挿入して取得できる', () async {
      // Arrange
      const newUser = UsersCompanion(
        name: Value('テストユーザー'),
        email: Value('test@example.com'),
        passwordHash: Value('hashed_password'),
      );

      // Act
      final userId = await database.userDao.insertUser(newUser);
      final user = await database.userDao.getUserById(userId);

      // Assert
      expect(user, isNotNull);
      expect(user!.name, 'テストユーザー');
      expect(user.email, 'test@example.com');
    });
  });
}
```
