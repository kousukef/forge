---
name: database-migrations
description: "When creating, modifying, or reviewing database schema changes (prisma/migrations/, *.prisma files). Provides zero-downtime Expand-Contract migration patterns, data loss risk detection, staged migration strategies, rollback procedures, and Prisma Migrate workflow best practices. MUST be invoked before executing any schema migration or column rename/remove operation."
---

# データベースマイグレーションスキル

## 原則

本番データベースのスキーマ変更はゼロダウンタイムで実施する。
データ損失リスクを事前に検知し、段階的なマイグレーション戦略で安全に適用する。
Prisma Migrate を中心としたワークフローに従い、手動 SQL 操作を排除する。

---

## Expand-Contract パターン（ゼロダウンタイムの核心）

すべての破壊的スキーマ変更は Expand-Contract パターンで実施する。直接的なカラム名変更・削除は禁止。

### 3フェーズ構成

```
Phase 1: EXPAND（拡張）
  - 新しいカラム/テーブルを追加（nullable または default 付き）
  - アプリケーションは新旧両方に書き込む
  - 既存データをバックフィルする

Phase 2: MIGRATE（移行）
  - アプリケーションは新カラムから読み取り、新旧両方に書き込む
  - データ整合性を検証する

Phase 3: CONTRACT（収縮）
  - アプリケーションは新カラムのみを使用する
  - 旧カラム/テーブルを別マイグレーションで削除する
```

### タイムライン例

```
Day 1: マイグレーション - new_status カラム追加（nullable）
Day 1: アプリ v2 デプロイ - status と new_status の両方に書き込み
Day 2: バックフィルマイグレーション実行
Day 3: アプリ v3 デプロイ - new_status のみ読み取り
Day 7: マイグレーション - 旧 status カラム削除
```

---

## データ損失リスク検出

以下の操作はデータ損失リスクがある。マイグレーション作成時に必ずチェックする。

### 高リスク操作（必ず Expand-Contract を適用）

| 操作 | リスク | 安全な代替手段 |
|------|--------|---------------|
| カラム削除 | データ完全消失 | まずアプリコードから参照を削除 → 次のデプロイで削除 |
| カラム名変更 | アプリエラー + データアクセス不能 | Expand-Contract（新カラム追加 → バックフィル → 旧カラム削除） |
| カラム型変更 | データ切り捨て・変換エラー | 新カラム追加 → データ変換 → 旧カラム削除 |
| NOT NULL 制約の追加 | 既存 NULL 行でエラー | バックフィルしてから制約追加 |
| テーブル削除 | データ完全消失 | まずアプリコードから参照を削除 → バックアップ確認 → 削除 |

### 中リスク操作（注意して実施）

| 操作 | リスク | 対策 |
|------|--------|------|
| UNIQUE 制約の追加 | 重複データでエラー | 事前に重複データを確認・解消 |
| 外部キー制約の追加 | 孤立レコードでエラー | 事前に参照整合性を確認 |
| デフォルト値の変更 | 既存レコードには影響しない | 影響範囲を確認 |

### 安全な操作（直接実行可能）

- nullable カラムの追加
- デフォルト値付きカラムの追加（PostgreSQL 11+ は即座に完了、テーブル書き換えなし）
- インデックスの追加（CONCURRENTLY を使用する場合）
- テーブルの新規作成

---

## 段階的マイグレーション戦略

### スキーマ変更とデータ変更の分離

スキーマ変更（DDL）とデータ変更（DML）は必ず別マイグレーションにする。

```
migrations/
  20240115_add_display_name/       ← DDL: カラム追加
  20240116_backfill_display_name/  ← DML: データバックフィル
  20240120_drop_username/          ← DDL: 旧カラム削除
```

**理由**:
- ロールバックが容易になる
- 長時間トランザクションを回避できる
- 各ステップを個別にテストできる

### 大量データのバックフィル

大量データのバックフィルはバッチ処理で実施する。一括 UPDATE はテーブルロックを引き起こす。

