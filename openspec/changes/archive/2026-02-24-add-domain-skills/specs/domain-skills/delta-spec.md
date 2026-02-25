# domain-skills デルタスペック

## ADDED Requirements

### Requirement: REQ-001 Domain Skills SKILL.md の作成

14の Domain Skills を `~/.claude/skills/<skill-name>/SKILL.md` に作成する。各 SKILL.md は以下の仕様に準拠しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** スキル名 `next-best-practices` が指定される **WHEN** SKILL.md を作成する **THEN** `~/.claude/skills/next-best-practices/SKILL.md` が存在し、frontmatter に `name: next-best-practices` を含み、`disable-model-invocation: true` は**存在しない**（Auto-Discovery 有効）。description がトリガー条件形式で記述されている
- **GIVEN** 14スキル全てが作成済み **WHEN** 各 SKILL.md の行数を検証する **THEN** 全スキルが 500行以内である
- **GIVEN** 14スキル全てが作成済み **WHEN** 各 SKILL.md の description を検証する **THEN** 全スキルの description が 1024文字以内であり、"When [condition]. Provides [content]. MUST be invoked [timing]." の3部構成で記述されている。condition にはファイルパスパターン（`src/app/`, `prisma/` 等）と作業内容を含む

#### Error Scenarios

- **GIVEN** SKILL.md 作成時に外部リポジトリの内容が取得不可 **WHEN** スキルを作成する **THEN** 公式ドキュメントと既存リファレンスのみをベースにスキルを作成する。外部リポジトリ依存のない自己完結した内容にする
- **GIVEN** SKILL.md の行数が 500行を超過する **WHEN** 検証する **THEN** 詳細ルールを REFERENCE.md に分離し、SKILL.md から参照する Progressive Disclosure を適用する

#### Boundary Scenarios

- **GIVEN** description の長さが 1024文字に近い **WHEN** description を記述する **THEN** トリガー条件とファイルパターンを維持しつつ 1024文字以内に収める
- **GIVEN** description が空文字または極端に短い（3部構成を満たさない） **WHEN** 検証する **THEN** 検証失敗とし、"When [condition]. Provides [content]. MUST be invoked [timing]." の3部構成で記述することを要求する
- **GIVEN** Domain Skills の SKILL.md に `disable-model-invocation: true` が設定されている **WHEN** 検証する **THEN** 検証失敗とする。Domain Skills は Auto-Discovery を有効にするため `disable-model-invocation` を省略しなければならない

#### Non-Functional Requirements

- **PERFORMANCE**: SKILL.md はスキル起動時に全文がコンテキストに注入されるため、500行以内に抑える
- **PERFORMANCE**: 全 Domain Skills の description 合計トークン数が 2000 tokens 以内であること

### Requirement: REQ-002 SKILL.md の内容品質

各 Domain Skills の SKILL.md 本文は以下の構造と品質基準に準拠しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** SKILL.md を作成する **WHEN** 本文のセクション構造を検証する **THEN** 「原則」「ルール/ガイドライン」「アンチパターン」「Applicability」の4セクションを含む
- **GIVEN** SKILL.md を作成する **WHEN** 対象技術のバージョンを確認する **THEN** Forge スタックのバージョン（Next.js 15, React 19, Prisma 6.x, Terraform 1.9+, Vitest 3.x, Playwright 1.50+, Tailwind CSS v4）に対応した内容である
- **GIVEN** SKILL.md を作成する **WHEN** Forge スタックとの適合性を検証する **THEN** Pages Router, Jest, AWS, 生SQL, Drizzle, TypeORM のパターンを含まない

#### Error Scenarios

- **GIVEN** 外部リポジトリのルールが Forge スタックに不適合 **WHEN** スキルに取り込む **THEN** 不適合部分を除外し、Forge スタック向けに翻訳する（例: Jest → Vitest, AWS → GCP, 生SQL → Prisma API）
- **GIVEN** SKILL.md に旧バージョンの API パターン（`getServerSideProps`, `getStaticProps`, `getInitialProps`, `forwardRef` 等）が含まれる **WHEN** 検証する **THEN** Forge スタック不適合（Pages Router 固有 / React 18 以前）としてフラグし、除去する
- **GIVEN** SKILL.md と既存リファレンスファイル（`~/.claude/reference/`）で矛盾する記述がある **WHEN** サブエージェントが両方を参照する **THEN** SKILL.md の記述を優先する

