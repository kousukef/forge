# BLoC Conventions

BLoC / Cubit パターンの実装規約。状態管理時に参照する。

---

## BLoC vs Cubit の選択基準

| 条件 | 選択 |
|------|------|
| イベント駆動（複数の入力源） | BLoC |
| シンプルな状態遷移 | Cubit |
| イベントのトレーサビリティが必要 | BLoC |
| フォーム / カウンター等の単純なロジック | Cubit |

---

## Event 設計（BLoC）

```dart
// ✅ Good: sealed class で Event を定義（Dart 3.0以降）
sealed class UserEvent {}

// 命名: 過去形の動詞 + 名詞 + Event
final class UserProfileLoadRequested extends UserEvent {
  final String userId;
  const UserProfileLoadRequested({required this.userId});
}

final class UserProfileRefreshRequested extends UserEvent {}

final class UserLogoutRequested extends UserEvent {}
```

---

## State 設計

```dart
// ✅ Good: sealed class で State を定義
sealed class UserState extends Equatable {}

// 命名: 名詞 + 状態を表す形容詞/名詞
final class UserInitial extends UserState {
  const UserInitial();

  @override
  List<Object?> get props => [];
}

final class UserLoadInProgress extends UserState {
  const UserLoadInProgress();

  @override
  List<Object?> get props => [];
}

final class UserLoadSuccess extends UserState {
  final User user;
  const UserLoadSuccess({required this.user});

  @override
  List<Object?> get props => [user];
}

final class UserLoadFailure extends UserState {
  final String message;
  const UserLoadFailure({required this.message});

  @override
  List<Object?> get props => [message];
}
```

---

## BLoC 実装

```dart
class UserBloc extends Bloc<UserEvent, UserState> {
  final GetUserProfileUseCase _getUserProfileUseCase;

  UserBloc({required GetUserProfileUseCase getUserProfileUseCase})
      : _getUserProfileUseCase = getUserProfileUseCase,
        super(const UserInitial()) {
    on<UserProfileLoadRequested>(_onUserProfileLoadRequested);
    on<UserLogoutRequested>(_onUserLogoutRequested);
  }

  Future<void> _onUserProfileLoadRequested(
    UserProfileLoadRequested event,
    Emitter<UserState> emitter,
  ) async {
    emitter(const UserLoadInProgress());

    final result = await _getUserProfileUseCase(
      GetUserProfileParams(userId: event.userId),
    );

    result.fold(
      (failure) => emitter(UserLoadFailure(message: failure.message)),
      (user) => emitter(UserLoadSuccess(user: user)),
    );
  }

  Future<void> _onUserLogoutRequested(
    UserLogoutRequested event,
    Emitter<UserState> emitter,
  ) async {
    emitter(const UserInitial());
  }
}
```

---

## Cubit 実装

```dart
class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);

  void increment() => emit(state + 1);
  void decrement() => emit(state - 1);
  void reset() => emit(0);
}
```

---

## BlocProvider の配置

```dart
// ✅ Good: 必要なスコープにのみ提供
// ページレベル（そのページのみで使用）
BlocProvider(
  create: (context) => UserBloc(
    getUserProfileUseCase: context.read<GetUserProfileUseCase>(),
  )..add(UserProfileLoadRequested(userId: userId)),
  child: const UserProfilePage(),
),

// ✅ Good: 複数ページで共有する場合は上位スコープ
MultiBlocProvider(
  providers: [
    BlocProvider(create: (context) => AuthBloc(authUseCase: context.read())),
    BlocProvider(create: (context) => ThemeBloc()),
  ],
  child: const MyApp(),
),
```

---

## BlocBuilder / BlocListener の使い分け

```dart
// ✅ Good: UI ビルドには BlocBuilder
BlocBuilder<UserBloc, UserState>(
  // buildWhen で不要なリビルドを防止
  buildWhen: (previous, current) => previous != current,
  builder: (context, state) {
    return switch (state) {
      UserInitial() => const SizedBox.shrink(),
      UserLoadInProgress() => const CircularProgressIndicator(),
      UserLoadSuccess(:final user) => UserProfileWidget(user: user),
      UserLoadFailure(:final message) => ErrorWidget(message: message),
    };
  },
),

// ✅ Good: 副作用（ナビゲーション、SnackBar）には BlocListener
BlocListener<AuthBloc, AuthState>(
  listenWhen: (previous, current) => current is AuthLogoutSuccess,
  listener: (context, state) {
    context.go('/login');  // ログアウト時にログイン画面へ
  },
  child: const HomeContent(),
),

// ✅ Good: 両方必要な場合は BlocConsumer
BlocConsumer<UserBloc, UserState>(
  buildWhen: (previous, current) => current is! UserLoadInProgress,
  builder: (context, state) => UserProfileWidget(state: state),
  listenWhen: (previous, current) => current is UserLoadFailure,
  listener: (context, state) {
    if (state is UserLoadFailure) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(state.message)),
      );
    }
  },
),
```

---

## BLoC テスト（bloc_test パッケージ）

```dart
group('UserBloc', () {
  late UserBloc userBloc;
  late MockGetUserProfileUseCase mockGetUserProfileUseCase;

  setUp(() {
    mockGetUserProfileUseCase = MockGetUserProfileUseCase();
    userBloc = UserBloc(getUserProfileUseCase: mockGetUserProfileUseCase);
  });

  tearDown(() => userBloc.close());

  test('初期状態は UserInitial であること', () {
    expect(userBloc.state, const UserInitial());
  });

  blocTest<UserBloc, UserState>(
    'UserProfileLoadRequested を追加すると成功時に UserLoadSuccess を発行する',
    build: () {
      when(() => mockGetUserProfileUseCase(any()))
          .thenAnswer((_) async => Right(tUser));
      return userBloc;
    },
    act: (bloc) => bloc.add(const UserProfileLoadRequested(userId: 'user-1')),
    expect: () => [
      const UserLoadInProgress(),
      UserLoadSuccess(user: tUser),
    ],
    verify: (_) {
      verify(() => mockGetUserProfileUseCase(
        const GetUserProfileParams(userId: 'user-1'),
      )).called(1);
    },
  );

  blocTest<UserBloc, UserState>(
    'UseCase が失敗した場合に UserLoadFailure を発行する',
    build: () {
      when(() => mockGetUserProfileUseCase(any()))
          .thenAnswer((_) async => Left(ServerFailure('サーバーエラー')));
      return userBloc;
    },
    act: (bloc) => bloc.add(const UserProfileLoadRequested(userId: 'user-1')),
    expect: () => [
      const UserLoadInProgress(),
      const UserLoadFailure(message: 'サーバーエラー'),
    ],
  );
});
```

---

## context.read vs context.watch vs context.select

```dart
// ✅ Good: イベント発行やアクション実行は context.read（リビルドなし）
ElevatedButton(
  onPressed: () => context.read<UserBloc>().add(const UserLogoutRequested()),
  child: const Text('ログアウト'),
),

// ✅ Good: 状態変化でリビルドが必要な場合は context.watch
final state = context.watch<UserBloc>().state;

// ✅ Good: 特定フィールドのみ監視する場合は context.select
final isLoading = context.select<UserBloc, bool>(
  (bloc) => bloc.state is UserLoadInProgress,
);
```
