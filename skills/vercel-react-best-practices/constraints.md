# vercel-react-best-practices: 技術的制約

- Hooks はトップレベルでのみ呼び出し。条件分岐・ループ内は不可（`use()` は例外）
- カスタムフックは `use` プレフィックス必須
- `any` 型禁止。`unknown` + 型ガードを使用
- `{count && <Component />}` は count=0 で "0" を表示する。三項演算子を使う
- 派生状態は render 中に計算する。Effect で setState しない
- バレルファイル（index.ts からの再 export）は避ける。直接パスでインポート
- Server → Client の props は必要最小限に絞る（シリアライズコスト最小化）
- useEffect 内でのデータフェッチは SWR / React Query を優先
- useEffect の依存配列を正確に記述。ESLint exhaustive-deps ルールに従う
- React 19: forwardRef は不要。ref を直接 props で受け取る
- React 19: useContext の代わりに use() を使用
- 独立した非同期処理は必ず Promise.all() で並列化する