#### Non-Functional Requirements

- **CONSISTENCY**: 全スキルの本文は日本語で記述し、frontmatter の description のみ英語とする。コード例は TypeScript/TSX で記述する。見出しレベルは `##` で統一する

### Requirement: REQ-003 Progressive Disclosure の適用

500行を超える詳細情報が必要なスキルは、Progressive Disclosure パターンを適用しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** `webapp-testing` スキルに Playwright API の詳細リファレンスが必要 **WHEN** SKILL.md を作成する **THEN** `~/.claude/skills/webapp-testing/API_REFERENCE.md` に詳細を分離し、SKILL.md から「API の詳細は `API_REFERENCE.md` を参照」と記載する
- **GIVEN** 参照ファイルが必要なスキル **WHEN** 参照ファイルを作成する **THEN** SKILL.md 本文は 500行以内を維持し、参照ファイルにはサイズ制限を設けない

#### Error Scenarios

- **GIVEN** SKILL.md 単体で 500行を超過する **WHEN** 分離対象のセクションが不明 **THEN** 詳細なコード例やAPI リファレンスを優先的に参照ファイルに分離する

#### Boundary Scenarios

- **GIVEN** 参照ファイル（API_REFERENCE.md 等）が 2000行を超える **WHEN** サブエージェントが参照ファイルを Read する **THEN** コンテキストウィンドウの消費が大きくなるため、セクション単位での部分的 Read を推奨する旨を SKILL.md に記載する

### Requirement: REQ-004 forge-skill-orchestrator の簡素化（Domain Skills レジストリ削除）

`~/.claude/skills/forge-skill-orchestrator/SKILL.md` から Domain Skills レジストリを削除し、Methodology テーブル + ドメイン検出テーブルのみを維持しなければならない (SHALL)。Domain Skills は Auto-Discovery により自動起動されるため、レジストリによる手動管理は不要となる。

#### Happy Path Scenarios

- **GIVEN** forge-skill-orchestrator を簡素化する **WHEN** SKILL.md を検証する **THEN** Domain Skills のレジストリテーブルが削除されており、Methodology Skills テーブルとドメイン検出テーブル（ファイルパス → ドメイン名のマッピング）が維持されている
- **GIVEN** 既存レジストリに `playwright-skill`, `typescript-backend`, `terraform-infrastructure` がある **WHEN** レジストリを削除する **THEN** これらの旧名スキルエントリも含めて Domain Skills レジストリが全て削除される。ドメイン検出テーブルのドメイン名（`nextjs-frontend`, `typescript-backend`, `prisma-database`, `terraform-infrastructure`, `testing`）自体は変更しない
- **GIVEN** フローチャートに Domain Skills レジストリ参照ステップがある **WHEN** 簡素化する **THEN** フローチャートの Step 3 から Domain Skills レジストリ参照を削除し、Methodology Skills の解決のみにする

#### Error Scenarios

- **GIVEN** Methodology Skills テーブルが誤って削除された **WHEN** オーケストレーターが Methodology Skills を起動しようとする **THEN** スキル解決に失敗する。Methodology テーブルは必ず維持する

### Requirement: REQ-005 CLAUDE.md の更新

