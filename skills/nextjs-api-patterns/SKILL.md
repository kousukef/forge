---
name: nextjs-api-patterns
description: "When implementing, reviewing, or debugging Route Handlers (route.ts), Server Actions ('use server'), or Middleware (middleware.ts) in Next.js App Router. Provides patterns for type-safe request/response handling with Zod validation, unified error responses, authentication middleware, and progressive enhancement. MUST be invoked before creating or modifying API endpoints, Server Actions, or middleware logic."
---

# Next.js API Patterns

## 原則

Next.js App Router における API レイヤー（Route Handlers / Server Actions / Middleware）の設計パターン集。
型安全性、バリデーション、統一エラーレスポンス、認証を一貫したパターンで実装する。

---

## Route Handlers

### 基本構造

`src/app/api/` 配下に `route.ts` を配置。各 HTTP メソッドを named export する。

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const users = await getUsers({ page });
  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // バリデーション + 処理（後述）
}
```

### 動的ルートパラメータ

```typescript
// src/app/api/users/[id]/route.ts
type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json(
      { error: { code: "not_found", message: "User not found" } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: user });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteUser(id);
  return new Response(null, { status: 204 });
}
```

### Route Handler の重要ルール

- `GET` のみの場合、ビルド時に静的評価される。動的にするには `Request` を使用するか `dynamic = "force-dynamic"` を設定
- `cookies()` / `headers()` の使用で `GET` は自動的に動的になる
- レスポンスは Web 標準 `Response` または `NextResponse` を使用
- `NextResponse.json()` で型安全なレスポンスを返す

---

## Zod バリデーション

### リクエストボディ

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "user"]).default("user"),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Request validation failed",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
        },
      },
      { status: 422 }
    );
  }

  const user = await createUser(result.data);
  return NextResponse.json({ data: user }, { status: 201 });
}
```

### クエリパラメータ

```typescript
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = listQuerySchema.safeParse(params);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "invalid_query", message: "Invalid query parameters" } },
      { status: 400 }
    );
  }
  const { page, limit, sort, order, search } = result.data;
  // データ取得処理
}
```

---

## 統一エラーレスポンス

### エラー型定義

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field: string; message: string; code: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
  static badRequest(message: string, details?: ApiError["details"]) {
    return new ApiError(400, "bad_request", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "unauthorized", message);
  }
  static forbidden(message = "Insufficient permissions") {
    return new ApiError(403, "forbidden", message);
  }
  static notFound(resource = "Resource") {
    return new ApiError(404, "not_found", `${resource} not found`);
  }
  static conflict(message: string) {
    return new ApiError(409, "conflict", message);
  }
}
```

### 統一エラーハンドラ

```typescript
// src/lib/api/handler.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "./errors";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message, details: error.details } },
          { status: error.statusCode }
        );
      }
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "validation_error",
              message: "Validation failed",
              details: error.issues.map((i) => ({
                field: i.path.join("."), message: i.message, code: i.code,
              })),
            },
          },
          { status: 422 }
        );
      }
      console.error("Unhandled error:", error);
      return NextResponse.json(
        { error: { code: "internal_error", message: "Internal server error" } },
        { status: 500 }
      );
    }
  };
}
```

### 使用例

```typescript
export const GET = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) throw ApiError.notFound("User");
  return NextResponse.json({ data: user });
});
```

---

## Server Actions

### 基本パターン

```typescript
// src/actions/user.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function createUser(formData: FormData) {
  const result = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }
  const user = await db.user.create({ data: result.data });
  revalidatePath("/users");
  redirect(`/users/${user.id}`);
}
```

### useActionState によるフォーム連携（React 19+）

```typescript
// Server Action
"use server";

type ActionState = { errors?: Record<string, string[]>; message?: string };

