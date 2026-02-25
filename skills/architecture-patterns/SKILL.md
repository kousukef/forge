---
name: architecture-patterns
description: "When designing module boundaries, defining layer dependencies, or structuring domain logic in TypeScript projects. Provides practical SOLID patterns, DDD building blocks (Bounded Context, Aggregate, Repository), ADR templates, layered architecture guidelines, and dependency inversion examples with TypeScript code. MUST be invoked before creating new modules, services, or architectural boundaries."
---

# ソフトウェアアーキテクチャパターン

## 原則

アーキテクチャの目的は「変更コストを最小化する構造」を作ること。
学術的な定義ではなく、TypeScript プロジェクトで即座に適用できる実践パターンを提供する。
`coding-standards.md` が「何を守るか」を定義するのに対し、このスキルは「どう構造化するか」を具体的コードで示す。

---

## SOLID 原則（実践編）

### Single Responsibility: 変更理由を1つに絞る

```typescript
// Bad: ユーザー検証とメール送信が混在
class UserService {
  async register(input: UserInput) {
    if (!input.email.includes("@")) throw new ValidationError("Invalid email");
    const user = await this.db.user.create({ data: input });
    await this.sendWelcomeEmail(user.email); // 別の変更理由
    return user;
  }
  private async sendWelcomeEmail(email: string) { /* ... */ }
}

// Good: 責務を分離し、変更理由を1つに
class UserRegistrationService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly notifier: UserNotifier,
  ) {}

  async register(input: UserInput): Promise<User> {
    const user = await this.userRepo.create(input);
    await this.notifier.onUserCreated(user);
    return user;
  }
}
```

**判定基準**: 「このクラスを変更する理由は何か」を列挙し、2つ以上なら分割を検討する。

### Open/Closed: 拡張は追加、既存コードは変更しない

```typescript
// Bad: 新しい通知チャネル追加のたびに既存コードを修正
function notify(user: User, channel: "email" | "slack" | "sms") {
  if (channel === "email") { /* ... */ }
  else if (channel === "slack") { /* ... */ }
  else if (channel === "sms") { /* ... */ }
}

// Good: Strategy パターンで拡張に開く
interface NotificationChannel {
  send(user: User, message: string): Promise<void>;
}

class EmailChannel implements NotificationChannel {
  async send(user: User, message: string): Promise<void> { /* ... */ }
}

class SlackChannel implements NotificationChannel {
  async send(user: User, message: string): Promise<void> { /* ... */ }
}

// 新チャネル追加時は新クラスを作るだけ。既存コードは変更不要。
class NotificationService {
  constructor(private readonly channels: NotificationChannel[]) {}

  async notifyAll(user: User, message: string): Promise<void> {
    await Promise.all(this.channels.map((ch) => ch.send(user, message)));
  }
}
```

### Liskov Substitution + Interface Segregation: 型階層を正しく設計する

LSP: 派生型が基底型の契約を破壊してはならない。ISP: クライアントが使わないメソッドに依存させない。この2つは連動する。

```typescript
// Bad: 巨大インターフェースに全操作を詰め込む → 実装側で例外を投げる LSP 違反が発生
interface DataStore<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>; // CacheStore には不要
}

// Good: 用途ごとにインターフェースを分割 → LSP 違反を構造的に防ぐ
interface Readable<T> {
  findById(id: string): Promise<T | null>;
}
interface Writable<T> {
  save(entity: T): Promise<void>;
}
interface Deletable {
  delete(id: string): Promise<void>;
}
// CacheStore は Readable + Writable のみ実装。delete を持たないので違反しようがない
```

### Dependency Inversion: 上位モジュールが抽象を所有する

```typescript
// Bad: ドメイン層が Prisma に直接依存
import { PrismaClient } from "@prisma/client";

class OrderService {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrder(id: string) {
    return this.prisma.order.findUnique({ where: { id } });
  }
}

// Good: ドメイン層がインターフェースを定義し、インフラ層が実装
// --- domain/order/order-repository.ts ---
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

// --- domain/order/order-service.ts ---
class OrderService {
  constructor(private readonly orderRepo: OrderRepository) {}

  async getOrder(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id);
  }
}

// --- infrastructure/prisma/prisma-order-repository.ts ---
class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: this.toPersistence(order),
      update: this.toPersistence(order),
    });
  }
}
```

**依存の方向**: `domain/ ← application/ ← infrastructure/`（矢印は「依存される側」を指す）

---

## DDD 基本概念

### Bounded Context: モジュール境界の設計

Bounded Context はドメインモデルの適用範囲を定義する。同じ「ユーザー」でも文脈によって異なるモデルになる。