`~/.claude/CLAUDE.md` と `/Users/kosuke/forge/CLAUDE.md` の Available Skills テーブルとガイダンステーブル（推奨マッピング）を更新しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 14スキルが全て作成済み **WHEN** CLAUDE.md の Available Skills テーブルを検証する **THEN** 14 Domain Skills 全てがテーブルに記載されている
- **GIVEN** CLAUDE.md を更新する **WHEN** ガイダンステーブル（推奨マッピング）を検証する **THEN** 以下を含む:
  - テーブル名が「ガイダンステーブル（推奨マッピング）」であること（旧称「スキル名決定テーブル」から変更）
  - 導入文: Domain Skills は Auto-Discovery により自動起動されるが、サブエージェント委譲時は推奨マッピングを参照してスキル名を明示指定する旨の説明
  - 以下のマッピング:
    - `.ts` / `.tsx` 全般 → 既存 Methodology Skills
    - Next.js（`src/app/`） → + `next-best-practices`, `vercel-react-best-practices`
    - Prisma（`prisma/`, `server/`） → + `prisma-expert`
    - Terraform（`terraform/`） → + `terraform-gcp-expert`
    - E2E テスト（`e2e/`） → + `webapp-testing`
    - フロントエンド UI → + `frontend-design`（既存プラグイン維持）, `web-design-guidelines`, `tailwind-best-practices`
    - API（`src/app/api/`, `src/actions/`） → + `nextjs-api-patterns`
- **GIVEN** グローバル CLAUDE.md を更新する **WHEN** プロジェクト CLAUDE.md を検証する **THEN** 両方のファイルの Available Skills テーブルとガイダンステーブルが同一内容である

#### Error Scenarios

- **GIVEN** グローバル CLAUDE.md を更新した **WHEN** プロジェクト CLAUDE.md の同期を忘れる **THEN** 同期漏れが発生する（過去の学び: 2回の同期漏れ事例あり）。最終検証で Available Skills セクションとガイダンステーブルの diff を確認する
- **GIVEN** Available Skills テーブルにスキル X が追加されたがガイダンステーブルにマッピングされていない **WHEN** 最終検証で整合性を検証する **THEN** 警告を報告する（Auto-Discovery で動作するため検証失敗ではなく警告に緩和）

### Requirement: REQ-006 implement-orchestrator ガイダンステーブル（推奨マッピング）の更新

`~/.claude/agents/orchestration/implement-orchestrator.md` のガイダンステーブル（推奨マッピング）を更新しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** ガイダンステーブルを更新する **WHEN** テーブルを検証する **THEN** 以下を含む:
  - テーブル名が「ガイダンステーブル（推奨マッピング）」であること（旧称「スキル名決定テーブル」から変更）
  - 導入文: Domain Skills は Auto-Discovery により自動起動されるが、サブエージェント委譲時は推奨マッピングを参照してスキル名を明示指定する旨の説明
  - 以下のマッピング:
    - `.ts` / `.tsx` 全般 → 既存 Methodology Skills
    - Next.js（`src/app/`） → + `next-best-practices`, `vercel-react-best-practices`
    - Prisma（`prisma/`, `server/`） → + `prisma-expert`
    - Terraform（`terraform/`） → + `terraform-gcp-expert`
    - E2E テスト（`e2e/`） → + `webapp-testing`
    - フロントエンド UI → + `web-design-guidelines`, `tailwind-best-practices`

#### Error Scenarios

- **GIVEN** ガイダンステーブルにスキルが記載されているが SKILL.md が存在しない **WHEN** implement-orchestrator がスキルを注入する **THEN** Claude Code がスキル不在のエラーを返す

### Requirement: REQ-007 ui-ux-pro-max の MCP 統合

`ui-ux-pro-max` を SKILL.md + MCP プラグインの両方で統合しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** ui-ux-pro-max を統合する **WHEN** SKILL.md を作成する **THEN** UX ガイドライン・デザイン原則を SKILL.md に記載し、MCP プラグインの利用方法（検索コマンド、`--design-system` フラグ等）も記載する
- **GIVEN** MCP プラグインをインストールする **WHEN** Claude Code の設定を確認する **THEN** MCP サーバーとして `ui-ux-pro-max` が登録されている

#### Error Scenarios

- **GIVEN** MCP プラグインが利用不可（Python 未インストール等） **WHEN** ui-ux-pro-max を使用する **THEN** SKILL.md のルール・ガイドラインのみで動作し、MCP 検索機能なしでもベストプラクティスを提供する
- **GIVEN** MCP プラグインのインストールがネットワークエラーやバージョン不整合で失敗する **WHEN** ui-ux-pro-max を統合する **THEN** SKILL.md のみで完了とし、MCP プラグインのインストールは後日リトライ可能と記録する

#### Non-Functional Requirements

