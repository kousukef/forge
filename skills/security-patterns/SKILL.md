---
name: security-patterns
description: "When implementing authentication, authorization, input validation, API endpoints, file uploads, or handling secrets in TypeScript/Next.js applications. Provides application-layer security patterns covering OWASP Top 10 mitigations, XSS/CSRF/SQLi prevention, Zod validation, CORS configuration, and secret management. MUST be invoked before writing or reviewing security-sensitive code paths."
---

# アプリケーションレイヤー セキュリティパターン

## 原則

- **Defence in Depth**: 入力バリデーション + 出力エスケープ + CSP ヘッダーのように多層防御を徹底
- **Secure by Default**: セキュリティは「追加するもの」ではなく「デフォルトで有効なもの」
- **YAGNI 不適用**: セキュリティ防御策に YAGNI を適用しない。防御は常に先手で実装
- **Fail Secure**: エラー時はアクセス拒否方向に倒す

---

## 1. XSS 防止

### dangerouslySetInnerHTML の禁止

```typescript
// NG: 原則使用禁止
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// OK: React のデフォルトエスケープを活用
<div>{userInput}</div>
```

やむを得ず HTML レンダリングが必要な場合は DOMPurify でサニタイズ:

```typescript
import DOMPurify from 'isomorphic-dompurify'

const clean = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
})
```

### CSP ヘッダー

```typescript
// next.config.ts
const config: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: [
          "default-src 'self'",
          "script-src 'self' 'nonce-${nonce}'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ') },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
      ],
    }]
  },
}
```

### 追加ルール

- `href` に `javascript:` プロトコルを許可しない
- URL 構築時は `new URL()` でパース検証
- `eval()` / `new Function()` 使用禁止

---

## 2. CSRF 防止

### Server Actions（自動保護）

Next.js Server Actions は CSRF 保護が組み込み済み。追加対策不要。

### Route Handlers（明示的対策が必要）

```typescript
export async function POST(request: NextRequest) {
  // Origin ヘッダーの検証
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // 処理...
}
```

### Cookie 設定の必須要件

| 属性 | 値 | 理由 |
|---|---|---|
| `httpOnly` | `true` | JS からのアクセス遮断 |
| `secure` | `true`（本番） | HTTPS のみ |
| `sameSite` | `strict` or `lax` | CSRF 防止 |
| `path` | 最小スコープ | 不要なパスへの送信防止 |

```typescript
response.cookies.set('session', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24,
  path: '/',
})
```

---

## 3. 入力バリデーション（Zod）

### Server Actions

```typescript
'use server'
import { z } from 'zod'

const ContactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(2000),
})

export async function submitContact(formData: FormData) {
  const result = ContactSchema.safeParse({
    email: formData.get('email'),
    message: formData.get('message'),
  })
  if (!result.success) {
    return { success: false as const, errors: result.error.flatten().fieldErrors }
  }
  // result.data は型安全
}
```

### Route Handlers

```typescript
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
})

export async function GET(request: NextRequest) {
  const result = QuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  )
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }
}
```

### ルール

- **ホワイトリスト方式**: 許可する値を列挙（ブラックリスト禁止）
- **全入力バリデーション**: Server Actions / Route Handlers は例外なく Zod で検証
- **型と一体化**: `z.infer<typeof Schema>` で TypeScript 型を生成
- **エラーメッセージ**: 内部情報を漏洩しない汎用メッセージにする

---

## 4. 認証・認可パターン

### Middleware によるルート保護

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get('session')?.value
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Server Actions での認証・認可チェック

```typescript
'use server'
export async function deleteItem(itemId: string) {
  // 1. 認証チェック: 必ず最初に実行
  const session = await getServerSession()
  if (!session?.user) throw new Error('Unauthorized')

  // 2. 認可チェック: リソース所有者か確認
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { userId: true },
  })
  if (!item || item.userId !== session.user.id) throw new Error('Forbidden')

  await prisma.item.delete({ where: { id: itemId } })
}
```

### ルール

- **認証チェックは先頭**: 全保護エンドポイントで最初に実行
- **認可は個別**: ロール + リソース所有権の二重チェック
- **トークン保存先**: httpOnly Cookie のみ（localStorage / sessionStorage 禁止）
- **パスワード**: bcrypt / argon2 でハッシュ化。平文保存は絶対禁止

---

## 5. ファイルアップロードバリデーション

```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateUpload(file: File) {
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large')
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) throw new Error('Invalid file type')

  // ファイル名サニタイズ: パストラバーサル防止
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.')
  return { file, safeName }
}
```

### ルール

- **サイズ制限**: 用途に応じた上限を必ず設定
- **MIME タイプ検証**: ホワイトリスト方式
- **ファイル名サニタイズ**: パストラバーサル防止
- **保存先**: Cloud Storage（GCS 等）を使用。パブリックディレクトリ直接保存禁止
- **本番環境**: マジックバイト検証・アンチウイルススキャンを検討

