# Coding Standards（Flutter版）

言語非依存のコーディング標準とFlutter固有規約。全作業で適用。

---

## Code Organization

### Flutter プロジェクト構造（feature-first 推奨）

```
lib/
├── core/                   # アプリ全体の共通コンポーネント
│   ├── error/              # エラー型定義（Failure, AppException）
│   ├── network/            # ネットワーク設定（Dio, Interceptor）
│   ├── utils/              # ユーティリティ関数
│   └── widgets/            # 共通 Widget
├── features/               # 機能ごとのモジュール
│   └── <feature_name>/     # 機能モジュール
│       ├── data/           # Data 層
│       │   ├── datasources/  # RemoteDataSource / LocalDataSource
│       │   ├── models/       # DTO（JSON/DB マッピング用）
│       │   └── repositories/ # Repository 実装
│       ├── domain/         # Domain 層（Flutter 非依存）
│       │   ├── entities/   # エンティティ（ビジネスオブジェクト）
│       │   ├── repositories/ # Repository インターフェース（抽象）
│       │   └── usecases/   # UseCase
│       └── presentation/   # Presentation 層
│           ├── bloc/       # BLoC / Cubit（Event, State, BLoC）
│           ├── pages/      # ページ Widget（ルートレベル）
│           └── widgets/    # ページ固有 Widget
├── injection.dart          # DI 設定（get_it + injectable）
└── main.dart               # アプリエントリーポイント

test/
├── core/                   # core のテスト
└── features/               # feature のテスト
    └── <feature_name>/
        ├── data/           # DataSource / Repository のユニットテスト
        ├── domain/         # UseCase のユニットテスト
        └── presentation/   # BLoC / Widget テスト

integration_test/           # インテグレーションテスト
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| ファイル | snake_case | `user_repository.dart` |
| クラス | PascalCase | `UserRepository` |
| 変数/関数 | camelCase | `getUserById()` |
| 定数 | lowerCamelCase or SCREAMING_SNAKE | `kMaxRetryCount` |
| private メンバー | _underscorePrefix | `_subscription` |
| BLoC Event | PastTense PascalCase + Event suffix | `UserLoginRequested` |
| BLoC State | PascalCase + State suffix | `UserLoginSuccess` |
| UseCase | 動詞 + 名詞 + UseCase suffix | `GetUserProfileUseCase` |
| Repository | 名詞 + Repository suffix | `UserRepository` |

---

## Code Quality

### SOLID Principles

- **Single Responsibility**: 各クラスは1つの責務のみ（UseCase は1つのビジネスルール）
- **Open/Closed**: 抽象インターフェース経由で拡張（Repository パターン）
- **Liskov Substitution**: Repository 実装クラスは抽象インターフェースと置換可能
- **Interface Segregation**: 使用しないメソッドを持つインターフェースに依存しない
- **Dependency Inversion**: Domain 層は抽象（Repository インターフェース）に依存

### DRY, KISS, YAGNI

- **DRY**: 重複を避ける（3回以上なら抽象化）
- **KISS**: シンプルに保つ（BLoC の責務を明確に）
- **YAGNI**: 必要になるまで実装しない

---

## Error Handling

### Flutter 向けエラー階層

```dart
// Domain 層のエラー型
abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}
```

### Either パターン（fpdart / dartz）

```dart
// UseCase の戻り値: Either<Failure, T>
Future<Either<Failure, User>> call(GetUserParams params) async {
  return await repository.getUser(params.userId);
}

// BLoC での処理
final result = await getUserUseCase(params);
result.fold(
  (failure) => emit(UserLoadFailure(failure.message)),
  (user) => emit(UserLoadSuccess(user)),
);
```

### エラーハンドリングパターン

```dart
// ✅ Good: 具体的な例外型でキャッチ
try {
  final response = await dio.get('/users/$userId');
  return Right(UserModel.fromJson(response.data));
} on DioException catch (exception) {
  return Left(ServerFailure(exception.message ?? 'サーバーエラーが発生しました'));
} on CacheException catch (exception) {
  return Left(CacheFailure(exception.message));
}

// ❌ Bad: 空の catch
try {
  await someOperation();
} catch (e) {
  // 何もしない
}
```

---

## Logging Standards

### Flutter 向けログレベル

| Level | Use When | Tool |
|-------|----------|------|
| ERROR | システム障害、ユーザー影響あり | `debugPrint` (開発) / logging パッケージ (本番) |
| WARN | 潜在的問題、ユーザー影響なし | `debugPrint` |
| INFO | 重要なビジネスイベント | logging パッケージ |
| DEBUG | 開発時のデバッグ情報 | `debugPrint` のみ（`print` 禁止） |

```dart
// ✅ Good: debugPrint を使用
debugPrint('User logged in: ${user.id}');

// ❌ Bad: print を使用（本番ビルドに残る）
print('User logged in: ${user.id}');
```

---

## Testing Standards

### Flutter テスト構造

```dart
// BLoC テスト（bloc_test パッケージ）
group('UserBloc', () {
  late UserBloc userBloc;
  late MockGetUserUseCase mockGetUserUseCase;

  setUp(() {
    mockGetUserUseCase = MockGetUserUseCase();
    userBloc = UserBloc(getUserUseCase: mockGetUserUseCase);
  });

  tearDown(() {
    userBloc.close();
  });

  blocTest<UserBloc, UserState>(
    '正常なユーザーIDを渡すと UserLoadSuccess を発行する',
    build: () {
      when(() => mockGetUserUseCase(any()))
          .thenAnswer((_) async => Right(tUser));
      return userBloc;
    },
    act: (bloc) => bloc.add(const UserLoadRequested(userId: '1')),
    expect: () => [
      const UserLoadInProgress(),
      UserLoadSuccess(user: tUser),
    ],
  );
});
```

### テスト命名規則

```dart
// Format: [何をテストするか]_[条件]_[期待結果]
test('getUserUseCase_正常なID_Userエンティティを返す', () async {});
test('getUserUseCase_存在しないID_ServerFailureを返す', () async {});
test('UserBloc_初期状態_UserInitialである', () async {});
```

### カバレッジ要件

| Type | Minimum | Target |
|------|---------|--------|
| Unit Tests（UseCase/Repository/BLoC） | 70% | 85% |
| Widget Tests | 50% | 70% |
| Critical Paths | 90% | 100% |

---

## Performance

### Flutter パフォーマンスルール

1. **const を使う**: 不変な Widget は必ず `const` コンストラクタ
2. **build() を軽く**: `build()` 内で重い計算をしない
3. **ListView.builder**: 長いリストは必ず `ListView.builder`
4. **計測してから最適化**: Flutter DevTools でプロファイリング後に最適化

---

## Security

### Flutter セキュリティチェックリスト

| Risk | Prevention |
|------|------------|
| 機密情報の保存 | `flutter_secure_storage` を使用 |
| 平文 HTTP 通信 | `https://` のみ許可 |
| SQLインジェクション | Drift のパラメータ化クエリのみ使用 |
| デバッグ情報の漏洩 | リリースビルドで `--obfuscate` |
| API キーのハードコード | 環境変数または安全なストレージを使用 |

---

_Coding Standards（Flutter版）: 品質 × セキュリティ × 保守性_
