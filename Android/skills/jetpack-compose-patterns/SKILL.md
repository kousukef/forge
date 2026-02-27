---
name: jetpack-compose-patterns
description: "Jetpack Compose の状態ホイスティング・副作用・再コンポジション最適化・アクセシビリティのベストプラクティス"
---

# Jetpack Compose Patterns

## 状態ホイスティング

状態は使用する最上位の Composable に引き上げる（State Hoisting）。

```kotlin
// WRONG: 状態を内部で持つ
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) { Text("$count") }
}

// CORRECT: 状態をホイスト
@Composable
fun Counter(count: Int, onIncrement: () -> Unit) {
    Button(onClick = onIncrement) { Text("$count") }
}
```

## 再コンポジション最適化

- `remember` でオブジェクト生成をキャッシュ
- `key()` でリスト要素の再コンポジションスコープを限定
- `derivedStateOf` で派生状態の計算をキャッシュ
- ラムダは `remember { }` でラップ（不要な再コンポジション防止）

```kotlin
// CORRECT: ラムダのメモ化
val onItemClick = remember { { item: Item -> viewModel.select(item) } }
```

- `@Stable` / `@Immutable` アノテーションで安定性を明示

## 副作用

| 副作用 API | 用途 |
|---|---|
| `LaunchedEffect(key)` | key 変化時にコルーチン起動（一度だけ実行は `Unit` キー）|
| `DisposableEffect(key)` | ライフサイクル連動の登録/解除（onDispose 必須） |
| `SideEffect` | Compose 外部へのメインスレッド同期（毎コンポジション） |
| `rememberCoroutineScope` | ユーザー操作起点のコルーチン（クリック等） |

## Composable 設計原則

- 1 Composable = 1 つの UI 責務（200行超えたら分割）
- パラメータは必要最小限（ViewModel を直接渡さない）
- Preview は `@PreviewParameter` でダミーデータを提供
- `Modifier` は必ず先頭パラメータの直後に配置し、外部から合成可能に

```kotlin
@Composable
fun UserCard(
    user: User,
    modifier: Modifier = Modifier,
    onProfileClick: () -> Unit
) { ... }
```

## アクセシビリティ

- `contentDescription` を画像・アイコン Composable に必ず設定
- タッチターゲットは最低 48dp × 48dp
- `semantics` ブロックでスクリーンリーダー向けの説明を追加
- `testTag` を重要 UI 要素に設定（UI テストの安定性向上）

## テーマ・スタイル

- `MaterialTheme.colorScheme`、`MaterialTheme.typography` を使用（ハードコード禁止）
- ダークテーマ対応: `isSystemInDarkTheme()` で分岐せず、`colorScheme` に任せる
