---
name: prisma-expert
description: "When working with Prisma schema files (.prisma), database queries, migrations, or relation design in prisma/ or server/ directories. Provides best practices for schema design, query optimization, N+1 prevention, index strategy, transaction patterns, and migration safety using Prisma ORM API only. MUST be invoked before creating or modifying Prisma schemas, writing database queries, or planning migrations."
---

# Prisma Expert

## 原則

Prisma ORM を通じたデータベース操作において、型安全性・パフォーマンス・マイグレーション安全性を最大化する。
生 SQL（`$queryRaw`/`$executeRaw`）は原則禁止。Prisma Client API のみで表現する。

---

## 1. スキーマ設計

### 命名規約

- モデル名: PascalCase 単数形（`User`, `Post`, `OrderItem`）
- フィールド名: camelCase（`createdAt`, `userId`, `orderStatus`）
- リレーション名: 意味のある名前（`author`, `posts`, `parentComment`）
- Enum 名: PascalCase、値は UPPER_SNAKE_CASE
- `@@map` でテーブル名を snake_case 化、`@map` でカラム名を snake_case 化

```prisma
model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int      @map("order_id")
  productId Int      @map("product_id")
  quantity  Int
  unitPrice Decimal  @map("unit_price") @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

### 主キー戦略

- 単一 DB: `Int @id @default(autoincrement())` または `BigInt` が基本
- 外部公開 ID: `String @id @default(cuid())` または `@default(uuid())`
- ランダム UUID v4 は大規模テーブルでインデックス断片化を起こすため避ける
- CUID2 が順序性とユニーク性のバランスが良い

### Enum の活用

```prisma
enum OrderStatus {
  PENDING    @map("pending")
  PROCESSING @map("processing")
  COMPLETED  @map("completed")
  CANCELLED  @map("cancelled")
  @@map("order_status")
}
```

- Enum 値は `@map` で snake_case 化、Enum 自体も `@@map` でテーブル名を設定
- `@default(USER)` のようにデフォルト値を明示する

### データ型の選択

| 用途 | Prisma 型 | 注意事項 |
|---|---|---|
| ID（内部） | `Int` / `BigInt` | 21億超の可能性があれば `BigInt` |
| ID（外部公開） | `String` + `@default(cuid())` | UUID v4 より CUID を推奨 |
| 文字列 | `String` | `@db.VarChar(n)` は制約が必要な場合のみ |
| 日時 | `DateTime` | 常に `@db.Timestamptz` を検討 |
| 金額 | `Decimal` + `@db.Decimal(10, 2)` | `Float` は精度が失われるため禁止 |
| 真偽値 | `Boolean` | `@default(false)` を明示 |
| JSON | `Json` | 構造化データには専用モデルを優先 |

### リレーション設計

#### 1対多

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int  @map("author_id")
  author   User @relation(fields: [authorId], references: [id])

  @@index([authorId])
  @@map("posts")
}
```

#### 多対多（明示的中間テーブル推奨）

暗黙的多対多（`@relation` のみ）は中間テーブルにフィールド追加不可。明示的中間テーブルを使用する。

```prisma
model PostTag {
  postId    Int      @map("post_id")
  tagId     Int      @map("tag_id")
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at")  // 追加フィールド可能

  @@id([postId, tagId])
  @@index([tagId])
  @@map("post_tags")
}
```

#### 自己参照リレーション

```prisma
model Comment {
  id       Int       @id @default(autoincrement())
  parentId Int?      @map("parent_id")
  parent   Comment?  @relation("CommentTree", fields: [parentId], references: [id])
  children Comment[] @relation("CommentTree")
  @@index([parentId])
}
```

### カスケード設定

| シナリオ | onDelete | 理由 |
|---|---|---|
| 親削除で子も不要 | `Cascade` | ユーザー削除時のセッション等 |
| 親削除を防ぎたい | `Restrict` | 注文がある顧客の削除防止 |
| 子のFKをnullに | `SetNull` | 著者削除時に投稿を匿名化 |
| デフォルト推奨 | `Restrict` | データ損失を防ぐ安全側の選択 |

---

## 2. クエリ最適化

### select によるフィールド選択