```typescript
// Prisma でのバッチバックフィル例
async function backfillDisplayNames(prisma: PrismaClient) {
  const batchSize = 5000;
  let processed = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: { displayName: null },
      take: batchSize,
      select: { id: true, username: true },
    });

    if (users.length === 0) break;

    await prisma.$transaction(
      users.map((user) =>
        prisma.user.update({
          where: { id: user.id },
          data: { displayName: user.username },
        })
      )
    );

    processed += users.length;
    console.error(`Backfilled ${processed} users`);
  }
}
```

---

## ロールバック戦略

### Prisma Migrate のロールバック方針

Prisma Migrate は本番環境での DOWN マイグレーションを直接サポートしない。
ロールバックは「新しい forward マイグレーション」として実施する。

### ロールバック手順

#### 失敗したマイグレーションの解決

```bash
# マイグレーションをロールバック済みとしてマーク
npx prisma migrate resolve --rolled-back 20240115000000_add_users_table

# 手動でロールバック SQL を実行（必要な場合）
npx prisma db execute --file ./down.sql

# 修正後に再デプロイ
npx prisma migrate deploy
```

#### down.sql の生成

```bash
# マイグレーション作成時に down.sql も生成する
# Prisma 公式ワークフロー:
# 1. 変更前のスキーマを保存
# 2. マイグレーション適用後、元のスキーマに戻す
# 3. prisma migrate diff でロールバック SQL を生成

npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma.backup \
  --script > down.sql
```

### ロールバック判断基準

| 状況 | アクション |
|------|-----------|
| マイグレーション途中で失敗 | `migrate resolve --rolled-back` + 手動修復 |
| マイグレーション成功、アプリにバグ | アプリをロールバック（スキーマはそのまま） |
| データ破損の可能性 | バックアップからリストア + `migrate resolve` |

---

## Prisma Migrate ワークフロー

### 開発環境

```bash
# スキーマ変更後、マイグレーション作成 + 適用
npx prisma migrate dev --name add_user_avatar

# マイグレーションを作成するが適用しない（手動編集用）
npx prisma migrate dev --create-only --name add_email_index

# データベースをリセット（全データ削除 + 全マイグレーション再適用）
npx prisma migrate reset

# Prisma Client を再生成
npx prisma generate
```

### 本番環境

```bash
# 保留中のマイグレーションを適用（非対話的、アドバイザリーロック付き）
npx prisma migrate deploy
```

**`migrate deploy` の特徴**:
- アドバイザリーロックにより同時実行を防止
- `_prisma_migrations` テーブルで適用済みマイグレーションを追跡
- 失敗した場合はその時点で停止（部分適用の可能性あり）

### CI/CD パイプライン

```yaml
# GitHub Actions 例
name: Deploy Migrations
on:
  push:
    paths:
      - prisma/migrations/**
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### カスタム SQL マイグレーション

Prisma が自動生成できない操作（CONCURRENTLY インデックス、データバックフィル等）には手動編集を使う。

```bash
# 空のマイグレーションを作成
npx prisma migrate dev --create-only --name add_concurrent_index
```

作成された `migration.sql` を手動編集:

```sql
-- Prisma は CONCURRENTLY を生成できないため手動で記述
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

---

## カラム名変更の安全なパターン

Prisma スキーマで `@map` を活用し、アプリケーション側の名前変更とデータベース側の名前変更を分離する。

### パターン 1: アプリ側のみ名前変更（推奨）

データベースカラム名はそのままで、Prisma フィールド名だけ変更する。

```prisma
model User {
  // データベースカラム名 "username" はそのまま
  // Prisma クライアントでは "displayName" としてアクセス
  displayName String @map("username")
}
```

**メリット**: マイグレーション不要。データ損失リスクゼロ。

### パターン 2: データベース側も名前変更（Expand-Contract）

```
// Step 1: 新カラム追加（マイグレーション 1）
model User {
  username    String?      // 旧カラム（nullable に変更）
  displayName String?      // 新カラム追加
}

// Step 2: バックフィル（マイグレーション 2: カスタム SQL）

// Step 3: 旧カラム削除（マイグレーション 3）
model User {
  displayName String       // 新カラムのみ
}
```

