---
name: terraform-gcp-expert
description: "When writing, reviewing, or designing Terraform configurations for Google Cloud Platform resources. Provides GCP resource patterns, module design, IAM, state management, and security best practices. MUST be invoked when working with any GCP Terraform code including Cloud Run, Cloud SQL, Cloud Storage, VPC, or Secret Manager."
---

# Terraform GCP Expert

GCP リソース設計に特化した Terraform ベストプラクティスガイド。Cloud Run / Cloud SQL / Cloud Storage / VPC / Secret Manager を中心に、モジュール設計・IAM・ステート管理・環境分離の規約を提供する。

## 1. プロバイダ設定

```hcl
terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  default_labels = {
    managed_by  = "terraform"
    project     = var.project_name
    environment = var.environment
  }
}
```

## 2. ファイル構成

| ファイル | 用途 |
|---|---|
| `terraform.tf` | Terraform / プロバイダバージョン制約 |
| `providers.tf` | プロバイダ設定 |
| `backend.tf` | バックエンド設定（GCS リモートステート） |
| `main.tf` | プライマリリソース・データソース |
| `variables.tf` | 入力変数（アルファベット順） |
| `outputs.tf` | 出力値（アルファベット順） |
| `locals.tf` | ローカル変数 |

## 3. 命名規約

- **小文字 + アンダースコア** を使用（リソースタイプ名を除く記述的名詞）
- 単数形、1つしかないリソースは `main` をデフォルト名に

```hcl
# NG
resource "google_compute_network" "myVPC-network" {}
# OK
resource "google_compute_network" "main" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
# VPC: "${local.name_prefix}-vpc"  Cloud Run: "${local.name_prefix}-api"
# Cloud SQL: "${local.name_prefix}-db"  GCS: "${var.project_id}-${var.environment}-data"
```

## 4. GCP リソースパターン

### 4.1 Cloud Run v2

```hcl
resource "google_cloud_run_v2_service" "api" {
  name                = "${local.name_prefix}-api"
  location            = var.region
  deletion_protection = var.environment == "prod" ? true : false
  ingress             = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.cloud_run.email
    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.cloud_run_max_instances
    }
    containers {
      image = var.container_image
      resources {
        limits = { cpu = var.cloud_run_cpu, memory = var.cloud_run_memory }
      }
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}
```

### 4.2 Cloud SQL

```hcl
resource "google_sql_database_instance" "main" {
  name                = "${local.name_prefix}-db"
  region              = var.region
  database_version    = "POSTGRES_15"
  deletion_protection = var.environment == "prod" ? true : false

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    disk_autoresize   = true
    disk_type         = "PD_SSD"
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.environment == "prod"
      start_time                     = "03:00"
      backup_retention_settings {
        retained_backups = var.environment == "prod" ? 30 : 7
      }
    }
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      enable_private_path_for_google_cloud_services = true
    }
    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }
  }
}
```

### 4.3 Cloud Storage

```hcl
resource "google_storage_bucket" "data" {
  name                        = "${var.project_id}-${var.environment}-data"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = var.environment != "prod"

  versioning { enabled = true }
  encryption { default_kms_key_name = google_kms_crypto_key.storage.id }

  lifecycle_rule {
    condition { age = 90 }
    action { type = "SetStorageClass", storage_class = "NEARLINE" }
  }
  lifecycle_rule {
    condition { age = 365 }
    action { type = "SetStorageClass", storage_class = "COLDLINE" }
  }
  labels = local.common_labels
}
```

### 4.4 VPC ネットワーク

