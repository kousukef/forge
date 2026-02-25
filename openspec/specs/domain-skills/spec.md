# domain-skills スペック

## Requirements

### Requirement: Domain Skills SKILL.md の作成（REQ-001）

14の Domain Skills を `~/.claude/skills/<skill-name>/SKILL.md` に作成する。各 SKILL.md は以下の仕様に準拠しなければならない (SHALL)。

#### Scenario: 正常作成
- **GIVEN** スキル名が指定される
- **WHEN** SKILL.md を作成する
- **THEN** `~/.claude/skills/<skill-name>/SKILL.md` が存在し、frontmatter に `name` を含み、`disable-model-invocation: true` は存在しない（Auto-Discovery 有効）。description がトリガー条件形式で記述されている

#### Scenario: 行数制限
- **GIVEN** 14スキル全てが作成済み
- **WHEN** 各 SKILL.md の行数を検証する
- **THEN** 全スキルが 500行以内である

#### Scenario: description 品質
- **GIVEN** 14スキル全てが作成済み
- **WHEN** 各 SKILL.md の description を検証する
- **THEN** 全スキルの description が 1024文字以内であり、"When [condition]. Provides [content]. MUST be invoked [timing]." の3部構成で記述されている

#### Scenario: 外部リポジトリ不可時
- **GIVEN** SKILL.md 作成時に外部リポジトリの内容が取得不可
- **WHEN** スキルを作成する
- **THEN** 公式ドキュメントと既存リファレンスのみをベースに自己完結した内容にする

#### Scenario: 行数超過時
- **GIVEN** SKILL.md の行数が 500行を超過する
- **WHEN** 検証する
- **THEN** 詳細ルールを REFERENCE.md に分離し、SKILL.md から参照する Progressive Disclosure を適用する

#### Non-Functional Requirements
- PERFORMANCE: SKILL.md はスキル起動時に全文がコンテキストに注入されるため、500行以内に抑える
- PERFORMANCE: 全 Domain Skills の description 合計トークン数が 2000 tokens 以内であること

### Requirement: SKILL.md の内容品質（REQ-002）

各 Domain Skills の SKILL.md 本文は以下の構造と品質基準に準拠しなければならない (SHALL)。

#### Scenario: セクション構造
- **GIVEN** SKILL.md を作成する
- **WHEN** 本文のセクション構造を検証する
- **THEN** 「原則」「ルール/ガイドライン」「アンチパターン」「Applicability」の4セクションを含む

#### Scenario: バージョン対応
- **GIVEN** SKILL.md を作成する
- **WHEN** 対象技術のバージョンを確認する
- **THEN** Forge スタックのバージョン（Next.js 15, React 19, Prisma 6.x, Terraform 1.9+, Vitest 3.x, Playwright 1.50+, Tailwind CSS v4）に対応した内容である

#### Scenario: スタック適合性
- **GIVEN** SKILL.md を作成する
- **WHEN** Forge スタックとの適合性を検証する
- **THEN** Pages Router, Jest, AWS, 生SQL, Drizzle, TypeORM のパターンを含まない

#### Scenario: 外部リポジトリのフィルタリング
- **GIVEN** 外部リポジトリのルールが Forge スタックに不適合
- **WHEN** スキルに取り込む
- **THEN** 不適合部分を除外し、Forge スタック向けに翻訳する（例: Jest → Vitest, AWS → GCP, 生SQL → Prisma API）

#### Scenario: 旧バージョン API の除去
- **GIVEN** SKILL.md に旧バージョンの API パターンが含まれる
- **WHEN** 検証する
- **THEN** Forge スタック不適合としてフラグし、除去する

#### Non-Functional Requirements
- CONSISTENCY: 全スキルの本文は日本語で記述し、frontmatter の description のみ英語とする。コード例は TypeScript/TSX で記述する

### Requirement: Progressive Disclosure の適用（REQ-003）

500行を超える詳細情報が必要なスキルは、Progressive Disclosure パターンを適用しなければならない (SHALL)。

#### Scenario: 参照ファイル分離
- **GIVEN** webapp-testing スキルに Playwright API の詳細リファレンスが必要
- **WHEN** SKILL.md を作成する
- **THEN** API_REFERENCE.md に詳細を分離し、SKILL.md から参照する

#### Scenario: 大規模参照ファイル
- **GIVEN** 参照ファイルが 2000行を超える
- **WHEN** サブエージェントが参照ファイルを Read する
- **THEN** セクション単位での部分的 Read を推奨する旨を SKILL.md に記載する

### Requirement: forge-skill-orchestrator の簡素化（REQ-004）

forge-skill-orchestrator から Domain Skills レジストリを削除し、Methodology テーブル + ドメイン検出テーブルのみを維持しなければならない (SHALL)。

#### Scenario: レジストリ削除
- **GIVEN** forge-skill-orchestrator を簡素化する
- **WHEN** SKILL.md を検証する
- **THEN** Domain Skills のレジストリテーブルが削除されており、Methodology Skills テーブルとドメイン検出テーブルが維持されている

