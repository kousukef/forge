# vercel-composition-patterns: 技術的制約

- boolean prop が2つ以上あるコンポーネントは Explicit Variants にリファクタする
- boolean 1つで状態の組み合わせが2倍になる（指数的複雑性）
- render props（renderX）の代わりに children composition を使用する
- Compound Components の共有状態は Context 経由でアクセスする
- 状態管理の実装詳細は Provider（Container）に隔離する
- UI（Presentational）はコンテキストインターフェースのみに依存する
- コンテキストインターフェースは state, actions, meta の3部構成で定義する
- React 19: forwardRef は不要。ref を直接 props で受け取る
- React 19: Context.Provider の代わりに Context を直接使用する
- React 19: useContext の代わりに use() を使用する
- render props が適切なのは、親から子にデータを渡す必要がある場合のみ
