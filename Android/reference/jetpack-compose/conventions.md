# Jetpack Compose Conventions

## ファイル構成

- 1 ファイル 1 画面 or 1 コンポーネント（200行超えたら分割）
- Screen Composable は `*Screen.kt`（例: `UserScreen.kt`）
- 再利用可能 Composable は `components/` ディレクトリに

## Composable 関数の構造

```kotlin
@Composable
fun UserScreen(
    uiState: UserUiState,          // 状態（ViewModel から）
    modifier: Modifier = Modifier, // Modifier は2番目
    onUserClick: (String) -> Unit  // コールバック
) {
    // 実装
}
```

## 状態管理パターン

```kotlin
// Screen 単位の ViewModel 参照（hiltViewModel() 使用）
@Composable
fun UserRoute(
    viewModel: UserViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    UserScreen(
        uiState = uiState,
        onUserClick = viewModel::selectUser
    )
}
```

## Preview

```kotlin
@Preview(showBackground = true)
@Preview(uiMode = UI_MODE_NIGHT_YES, showBackground = true)
@Composable
private fun UserScreenPreview() {
    AppTheme {
        UserScreen(
            uiState = UserUiState(user = PreviewData.user),
            onUserClick = {}
        )
    }
}
```

## テーマ適用

- すべての Preview と ルート Composable は `AppTheme { }` でラップ
- カラー・タイポグラフィは `MaterialTheme.colorScheme` / `MaterialTheme.typography` のみ使用

## Modifier ベストプラクティス

- `fillMaxSize()` は画面全体を占有する Composable にのみ使用
- `padding` は親から渡された `modifier` に連鎖させる（自前で付けない）
- `clickable { }` は `Modifier.clickable` で統一（Button 内部は不要）