---

## 6. CORS 設定

```typescript
const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_APP_URL].filter(Boolean) as string[]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Vary'] = 'Origin'
  }
  return headers
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request.headers.get('origin')) })
}
```

### ルール

- **`Access-Control-Allow-Origin: *` 禁止**: 認証付き API では絶対不可
- **オリジンのホワイトリスト**: 環境変数で管理し動的検証
- **Credentials 使用時**: ワイルドカードオリジン不可

---

## 7. SQL インジェクション防止（Prisma）

```typescript
// OK: Prisma クエリビルダー（自動パラメータ化）
const user = await prisma.user.findUnique({ where: { email: userInput } })

// OK: $queryRaw テンプレートリテラル（自動パラメータ化）
const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${userEmail}`

// NG: $queryRawUnsafe で文字列連結（SQL インジェクション脆弱性）
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`)
```

### ルール

- **Prisma Client のみ使用**: 生 DB ドライバー（pg 等）不使用
- **`$queryRawUnsafe` 禁止**: 使用する場合はセキュリティレビュー必須（エスカレーション対象）
- **動的カラム名**: ホワイトリストで検証してから使用

---

## 8. シークレット管理

### 開発環境（環境変数 + Zod バリデーション）

```typescript
// env.ts - 起動時バリデーション
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

### 本番環境（GCP Secret Manager）

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()

export async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${name}/versions/latest`,
  })
  const payload = version.payload?.data
  if (!payload) throw new Error(`Secret ${name} not found`)
  return typeof payload === 'string' ? payload : payload.toString()
}
```

### ルール

| ルール | 説明 |
|---|---|
| ハードコード禁止 | API キー・パスワード・トークンをソースコードに記述しない |
| `.env.local` を gitignore | `.gitignore` に `.env*.local` を含める |
| 起動時バリデーション | Zod で環境変数の存在・形式を検証 |
| 本番は Secret Manager | GCP Secret Manager でシークレットを管理 |
| ログ出力禁止 | シークレットを console.log / エラーメッセージに含めない |
| クライアント公開禁止 | `NEXT_PUBLIC_` プレフィックスにシークレットを含めない |

---

## 9. エラーハンドリング（情報漏洩防止）

```typescript
// OK: ユーザーには汎用メッセージ、サーバーログに詳細
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
}

// NG: スタックトレースや DB 情報をクライアントに返す
catch (error) {
  return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
}
```

- スタックトレースをクライアントに返さない
- DB エラーの詳細をクライアントに返さない
- `NODE_ENV === 'production'` ではデバッグ情報を一切出力しない

---

## 10. レート制限

API エンドポイントにはレート制限を設ける。本番環境では Redis ベースの実装を使用する（サーバーレス環境ではインメモリは共有不可）。

認証エンドポイント（ログイン・パスワードリセット）には特に厳しい制限を設定すること。

---

## アンチパターン一覧

| アンチパターン | リスク | 対策 |
|---|---|---|
| `dangerouslySetInnerHTML` 未サニタイズ | XSS | DOMPurify or 使用しない |
| localStorage にトークン保存 | XSS でトークン窃取 | httpOnly Cookie |
| `$queryRawUnsafe` で文字列連結 | SQL インジェクション | Prisma クエリビルダー |
| `Access-Control-Allow-Origin: *` | CSRF / データ漏洩 | オリジンホワイトリスト |
| 環境変数バリデーション未実施 | 不明確なエラー | Zod で起動時検証 |
| エラーに内部情報含有 | 情報漏洩 | 汎用メッセージ |
| Route Handler に認証チェックなし | 不正アクセス | Middleware + 個別チェック |
| CSRF 対策なしの Route Handler POST | CSRF 攻撃 | Origin 検証 + SameSite Cookie |
| `NEXT_PUBLIC_` にシークレット | クライアント漏洩 | サーバー専用環境変数 |
| ファイルアップロードサイズ無制限 | DoS | サイズ上限設定 |

---

## セキュリティチェックリスト

- [ ] 全入力が Zod スキーマでバリデーション済み
- [ ] 認証チェックが全保護エンドポイントの先頭にある
- [ ] 認可チェックがリソースアクセスの前にある
- [ ] CSP ヘッダーが設定されている
- [ ] Cookie に httpOnly / secure / sameSite が設定されている
- [ ] Route Handlers に CSRF 対策（Origin 検証）がある
- [ ] Prisma パラメータ化クエリのみ使用
- [ ] シークレットがハードコードされていない
- [ ] エラーメッセージに内部情報が含まれていない
- [ ] ファイルアップロードにサイズ・タイプ制限がある
- [ ] CORS がホワイトリスト方式
- [ ] `npm audit` でゼロ脆弱性を維持

## Applicability

- **フェーズ**: implementation, review, debug
- **ドメイン**: 全ドメイン（セキュリティは横断的関心事）
