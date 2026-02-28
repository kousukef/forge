# nextjs-api-patterns: 設計ガイダンス

## Route Handlers の設計指針

### 基本設計パターン

- src/app/api/ 配下に route.ts を配置。各 HTTP メソッドを named export する
- 動的ルートパラメータは Promise として受け取り await で解決（Next.js 15）
- レスポンスは統一形式: 成功は `{ data: T }`、エラーは `{ error: { code, message, details? } }`
- GET のみの場合はビルド時に静的評価される。動的にするには Request を使用するか dynamic を設定

### エラーハンドリング戦略

- withErrorHandler パターンで全 Route Handler をラップし、統一的なエラーレスポンスを保証
- ApiError クラスで HTTP ステータスコードとエラーコードを型安全に管理
- ZodError は自動的に 422 レスポンスに変換
- 予期しないエラーは 500 レスポンスで内部情報を隠蔽

### エラー分類の設計

- 400 bad_request: 不正なリクエスト形式
- 401 unauthorized: 認証が必要
- 403 forbidden: 権限不足
- 404 not_found: リソースが存在しない
- 409 conflict: リソースの状態が矛盾
- 422 validation_error: バリデーション失敗
- 429 rate_limit_exceeded: レート制限超過
- 500 internal_error: サーバー内部エラー

## Zod バリデーションの設計指針

### バリデーション設計の原則

- 全入力は safeParse でバリデーション。parse（例外スロー）は Route Handler 外でのみ使用
- リクエストボディ: z.object で必須・オプションフィールドを明示
- クエリパラメータ: z.coerce で文字列から型変換。デフォルト値を設定
- z.infer で TypeScript 型を自動生成し、スキーマと型の乖離を防ぐ
- エラーメッセージは内部情報を漏洩しない汎用メッセージにする

### クエリパラメータのバリデーションパターン

- ページネーション: page は正の整数、limit は 1-100 の範囲でデフォルト 20
- ソート: enum でフィールドを限定、order は asc/desc のみ
- 検索: 最大文字数を制限し、SQL インジェクション防止

## Server Actions の設計指針

### パターン選択の判断基準

- FormData 受け取り + Zod バリデーション + DB 操作 + revalidate が基本フロー
- useActionState（React 19+）でフォーム状態管理を宣言的に実装
- redirect() は try/catch の外で呼ぶ（内部で例外をスロー）
- revalidatePath() / revalidateTag() は redirect() の前に呼ぶ

### Route Handlers vs Server Actions の使い分け

- フォーム送信（progressive enhancement）→ Server Actions
- 外部 API / Webhook 受信 → Route Handlers
- CRUD ミューテーション（UI 連動）→ Server Actions
- ファイルダウンロード / ストリーミング → Route Handlers
- 外部サービスからの呼び出し → Route Handlers

### セキュリティ考慮

- 認証チェックは Server Action 内で必ず行う（クライアント側だけに頼らない）
- Server Actions は POST で送信。CSRF 保護は Next.js が自動で行う
- 認可チェック: リソース所有権をサーバー側で検証

## Middleware の設計指針

### 設計原則

- 1ファイルのみ。軽量な処理に限定する（Edge Runtime 制約）
- DB アクセスは禁止。トークン検証やセッション検証に留める
- matcher で適用範囲を限定。静的ファイルは除外する

### 認証 Middleware の設計パターン

- パブリックパスリストを定義し、一致しないパスで認証チェック
- セッション不在時はログインページにリダイレクト（callbackUrl 付き）
- セキュリティヘッダー（X-Frame-Options, X-Content-Type-Options 等）の一括設定

## 型安全なクライアント-サーバー通信の設計

### 共有型定義

- ApiResponse<T>, ApiErrorResponse, PaginatedResponse<T> の型を共通定義
- 型安全な fetch ラッパーで一貫したエラーハンドリング

## レート制限の設計考慮

- Edge Runtime では永続ストレージ不可。本番は Upstash Redis やリバースプロキシレベルで実装
- 認証エンドポイントには特に厳しい制限を設定
- 429 レスポンスには Retry-After ヘッダーを含める

## アンチパターンと回避

- Server Action でバリデーションなし: 不正データ混入。Zod safeParse で防ぐ
- Route Handler で try/catch なし: 内部情報漏洩。withErrorHandler でラップ
- redirect() を try 内で呼ぶ: 例外がキャッチされる。try/catch の外で呼ぶ
- any 型の body を直接使用: 型安全性喪失。Zod スキーマで parse する