```
認証コンテキスト          注文コンテキスト          請求コンテキスト
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ AuthUser        │     │ Customer        │     │ BillingAccount  │
│ - email         │     │ - customerId    │     │ - accountId     │
│ - passwordHash  │     │ - shippingAddr  │     │ - paymentMethod │
│ - roles[]       │     │ - orderHistory  │     │ - invoices      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**ディレクトリ構造への反映**:

```
src/
├── modules/
│   ├── auth/           # 認証コンテキスト
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── order/          # 注文コンテキスト
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── billing/        # 請求コンテキスト
│       ├── domain/
│       ├── application/
│       └── infrastructure/
└── shared/             # 共有カーネル（最小限に保つ）
    ├── types/
    └── utils/
```

**コンテキスト間の通信**: 直接インポートせず、イベントまたは明示的な Anti-Corruption Layer を使う。

```typescript
// Bad: 注文コンテキストが認証コンテキストの内部型に直接依存
import { AuthUser } from "@/modules/auth/domain/auth-user";

// Good: 注文コンテキスト側で必要な型を定義
// --- modules/order/domain/types.ts ---
type CustomerId = string; // 注文コンテキストにとっての「顧客」は ID だけで十分
```

### Aggregate: 整合性境界の単位

Aggregate はトランザクション整合性を保証する単位。外部から Aggregate 内部のエンティティを直接操作しない。

```typescript
// --- domain/order/order.ts ---
class Order {
  private constructor(
    readonly id: string,
    private _status: OrderStatus,
    private _items: OrderItem[],
    private _totalAmount: number,
  ) {}

  static create(customerId: string, items: OrderItemInput[]): Order {
    if (items.length === 0) {
      throw new DomainError("Order must have at least one item");
    }
    const orderItems = items.map(OrderItem.create);
    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    return new Order(generateId(), "pending", orderItems, total);
  }

  addItem(input: OrderItemInput): void {
    if (this._status !== "pending") {
      throw new DomainError("Cannot modify confirmed order");
    }
    const item = OrderItem.create(input);
    this._items.push(item);
    this.recalculateTotal();
  }

  confirm(): void {
    if (this._items.length === 0) {
      throw new DomainError("Cannot confirm empty order");
    }
    this._status = "confirmed";
  }

  private recalculateTotal(): void {
    this._totalAmount = this._items.reduce((sum, i) => sum + i.subtotal, 0);
  }
}
```

**ルール**:
- Aggregate Root（Order）経由でのみ内部状態を変更する
- Aggregate 間の参照は ID のみ（オブジェクト参照しない）
- 1トランザクション = 1 Aggregate の更新

### Repository パターン: 永続化の抽象化

```typescript
// --- domain/order/order-repository.ts ---
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
}

// --- application/order/create-order-use-case.ts ---
class CreateOrderUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const order = Order.create(input.customerId, input.items);
    await this.orderRepo.save(order);
    return order;
  }
}
```

**Repository の責務**: ドメインオブジェクトの保存・取得のみ。クエリロジックはここに、ビジネスロジックはドメインに。

---

## ADR（Architecture Decision Records）

重要なアーキテクチャ判断を記録し、将来の「なぜこうなっているのか」に答える。

### テンプレート

```markdown
# ADR-XXXX: [タイトル]

## ステータス
proposed | accepted | deprecated | superseded by ADR-YYYY

## コンテキスト
[判断が必要になった背景・状況]

## 決定
[選択した方針とその理由]

## 却下した選択肢
- [選択肢A]: [却下理由]
- [選択肢B]: [却下理由]

## 影響
- [正の影響]
- [負の影響・トレードオフ]
```

### ADR を書くべきタイミング

- 新しいモジュール・サービスの追加
- 外部ライブラリの選定（同等の選択肢が複数ある場合）
- データモデルの重要な設計判断
- レイヤー間の通信方式の決定
- パフォーマンスとのトレードオフを含む設計判断

### 配置場所

```
docs/
└── adr/
    ├── 0001-use-prisma-as-orm.md
    ├── 0002-app-router-only.md
    └── 0003-module-based-structure.md
```

---

## モジュール境界設計

### 境界の判定基準

| 基準 | 分離すべき | 同一モジュールでOK |
|---|---|---|
| 変更頻度 | 異なる | 同じ |
| チーム所有権 | 別チーム | 同一チーム |
| ドメイン概念 | 異なるコンテキスト | 同一コンテキスト |
| デプロイ独立性 | 独立デプロイしたい | 一緒でよい |

### 公開 API の設計

各モジュールは `index.ts` で公開インターフェースを明示する。

```typescript
// --- modules/order/index.ts ---
// 公開する型
export type { Order } from "./domain/order";
export type { CreateOrderInput } from "./application/types";

// 公開するユースケース
export { CreateOrderUseCase } from "./application/create-order-use-case";
export { GetOrderUseCase } from "./application/get-order-use-case";