```hcl
resource "google_compute_network" "main" {
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "main" {
  for_each                 = var.subnets
  name                     = "${local.name_prefix}-${each.key}-subnet"
  ip_cidr_range            = each.value.cidr
  region                   = var.region
  network                  = google_compute_network.main.id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_router" "main" {
  name    = "${local.name_prefix}-router"
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "main" {
  name                               = "${local.name_prefix}-nat"
  router                             = google_compute_router.main.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  log_config { enable = true, filter = "ERRORS_ONLY" }
}

# Serverless VPC Access Connector（Cloud Run 用）
resource "google_vpc_access_connector" "main" {
  name         = "${local.name_prefix}-connector"
  region       = var.region
  machine_type = "e2-micro"
  subnet { name = google_compute_subnetwork.connector.name }
}
```

### 4.5 ファイアウォール

```hcl
resource "google_compute_firewall" "deny_all_ingress" {
  name      = "${local.name_prefix}-deny-all-ingress"
  network   = google_compute_network.main.id
  direction = "INGRESS"
  priority  = 65534
  deny { protocol = "all" }
  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_iap_ssh" {
  name      = "${local.name_prefix}-allow-iap-ssh"
  network   = google_compute_network.main.id
  direction = "INGRESS"
  priority  = 1000
  allow { protocol = "tcp", ports = ["22"] }
  source_ranges = ["35.235.240.0/20"]  # IAP IP 範囲
  target_tags   = ["allow-iap-ssh"]
}
```

## 5. IAM 最小権限の原則

