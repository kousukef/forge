# vercel-react-best-practices: 設計ガイダンス

## パフォーマンス最適化の優先度と判断基準

### 1. ウォーターフォール排除（CRITICAL）

- 独立した非同期処理は必ず Promise.all() で並列化する
- 各 sequential await はフルネットワークレイテンシを追加する
- await を実際に使うブランチまで遅延する（async-defer-await）
- Suspense バウンダリで段階的にコンテンツをストリームする

### 2. バンドルサイズ最適化（CRITICAL）

- バレルファイルは 200-800ms のインポートコストを発生させる。直接パスでインポート
- 重いコンポーネントは next/dynamic で動的インポート
- 分析・ログは hydration 後にロード
- フィーチャー有効時のみモジュールロード

### 3. サーバーサイドパフォーマンス（HIGH）

- React.cache() でリクエスト内の重複排除
- RSC 境界でのシリアライズコストを最小化。クライアントに送るデータは必要最小限
- after() でノンブロッキング処理
- Server Actions は API Route 同様に認証チェック必須

### 4. 再レンダリング最適化（MEDIUM）

- 派生状態は render 中に計算する。Effect で setState しない
- 不要な再レンダリングの防止: 状態の購読範囲を最小化する
- 関数形式の setState で安定コールバック
- 高コスト初期値は useState に関数を渡す（lazy initialization）
- 単純プリミティブ式に useMemo は不要
- 非緊急更新は startTransition で優先度を下げる
- 高頻度一時値は ref で保持（再レンダリング不要）

### 5. レンダリングパフォーマンス（MEDIUM）

- 条件付きレンダリングは && ではなく三項演算子を使う（0 の表示を防ぐ）
- 静的 JSX はコンポーネント外に抽出して再レンダリングを回避
- 長いリストには content-visibility で表示最適化
- ローディング状態は useTransition を推奨

### 6. JavaScript パフォーマンス（LOW-MEDIUM）

- 繰り返し検索には Map でインデックス構築（O(1) ルックアップ）
- 複数の filter/map を1ループに統合
- RegExp 生成はループ外に巻き上げ
- 高コスト比較の前に配列長チェック

## React 19 新 API の設計指針

### ref as prop

- forwardRef は不要。ref を直接 props で受け取る
- 新規コンポーネントでは forwardRef を使わない。既存コードは段階的に移行

### use() API

- Promise または Context の値をレンダー中に読み取る
- 条件分岐やループ内で呼び出し可能（Hooks とは異なる）
- Promise の use() は必ず Suspense + ErrorBoundary 内で使用

### useActionState

- フォームアクションの状態管理用フック
- form action と組み合わせて宣言的なフォーム管理
- 手動の onSubmit + e.preventDefault() は避ける

### useOptimistic

- 非同期操作中に楽観的 UI 更新を即座に反映
- 操作失敗時は自動的にロールバック
- useActionState と組み合わせて即座のフィードバックとサーバー状態同期を両立

### ref クリーンアップ関数

- ref コールバックからクリーンアップ関数を返せる（React 19）
- リソースの確保と解放が必要な ref には必ずクリーンアップ関数を返す

## コンポーネント設計の指針

### 単一責任

- 1コンポーネント = 1つの責務
- 表示ロジック（UI）とビジネスロジック（データ取得・加工）を分離
- カスタムフックでロジックを抽出し、コンポーネントは描画に専念

### 型安全性

- Props は必ず TypeScript の型/インターフェースで定義
- any 禁止。unknown + 型ガードを使用
- ジェネリックコンポーネントで再利用性と型安全性を両立

### Hooks ベストプラクティス

- Hooks はトップレベルでのみ呼び出し。条件分岐・ループ内不可（use() は例外）
- useEffect の依存配列を正確に記述（ESLint exhaustive-deps 準拠）
- useEffect 内でのデータフェッチは SWR / React Query を優先
- クリーンアップ関数でリソースリーク防止

### アクセシビリティ

- セマンティック HTML 要素を優先
- インタラクティブ要素に適切な aria-* 属性
- キーボードナビゲーション対応
- role="alert" でエラーメッセージをスクリーンリーダーに通知

### テスタビリティ

- Props 駆動の設計で外部依存を注入可能に
- data-testid でテスト用セレクタを提供
- 副作用をカスタムフックに分離してモック可能に
