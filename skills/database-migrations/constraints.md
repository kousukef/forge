# database-migrations: 技術的制約

- 直接的なカラム名変更・削除は禁止。Expand-Contract パターンで実施
- スキーマ変更（DDL）とデータ変更（DML）は必ず別マイグレーションにする
- `migrate dev` は開発環境専用。本番は `migrate deploy` のみ
- `migrate reset` は本番で実行禁止（全データ消失）
- デプロイ済みマイグレーションファイルの編集は禁止
- NOT NULL カラムの直接追加は禁止。nullable → バックフィル → 制約追加
- 大規模テーブルのインデックス追加は CREATE INDEX CONCURRENTLY を使用
- CONCURRENTLY はトランザクション内で実行不可
- Prisma Migrate は DOWN マイグレーションを直接サポートしない。ロールバックは forward マイグレーションで実施
- コード変更前にカラム削除しない（アプリエラー防止）
- アプリコード変更とカラム削除を同一デプロイに含めない
- 大量データのバックフィルはバッチ処理で実施（一括 UPDATE はテーブルロック）
- 本番 DB への手動 SQL 実行は禁止（監査証跡なし）