```hcl
resource "google_service_account" "cloud_run" {
  account_id   = "${local.name_prefix}-run-sa"
  display_name = "Cloud Run Service Account - ${var.environment}"
}

resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

**IAM ルール:**

| ルール | 説明 |
|---|---|
| デフォルト SA 使用禁止 | Compute Engine のデフォルト SA を本番で使わない |
| サービスごとに SA 分離 | Cloud Run / GKE それぞれに専用 SA を作成 |
| 基本ロール使用禁止 | `roles/editor` / `roles/owner` をプログラムから付与しない |
| 事前定義ロール優先 | カスタムロールは不足する場合のみ |
| 条件付き IAM | `condition` ブロックで範囲を限定 |

## 6. Secret Manager 統合

```hcl
resource "google_secret_manager_secret" "database_url" {
  secret_id  = "${local.name_prefix}-database-url"
  replication { auto {} }
  labels     = local.common_labels
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${google_sql_user.main.name}:${random_password.db_password.result}@/${google_sql_database.main.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
  lifecycle { ignore_changes = [secret_data] }
}

resource "google_secret_manager_secret_iam_member" "accessor" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

**禁止:** `secret_data` へのハードコード / `.tfvars` へのシークレット記載 / `sensitive = true` なしの出力

## 7. モジュール設計

### ディレクトリ構造

```
terraform/
  modules/
    networking/    # VPC, サブネット, ファイアウォール, NAT
    database/      # Cloud SQL, ユーザー, データベース
    cloud-run/     # Cloud Run, SA, IAM
    storage/       # Cloud Storage, IAM
    secrets/       # Secret Manager
  environments/
    dev/           # main.tf, terraform.tfvars, backend.tf
    staging/
    prod/
```

### 変数バリデーション（必須パターン）

全変数に `type` + `description` を必須とし、バリデーションを積極的に使う。

```hcl
variable "environment" {
  description = "デプロイ環境"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment は dev, staging, prod のいずれか"
  }
}

variable "region" {
  description = "GCP リージョン"
  type        = string
  default     = "asia-northeast1"
  validation {
    condition     = can(regex("^[a-z]+-[a-z]+[0-9]$", var.region))
    error_message = "有効な GCP リージョン名を指定すること"
  }
}

variable "subnets" {
  description = "サブネット定義マップ"
  type = map(object({
    cidr             = string
    secondary_ranges = optional(list(object({ name = string, cidr = string })), [])
  }))
  validation {
    condition     = alltrue([for k, v in var.subnets : can(cidrhost(v.cidr, 0))])
    error_message = "全サブネットに有効な CIDR ブロックを指定すること"
  }
}
```

## 8. ステート管理（GCS リモートステート）

```hcl
terraform {
  backend "gcs" {
    bucket = "my-project-terraform-state"
    prefix = "env/prod"
  }
}
```

**ステートバケット要件:**

```hcl
resource "google_storage_bucket" "terraform_state" {
  name                        = "${var.project_id}-terraform-state"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  versioning { enabled = true }
  lifecycle_rule {
    condition { num_newer_versions = 10 }
    action { type = "Delete" }
  }
}
```

| ルール | 説明 |
|---|---|
| 環境ごとに prefix 分離 | `prefix = "env/${var.environment}"` |
| バージョニング必須 | `versioning { enabled = true }` |
| アクセス制限 | CI/CD SA のみにアクセスを許可 |
| ステートロック | GCS バックエンドは自動でロック対応 |

## 9. 環境分離

| ルール | 説明 |
|---|---|
| プロジェクト分離 | dev / staging / prod で GCP プロジェクトを分ける |
| ステート分離 | 環境ごとに独立したステートファイル |
| 同一モジュール | 全環境で同じモジュール、tfvars で差分管理 |
| 本番保護 | `deletion_protection = true` を prod で強制 |

```hcl
# environments/dev/terraform.tfvars
project_id = "my-project-dev"
environment = "dev"
db_tier     = "db-f1-micro"

# environments/prod/terraform.tfvars
project_id = "my-project-prod"
environment = "prod"
db_tier     = "db-custom-4-16384"
```

## 10. for_each の活用（count より優先）

`count` はインデックスベースで中間要素削除時に意図しない再作成が発生する。`for_each` はキーベースで安全。

```hcl
# NG: count
resource "google_project_iam_member" "roles" {
  count   = length(var.roles)
  project = var.project_id
  role    = var.roles[count.index]
  member  = "serviceAccount:${google_service_account.main.email}"
}

# OK: for_each
resource "google_project_iam_member" "roles" {
  for_each = toset(var.roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.main.email}"
}
```

**count は条件付き作成のみに使用:**

```hcl
resource "google_compute_router_nat" "main" {
  count  = var.enable_nat ? 1 : 0
  name   = "${local.name_prefix}-nat"
  router = google_compute_router.main.name
  region = var.region
}
```

## 11. セキュリティチェックリスト

- [ ] 全ストレージ暗号化（Cloud KMS / デフォルト暗号化）
- [ ] プライベートネットワーク構成（Cloud SQL: `ipv4_enabled = false`）
- [ ] パブリックアクセス防止（GCS: `public_access_prevention = "enforced"`）
- [ ] IAM 最小権限（`roles/editor` 等の基本ロール使用禁止）
- [ ] ファイアウォール最小公開（デフォルト拒否 + 必要なもののみ許可）
- [ ] VPC フローログ・監査ログ有効化
- [ ] シークレットのハードコード禁止
- [ ] `sensitive = true` で機密出力をマスク
- [ ] `deletion_protection = true` を本番環境で設定

```hcl
resource "google_kms_key_ring" "main" {
  name     = "${local.name_prefix}-keyring"
  location = var.region
}

resource "google_kms_crypto_key" "storage" {
  name            = "${local.name_prefix}-storage-key"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days
}
```

## 12. コード品質

コミット前に実行: `terraform fmt -recursive && terraform validate`

追加ツール: `tflint`（Lint）/ `checkov` / `tfsec`（セキュリティスキャン）/ `terraform test`

**バージョン管理:** `.tf` + `.terraform.lock.hcl` をコミット。`terraform.tfstate` / `.terraform/` / `*.tfplan` / シークレット含む `.tfvars` はコミット対象外。

## 13. レビューチェックリスト

- [ ] `terraform fmt` + `terraform validate` 通過
- [ ] 全変数に `type` / `description` / `validation`
- [ ] 全出力に `description`、機密値に `sensitive = true`
- [ ] `for_each` を `count` より優先
- [ ] IAM 最小権限（基本ロール不使用）
- [ ] 本番で `deletion_protection` 有効
- [ ] ハードコードされた認証情報なし