---

## カラム削除の安全なパターン

### 2段階デプロイ

```
Deploy 1: アプリケーションコードからカラム参照を削除
  - Prisma スキーマからフィールドを削除
  - prisma migrate dev --create-only で SQL を確認
  - DROP COLUMN が含まれていることを確認

Deploy 2: マイグレーション適用
  - npx prisma migrate deploy
```

**禁止**: アプリコード変更とカラム削除を同一デプロイに含めない。
デプロイの順序が保証されない環境では、旧バージョンのアプリが削除済みカラムにアクセスしてエラーになる。

---

## インデックス作成の考慮事項

### CONCURRENTLY インデックス

大規模テーブルへのインデックス追加は `CREATE INDEX CONCURRENTLY` を使用する。
通常の `CREATE INDEX` はテーブルへの書き込みをブロックする。

```bash
# Prisma は CONCURRENTLY を自動生成しないため手動マイグレーションを使う
npx prisma migrate dev --create-only --name add_users_email_index
```

```sql
-- migration.sql を手動編集
-- 通常の CREATE INDEX ではなく CONCURRENTLY を使用
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
  ON users (email);

-- 注意: CONCURRENTLY はトランザクション内で実行できない
-- Prisma のマイグレーションはデフォルトでトランザクション内実行のため、
-- migration.sql の先頭に以下を追加する必要がある場合がある:
-- (Prisma は -- WrappedInTransaction: false コメントで制御)
```

### インデックス設計ガイドライン

| クエリパターン | インデックス種別 | Prisma スキーマ |
|---------------|----------------|-----------------|
| 等価検索 | B-tree | `@@index([field])` |
| 複合条件（等価 + 範囲） | 複合 B-tree | `@@index([status, createdAt])` |
| UNIQUE 制約 | Unique | `@@unique([email])` |
| 部分インデックス | カスタム SQL | 手動マイグレーション |

```prisma
model Order {
  id        String   @id @default(cuid())
  status    String
  userId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  // 複合インデックス: 等価カラムを先、範囲カラムを後に配置
  @@index([status, createdAt])
  // 外部キーインデックス（N+1 防止に必須）
  @@index([userId])
}
```

---

## マイグレーション安全チェックリスト

マイグレーション実行前に必ず確認する。

- [ ] `--create-only` で SQL を事前確認したか
- [ ] データ損失リスクのある操作を Expand-Contract に分解したか
- [ ] 大規模テーブルのインデックスに CONCURRENTLY を使用しているか
- [ ] スキーマ変更とデータ変更を別マイグレーションに分離したか
- [ ] ロールバック手順（down.sql）を準備したか
- [ ] 本番相当のデータ量でテストしたか
- [ ] `npx prisma migrate deploy` で適用されることを確認したか

---

## アンチパターン

| アンチパターン | 問題 | 正しいアプローチ |
|---------------|------|-----------------|
| 本番 DB への手動 SQL 実行 | 監査証跡なし、再現不可能 | 常にマイグレーションファイルを使用 |
| デプロイ済みマイグレーションの編集 | 環境間のドリフト | 新しいマイグレーションを作成 |
| NOT NULL カラムの直接追加 | テーブルロック + 全行書き換え | nullable で追加 → バックフィル → 制約追加 |
| 大規模テーブルに通常の CREATE INDEX | 書き込みブロック | CREATE INDEX CONCURRENTLY |
| スキーマ変更 + データ変更を1マイグレーションに | ロールバック困難、長時間トランザクション | 別マイグレーションに分離 |
| コード変更前にカラム削除 | アプリエラー | コード変更を先にデプロイ |
| `migrate reset` を本番で実行 | 全データ消失 | 開発環境専用。本番は `migrate deploy` のみ |
| `migrate dev` を本番で実行 | シャドウ DB 作成、データ損失の可能性 | 本番は `migrate deploy` のみ |

---

## Applicability

- **フェーズ**: implementation, review, design
- **ドメイン**: prisma-database
