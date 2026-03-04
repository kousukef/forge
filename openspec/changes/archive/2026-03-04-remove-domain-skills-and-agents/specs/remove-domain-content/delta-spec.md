# remove-domain-content デルタスペック

## ADDED Requirements

### Requirement: REQ-001 動的レビュアー検出

`/review` コマンドは `agents/review/` ディレクトリ内のエージェント定義ファイルを動的にスキャンし、変更内容に関連するレビュアーのみを起動する（SHALL）。「関連する」の判定は LLM によるセマンティック判定であり、エージェント定義の description と `git diff --stat` の変更内容を LLM が意味的に照合して決定する。review-aggregator は常時起動する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `agents/review/` に `my-reviewer.md`（frontmatter に name, description あり）が配置されている **WHEN** `/review` コマンドが実行され、`git diff --stat` の変更内容が `my-reviewer.md` の description と LLM セマンティック判定で関連すると判定される **THEN** `my-reviewer` がレビュアーとして起動される
- **GIVEN** `agents/review/` に複数のレビュアー定義ファイルが存在する **WHEN** `/review` コマンドが実行される **THEN** `review-aggregator` は変更内容に関わらず常に起動される
- **GIVEN** `agents/review/my-reviewer.md` の description に "TypeScript の型安全性を検証する" と記載されている **WHEN** `git diff --stat` に .ts ファイルの変更のみが含まれる **THEN** `my-reviewer` が起動される
- **GIVEN** `agents/review/my-reviewer.md` の description に "Terraform のインフラ設定を検証する" と記載されている **WHEN** `git diff --stat` に .py ファイルの変更のみが含まれる **THEN** `my-reviewer` は起動されない
- **GIVEN** リスクレベルが HIGH と判定された **WHEN** レビュアー選択を行う **THEN** `agents/review/` 配下の全レビュアーを起動する（安全側に倒す）

#### Error Scenarios

- **GIVEN** `agents/review/` ディレクトリが空である（review-aggregator.md のみ存在） **WHEN** `/review` コマンドが実行される **THEN** review-aggregator のみが起動され、「レビュアーが見つかりませんでした。`agents/review/` にレビュアー定義を追加してください」とユーザーに案内する
- **GIVEN** `agents/review/` 内のファイルに YAML frontmatter が存在しない **WHEN** `/review` コマンドが実行される **THEN** 該当ファイルをスキップし、正常な frontmatter を持つファイルのみで処理を継続する
- **GIVEN** `agents/review/my-reviewer.md` の frontmatter に name フィールドが存在しない **WHEN** `/review` コマンドが実行される **THEN** 該当ファイルをスキップし、警告メッセージを出力する
- **GIVEN** `agents/review/my-reviewer.md` の frontmatter に YAML 構文エラーがある **WHEN** `/review` コマンドが実行される **THEN** 該当ファイルをスキップし、警告メッセージを出力する
- **GIVEN** `agents/review/` に3つのレビュアー定義が存在する **WHEN** `/review` コマンドが実行され、いずれのレビュアーの description も変更内容に関連しないと判定された **THEN** ユーザーに利用可能なレビュアー一覧を提示し、手動で起動するレビュアーを選択させる

#### Boundary Scenarios

- **GIVEN** `agents/review/` に 1 つのレビュアー定義ファイルのみ存在する **WHEN** `/review` コマンドが実行され、そのレビュアーの description が変更内容と関連する **THEN** そのレビュアー 1 つと review-aggregator が起動される
- **GIVEN** リスクレベルが HIGH と判定されたが `agents/review/` にレビュアー定義が 0 件（review-aggregator.md のみ） **WHEN** レビュアー選択を行う **THEN** review-aggregator のみが起動され、追加のレビューエージェント作成を案内するメッセージを出力する

#### Non-Functional Requirements

- **COMPATIBILITY**: 既存のレビュアーエージェント定義（name, description, model, tools, skills を持つ YAML frontmatter）との後方互換性を維持する

---

### Requirement: REQ-002 汎用リスクレベル判定

