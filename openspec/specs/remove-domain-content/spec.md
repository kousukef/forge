# remove-domain-content スペック

## Requirements

### Requirement: REQ-001 動的レビュアー検出

`/review` コマンドは `agents/review/` ディレクトリ内のエージェント定義ファイルを動的にスキャンし、変更内容に関連するレビュアーのみを起動する（SHALL）。「関連する」の判定は LLM によるセマンティック判定であり、エージェント定義の description と `git diff --stat` の変更内容を LLM が意味的に照合して決定する。review-aggregator は常時起動する（SHALL）。

#### Scenario: カスタムレビュアーの自動起動
- **GIVEN** `agents/review/` に `my-reviewer.md`（frontmatter に name, description あり）が配置されている
- **WHEN** `/review` コマンドが実行され、`git diff --stat` の変更内容が `my-reviewer.md` の description と LLM セマンティック判定で関連すると判定される
- **THEN** `my-reviewer` がレビュアーとして起動される

#### Scenario: review-aggregator の常時起動
- **GIVEN** `agents/review/` に複数のレビュアー定義ファイルが存在する
- **WHEN** `/review` コマンドが実行される
- **THEN** `review-aggregator` は変更内容に関わらず常に起動される

#### Scenario: HIGH リスク時の全レビュアー起動
- **GIVEN** リスクレベルが HIGH と判定された
- **WHEN** レビュアー選択を行う
- **THEN** `agents/review/` 配下の全レビュアーを起動する（安全側に倒す）

#### Scenario: レビュアー 0 件時の手動選択
- **GIVEN** `agents/review/` に3つのレビュアー定義が存在する
- **WHEN** `/review` コマンドが実行され、いずれのレビュアーの description も変更内容に関連しないと判定された
- **THEN** ユーザーに利用可能なレビュアー一覧を提示し、手動で起動するレビュアーを選択させる

#### Scenario: frontmatter 不正時のスキップ
- **GIVEN** `agents/review/` 内のファイルに YAML frontmatter が存在しない、または name フィールドが欠落、または YAML 構文エラーがある
- **WHEN** `/review` コマンドが実行される
- **THEN** 該当ファイルをスキップし、警告メッセージを出力する

#### Scenario: レビュアー定義が空の場合
- **GIVEN** `agents/review/` ディレクトリが空である（review-aggregator.md のみ存在）
- **WHEN** `/review` コマンドが実行される
- **THEN** review-aggregator のみが起動され、「レビュアーが見つかりませんでした。`agents/review/` にレビュアー定義を追加してください」とユーザーに案内する

---

### Requirement: REQ-002 汎用リスクレベル判定

`/review` コマンドのリスクレベル判定はドメイン固有の条件を含まず、汎用的な条件で判定する（SHALL）。

#### Scenario: LOW リスク判定
- **GIVEN** `git diff --stat` にドキュメントファイル (.md)、テストファイル (.test.*, .spec.*)、またはスタイルシート (.css) のみが含まれる
- **WHEN** リスクレベル判定が実行される
- **THEN** リスクレベルは LOW と判定される

#### Scenario: HIGH リスク判定
- **GIVEN** `git diff --stat` に認証・認可関連ファイルまたは環境設定ファイルまたは CI/CD 設定の変更が含まれる
- **WHEN** リスクレベル判定が実行される
- **THEN** リスクレベルは HIGH と判定される

#### Scenario: MEDIUM リスク判定
- **GIVEN** `git diff --stat` に上記いずれにも該当しないソースファイルが含まれる
- **WHEN** リスクレベル判定が実行される
- **THEN** リスクレベルは MEDIUM と判定される

---

### Requirement: REQ-003 動的スキル注入（レビュアー向け）

`/review` コマンドはレビュアーエージェント定義の `skills` frontmatter に記載されたスキルを自動的に REQUIRED SKILLS として注入する（SHALL）。ハードコードされたレビュアー → Skill マッピングテーブルは使用しない（SHALL NOT）。

#### Scenario: skills frontmatter からの自動注入
- **GIVEN** `agents/review/my-reviewer.md` の frontmatter に `skills: [my-domain-skill]` が記載されている
- **WHEN** `my-reviewer` がレビュアーとして起動される
- **THEN** `my-domain-skill` が REQUIRED SKILLS としてレビュアーのプロンプトに注入される

#### Scenario: skills フィールド不在時
- **GIVEN** レビュアーエージェント定義の frontmatter に `skills` フィールドが存在しない
- **WHEN** そのレビュアーが起動される
- **THEN** 追加のドメインスキルなしで正常に起動される（Methodology Skills のみ適用される）

---

### Requirement: REQ-004 動的カバレッジマトリクス

Review Coverage Matrix の列はハードコードされた固定レビュアー名ではなく、実際に起動されたレビュアー名を動的に構成する（SHALL）。

#### Scenario: 起動レビュアーに基づく動的列構成
- **GIVEN** `custom-security` と `custom-performance` の 2 つのレビュアーが起動された
- **WHEN** review-aggregator がカバレッジマトリクスを生成する
- **THEN** マトリクスの列は `custom-security`, `custom-performance`, `カバー状態` の 3 列で構成される

