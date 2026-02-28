# terraform-gcp-expert: 技術的制約

- Terraform >= 1.9、Google Provider ~> 6.0
- `for_each` を `count` より優先。count は条件付き作成のみに使用
- 全変数に `type` + `description` を必須とする
- デフォルト SA（Compute Engine）を本番で使用禁止
- 基本ロール（`roles/editor` / `roles/owner`）をプログラムから付与禁止
- `secret_data` へのハードコード / `.tfvars` へのシークレット記載は禁止
- 機密出力には `sensitive = true` を必須とする
- 本番環境では `deletion_protection = true` を強制
- Cloud SQL は `ipv4_enabled = false`（プライベートネットワーク構成）
- GCS は `public_access_prevention = "enforced"`
- ステートファイル（`terraform.tfstate`）はコミット対象外
- ステートバケットはバージョニング必須
- 環境ごとにステートファイルを prefix で分離
- コミット前に `terraform fmt -recursive && terraform validate` を実行
