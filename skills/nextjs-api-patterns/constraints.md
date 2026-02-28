# nextjs-api-patterns: 技術的制約

- Middleware は Edge Runtime で実行。Node.js API の一部は使用不可
- Middleware で DB への直接アクセスは禁止。トークン/セッション検証に留める
- `middleware.ts` はプロジェクトルートに1ファイルのみ
- Server Actions は POST で送信。CSRF 保護は Next.js が自動で行う
- Server Actions の `redirect()` は try/catch の外で呼ぶ（内部で例外をスロー）
- Server Actions からは JSON シリアライズ可能な値のみ返す
- Route Handler の `GET` のみの場合、ビルド時に静的評価される
- `page.tsx` と `route.ts` は同じディレクトリに配置不可
- 全入力は Zod `safeParse` でバリデーション必須（Server Actions / Route Handlers 例外なし）
- エラーレスポンスに内部情報（スタックトレース、DB 詳細）を含めない
- 認証チェックは Server Action / Route Handler 内で必ず行う（クライアント側のみ不可）
- `matcher` で Middleware の適用範囲を限定する。全リクエストに適用しない