// 内部実装は公開しない
// PrismaOrderRepository, OrderItem 等は export しない
```

**ルール**: モジュール外からの `import` は必ず `index.ts` 経由にする。内部パスへの直接アクセスは禁止。

---

## レイヤードアーキテクチャ

### 4層構造

```
┌─────────────────────────────────────┐
│  Presentation (UI / API Routes)     │  ← フレームワーク依存OK
├─────────────────────────────────────┤
│  Application (Use Cases)            │  ← オーケストレーション
├─────────────────────────────────────┤
│  Domain (Entities, Value Objects)   │  ← ビジネスルール（純粋）
├─────────────────────────────────────┤
│  Infrastructure (DB, External API)  │  ← 技術的詳細
└─────────────────────────────────────┘
```

### 各層の責務と依存ルール

| 層 | 責務 | 依存してよい層 | 配置例 |
|---|---|---|---|
| Presentation | リクエスト処理、レスポンス整形 | Application | `src/app/api/`, `src/app/**/page.tsx` |
| Application | ユースケース実行、トランザクション管理 | Domain | `src/modules/*/application/` |
| Domain | ビジネスルール、バリデーション | なし（自己完結） | `src/modules/*/domain/` |
| Infrastructure | DB操作、外部API呼び出し | Domain（インターフェース実装） | `src/modules/*/infrastructure/` |

### 実践例: Next.js App Router での適用

```typescript
// Presentation: src/app/api/orders/route.ts
export async function POST(request: Request) {
  const input = orderInputSchema.parse(await request.json());
  const order = await createOrderUseCase.execute(input);
  return Response.json(order, { status: 201 });
}

// Application: src/modules/order/application/create-order-use-case.ts
class CreateOrderUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}
  async execute(input: CreateOrderInput): Promise<Order> {
    const order = Order.create(input.customerId, input.items);
    await this.orderRepo.save(order);
    return order;
  }
}

// Domain: 純粋なビジネスロジック。フレームワーク依存なし。
// Infrastructure: Prisma を使った OrderRepository の実装。
```

---

## 依存性注入の実践

TypeScript プロジェクトでは DI コンテナなしでも、コンストラクタ注入で十分なケースが多い。

### 手動 DI（Composition Root パターン）

```typescript
// --- src/composition-root.ts ---
import { PrismaClient } from "@prisma/client";
import { PrismaOrderRepository } from "@/modules/order/infrastructure/prisma-order-repo";
import { CreateOrderUseCase } from "@/modules/order/application/create-order-use-case";
import { EmailNotifier } from "@/modules/notification/infrastructure/email-notifier";

const prisma = new PrismaClient();

// 依存関係の組み立てを1箇所に集約
export const orderRepo = new PrismaOrderRepository(prisma);
export const notifier = new EmailNotifier();
export const createOrderUseCase = new CreateOrderUseCase(orderRepo);
```

**ルール**: 依存の組み立て（`new` の呼び出し）はアプリケーションのエントリーポイント付近（Composition Root）に集約する。ドメイン層やアプリケーション層では `new` で具象クラスを生成しない。

### テスト時の差し替え

```typescript
// テスト用のインメモリ実装
class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }
}

// テストでは InMemory 実装を注入
describe("CreateOrderUseCase", () => {
  it("should create an order", async () => {
    const repo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(repo);
    const order = await useCase.execute(validInput);
    expect(order).toBeDefined();
  });
});
```

---

## アンチパターン

| パターン | 問題 | 対策 |
|---|---|---|
| God Class | 1クラスに全責務が集中 | SRP に従い分割 |
| Circular Dependency | モジュール間の循環参照 | 依存逆転で解消 |
| Anemic Domain Model | ドメインオブジェクトがデータだけ | ビジネスロジックをドメインに移動 |
| Leaky Abstraction | インフラの詳細がドメインに漏れる | Repository インターフェースで隔離 |
| Premature Abstraction | 1つしか実装がないのにインターフェース | 2つ目の実装が必要になってから抽象化 |
| Shared Mutable State | グローバル変数やシングルトンの濫用 | コンストラクタ注入で明示的に渡す |

---

## 適用判断ガイド

全プロジェクトで完全な DDD を適用する必要はない。規模に応じて段階的に導入する。

| プロジェクト規模 | 推奨アプローチ |
|---|---|
| 小規模（PoC、数画面） | レイヤー分離のみ。DDD は不要 |
| 中規模（10+ 画面、複数ドメイン） | モジュール分割 + Repository パターン |
| 大規模（複数チーム、複雑なドメイン） | Bounded Context + Aggregate + ADR |

---

## Applicability

- **フェーズ**: design, implementation, review
- **ドメイン**: universal（全技術ドメインに適用。特にモジュール設計・レイヤー設計時）