```typescript
// BAD: 全フィールド取得
const users = await prisma.user.findMany();

// GOOD: 必要なフィールドのみ
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

### N+1 クエリの防止

```typescript
// BAD: N+1（ループ内で個別クエリ）
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
}

// GOOD: include で一括取得（2クエリ）
const usersWithPosts = await prisma.user.findMany({ include: { posts: true } });

// GOOD: in フィルタで一括取得（2クエリ）
const users = await prisma.user.findMany();
const posts = await prisma.post.findMany({
  where: { authorId: { in: users.map((u) => u.id) } },
});

// BEST: relationLoadStrategy: "join" で1クエリ
const usersWithPosts = await prisma.user.findMany({
  relationLoadStrategy: "join",
  include: { posts: true },
});
```

### include と select の組み合わせ

リレーション先も `select` で必要フィールドのみに絞る。

```typescript
const posts = await prisma.post.findMany({
  select: { id: true, title: true, author: { select: { id: true, name: true } } },
});
```

### findMany には必ず take を設定

```typescript
// BAD: 上限なし
const posts = await prisma.post.findMany({
  where: { published: true },
});

// GOOD: 上限を明示
const posts = await prisma.post.findMany({
  where: { published: true },
  take: 50,
  orderBy: { createdAt: "desc" },
});
```

### カーソルベースページネーション

```typescript
// BAD: OFFSET ベース（深いページで遅い）
const posts = await prisma.post.findMany({
  skip: 1000,
  take: 20,
});

// GOOD: カーソルベース（常に O(1)）
const posts = await prisma.post.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastPostId },
  orderBy: { id: "asc" },
});
```

### 一括操作

```typescript
// BAD: ループ内で個別作成
for (const data of items) {
  await prisma.item.create({ data });
}

// GOOD: createMany で一括作成
await prisma.item.createMany({
  data: items,
  skipDuplicates: true,
});

// GOOD: updateMany / deleteMany
await prisma.post.updateMany({
  where: { published: false, createdAt: { lt: cutoffDate } },
  data: { archived: true },
});
```

### upsert パターン

`findFirst` + `create`/`update` はレースコンディションの原因。`upsert` を使用する。

```typescript
await prisma.setting.upsert({
  where: { userId_key: { userId, key: "theme" } },
  update: { value },
  create: { userId, key: "theme", value },
});
```

---

## 3. インデックス戦略

### 外部キーには必ずインデックス

PostgreSQL は外部キーカラムに自動でインデックスを作成しない。
Prisma スキーマで全ての外部キーフィールドに `@@index` を設定する。

```prisma
model Post {
  id       Int @id @default(autoincrement())
  authorId Int @map("author_id")
  author   User @relation(fields: [authorId], references: [id])

  @@index([authorId])  // 必須: JOIN と CASCADE が高速化
}
```

### 複合インデックスの順序

等値条件のカラムを先、範囲条件のカラムを後に配置する。

```prisma
model Order {
  id        Int         @id @default(autoincrement())
  status    OrderStatus
  createdAt DateTime    @default(now()) @map("created_at")

  // GOOD: status（等値）を先、createdAt（範囲）を後に
  @@index([status, createdAt])
  @@map("orders")
}
```

```typescript
// このクエリが高速化される
const pendingOrders = await prisma.order.findMany({
  where: {
    status: "PENDING",
    createdAt: { gt: new Date("2024-01-01") },
  },
});
```

### ユニーク制約の活用

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique

  @@map("users")
}

model Setting {
  id     Int    @id @default(autoincrement())
  userId Int    @map("user_id")
  key    String

  @@unique([userId, key])  // 複合ユニーク制約（upsert の where で使用可能）
  @@map("settings")
}
```

### 部分インデックス

Prisma は `@@index` に `where` 句を直接サポートしていない。
ソフトデリート等で部分インデックスが必要な場合、`--create-only` でマイグレーションを生成し、SQL ファイルに手動で追記する。

---

## 4. トランザクションパターン

### 順次トランザクション（独立した操作の一括実行）

```typescript
// 結果が互いに依存しない操作に使用
const [posts, totalCount] = await prisma.$transaction([
  prisma.post.findMany({ where: { published: true }, take: 10 }),
  prisma.post.count({ where: { published: true } }),
]);
```

### インタラクティブトランザクション（依存する操作）