- **SECURITY**: MCP プラグインのインストール時にバージョンを固定し、既知の脆弱性がないことを確認する

### Requirement: REQ-008 14スキルの内容仕様

各 Domain Skill の SKILL.md は以下の内容を最低限含まなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** `next-best-practices` を作成する **WHEN** 内容を検証する **THEN** App Router ファイル規約、Server/Client Components 使い分け、データフェッチング戦略、メタデータ API、画像/フォント最適化、エラーハンドリングを含む
- **GIVEN** `vercel-react-best-practices` を作成する **WHEN** 内容を検証する **THEN** コンポーネント設計、状態管理、パフォーマンス最適化、Hooks パターン、型安全性、テスタビリティ、アクセシビリティ、エラーハンドリングの8カテゴリを含む
- **GIVEN** `vercel-composition-patterns` を作成する **WHEN** 内容を検証する **THEN** Container/Presentational、Compound Components、children による Composition、Context Provider、明示的バリアント、React 19 API 対応を含む
- **GIVEN** `web-design-guidelines` を作成する **WHEN** 内容を検証する **THEN** アクセシビリティ（WCAG 2.1 AA）、レスポンシブ、Core Web Vitals、UX パターン、フォーム設計を含む
- **GIVEN** `tailwind-best-practices` を作成する **WHEN** 内容を検証する **THEN** ユーティリティファースト設計、cn() パターン、レスポンシブ、ダークモード、Radix UI / Headless UI 統合を含む
- **GIVEN** `nextjs-api-patterns` を作成する **WHEN** 内容を検証する **THEN** Route Handlers 実装パターン、Server Actions 実装パターン、Middleware パターン、Zod バリデーション、エラーレスポンス統一を含む
- **GIVEN** `security-patterns` を作成する **WHEN** 内容を検証する **THEN** XSS 防止、CSRF 保護、Zod バリデーション、認証・認可パターン、ファイルアップロード検証、CORS 設定を含む
- **GIVEN** `prisma-expert` を作成する **WHEN** 内容を検証する **THEN** スキーマ設計、クエリ最適化（select/include, N+1防止）、インデックス戦略、トランザクション管理、Prisma Client シングルトンを含む
- **GIVEN** `database-migrations` を作成する **WHEN** 内容を検証する **THEN** Expand-Contract パターン、zero-downtime マイグレーション、データ損失リスク検出、段階的マイグレーション、ロールバック戦略を含む
- **GIVEN** `webapp-testing` を作成する **WHEN** 内容を検証する **THEN** Reconnaissance-then-Action パターン、Auto-waiting、Page Object Model、ネットワークインターセプト、認証状態保存を含む
- **GIVEN** `vitest-testing-patterns` を作成する **WHEN** 内容を検証する **THEN** RTL クエリ優先順位、モック戦略（vi.mock/vi.fn/vi.spyOn）、テストファクトリ、userEvent、カバレッジ設定を含む
- **GIVEN** `terraform-gcp-expert` を作成する **WHEN** 内容を検証する **THEN** GCP リソース設計、モジュール化、ステート管理、IAM 最小権限、命名規約、環境分離、Secret Manager 連携を含む
- **GIVEN** `architecture-patterns` を作成する **WHEN** 内容を検証する **THEN** SOLID 原則、DDD 基本概念、ADR パターン、モジュール境界、依存関係ルール、レイヤードアーキテクチャを含む
- **GIVEN** `ui-ux-pro-max` を作成する **WHEN** 内容を検証する **THEN** デザインシステム原則、カラーパレット選定指針、フォントペアリング指針、UX ガイドライン、MCP 検索機能の使用方法を含む

#### Error Scenarios

- **GIVEN** 外部リポジトリのルールに Forge スタック不適合の内容が含まれる **WHEN** スキルに取り込む **THEN** 不適合部分（Pages Router, Jest, AWS, 生SQL 等）を除外し、適合する内容のみを含める

### Requirement: REQ-009 最終検証

