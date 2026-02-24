---
name: next-best-practices
description: "When working with Next.js 15 App Router (file-based routing, Server/Client Components, data fetching, metadata, optimization). Provides conventions, selection criteria, and common patterns for App Router development. MUST be invoked before implementing or reviewing any Next.js App Router code."
---

# Next.js 15 App Router ベストプラクティス

Next.js 15 App Router の規約・パターン・最適化ガイドライン。
Server Components / Client Components の使い分け、データ取得パターン、ファイルベースルーティング規約を中心に、実装判断の指針を提供する。

---

## 適用タイミング

以下の作業時にこのスキルを参照すること:

- `src/app/` 配下のルート・レイアウト・ページの作成・変更
- Server Components / Client Components の設計判断
- データ取得パターンの選択
- メタデータ（SEO / OGP）の設定
- 画像・フォントの最適化
- エラーハンドリング・ローディング UI の実装

---

## 1. ファイルベースルーティング規約

### 特殊ファイル一覧

| ファイル | 役割 | レンダリング |
|---|---|---|
| `page.tsx` | ルートの UI（このファイルがないとルートはアクセス不可） | Server Component |
| `layout.tsx` | 子ルートを包む共有レイアウト（再レンダリングされない） | Server Component |
| `template.tsx` | layout と同様だがナビゲーション毎に再マウント | Server Component |
| `loading.tsx` | Suspense フォールバック UI | Server Component |
| `error.tsx` | エラーバウンダリ UI | **Client Component 必須** |
| `not-found.tsx` | 404 UI | Server Component |
| `route.ts` | API Route Handler（`page.tsx` と共存不可） | Server のみ |
| `default.tsx` | Parallel Routes のデフォルトフォールバック | Server Component |
| `global-error.tsx` | ルートレイアウトのエラーバウンダリ | **Client Component 必須** |

### ルートグループとプライベートフォルダ

```
src/app/
  (marketing)/        # ルートグループ: URL に影響しない。レイアウト分離に使用
    about/page.tsx     # /about
  (dashboard)/
    settings/page.tsx  # /settings
  _components/         # プライベートフォルダ: ルーティング対象外（先頭 _）
  [slug]/page.tsx      # 動的ルート
  [...slug]/page.tsx   # Catch-all ルート
  [[...slug]]/page.tsx # Optional catch-all ルート
```

### レイアウトの原則

- `layout.tsx` はナビゲーション間で状態を保持する（再マウントされない）
- ルートレイアウト（`app/layout.tsx`）は必須。`<html>` と `<body>` を含む
- レイアウトはデータ取得可能（async function）
- レイアウトから子ルートにデータを props で渡すことはできない

---

## 2. Server Components vs Client Components

### デフォルトは Server Component

App Router ではすべてのコンポーネントがデフォルトで Server Component。
`'use client'` ディレクティブを宣言したファイルとその import ツリーのみが Client Component になる。

### 選択基準

| 判断基準 | Server Component | Client Component (`'use client'`) |
|---|---|---|
| データ取得 | 直接 `async/await` | SWR / React Query 等を使用 |
| バックエンドリソース | 直接アクセス可能 | API 経由のみ |
| 機密情報（API キー等） | 安全に使用可能 | 絶対に含めない |
| React Hooks（useState 等） | 使用不可 | 使用可能 |
| ブラウザ API（window 等） | 使用不可 | 使用可能 |
| イベントハンドラ（onClick 等） | 使用不可 | 使用可能 |
| バンドルサイズ | JS バンドルに含まれない | JS バンドルに含まれる |

### 設計原則

1. **Client Component は葉ノードに押し込む**: インタラクティブな部分だけを `'use client'` で分離
2. **Server Component を親にする**: データ取得は親の Server Component で行い、結果を Client Component に props で渡す
3. **シリアライズ可能な props のみ渡す**: Server → Client 間は JSON シリアライズ可能な値のみ（関数・Date・Map 等は不可）
4. **境界を明確にする**: `'use client'` ファイルが境界。そこから import されるモジュールもすべて Client になる

---

## 3. Next.js 15 の破壊的変更

### params / searchParams が Promise に変更

Next.js 15 では `params` と `searchParams` が **Promise** になった。`await` または `React.use()` で解決する必要がある。

#### Server Component / Layout（async/await）

```tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { query } = await searchParams
  return <div>{slug} - {query}</div>
}
```

#### Client Component（React.use）

```tsx
'use client'
import { use } from 'react'

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <div>{slug}</div>
}
```

#### Route Handler

```tsx
type Params = Promise<{ slug: string }>

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params
  const slug = params.slug
}
```

### fetch() のデフォルトが no-store に変更

Next.js 15 では `fetch()` のデフォルトキャッシュ動作が `no-store` に変更された。

```tsx
// デフォルト: 毎回リクエスト（no-store）
const data = await fetch('https://api.example.com/data')

// 明示的にキャッシュ
const cached = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
})

// 時間ベースの再検証
const revalidated = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },
})

// タグベースの再検証
const tagged = await fetch('https://api.example.com/data', {
  next: { tags: ['posts'] },
})
```

---

## 4. データ取得パターン

### パターン選択ガイドライン