`/review` コマンドのリスクレベル判定はドメイン固有の条件を含まず、汎用的な条件で判定する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `git diff --stat` にドキュメントファイル (.md) のみが含まれる **WHEN** リスクレベル判定が実行される **THEN** リスクレベルは LOW と判定される
- **GIVEN** `git diff --stat` に認証・認可関連ファイルまたは環境設定ファイルの変更が含まれる **WHEN** リスクレベル判定が実行される **THEN** リスクレベルは HIGH と判定される
- **GIVEN** `git diff --stat` に上記いずれにも該当しないソースファイルが含まれる **WHEN** リスクレベル判定が実行される **THEN** リスクレベルは MEDIUM と判定される
- **GIVEN** `git diff --stat` にテストファイル（.test.*, .spec.*）またはスタイルシート（.css）のみが含まれる **WHEN** リスクレベル判定が実行される **THEN** リスクレベルは LOW と判定される

#### Error Scenarios

- **GIVEN** `git diff --stat` の出力が空である **WHEN** リスクレベル判定が実行される **THEN** リスクレベルは LOW と判定され、処理は続行される

---

### Requirement: REQ-003 動的スキル注入（レビュアー向け）

`/review` コマンドはレビュアーエージェント定義の `skills` frontmatter に記載されたスキルを自動的に REQUIRED SKILLS として注入する（SHALL）。ハードコードされたレビュアー → Skill マッピングテーブルは使用しない（SHALL NOT）。

#### Happy Path Scenarios

- **GIVEN** `agents/review/my-reviewer.md` の frontmatter に `skills: [my-domain-skill]` が記載されている **WHEN** `my-reviewer` がレビュアーとして起動される **THEN** `my-domain-skill` が REQUIRED SKILLS としてレビュアーのプロンプトに注入される

#### Error Scenarios

- **GIVEN** レビュアーエージェント定義の frontmatter に `skills` フィールドが存在しない **WHEN** そのレビュアーが起動される **THEN** 追加のドメインスキルなしで正常に起動される（Methodology Skills のみ適用される）
- **GIVEN** レビュアーエージェント定義の skills に "nonexistent-skill" が記載されている **WHEN** そのレビュアーが起動される **THEN** Claude Code の Auto-Discovery で該当スキルが見つからない場合、スキルなしで起動を継続し、警告を出力する

---

### Requirement: REQ-004 動的カバレッジマトリクス

Review Coverage Matrix の列はハードコードされた固定レビュアー名ではなく、実際に起動されたレビュアー名を動的に構成する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `custom-security` と `custom-performance` の 2 つのレビュアーが起動された **WHEN** review-aggregator がカバレッジマトリクスを生成する **THEN** マトリクスの列は `custom-security`, `custom-performance`, `カバー状態` の 3 列で構成される

#### Error Scenarios

- **GIVEN** レビュアーが 0 件起動された（review-aggregator のみ） **WHEN** review-aggregator がカバレッジマトリクスを生成する **THEN** 全仕様項目のカバー状態が「UNCOVERED」となり、レビュアー追加を推奨するメッセージが出力される

---

### Requirement: REQ-005 /spec コマンドのドメインスキル動的発見

`/spec` コマンドの Phase 1.7 はハードコードされたキーワード推論テーブルを使用せず、`skills/` 配下のドメインスキルを動的に発見して design.md を注入する（SHALL）。「関連する」の判定は LLM によるセマンティック判定であり、proposal.md の内容とスキルの description を LLM が意味的に照合して決定する。ドメインスキルが存在しない場合はドメインコンテキストなしで進める（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `skills/my-domain/design.md` が存在する **WHEN** `/spec` コマンドが実行され、proposal.md の内容が `my-domain` スキルの description と LLM セマンティック判定で関連すると判定される **THEN** `skills/my-domain/design.md` が spec-writer / spec-validator のプロンプトに DOMAIN CONTEXT FILES として注入される
- **GIVEN** `skills/` にドメインスキルが存在しない **WHEN** `/spec` コマンドが実行される **THEN** ドメインコンテキストなしで仕様生成が正常に進行する
- **GIVEN** `skills/skill-a/design.md` と `skills/skill-b/design.md` が存在する **WHEN** `/spec` コマンドが実行され、proposal.md の内容が両方のスキルの description と関連する **THEN** 両方の design.md が DOMAIN CONTEXT FILES として注入される

#### Error Scenarios

- **GIVEN** `skills/my-domain/` に SKILL.md は存在するが design.md が存在しない **WHEN** `/spec` コマンドで `my-domain` が関連スキルと判定される **THEN** フォールバックとして SKILL.md 全体を Skill ツールで読み込み、「`/skill-format my-domain` で分割してください」と警告を出力する

---

### Requirement: REQ-006 拡張ガイダンスの提供

