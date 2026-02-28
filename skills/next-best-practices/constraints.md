# next-best-practices: 技術的制約

- Next.js 15 では `params` / `searchParams` が Promise。`await` / `use()` で解決必須
- Next.js 15 では `fetch()` のデフォルトが `no-store` に変更
- `error.tsx` / `global-error.tsx` は Client Component 必須（`'use client'`）
- `route.ts` と `page.tsx` は同じディレクトリに共存不可
- ルートレイアウト（`app/layout.tsx`）は必須。`<html>` と `<body>` を含む
- レイアウトから子ルートにデータを props で渡すことは不可
- Server → Client 間は JSON シリアライズ可能な値のみ渡せる（関数・Date・Map 不可）
- `'use client'` ファイルが境界。そこから import されるモジュールも全て Client になる
- Server Actions の `redirect()` は try/catch の外で呼ぶ（内部で例外をスロー）
- `revalidatePath()` / `revalidateTag()` は `redirect()` の前に呼ぶ
- `error.tsx` は同セグメントの `layout.tsx` のエラーはキャッチしない
- リモート画像は `next.config.ts` の `images.remotePatterns` で許可が必要