| ユースケース | 推奨パターン |
|---|---|
| ページ表示時の初期データ | Server Component で直接 `fetch` / DB クエリ |
| ユーザー操作によるデータ変更 | Server Actions |
| クライアント側のリアルタイム更新 | SWR / React Query（Client Component） |
| 複数コンポーネントで同一データ | `React.cache()` でリクエスト単位の重複排除 |
| クロスリクエストのキャッシュ | `unstable_cache` + タグベース再検証 |

### 並列データ取得（ウォーターフォール回避）

```tsx
export default async function Dashboard() {
  // OK: Promise.all で並列取得
  const [user, posts] = await Promise.all([getUser(), getPosts()])
  return <div>{user.name}: {posts.length} posts</div>
}
```

### Server Actions

```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

export async function createPost(formData: FormData) {
  const parsed = schema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  await db.post.create({ data: parsed.data })
  revalidatePath('/posts')
}
```

### キャッシュ無効化

- `revalidatePath('/posts')`: 特定ルートのキャッシュを無効化
- `revalidateTag('posts')`: タグに紐づく全キャッシュを無効化

---

## 5. メタデータ API

### 静的メタデータ

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'サイトタイトル',
  description: 'サイトの説明',
  openGraph: {
    title: 'OGP タイトル',
    description: 'OGP 説明',
    images: ['/og-image.png'],
  },
}
```

### 動的メタデータ

```tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, images: [post.ogImage] },
  }
}
```

### メタデータの原則

- 各 `page.tsx` で `generateMetadata` または `metadata` を定義する
- 子ルートのメタデータは親を上書き（マージではない）
- `robots.ts` と `sitemap.ts` は `app/` 直下に配置
- `opengraph-image.tsx` で動的 OGP 画像を生成可能

---

## 6. 画像・フォント最適化

### next/image

```tsx
import Image from 'next/image'
import heroImg from '@/public/hero.png'

// 静的インポート（自動サイズ検出）
<Image src={heroImg} alt="Hero" priority />

// リモート画像（サイズ指定必須）
<Image src={url} alt="Avatar" width={48} height={48} />
```

- LCP 画像には `priority` を付与
- `width` / `height` を必ず指定（静的インポート時は自動）
- リモート画像は `next.config.ts` の `images.remotePatterns` で許可
- `fill` prop はコンテナサイズに合わせる場合に使用（`sizes` も指定）

### next/font

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- Google Fonts はビルド時にダウンロード・セルフホスト（外部リクエストなし）
- `display: 'swap'` を推奨（フォント読み込み中はフォールバック表示）
- `subsets` を指定してファイルサイズを削減
- CSS 変数（`variable`）で Tailwind CSS との統合が容易

---

## 7. エラーハンドリング・ローディング

### error.tsx

```tsx
'use client'  // Client Component 必須
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={() => reset()}>再試行</button>
    </div>
  )
}
```

### not-found.tsx と notFound()

```tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  return <div>{post.title}</div>
}
```

### loading.tsx と Suspense

```tsx
// loading.tsx: ルートレベルの Suspense バウンダリとして自動動作
export default function Loading() {
  return <div>Loading...</div>
}
```

```tsx
// コンポーネント単位の Suspense で並列ストリーミング
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <RecentPosts />
      </Suspense>
    </div>
  )
}
```

### エラーハンドリングの原則

- `error.tsx` は同セグメントの `page.tsx` と子コンポーネントのエラーをキャッチ
- `error.tsx` は同セグメントの `layout.tsx` 自体のエラーはキャッチしない（親の error.tsx が担当）
- `global-error.tsx` はルートレイアウトのエラーをキャッチする最後の砦（`'use client'` 必須）
- `loading.tsx` はページ全体のフォールバック。部分的な制御には `<Suspense>` を使う
- 独立したデータソースは別々の Suspense バウンダリで囲み、並列ストリーミングを有効化する

---

## 8. Route Handlers

```tsx
// app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

export async function GET() {
  const posts = await db.post.findMany()
  return NextResponse.json({ data: posts })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const post = await db.post.create({ data: parsed.data })
  return NextResponse.json({ data: post }, { status: 201 })
}
```

- `app/api/[リソース名]/route.ts` に配置
- 入力は Zod でバリデーション
- エラーレスポンス: `{ error: { code: string, message: string } }`
- 成功レスポンス: `{ data: T }`
- `page.tsx` と同じディレクトリには配置不可
- Server Actions で代替可能な場合は Server Actions を優先

---

## 9. チェックリスト

実装完了時に以下を確認すること:

- [ ] `params` / `searchParams` は `Promise` として扱い `await` / `use()` で解決している
- [ ] `fetch()` のキャッシュ動作を意識している（デフォルト `no-store`）
- [ ] Client Component は最小限のスコープで `'use client'` を宣言している
- [ ] データ取得は Server Component で行い、Client Component には props で渡している
- [ ] 並列データ取得で `Promise.all` を使いウォーターフォールを回避している
- [ ] `error.tsx` に `'use client'` を宣言している
- [ ] LCP 画像に `priority` を付与している
- [ ] `generateMetadata` でページ固有のメタデータを定義している
- [ ] Server Actions の入力を Zod でバリデーションしている
- [ ] `revalidatePath` / `revalidateTag` で適切にキャッシュを無効化している