CLAUDE.md、README.md にスキル・レビューエージェント・リファレンスの追加方法を案内するセクションを追加する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** OSS ユーザーが Forge をインストールした **WHEN** CLAUDE.md を参照する **THEN** ドメインスキル・レビューエージェント・リファレンスの追加方法が記載されている
- **GIVEN** OSS ユーザーが Forge をインストールした **WHEN** README.md のカスタマイズセクションを参照する **THEN** `/setup` コマンドによるスキル検索・インストール手順と、手動追加方法が記載されている
- **GIVEN** ガイダンスセクションが記載されている **WHEN** ユーザーがレビューエージェントの追加方法を確認する **THEN** 最低限「ファイル配置場所」「必須 frontmatter フィールド（name, description）」「frontmatter の例」が記載されている

#### Error Scenarios

- **GIVEN** ユーザーがガイダンスに従って `agents/review/` にレビュアーを追加したが frontmatter が不正である **WHEN** `/review` コマンドが実行される **THEN** 不正なファイルはスキップされ、有効なレビュアーのみで処理が続行される（REQ-001 Error Scenario と同一）

---

## MODIFIED Requirements

### Requirement: REQ-007 L1/L2 自動チェックの汎用化

`/review` コマンドの Step 0（L1/L2 自動チェック）はドメイン固有のツール名をハードコードせず、プロジェクトの静的解析ツールを汎用的に参照する（SHALL）。

**変更理由**: TypeScript/ESLint 固有のコマンド (`npx tsc --noEmit`, `npx eslint --quiet`) をハードコードすると、非 TypeScript プロジェクトでは不適切なため。

#### Happy Path Scenarios

- **GIVEN** プロジェクトに静的解析ツールが設定されている **WHEN** `/review` コマンドの Step 0 が実行される **THEN** プロジェクトの package.json / 設定ファイルから利用可能な静的解析ツールを検出し、実行する
- **GIVEN** プロジェクトに静的解析ツールが設定されていない **WHEN** `/review` コマンドの Step 0 が実行される **THEN** L1/L2 チェックをスキップし、LLM レビュアーのみで処理を続行する

#### Error Scenarios

- **GIVEN** 静的解析ツールの実行がエラーで失敗する **WHEN** `/review` コマンドの Step 0 が実行される **THEN** エラーを REVIEW CONTEXT に記録し、LLM レビュアーに通知した上で処理を続行する

---

### Requirement: REQ-008 core-essentials の汎用化

`rules/core-essentials.md` のセキュリティ必須事項とコード品質セクションから TypeScript/Next.js 固有の記述を除去し、汎用的な記述に変更する（SHALL）。

**変更理由**: Forge を汎用ワークフローシステムとして提供するため、特定言語・フレームワークへの依存を除去する。

#### Happy Path Scenarios

- **GIVEN** Forge が TypeScript 以外のプロジェクトにインストールされている **WHEN** `rules/core-essentials.md` が読み込まれる **THEN** TypeScript 固有の記述（Zod、`middleware.ts`、`npx tsc --noEmit`、`dangerouslySetInnerHTML` 等）が含まれていない
- **GIVEN** Forge が任意のプロジェクトにインストールされている **WHEN** `rules/core-essentials.md` が読み込まれる **THEN** 言語非依存のセキュリティ原則（入力バリデーション、パラメータ化クエリ、XSS 防止等）と品質原則（テスト、コード規約遵守等）が記載されている

#### Error Scenarios

- **GIVEN** 汎用化後の `rules/core-essentials.md` が読み込まれる **WHEN** セキュリティレビューが実行される **THEN** 汎用的な原則（入力バリデーション必須、パラメータ化クエリ必須、生HTML出力禁止、ミドルウェアによるルート保護、シークレットのハードコード禁止）に基づいてレビューが行われる

---

### Requirement: REQ-009 forge-skill-orchestrator の汎用化

`skills/forge-skill-orchestrator/SKILL.md` からドメイン固有のパターン・例示を除去し、Auto-Discovery に委ねる方式に変更する（SHALL）。

**変更理由**: ドメインスキル削除後、固有パターン（`src/app/**/*.tsx` → `nextjs-frontend` 等）は不整合となるため。

#### Happy Path Scenarios

- **GIVEN** ユーザーが独自のドメインスキルを `skills/` に追加している **WHEN** forge-skill-orchestrator が実行される **THEN** ドメイン検出テーブルにスキルが登録されていなくても、Claude Code の Auto-Discovery で自動検出される
- **GIVEN** `skills/` にドメインスキルが存在しない **WHEN** forge-skill-orchestrator が実行される **THEN** Methodology Skills のみが適用され、エラーは発生しない