---

### Requirement: REQ-005 /spec コマンドのドメインスキル動的発見

`/spec` コマンドの Phase 1.7 はハードコードされたキーワード推論テーブルを使用せず、`skills/` 配下のドメインスキルを動的に発見して design.md を注入する（SHALL）。「関連する」の判定は LLM によるセマンティック判定であり、proposal.md の内容とスキルの description を LLM が意味的に照合して決定する。ドメインスキルが存在しない場合はドメインコンテキストなしで進める（SHALL）。

#### Scenario: 関連ドメインスキルの動的発見と注入
- **GIVEN** `skills/my-domain/design.md` が存在する
- **WHEN** `/spec` コマンドが実行され、proposal.md の内容が `my-domain` スキルの description と LLM セマンティック判定で関連すると判定される
- **THEN** `skills/my-domain/design.md` が spec-writer / spec-validator のプロンプトに DOMAIN CONTEXT FILES として注入される

#### Scenario: ドメインスキル不在時
- **GIVEN** `skills/` にドメインスキルが存在しない
- **WHEN** `/spec` コマンドが実行される
- **THEN** ドメインコンテキストなしで仕様生成が正常に進行する

#### Scenario: design.md 不在時のフォールバック
- **GIVEN** `skills/my-domain/` に SKILL.md は存在するが design.md が存在しない
- **WHEN** `/spec` コマンドで `my-domain` が関連スキルと判定される
- **THEN** フォールバックとして SKILL.md 全体を Skill ツールで読み込み、「`/skill-format my-domain` で分割してください」と警告を出力する

---

### Requirement: REQ-006 拡張ガイダンスの提供

CLAUDE.md、README.md にスキル・レビューエージェント・ルール・リファレンスの追加方法を案内するセクションを追加する（SHALL）。

#### Scenario: CLAUDE.md での拡張方法案内
- **GIVEN** OSS ユーザーが Forge をインストールした
- **WHEN** CLAUDE.md を参照する
- **THEN** ドメインスキル・レビューエージェント・ルールの追加方法が記載されている。ルールの追加方法として `.claude/rules/` への配置方法が案内されており、`paths` フロントマター付き（対象ファイル操作時にロード）と `paths` なし（毎セッション自動ロード）の使い分けが説明されている。`reference/` は補足資料・長文リファレンスの配置先として案内されている

#### Scenario: README.md でのカスタマイズ案内
- **GIVEN** OSS ユーザーが Forge をインストールした
- **WHEN** README.md のカスタマイズセクションを参照する
- **THEN** `/setup` コマンドによるスキル検索・インストール手順と、手動追加方法が記載されている

---

### Requirement: REQ-007 L1/L2 自動チェックの汎用化

`/review` コマンドの Step 0（L1/L2 自動チェック）はドメイン固有のツール名をハードコードせず、プロジェクトの静的解析ツールを汎用的に参照する（SHALL）。

#### Scenario: プロジェクトの静的解析ツール検出
- **GIVEN** プロジェクトに静的解析ツールが設定されている
- **WHEN** `/review` コマンドの Step 0 が実行される
- **THEN** プロジェクトの package.json / 設定ファイルから利用可能な静的解析ツールを検出し、実行する

#### Scenario: 静的解析ツール不在時
- **GIVEN** プロジェクトに静的解析ツールが設定されていない
- **WHEN** `/review` コマンドの Step 0 が実行される
- **THEN** L1/L2 チェックをスキップし、LLM レビュアーのみで処理を続行する

---

### Requirement: REQ-008 core-essentials の汎用化

`rules/core-essentials.md` のセキュリティ必須事項とコード品質セクションから TypeScript/Next.js 固有の記述を除去し、汎用的な記述に変更する（SHALL）。

#### Scenario: 言語非依存のルール提供
- **GIVEN** Forge が TypeScript 以外のプロジェクトにインストールされている
- **WHEN** `rules/core-essentials.md` が読み込まれる
- **THEN** TypeScript 固有の記述（Zod、`middleware.ts`、`npx tsc --noEmit`、`dangerouslySetInnerHTML` 等）が含まれていない

---

### Requirement: REQ-009 forge-skill-orchestrator の汎用化

`skills/forge-skill-orchestrator/SKILL.md` からドメイン固有のパターン・例示を除去し、Auto-Discovery に委ねる方式に変更する（SHALL）。

#### Scenario: Auto-Discovery による動的検出
- **GIVEN** ユーザーが独自のドメインスキルを `skills/` に追加している
- **WHEN** forge-skill-orchestrator が実行される
- **THEN** ドメイン検出テーブルにスキルが登録されていなくても、Claude Code の Auto-Discovery で自動検出される

---

### Requirement: REQ-010 レビュー並列実行の動的化

動的に検出されたレビュアーを Task(subagent) で並列起動する（SHALL）。

#### Scenario: 動的検出レビュアーの並列起動
- **GIVEN** REQ-001 により 3 つのレビュアーが動的に検出された
- **WHEN** `/review` コマンドのレビュー実行フェーズに入る
- **THEN** 検出された 3 つのレビュアーを Task(subagent) で並列起動する
