# terraform-gcp-expert: 設計ガイダンス

## GCP リソース設計の判断基準

### Cloud Run v2 の設計考慮

- ingress 設定: 内部ロードバランサー経由のみに制限するのがデフォルト
- スケーリング: 本番は min_instance_count >= 1（コールドスタート回避）、開発は 0（コスト最適化）
- deletion_protection: 本番は true。開発は false で柔軟に
- シークレット: Secret Manager 参照で環境変数に注入。ハードコード禁止
- VPC アクセス: Serverless VPC Access Connector でプライベートネットワーク接続

### Cloud SQL の設計考慮

- 可用性: 本番は REGIONAL（ゾーン障害に耐性）、開発は ZONAL（コスト最適化）
- バックアップ: 本番は PITR 有効 + 30日保持、開発は 7日保持
- ネットワーク: ipv4_enabled = false でプライベートネットワーク構成
- メンテナンスウィンドウ: 日曜 3:00 stable トラックがデフォルト推奨

### Cloud Storage の設計考慮

- uniform_bucket_level_access: true で IAM 統一管理
- public_access_prevention: enforced でパブリックアクセス防止
- バージョニング: 有効にしてデータ復旧を可能にする
- ライフサイクルルール: 90日 → NEARLINE、365日 → COLDLINE でコスト最適化
- 暗号化: Cloud KMS カスタム鍵で暗号化

## IAM 設計の指針

### 最小権限の原則

- サービスごとに専用 SA を作成（Cloud Run、GKE 等）
- 事前定義ロールを優先。カスタムロールは不足する場合のみ
- 基本ロール（roles/editor, roles/owner）はプログラムから付与禁止
- condition ブロックで適用範囲を限定

### Secret Manager 統合

- シークレットは Secret Manager で一元管理
- 個別の SA に secretAccessor ロールを付与
- lifecycle ignore_changes で secret_data の意図しない上書きを防止

## モジュール設計

### ディレクトリ構造の設計トレードオフ

- 機能別モジュール分割: networking, database, cloud-run, storage, secrets
- 環境別ディレクトリ: dev, staging, prod で tfvars を分離
- 全環境で同じモジュール、tfvars で差分管理（DRY 原則）

### 変数設計

- 全変数に type + description + validation を設定
- validation ブロックで不正値を早期検出
- 環境名は enum で制約（dev, staging, prod）
- リージョン名は正規表現で GCP 形式を強制

## ネットワーク設計

### VPC 設計パターン

- auto_create_subnetworks = false で手動サブネット管理
- private_ip_google_access = true で Google API へのプライベートアクセス
- VPC フローログ有効化（監査・デバッグ用）

### ファイアウォール設計

- デフォルト拒否 + 必要なもののみ許可（ホワイトリスト方式）
- IAP SSH アクセスは IAP IP 範囲のみ許可
- priority で適用順序を明示管理

## ステート管理

### リモートステート設計

- GCS バケットで一元管理。環境ごとに prefix で分離
- バージョニング必須（ステートの履歴復旧に対応）
- アクセス制限: CI/CD SA のみにアクセスを許可
- GCS バックエンドは自動でロック対応

## 環境分離の設計

### 分離レベル

- GCP プロジェクトレベルで分離（dev, staging, prod）
- ステートファイルは環境ごとに独立
- 同一モジュールを使用し tfvars で差分管理
- 本番保護: deletion_protection = true を強制

## for_each vs count の判断

- for_each: キーベースで安全。中間要素削除時に意図しない再作成が発生しない
- count: インデックスベース。条件付き作成（0 or 1）のみに使用する
- IAM ロールの一括付与: toset() + for_each で安全に管理

## コード品質の設計考慮

- コミット前: terraform fmt -recursive && terraform validate
- 追加ツール: tflint（Lint）、checkov / tfsec（セキュリティスキャン）
- バージョン管理: .tf + .terraform.lock.hcl をコミット
- コミット対象外: terraform.tfstate, .terraform/, *.tfplan, シークレット含む .tfvars

## 命名規約

- リソース名: 小文字 + アンダースコア。単数形
- 1つしかないリソースは main をデフォルト名に
- name_prefix: "${var.project_name}-${var.environment}" で環境ごとに一意化
- GCS バケット名: "${var.project_id}-${var.environment}-data" でグローバル一意性を確保