#### Error Scenarios

- **GIVEN** ドメイン検出テーブルが空である **WHEN** forge-skill-orchestrator の決定フローチャートが実行される **THEN** ドメイン判定ステップがスキップされ、Methodology Skills の判定のみで完了する

---

### Requirement: REQ-010 レビュー並列実行の動的化

workflow-redesign spec の「/review は Task 並列」要件を、動的に検出されたレビュアーを並列起動する方式に MODIFIED する。

**変更理由**: workflow-redesign spec ではハードコードされた固定レビュアーの並列起動を想定していたが、REQ-001 により動的検出されたレビュアーを並列起動する方式に変更する必要がある。

#### Happy Path Scenarios

- **GIVEN** REQ-001 により 3 つのレビュアーが動的に検出された **WHEN** `/review` コマンドのレビュー実行フェーズに入る **THEN** 検出された 3 つのレビュアーを Task(subagent) で並列起動する

#### Error Scenarios

- **GIVEN** 動的検出でレビュアーが 0 件だった **WHEN** `/review` コマンドのレビュー実行フェーズに入る **THEN** review-aggregator のみが起動され、ユーザーにレビュアー手動選択を求める（REQ-001 Error Scenario と連携）

---

## REMOVED Requirements

### Requirement: ドメイン固有スキルの同梱

**削除理由**: Forge を汎用ワークフローシステムとして OSS 公開するため、特定技術スタック（Next.js, Prisma, Terraform 等）に依存する 14 個のドメインスキルを Layer 1（フレームワーク同梱）から除去する。ユーザーは `/setup` コマンドまたは手動で自身のプロジェクトに合ったドメインスキルを追加する。

削除対象: next-best-practices, nextjs-api-patterns, vercel-react-best-practices, vercel-composition-patterns, tailwind-best-practices, ui-ux-pro-max, prisma-expert, database-migrations, security-patterns, terraform-gcp-expert, vitest-testing-patterns, webapp-testing, architecture-patterns, web-design-guidelines

### Requirement: ドメイン固有レビューエージェントの同梱

**削除理由**: 7 つのドメイン固有レビューエージェント（security-sentinel, performance-oracle, architecture-strategist, prisma-guardian, terraform-reviewer, type-safety-reviewer, api-contract-reviewer）を除去する。ユーザーが `agents/review/` にカスタムレビュアーを追加する方式に移行する。

### Requirement: ドメイン固有リファレンスの同梱

**削除理由**: TypeScript/Next.js/Prisma/Terraform 固有のリファレンスファイル（typescript-rules.md, nextjs/conventions.md, prisma/conventions.md, terraform/conventions.md, common/coding-style.md, common/performance.md）を除去する。プロジェクト固有のルールはユーザーが `reference/` に追加する。

### Requirement: /spec Phase 1.7 のキーワード推論テーブル

**削除理由**: ドメインスキル削除に伴い、ハードコードされたキーワード → ドメイン → design.md のマッピングテーブルは不整合となるため除去する。REQ-005 の動的発見方式に置き換える。

### Requirement: /review Step 2b のドメイン検出テーブル

**削除理由**: ドメイン固有レビュアー削除に伴い、ファイルパターン → レビュアーのハードコードされたマッピングテーブルは不整合となるため除去する。REQ-001 の動的検出方式に置き換える。

### Requirement: /review Step 2c のレビュアー → Skill マッピングテーブル

**削除理由**: ドメイン固有スキル・レビュアー削除に伴い、ハードコードされたマッピングは不整合となるため除去する。REQ-003 の動的注入方式に置き換える。

### Requirement: openspec/specs/domain-skills/spec.md

**削除理由**: ドメインスキル関連の累積スペックをアーカイブへ移動する。歴史的記録として `openspec/changes/archive/2026-03-04-domain-skills/` に保存する。代替要件マッピング:
- domain-skills/spec.md REQ-004（Skill Orchestrator によるドメインスキル検出） → 本変更の REQ-009 で代替
- domain-skills/spec.md REQ-005（/spec Phase 1.7 のドメインスキル注入） → 本変更の REQ-005 および REQ-006 で代替（REQ-005: /spec の動的スキル発見、REQ-006: CLAUDE.md 更新のガイダンス部分）
