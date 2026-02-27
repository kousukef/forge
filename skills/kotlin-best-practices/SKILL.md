---
name: kotlin-best-practices
description: "Kotlin の慣用句・Null Safety・拡張関数・データクラス・スコープ関数・sealed class のベストプラクティス"
---

# Kotlin Best Practices

## Null Safety

- `!!` 演算子は禁止。代わりに `?.`、`?: return`、`?: throw` を使う
- `lateinit` は DI で注入するフィールドのみ使用（テストで `isInitialized` チェック）
- `?` 型を返す関数は必ず呼び出し元でハンドリング

```kotlin
// WRONG
val length = str!!.length

// CORRECT
val length = str?.length ?: 0
```

## データクラス

- 状態を表すオブジェクトは `data class` を使い、`copy()` でイミュータブルに更新
- UI State は `data class` で定義し、sealed class/interface でラップしない（UiState は別）

## Sealed Class / Sealed Interface

- 結果型: `sealed interface Result<out T>` を使い `Success`, `Error`, `Loading` を表現
- UI State の状態遷移: `sealed class UiState` でスクリーン状態を表現
- `when` 式は `else` ブランチを極力使わない（コンパイル時の網羅性チェックを活かす）

## スコープ関数

| 関数 | 用途 |
|---|---|
| `let` | null チェック後の処理、スコープを限定した変換 |
| `apply` | オブジェクトの初期化・設定（レシーバを返す） |
| `also` | デバッグ・ログ・副作用（引数として渡される） |
| `run` | 複数処理をまとめてブロック化、結果を返す |
| `with` | 同一オブジェクトへの複数操作 |

スコープ関数の乱用禁止（3段以上のネストは分割する）。

## 拡張関数

- ユーティリティ系は拡張関数で定義し、`object` クラスのヘルパーより優先
- 既存クラスへの追加は明示的な名前で（`String.toFormattedDate()` 等）
- `inline` 関数は lambda を受け取る高階関数に使用

## コレクション操作

- `map`, `filter`, `fold`, `groupBy` 等の関数型 API を優先
- `forEach` でインデックスが必要なら `forEachIndexed`
- 大量データの遅延評価は `Sequence` / `asSequence()` を使用

## 命名規則

- クラス: `PascalCase`（例: `UserRepository`）
- 関数・変数: `camelCase`（例: `getUserById`）
- 定数: `UPPER_SNAKE_CASE`（例: `MAX_RETRY_COUNT`）
- 略語禁止: `ctx` → `context`, `repo` → `repository`, `vm` → `viewModel`
- バッキングプロパティ: `_name`（プライベート）と `name`（パブリック読み取り専用）

```kotlin
private val _uiState = MutableStateFlow(UiState())
val uiState: StateFlow<UiState> = _uiState.asStateFlow()
```