#### Scenario: フローチャート簡素化
- **GIVEN** フローチャートに Domain Skills レジストリ参照ステップがある
- **WHEN** 簡素化する
- **THEN** Domain Skills レジストリ参照を削除し、Methodology Skills の解決のみにする

### Requirement: CLAUDE.md の更新（REQ-005）

`~/.claude/CLAUDE.md` と プロジェクト CLAUDE.md の Available Skills テーブルとガイダンステーブル（推奨マッピング）を更新しなければならない (SHALL)。

#### Scenario: テーブル更新
- **GIVEN** 14スキルが全て作成済み
- **WHEN** CLAUDE.md を検証する
- **THEN** 14 Domain Skills 全てが Available Skills テーブルに記載されている

#### Scenario: ガイダンステーブル
- **GIVEN** CLAUDE.md を更新する
- **WHEN** ガイダンステーブルを検証する
- **THEN** テーブル名が「ガイダンステーブル（推奨マッピング）」であり、Dual-Path 設計の導入文とドメインマッピングを含む

#### Scenario: 同期確認
- **GIVEN** グローバル CLAUDE.md を更新する
- **WHEN** プロジェクト CLAUDE.md を検証する
- **THEN** 両方のファイルの Available Skills テーブルとガイダンステーブルが同一内容である

### Requirement: implement-orchestrator ガイダンステーブルの更新（REQ-006）

implement-orchestrator のガイダンステーブル（推奨マッピング）を更新しなければならない (SHALL)。

#### Scenario: テーブル更新
- **GIVEN** ガイダンステーブルを更新する
- **WHEN** テーブルを検証する
- **THEN** 全ドメインのマッピング（.ts/.tsx、Next.js、Prisma、Terraform、E2E テスト、フロントエンド UI、API、セキュリティ、DB マイグレーション）を含む

### Requirement: ui-ux-pro-max-skill の MCP 統合（REQ-007）

ui-ux-pro-max-skill を SKILL.md + MCP プラグインの両方で統合しなければならない (SHALL)。

#### Scenario: 正常統合
- **GIVEN** ui-ux-pro-max-skill を統合する
- **WHEN** SKILL.md を作成する
- **THEN** UX ガイドライン・デザイン原則を SKILL.md に記載し、MCP プラグインの利用方法も記載する

#### Scenario: MCP 不可時のフォールバック
- **GIVEN** MCP プラグインが利用不可
- **WHEN** ui-ux-pro-max-skill を使用する
- **THEN** SKILL.md のルール・ガイドラインのみで動作する

#### Non-Functional Requirements
- SECURITY: MCP プラグインのインストール時にバージョンを固定し、既知の脆弱性がないことを確認する

### Requirement: 14スキルの内容仕様（REQ-008）

各 Domain Skill の SKILL.md は対象技術ドメインのベストプラクティスを含まなければならない (SHALL)。

対象スキル: next-best-practices, vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines, tailwind-best-practices, nextjs-api-patterns, security-patterns, prisma-expert, database-migrations, webapp-testing, vitest-testing-patterns, terraform-gcp-expert, architecture-patterns, ui-ux-pro-max-skill

### Requirement: 最終検証（REQ-009）

全作業完了後、以下の自動検証項目が全て合格しなければならない (SHALL)。

#### Scenario: 全項目合格
- **GIVEN** 全スキルが作成済み
- **WHEN** 最終検証を実行する
- **THEN** 14 SKILL.md 存在、API_REFERENCE.md 存在、Auto-Discovery 有効、500行以内、レジストリ削除済み、CLAUDE.md 記載済み、グローバル/プロジェクト同期済み、description 3部構成準拠が全て合格する

### Requirement: Description Quality for Auto-Discovery（REQ-010）

Domain Skills の description は Auto-Discovery の唯一のトリガーであり、3部構成トリガー条件形式に準拠しなければならない (SHALL)。

#### Scenario: 3部構成形式
- **GIVEN** Domain Skill の description を記述する
- **WHEN** 形式を検証する
- **THEN** "When [condition]. Provides [content]. MUST be invoked [timing]." の3部構成で記述されている

#### Scenario: ファイルパスパターン inclusion
- **GIVEN** description の condition 部分を記述する
- **WHEN** 内容を検証する
- **THEN** ファイルパスパターンと作業内容の両方を含む

#### Scenario: Dual-Path フォールバック
- **GIVEN** Auto-Discovery で Domain Skill が起動されない
- **WHEN** サブエージェント委譲時
- **THEN** ガイダンステーブルによるフォールバックでスキル名を明示指定できる

#### Non-Functional Requirements
- RELIABILITY: description の品質が Auto-Discovery の起動率に直結するため、3部構成形式を必須とする

### Requirement: frontend-design プラグインとの共存（REQ-M01）

既存の frontend-design プラグインをガイダンステーブルに維持し、新規 Domain Skills（web-design-guidelines, tailwind-best-practices）と併用する。frontend-design は美学的指針を提供し、新規スキルは技術的ベストプラクティスを提供する。
