# Flutter Conventions

Flutter 全般・Widget・pubspec・プロジェクト設定の規約。

---

## pubspec.yaml 管理

### バージョン指定方針

```yaml
dependencies:
  flutter:
    sdk: flutter
  # ✅ Good: キャレット（^）でマイナー互換
  bloc: ^9.0.0
  flutter_bloc: ^9.0.0
  equatable: ^2.0.5
  
  # ✅ Good: セキュリティ重要パッケージは固定
  flutter_secure_storage: 9.2.4  # セキュリティパッチを即時適用するため固定

dev_dependencies:
  flutter_test:
    sdk: flutter
  bloc_test: ^9.0.0
  mocktail: ^1.0.0
```

### 依存関係の更新

- `flutter pub outdated` で古い依存を定期確認
- メジャーバージョンアップは手動で変更ログを確認してから更新
- セキュリティ関連パッケージは即時更新

---

## Widget 設計原則

### StatelessWidget vs StatefulWidget の選択

```dart
// ✅ Good: BLoC/Riverpod で状態管理 -> StatelessWidget
class UserProfilePage extends StatelessWidget {
  const UserProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<UserBloc, UserState>(
      builder: (context, state) => _buildBody(state),
    );
  }
}

// ✅ Good: ローカル UI 状態のみ -> StatefulWidget
class AnimatedButton extends StatefulWidget {
  final VoidCallback onPressed;
  const AnimatedButton({super.key, required this.onPressed});

  @override
  State<AnimatedButton> createState() => _AnimatedButtonState();
}
```

### Widget の分割基準

- 1 Widget = 1 責務
- `build()` メソッドが 50 行を超えたら分割を検討
- 再利用可能な Widget は `widgets/` ディレクトリに配置

### const Widget の活用

```dart
// ✅ Good: 変化しない Widget に const
@override
Widget build(BuildContext context) {
  return const Scaffold(
    appBar: AppBar(title: Text('ユーザー一覧')),
    body: UserListWidget(),  // const で無駄なリビルドを防止
  );
}
```

---

## テーマとスタイル

### ThemeData の設定

```dart
// ✅ Good: テーマで一元管理
ThemeData buildTheme() {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6200EE)),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
      ),
    ),
  );
}

// ✅ Good: Theme.of(context) から色を取得
final primaryColor = Theme.of(context).colorScheme.primary;
final bodyStyle = Theme.of(context).textTheme.bodyMedium;

// ❌ Bad: ハードコードされた色
const Color myPrimaryColor = Color(0xFF6200EE);  // テーマと乖離する
```

---

## アクセシビリティ

### Semantics の設定

```dart
// ✅ Good: ボタンに semanticsLabel
IconButton(
  onPressed: onPressed,
  icon: const Icon(Icons.delete),
  tooltip: '削除',  // semanticLabel として機能
),

// ✅ Good: 画像に semanticLabel
Image.asset(
  'assets/logo.png',
  semanticLabel: 'アプリロゴ',
),

// ✅ Good: 装飾的な画像は除外
Image.asset(
  'assets/background.png',
  excludeFromSemantics: true,
),

// ✅ Good: カスタム Semantics
Semantics(
  label: '${item.name}を選択、価格: ${item.price}円',
  button: true,
  child: GestureDetector(onTap: () => onItemSelected(item), child: ItemCard(item: item)),
),
```

### タップターゲットサイズ

```dart
// ✅ Good: 最小タップターゲット 48x48 dp
SizedBox(
  width: 48,
  height: 48,
  child: InkWell(
    onTap: onTap,
    child: const Icon(Icons.chevron_right, size: 24),
  ),
),
```

---

## レスポンシブデザイン

```dart
// ✅ Good: MediaQuery で画面サイズに応じたレイアウト
@override
Widget build(BuildContext context) {
  final screenWidth = MediaQuery.of(context).size.width;
  final isTablet = screenWidth >= 600;

  return isTablet
      ? _buildTabletLayout()
      : _buildPhoneLayout();
}

// ✅ Good: LayoutBuilder でコンテナサイズに応じたレイアウト
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth >= 600) {
      return _buildWideLayout();
    }
    return _buildNarrowLayout();
  },
),
```

---

## フォームとバリデーション

```dart
// ✅ Good: Form ウィジェットでバリデーション
class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'メールアドレス'),
            validator: (value) {
              if (value == null || value.isEmpty) return 'メールアドレスを入力してください';
              if (!value.contains('@')) return '有効なメールアドレスを入力してください';
              return null;
            },
          ),
        ],
      ),
    );
  }
}
```

---

## Navigator と go_router

```dart
// ✅ Good: go_router での画面遷移
// 宣言的なルーティング
final GoRouter router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/users/:id',
      builder: (context, state) {
        final userId = state.pathParameters['id']!;
        return UserProfilePage(userId: userId);
      },
    ),
  ],
);

// 画面遷移
context.go('/users/123');           // 戻れない遷移
context.push('/users/123');          // 戻れる遷移
context.pop();                       // 戻る
```
