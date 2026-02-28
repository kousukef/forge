# vercel-composition-patterns: 設計ガイダンス

## パターン適用の判断フローチャート

1. boolean prop が2つ以上ある? → Explicit Variants パターンへリファクタ
2. サブコンポーネント間で状態共有が必要? → Compound Components + Context Provider
3. コンポーネント外から状態アクセスが必要? → 状態を Provider にリフト
4. renderX props を使っている? → children Composition に置き換え
5. 状態実装の差し替えが想定される? → 汎用コンテキストインターフェースで依存注入
6. React 19? → forwardRef 削除、useContext を use() に、Context.Provider を Context に

## コンポーネントアーキテクチャ（HIGH）

### Boolean Prop と Explicit Variants のトレードオフ

- boolean prop 1つで状態の組み合わせが2倍。3つで8通り、4つで16通り
- boolean の組み合わせにより「不可能な状態」が生まれる（isEditing かつ isForwarding 等）
- Explicit Variants: 各バリアントコンポーネントが使用する Provider、UI 要素、アクションを明示
- 不可能な状態が構造的に存在しない設計になる
- バリアント間で共有するパーツは Compound Components として抽出

### Compound Components の設計指針

- 共有コンテキストを持つサブコンポーネント群として構成
- 各サブコンポーネントは Context 経由で共有状態にアクセス
- prop drilling なしで柔軟な合成を実現
- 利用側は必要なパーツを明示的に合成する

## 状態管理の設計（MEDIUM）

### Container/Presentational の分離

- Provider（Container）だけが状態管理の実装を知る
- UI（Presentational）はコンテキストインターフェースを消費するだけ
- UI を変更せずに状態実装を差し替え可能にする
- 状態管理ライブラリの変更が UI に波及しない

### 汎用コンテキストインターフェースの設計

- state, actions, meta の3部構成でインターフェースを定義
- state: 現在の状態（input, attachments, isSubmitting 等）
- actions: 状態を変更する関数（update, submit 等）
- meta: 付随する参照情報（inputRef 等）
- 異なる Provider が同じインターフェースを実装可能（依存注入）
- ローカル状態版とグローバル同期状態版を Provider の差し替えだけで切り替え

### 状態リフトの設計判断

- コンポーネント境界外から状態アクセスが必要な場合、状態を Provider にリフトする
- 共有状態を必要とするコンポーネントは視覚的にネストされている必要はない
- 同じ Provider 内にあればアクセス可能
- Dialog 内のフォームと Dialog 外のアクションボタンで状態共有するケースが典型

## 実装パターン（MEDIUM）

### children Composition vs render props

- children による合成: より読みやすく、自然に合成される。デフォルトの選択
- render props が適切なのは: 親から子にデータを渡す必要がある場合のみ
- renderX props は型安全性が低く、IDE サポートも限定的

## React 19 API 互換性の設計

### 移行判断

- ref as prop: 新規コンポーネントでは forwardRef を使わない。ref を直接 props で受け取る
- use(): useContext の置き換え。条件分岐内でも呼び出せる
- Context Provider: Context.Provider ではなく Context を直接使用

### 段階的移行の指針

- 既存コードは段階的に移行。新規コードは React 19 API を使用
- forwardRef の削除は破壊的変更にならない（既存の ref 利用は動作する）
- Context.Provider から Context への変更は JSX 記法の変更のみ

## アンチパターンと回避策

- boolean prop の増殖: 指数的複雑性。Explicit Variants で構造的に解消
- render props の乱用: 可読性低下。children composition に置き換え
- prop drilling: Context + Compound Components で解消
- UI と状態管理の結合: Container/Presentational 分離で解消
- コンポーネント内に状態が閉じ込め: Provider にリフトして外部からもアクセス可能に
