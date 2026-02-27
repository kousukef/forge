# Dart Rules

Dart 言語固有のルールと慣用句。Dart コードを書く際に常時参照する。

---

## Null Safety

### Null 安全な型設計

```dart
// ✅ Good: 非 null 型を優先
class User {
  final String id;
  final String name;
  const User({required this.id, required this.name});
}

// ✅ Good: null を許容する場合は明示
class UserProfile {
  final String userId;
  final String? avatarUrl;  // null = 未設定
  const UserProfile({required this.userId, this.avatarUrl});
}
```

### ! 演算子の使用制限

```dart
// ❌ Bad: ! の安易な使用
final name = user!.name;  // NullPointerException のリスク

// ✅ Good: if チェックで安全にアクセス
if (user != null) {
  final name = user.name;  // スマートキャスト
}

// ✅ Good: ?? で代替値を提供
final name = user?.name ?? '名前なし';

// ✅ Good: early return で null チェック
String getName(User? user) {
  if (user == null) return '名前なし';
  return user.name;
}

// ! を使う場合は必ずコメントで根拠を説明
final controller = _controller!;  // initState で初期化済みのため非 null
```

### late の適切な使用

```dart
// ✅ Good: initState で初期化される場合
class _MyWidgetState extends State<MyWidget> {
  late final AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
}

// ❌ Bad: 初期化されない可能性がある late
late String _name;  // いつ初期化されるか不明
```

---

## Dart 慣用句

### const コンストラクタ

```dart
// ✅ Good: 不変オブジェクトは const
class AppColors {
  static const Color primary = Color(0xFF6200EE);
  static const Color secondary = Color(0xFF03DAC6);
  
  const AppColors._();  // インスタンス化を禁止
}

// Widget も const で生成
const Text('Hello'),
const SizedBox(height: 16),
const Icon(Icons.home),
```

### データクラスパターン

```dart
// ✅ Good: Equatable を使った値等価性
class User extends Equatable {
  final String id;
  final String name;
  final String email;

  const User({
    required this.id,
    required this.name,
    required this.email,
  });

  User copyWith({
    String? id,
    String? name,
    String? email,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
    );
  }

  @override
  List<Object?> get props => [id, name, email];

  @override
  String toString() => 'User(id: $id, name: $name, email: $email)';
}
```

### sealed class（Dart 3.0以降）

```dart
// ✅ Good: sealed class でパターンマッチング
sealed class UserState {}
class UserInitial extends UserState {}
class UserLoadInProgress extends UserState {}
class UserLoadSuccess extends UserState {
  final User user;
  UserLoadSuccess(this.user);
}
class UserLoadFailure extends UserState {
  final String message;
  UserLoadFailure(this.message);
}

// switch で網羅性を強制
Widget buildBody(UserState state) {
  return switch (state) {
    UserInitial() => const SizedBox.shrink(),
    UserLoadInProgress() => const CircularProgressIndicator(),
    UserLoadSuccess(:final user) => UserProfileWidget(user: user),
    UserLoadFailure(:final message) => ErrorWidget(message: message),
  };
}
```

### 拡張関数（Extension）

```dart
// ✅ Good: 既存クラスに機能追加
extension StringExtension on String {
  String get capitalize => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
  bool get isValidEmail => RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(this);
}

extension DateTimeExtension on DateTime {
  String toFormattedString() => '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
}

// 使用例
final greeting = 'hello'.capitalize;  // 'Hello'
```

---

## 非同期処理

### async/await パターン

```dart
// ✅ Good: async/await で可読性を維持
Future<User> fetchUser(String userId) async {
  try {
    final response = await dio.get('/users/$userId');
    return User.fromJson(response.data as Map<String, dynamic>);
  } on DioException catch (exception) {
    throw ServerException(message: exception.message ?? 'ネットワークエラー');
  }
}

// ❌ Bad: then チェーンは読みにくい
Future<User> fetchUser(String userId) {
  return dio.get('/users/$userId')
    .then((response) => User.fromJson(response.data))
    .catchError((error) => throw ServerException(message: error.toString()));
}
```

