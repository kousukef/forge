# next-best-practices: 設計ガイダンス

## Server Components vs Client Components の設計判断

### 選択基準

- データ取得が必要 → Server Component（直接 async/await）
- バックエンドリソースへの直接アクセスが必要 → Server Component
- 機密情報（API キー等）を使用 → Server Component
- React Hooks（useState 等）が必要 → Client Component
- ブラウザ API（window 等）が必要 → Client Component
- イベントハンドラ（onClick 等）が必要 → Client Component

### 設計原則

- Client Component は葉ノードに押し込む: インタラクティブな部分だけを `'use client'` で分離
- Server Component を親にする: データ取得は親で行い、結果を Client Component に props で渡す
- 境界を明確にする: `'use client'` ファイルが境界。その import ツリー全体が Client になる
- バンドルサイズの考慮: Server Component は JS バンドルに含まれない

## データ取得パターンの選択

### パターン選択ガイドライン

- ページ表示時の初期データ: Server Component で直接 fetch / DB クエリ
- ユーザー操作によるデータ変更: Server Actions
- クライアント側のリアルタイム更新: SWR / React Query
- 複数コンポーネントで同一データ: React.cache() でリクエスト単位の重複排除
- クロスリクエストのキャッシュ: unstable_cache + タグベース再検証

### ウォーターフォール回避

- 独立したデータ取得は必ず Promise.all で並列実行
- 各 sequential await はフルネットワークレイテンシを追加する

### キャッシュ戦略の設計

- Next.js 15 では fetch() のデフォルトが no-store に変更。キャッシュは明示的に指定
- 時間ベース再検証: revalidate オプションで秒数指定
- タグベース再検証: revalidateTag で特定データ群を無効化
- Server Actions 後は revalidatePath / revalidateTag でキャッシュ無効化

## ファイルベースルーティングの設計考慮

### 特殊ファイルの設計トレードオフ

- layout.tsx vs template.tsx: layout はナビゲーション間で状態保持（再マウントなし）。template はナビゲーション毎に再マウント。状態リセットが必要な場合のみ template を選択
- loading.tsx vs Suspense: loading.tsx はルート全体のフォールバック。部分的な制御には Suspense を使い、独立したデータソースを別々の Suspense バウンダリで囲む
- error.tsx の境界: 同セグメントの page.tsx と子コンポーネントのエラーをキャッチするが、同セグメントの layout.tsx のエラーはキャッチしない

### ルートグループの活用

- レイアウトを共有するルート群をグループ化する（URL に影響しない）
- 認証状態別、機能別のレイアウト分離に活用
- プライベートフォルダ（_ プレフィックス）でルーティング対象外のコンポーネントを配置

## メタデータの設計指針

- 各 page.tsx で metadata または generateMetadata を定義する
- 子ルートのメタデータは親を上書き（マージではない）ため、完全な定義が必要
- 動的メタデータ（generateMetadata）はデータ取得が必要なページで使用
- robots.ts と sitemap.ts は app/ 直下に配置

## 画像・フォント最適化の設計考慮

### 画像最適化の判断

- LCP 画像には priority を付与して優先読み込み
- 静的画像はインポートで自動サイズ検出。リモート画像はサイズ指定必須
- fill prop はコンテナサイズに合わせる場合に使用（sizes も指定）
- リモート画像は remotePatterns で明示的に許可

### フォント最適化

- Google Fonts はビルド時にダウンロード・セルフホスト（外部リクエストなし）
- display: swap でフォント読み込み中はフォールバック表示
- CSS 変数（variable）で Tailwind CSS との統合が容易

## Route Handlers vs Server Actions の使い分け

- フォーム送信（progressive enhancement）→ Server Actions
- 外部 API / Webhook 受信 → Route Handlers
- CRUD ミューテーション（UI 連動） → Server Actions
- ファイルダウンロード / ストリーミング → Route Handlers
- 外部サービスからの呼び出し → Route Handlers

## エラーハンドリングの設計

- error.tsx は Client Component 必須。reset 関数でリトライ機能を提供
- global-error.tsx はルートレイアウトのエラーをキャッチする最後の砦
- notFound() で明示的に 404 をトリガーし、not-found.tsx で UI を提供
- 独立したデータソースは別々の Suspense バウンダリで囲み、並列ストリーミングを有効化