export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = updateProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
  });
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }
  await db.profile.update({ where: { id: userId }, data: result.data });
  revalidatePath("/profile");
  return { message: "Profile updated successfully" };
}
```

```typescript
// Client Component
"use client";
import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateProfile, {});
  return (
    <form action={formAction}>
      <input name="name" />
      {state.errors?.name && <p>{state.errors.name[0]}</p>}
      <textarea name="bio" />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Server Actions の重要ルール

- `"use server"` はファイル先頭（全 export が Server Action）またはインライン関数に宣言
- Server Action は POST で送信。CSRF 保護は Next.js が自動で行う
- `redirect()` は try/catch の外で呼ぶ（内部で例外をスローする）
- `revalidatePath()` / `revalidateTag()` は `redirect()` の前に呼ぶ
- Server Action からは JSON シリアライズ可能な値のみ返す
- 認証チェックは Server Action 内で必ず行う（クライアント側だけに頼らない）

### Route Handlers vs Server Actions 使い分け

| 要件 | Route Handler | Server Action |
|---|---|---|
| フォーム送信（progressive enhancement） | -- | 推奨 |
| 外部 API / Webhook 受信 | 推奨 | -- |
| CRUD ミューテーション（UI 連動） | -- | 推奨 |
| ファイルダウンロード / ストリーミング | 推奨 | -- |
| 外部サービスからの呼び出し | 推奨 | -- |

---

## Middleware

### 基本構造

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 認証ミドルウェア

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const session = await verifySession(request);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", session.userId);
  return response;
}
```

### Middleware の重要ルール

- `middleware.ts` はプロジェクトルート（`src/` 使用時は `src/middleware.ts`）に1ファイルのみ
- Edge Runtime で実行。Node.js API の一部は使用不可
- DB への直接アクセスは避ける。トークン検証やセッション検証に留める
- `matcher` で適用範囲を限定する。全リクエストに適用しない
- `NextResponse.next()` で後続処理に進む

### セキュリティヘッダー

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}
```

---

## 型安全なクライアント-サーバー通信

### 共有型定義

```typescript
// src/types/api.ts
export type ApiResponse<T> = { data: T };

export type ApiErrorResponse = {
  error: { code: string; message: string; details?: Array<{ field: string; message: string; code: string }> };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};
```

### 型安全な fetch ラッパー

```typescript
// src/lib/api/client.ts
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    throw new ApiClientError(response.status, errorBody.error);
  }
  const json: ApiResponse<T> = await response.json();
  return json.data;
}
```

---

## レート制限

### 考慮事項

- Middleware でのレート制限は Edge Runtime の制約に注意（永続ストレージ不可）
- 本番環境では Upstash Redis やリバースプロキシレベルで実装する
- `429 Too Many Requests` + `Retry-After` ヘッダーを返す

```typescript
export const POST = withErrorHandler(async (request) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = await rateLimiter.check(ip, { maxRequests: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "rate_limit_exceeded", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  // 通常処理
});
```

---

## アンチパターン

| アンチパターン | 理由 | 正しいアプローチ |
|---|---|---|
| Server Action でバリデーションなし | 不正データ混入 | Zod `safeParse` してから保存 |
| Route Handler で `try/catch` なし | 内部情報漏洩 | `withErrorHandler` でラップ |
| Middleware で DB クエリ実行 | Edge Runtime 制約違反 | トークン検証のみ |
| `redirect()` を `try` 内で呼ぶ | 例外をスローする | `try/catch` の外で呼ぶ |
| クライアント側の認証のみに依存 | バイパス可能 | Server Action 内で認証チェック |
| `any` 型の body を直接使用 | 型安全性の喪失 | Zod スキーマで parse |
| `matcher` 未設定の Middleware | 不要パスにも適用 | 静的ファイル除外の matcher 設定 |

---

## Applicability

- **フェーズ**: implementation, review, debug
- **ドメイン**: typescript-backend, nextjs-frontend
- **対象ファイル**: `src/app/api/**/route.ts`, `src/actions/**/*.ts`, `src/middleware.ts`, `src/lib/api/**/*.ts`
