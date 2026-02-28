# prisma-expert: 技術的制約

- Prisma Client API のみ使用。生 SQL（`$queryRaw`/`$executeRaw`）は原則禁止
- `$queryRawUnsafe` は使用禁止（SQL インジェクション脆弱性）
- `Float` で金額を扱うことは禁止。`Decimal` を使用する
- `findMany` には必ず `take` で上限を設定する
- 外部キーカラムには必ず `@@index` を設定する（PostgreSQL は自動生成しない）
- 暗黙的多対多リレーションは禁止。明示的中間テーブルを使用する
- トランザクション内に外部 API 呼び出しを含めない
- 複合インデックスの順序: 等値条件のカラムを先、範囲条件を後に配置
- カスケード設定のデフォルトは `Restrict`（データ損失防止の安全側）
- UUID v4 は大規模テーブルでインデックス断片化を起こす。CUID2 を推奨
- 部分インデックスは Prisma 非対応。`--create-only` で手動 SQL 追記
- 開発環境のホットリロード対策: PrismaClient シングルトンパターン必須
- モデル名は PascalCase 単数形、フィールド名は camelCase
- `@@map` / `@map` でテーブル・カラムを snake_case 化
- `findFirst` + `create`/`update` はレースコンディション。`upsert` を使用