全作業完了後、自動検証スクリプトを実行し、全項目が合格しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 全スキルが作成済み **WHEN** 最終検証スクリプトを実行する **THEN** 以下が全て合格する:
  1. 14 SKILL.md ファイルが存在する
  2. webapp-testing/API_REFERENCE.md が存在する
  3. Domain Skills の frontmatter に `disable-model-invocation: true` が**存在しない**こと（Auto-Discovery 有効）。Methodology Skills は `disable-model-invocation: true` を維持していること
  4. 全 SKILL.md が 500行以内
  5. Domain Skills レジストリが削除済みであること。Methodology テーブル + ドメイン検出テーブルが維持されていること
  6. 全スキルが CLAUDE.md に記載済み
  7. グローバル CLAUDE.md とプロジェクト CLAUDE.md が同期済み
  8. Domain Skills の description が3部構成形式（"When [condition]. Provides [content]. MUST be invoked [timing]."）に準拠していること

#### Error Scenarios

- **GIVEN** 検証スクリプトで不合格項目がある **WHEN** 結果を確認する **THEN** 不合格項目を修正し、全項目が合格するまで再検証を繰り返す

### Requirement: REQ-010 Description Quality for Auto-Discovery

Domain Skills の description は Auto-Discovery の唯一のトリガーであり、以下の品質基準に準拠しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** Domain Skill の description を記述する **WHEN** 形式を検証する **THEN** "When [condition]. Provides [content]. MUST be invoked [timing]." の3部構成トリガー条件形式で記述されている
- **GIVEN** description の condition 部分を記述する **WHEN** 内容を検証する **THEN** ファイルパスパターン（例: `src/app/`, `prisma/`, `terraform/`, `e2e/`）と作業内容（例: implementing, reviewing, designing）の両方を含む
- **GIVEN** 14 Domain Skills 全ての description が作成済み **WHEN** 品質を検証する **THEN** 各 description が 1024文字以内であり、3部構成を満たしている

#### Error Scenarios

- **GIVEN** description が3部構成を満たさない **WHEN** 検証する **THEN** 検証失敗とし、3部構成形式への修正を要求する
- **GIVEN** description の condition にファイルパスパターンが含まれない **WHEN** 検証する **THEN** Auto-Discovery の起動精度が低下する可能性があるため、ファイルパスパターンの追加を要求する

#### Boundary Scenarios

- **GIVEN** Auto-Discovery で Domain Skill が起動されない **WHEN** サブエージェント委譲時 **THEN** ガイダンステーブル（推奨マッピング）によるフォールバックでスキル名を明示指定できる。Auto-Discovery の起動不安定性（GitHub Discussions #182117）への対策として、Dual-Path 設計を維持する

#### Non-Functional Requirements

- **RELIABILITY**: description の品質が Auto-Discovery の起動率に直結するため、3部構成形式と condition のファイルパスパターン inclusion を必須とする

## MODIFIED Requirements

### Requirement: REQ-M01 frontend-design プラグインとの共存

既存の `frontend-design` プラグイン（Anthropic 公式）をガイダンステーブル（推奨マッピング）に維持し、新規 Domain Skills（`web-design-guidelines`, `tailwind-best-practices`）と併用する。`frontend-design` は美学的指針（Typography, Color, Motion 等）を提供し、新規スキルは技術的ベストプラクティスを提供する。役割が異なるため両方を維持する。

**変更理由**: 新規 Domain Skills の追加に伴い、既存プラグインとの関係を明確化する必要がある。

#### Happy Path Scenarios

- **GIVEN** ガイダンステーブル（推奨マッピング）に `frontend-design` がある **WHEN** 新規 Domain Skills を追加する **THEN** `frontend-design` を維持したまま `web-design-guidelines` と `tailwind-best-practices` を追加する

## REMOVED Requirements

### Requirement: playwright-skill レジストリエントリ
**削除理由**: `webapp-testing`（Anthropic 公式）に置換。オーケストレーターレジストリから `playwright-skill` エントリを削除する。

### Requirement: typescript-backend レジストリエントリ
**削除理由**: `nextjs-api-patterns`（より具体的な名前）に置換。

### Requirement: terraform-infrastructure レジストリエントリ
**削除理由**: `terraform-gcp-expert`（より具体的な名前）に置換。