### Future の並列実行

```dart
// ✅ Good: 独立した Future は並列で実行
final (user, orders) = await (
  userRepository.getUser(userId),
  orderRepository.getOrders(userId),
).wait;

// または Future.wait を使用
final results = await Future.wait([
  userRepository.getUser(userId),
  orderRepository.getOrders(userId),
]);
```

### unawaited の使用

```dart
// ✅ Good: 意図的に待機しない Future は明示する
import 'dart:async' show unawaited;

unawaited(analyticsService.logEvent('page_view'));  // 意図的に await しない
```

---

## StreamSubscription 管理

### サブスクリプションのライフサイクル管理

```dart
// ✅ Good: dispose() で必ずキャンセル
class _MyWidgetState extends State<MyWidget> {
  StreamSubscription<Event>? _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = eventStream.listen((event) {
      setState(() {
        // 状態更新
      });
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

// ✅ Good: BLoC の close() でキャンセル
class UserBloc extends Bloc<UserEvent, UserState> {
  StreamSubscription<User>? _userSubscription;

  @override
  Future<void> close() async {
    await _userSubscription?.cancel();
    return super.close();
  }
}

// ❌ Bad: サブスクリプションを変数に保存しない
void init() {
  someStream.listen((event) => print(event));  // キャンセルできない！
}
```

### StreamController の管理

```dart
// ✅ Good: StreamController を適切に close
class EventService {
  final _controller = StreamController<AppEvent>.broadcast();
  Stream<AppEvent> get events => _controller.stream;

  void add(AppEvent event) => _controller.add(event);

  void dispose() {
    _controller.close();
  }
}
```

---

## エラーハンドリング

### Exception の階層設計

```dart
// カスタム例外の定義
class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => 'AppException: $message';
}

class ServerException extends AppException {
  const ServerException({required String message}) : super(message);
}

class CacheException extends AppException {
  const CacheException({required String message}) : super(message);
}

class NetworkException extends AppException {
  const NetworkException({required String message}) : super(message);
}
```

### try/catch のベストプラクティス

```dart
// ✅ Good: 具体的な例外型をキャッチ
try {
  final data = await fetchData();
  return Right(data);
} on ServerException catch (exception) {
  return Left(ServerFailure(exception.message));
} on NetworkException catch (exception) {
  return Left(NetworkFailure(exception.message));
} catch (exception, stackTrace) {
  // 予期しない例外はログに記録して再スロー
  debugPrint('Unexpected error: $exception\n$stackTrace');
  rethrow;
}

// ❌ Bad: 空の catch
try {
  await someOperation();
} catch (e) {
  // 何もしない（エラーを隠蔽）
}
```

---

## コードスタイル

### ファイル命名規則

| 種類 | 命名 | 例 |
|------|------|-----|
| Widget ページ | snake_case + _page.dart | `user_profile_page.dart` |
| Widget コンポーネント | snake_case + _widget.dart | `user_avatar_widget.dart` |
| BLoC | snake_case + _bloc.dart | `user_bloc.dart` |
| Cubit | snake_case + _cubit.dart | `counter_cubit.dart` |
| State | snake_case + _state.dart | `user_state.dart` |
| Event | snake_case + _event.dart | `user_event.dart` |
| UseCase | snake_case + _use_case.dart | `get_user_use_case.dart` |
| Repository（IF） | snake_case + _repository.dart | `user_repository.dart` |
| Repository（実装） | snake_case + _repository_impl.dart | `user_repository_impl.dart` |
| Model（DTO） | snake_case + _model.dart | `user_model.dart` |
| Entity | snake_case + _entity.dart（またはモデル名のみ） | `user.dart` |

### import の順序

```dart
// 1. dart:xxx
import 'dart:async';
import 'dart:convert';

// 2. package:xxx（外部パッケージ）
import 'package:bloc/bloc.dart';
import 'package:flutter/material.dart';

// 3. package:myapp/xxx（自プロジェクト）
import 'package:myapp/core/error/failures.dart';
import 'package:myapp/features/user/domain/entities/user.dart';
```
