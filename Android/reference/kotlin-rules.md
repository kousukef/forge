# Kotlin Rules

## Null Safety（厳守）

- `!!` 演算子禁止。代わりに `?.`、`?: return`、`?: throw IllegalStateException(...)` を使う
- `lateinit` は DI で注入するフィールド（`@Inject`）のみ許可
- `?` 型を返す関数の呼び出し元は必ずハンドリング

## 型安全

- `Any` 型の使用は最小限（必要な場合は `sealed interface` でラップ）
- キャスト (`as`) は `as?` を使い `ClassCastException` を防ぐ
- `is` チェック後はスマートキャストを活用

## 不変性（イミュータビリティ）

- `val` を優先。`var` は状態変化が明確な場合のみ
- コレクションは `listOf`, `mapOf`, `setOf`（不変）を優先
- 変更が必要なコレクションは `mutableListOf` 等を使い、パブリック API では不変インターフェースを返す

## 関数型プログラミング

- `map`, `filter`, `fold`, `flatMap` 等を使い命令型ループを避ける
- 大量データ処理は `Sequence` / `asSequence()` で遅延評価
- 高階関数の lambda は最終引数ならトレーリングラムダ構文を使う

## エラーハンドリング

- `Result<T>` で成功/失敗を表現（例外を使わない）
- `runCatching { }` で例外を `Result` に変換
- `catch` ブロックで例外を握り潰さない（必ずログまたは再スロー）

## coroutines との組み合わせ

- `suspend fun` は `Result<T>` を返す（例外を throw しない）
- `flow { emit(...) }` 内の例外は `catch` オペレータで処理