```typescript
// 前の操作の結果を次の操作で使う場合
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: "alice@example.com", name: "Alice" },
  });

  const post = await tx.post.create({
    data: { title: "First Post", authorId: user.id },
  });

  return { user, post };
});
```

### トランザクション設計の原則

| ルール | 説明 |
|---|---|
| トランザクションは短く | 外部 API 呼び出しをトランザクション内に含めない |
| タイムアウト設定 | `maxWait` と `timeout` を明示的に設定 |
| リトライロジック | P2034（書き込み競合）エラー時にリトライ |
| 分離レベル | デフォルト（Read Committed）で十分な場合が多い |

```typescript
// タイムアウト付きトランザクション
const result = await prisma.$transaction(
  async (tx) => {
    // 短い操作のみ
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  },
  {
    maxWait: 5000,
    timeout: 10000,
  },
);
```

### デッドロック防止

- 複数レコードをロックする場合、常に同じ順序（ID昇順等）でアクセスする

---

## 5. Prisma Client シングルトンパターン

開発環境でのホットリロードによるコネクション枯渇を防止する。

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### コネクションプール設定

```
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
```

- `connection_limit`: サーバーレス環境では低め（5-10）、サーバー環境では高め（10-20）
- `pool_timeout`: コネクション取得のタイムアウト（秒）

---

## 6. マイグレーションベストプラクティス

### 基本原則

- マイグレーションファーストで変更（スキーマ変更 → Prisma Client 再生成 → コード変更）
- 生成されたクライアントを直接編集しない
- `prisma migrate dev` で開発、`prisma migrate deploy` で本番

### 破壊的変更の段階的実行（Expand/Contract パターン）

1. 新カラム追加 + データコピー（既存カラムは残す）
2. アプリケーションコードを新カラムに切り替え
3. 旧カラムを削除するマイグレーション

### マイグレーション安全性チェックリスト

| チェック項目 | 対策 |
|---|---|
| カラム削除 | まずコードから参照を除去 → 次のリリースで削除 |
| 型変更 | データ互換性を確認（String → Int は既存データが壊れる） |
| NOT NULL 追加 | 既存データに default 値を設定してから制約追加 |
| テーブル名変更 | Expand/Contract パターンで段階的に |

### カスタムマイグレーション

`npx prisma migrate dev --create-only` で SQL ファイルを生成し、必要に応じて手動編集してから `npx prisma migrate dev` で適用する。

---

## 7. シーディングとテストデータ

### ファクトリ関数パターン

```typescript
// prisma/factories.ts
import { Prisma } from "@prisma/client";

export function buildUser(
  overrides: Partial<Prisma.UserCreateInput> = {},
): Prisma.UserCreateInput {
  return { email: `user-${Date.now()}@example.com`, name: "Test User", ...overrides };
}
```

- `overrides` パターンでテストごとにフィールドをカスタマイズ可能にする

---

## アンチパターン

| パターン | 問題 | 対策 |
|---|---|---|
| `$queryRaw` の多用 | 型安全性の喪失、SQL インジェクションリスク | Prisma Client API で表現する |
| ループ内の個別クエリ | N+1 問題 | `include`/`in` フィルタ/`createMany` |
| `findMany` に `take` なし | 大量データ取得でメモリ逼迫 | 必ず `take` で上限設定 |
| OFFSET ページネーション | 深いページで線形に遅くなる | カーソルベースページネーション |
| 外部キーにインデックスなし | JOIN と CASCADE が遅い | `@@index` を必ず設定 |
| トランザクション内で外部 API | ロック保持時間が長くなる | API 呼び出しはトランザクション外 |
| `Float` で金額を扱う | 浮動小数点の丸め誤差 | `Decimal` を使用 |
| 暗黙的多対多リレーション | 中間テーブルにフィールド追加不可 | 明示的中間テーブルを使用 |
| 全フィールド取得 | 不要データの転送・メモリ消費 | `select` で必要なフィールドのみ |
| `findFirst` + `create`/`update` | レースコンディション | `upsert` を使用 |

---

## Applicability

- **フェーズ**: implementation, review, debug
- **ドメイン**: prisma-database
- **トリガーファイル**: `prisma/schema.prisma`, `prisma/migrations/`, `lib/prisma.ts`, `server/` 配下の DB アクセスコード
