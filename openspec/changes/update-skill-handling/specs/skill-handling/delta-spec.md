# skill-handling デルタスペック

## ADDED Requirements

### Requirement: REQ-001 skill-phase-formatter Skill の作成

ドメイン Skill を Phase-Aware File Structure（SKILL.md / design.md / constraints.md）に分割・同期するための方法論 Skill を `~/.claude/skills/skill-phase-formatter/SKILL.md` に作成しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** skill-phase-formatter を作成する **WHEN** SKILL.md を検証する **THEN** `~/.claude/skills/skill-phase-formatter/SKILL.md` が存在し、frontmatter に `name: skill-phase-formatter` と `disable-model-invocation: true` を含む
- **GIVEN** skill-phase-formatter を作成する **WHEN** 内容を検証する **THEN** SSOT 原則、分割基準（constraints.md / design.md の含める/含めないもの）、分割手順、同期手順、検証項目が全て含まれている

#### Error Scenarios

- **GIVEN** skill-phase-formatter が存在しない **WHEN** `/skill-format` コマンドを実行する **THEN** 分割基準が参照できずコマンドが期待通り動作しない。`skill-phase-formatter` は `/skill-format` の前提依存である

#### Non-Functional Requirements

- **MAINTAINABILITY**: 分割基準は `skill-phase-formatter` に一元管理され、各コマンド・エージェントに分散しない

---

### Requirement: REQ-002 分割基準の定義

`skill-phase-formatter` Skill は以下の分割基準を定義しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** constraints.md の分割基準を定義する **WHEN** 内容を検証する **THEN** 以下を含む: 技術的にできないこと、数値的な上限・下限、前提条件、禁止事項（理由なし、事実のみ）。目安30行以内
- **GIVEN** design.md の分割基準を定義する **WHEN** 内容を検証する **THEN** 以下を含む: パターン選択の判断基準、トレードオフの説明、非機能要件の考慮事項、アンチパターンとその理由。目安120行以内
- **GIVEN** design.md の除外基準を定義する **WHEN** 内容を検証する **THEN** 以下を含まないことが明記されている: 具体的なコード例（コードブロック）、ステップバイステップの実装手順、API リファレンス的な詳細

#### Boundary Scenarios

- **GIVEN** constraints.md が30行を超過する **WHEN** 検証する **THEN** 検証失敗。制約の粒度を上げて30行以内に収める
- **GIVEN** design.md が120行を超過する **WHEN** 検証する **THEN** 検証失敗。詳細は SKILL.md に残し design.md は設計指針のみに絞る

---

### Requirement: REQ-003 `/skill-format` コマンドの作成

ドメイン Skill のファイル分割を実行する `/skill-format` コマンドを `~/.claude/commands/skill-format.md` に作成しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** `/skill-format <skill-name>` を実行する **WHEN** 指定 Skill の SKILL.md が存在する **THEN** `skill-phase-formatter` の分割基準に従って design.md と constraints.md を生成し、検証を実施し、結果を出力する
- **GIVEN** `/skill-format --all` を実行する **WHEN** ドメイン Skill が存在する **THEN** 方法論 Skill・ユーティリティ Skill・50行以下の軽量 Skill をスキップし、ドメイン Skill のみを一括分割する
- **GIVEN** `/skill-format --check` を実行する **WHEN** Skill ディレクトリをスキャンする **THEN** 各 Skill の分割状況（SKILL.md / design.md / constraints.md の行数、skip 理由）を一覧表示する
- **GIVEN** `/skill-format --sync <skill-name>` を実行する **WHEN** 対象 Skill に派生ファイルが存在する **THEN** `skill-phase-formatter` の同期手順に従って派生ファイルを更新し、変更差分を出力する

#### Error Scenarios

- **GIVEN** `/skill-format <skill-name>` を実行する **WHEN** 指定 Skill の SKILL.md が存在しない **THEN** エラー: 「Skill '<skill-name>' が見つかりません」
- **GIVEN** `/skill-format <skill-name>` を実行する **WHEN** 既に design.md / constraints.md が存在する **THEN** AskUserQuestion で上書き確認を行う

---

### Requirement: REQ-004 主要ドメイン Skill 9個のファイル分割

以下の9個のドメイン Skill を Phase-Aware File Structure に分割しなければならない (SHALL)。

対象: `prisma-expert`, `database-migrations`, `next-best-practices`, `nextjs-api-patterns`, `security-patterns`, `architecture-patterns`, `terraform-gcp-expert`, `vercel-react-best-practices`, `vercel-composition-patterns`

#### Happy Path Scenarios

- **GIVEN** 9個のドメイン Skill を分割する **WHEN** 各 Skill ディレクトリを検証する **THEN** 各ディレクトリに SKILL.md, design.md, constraints.md の3ファイルが存在する
- **GIVEN** 分割された design.md を検証する **WHEN** 行数を確認する **THEN** 全て120行以内である
- **GIVEN** 分割された constraints.md を検証する **WHEN** 行数を確認する **THEN** 全て30行以内である
- **GIVEN** 分割された design.md を検証する **WHEN** コードブロックの有無を確認する **THEN** コードブロック（` ``` `）が含まれていない

#### Boundary Scenarios

- **GIVEN** SKILL.md に設計指針が少ない Skill **WHEN** design.md を生成する **THEN** 内容が少なくても80行未満で生成する。空にはしない
- **GIVEN** SKILL.md に明確な制約がない Skill **WHEN** constraints.md を生成する **THEN** ランタイム制約・互換性制約を抽出して最低5行以上の内容を生成する

#### Non-Functional Requirements

- **CONSISTENCY**: 全 design.md のヘッダーは `# <skill-name>: 設計ガイダンス` で統一する
- **CONSISTENCY**: 全 constraints.md のヘッダーは `# <skill-name>: 技術的制約` で統一する

---

### Requirement: REQ-005 forge-skill-orchestrator のファイルサフィックス判定

`forge-skill-orchestrator` にフェーズに応じたファイルサフィックス判定を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** `/brainstorm` フェーズを検出する **WHEN** ドメイン Skill を呼び出す **THEN** スキル名に `/constraints` サフィックスを付与する（例: `prisma-expert/constraints`）
- **GIVEN** `/spec` フェーズを検出する **WHEN** ドメイン Skill を呼び出す **THEN** スキル名に `/design` サフィックスを付与する（例: `prisma-expert/design`）
- **GIVEN** `/implement` または `/review` フェーズを検出する **WHEN** ドメイン Skill を呼び出す **THEN** サフィックスなしでスキル名を出力する（例: `prisma-expert`、現行通り）
- **GIVEN** Methodology Skills を呼び出す **WHEN** フェーズに関わらず **THEN** サフィックスを付けない（Methodology Skills は対象外）

#### Error Scenarios

- **GIVEN** サフィックス付きスキル名で指定されたファイルが存在しない **WHEN** Claude Code がスキルを解決する **THEN** SKILL.md にフォールバックし、警告を出力する: 「[skill-name] の design.md が未作成です。`/skill-format <skill-name>` で分割してください」

---

### Requirement: REQ-006 spec-writer へのドメイン Skill 注入

`spec-writer` の frontmatter skills に `architecture-patterns` を追加し、ドメイン Skill 参照ガイダンスを追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** spec-writer が起動する **WHEN** frontmatter を検証する **THEN** `skills: [iterative-retrieval, verification-before-completion, architecture-patterns]` が設定されている
- **GIVEN** spec-writer が design.md を生成する **WHEN** ドメイン Skill 参照ガイダンスを検証する **THEN** 設計パターン選択、アンチパターン回避、トレードオフ説明にドメイン Skill を活用する指示が含まれている
- **GIVEN** ドメイン Skill の指針とビジネス要件が矛盾する **WHEN** spec-writer が判断する **THEN** ビジネス要件を最優先する（ドメイン Skill はガイドライン）

---

### Requirement: REQ-007 `/spec` コマンドのドメイン判定ロジック

`/spec` コマンドに Phase 1.7（ドメイン判定）を追加し、proposal.md のキーワードからドメインを推論してドメイン Skill を注入しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** proposal.md に「データベース」「テーブル」が含まれる **WHEN** ドメイン判定を実行する **THEN** `prisma-expert/design` と `database-migrations/design` が REQUIRED SKILLS に注入される
- **GIVEN** proposal.md に「API」「エンドポイント」が含まれる **WHEN** ドメイン判定を実行する **THEN** `nextjs-api-patterns/design` と `security-patterns/design` が注入される
- **GIVEN** proposal.md に複数ドメインのキーワードが含まれる **WHEN** ドメイン判定を実行する **THEN** 全ての該当ドメイン Skill を Union で含める
- **GIVEN** ドメイン判定を実行する **WHEN** `architecture-patterns/design` の包含を検証する **THEN** 常に含まれている（proposal.md の内容に関わらず）

#### Boundary Scenarios

- **GIVEN** ドメイン判定で6個以上の Skill が該当する **WHEN** 注入する Skill を決定する **THEN** 最大5個に制限する（コンテキスト効率のため）
- **GIVEN** proposal.md にキーワードが一つも該当しない **WHEN** ドメイン判定を実行する **THEN** `architecture-patterns/design` のみを注入する

---

### Requirement: REQ-008 spec-validator の STRIDE + Google 4観点

`spec-validator` に検証項目8（STRIDE 簡易チェック）と Google Design Review 4観点を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 保護リソースへのアクセスを含む仕様を検証する **WHEN** STRIDE 簡易チェックを実行する **THEN** Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege の6観点で評価する
- **GIVEN** 仕様の品質を検証する **WHEN** Google 4観点で評価する **THEN** Correctness（proposal.md 反映の正確性）, Completeness（エラー/エッジケース/非機能要件の網羅性）, Consistency（既存 specs との整合性）, Clarity（曖昧表現のフラグ）で評価する

#### Boundary Scenarios

- **GIVEN** セキュリティに無関係な仕様（UI スタイル変更等） **WHEN** STRIDE チェックを実行する **THEN** スキップ可能
- **GIVEN** 仕様に「適切に」「必要に応じて」「十分な」等の曖昧表現がある **WHEN** Clarity チェックを実行する **THEN** フラグして具体的な基準の記述を推奨する

---

### Requirement: REQ-009 `/review` の L1/L2 自動チェック

`/review` コマンドに Step 0（L1/L2 自動チェック）を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** /review を実行する **WHEN** Step 0 を検証する **THEN** LLM レビュアー起動前に `npx tsc --noEmit` と `npx eslint --quiet` が実行される
- **GIVEN** L1/L2 の結果が REVIEW CONTEXT に注入される **WHEN** LLM レビュアーがレビューする **THEN** L1/L2 で検出済みの問題と同一の指摘は行わず、高次の問題に集中する

#### Error Scenarios

- **GIVEN** L1/L2 でエラーが検出される **WHEN** レビューフローを継続するか判断する **THEN** レビューは続行する（エラー修正は `/implement` の責務）

#### Non-Functional Requirements

- **PERFORMANCE**: L1/L2 チェックは LLM レビュアー起動前に完了すること。タイムアウトは設けず、コマンドの実行時間に依存する

---

### Requirement: REQ-010 Review Agent へのドメイン Skill 宣言

6個の Review Agent の frontmatter skills にドメイン Skill を追加し、SSOT ルールを追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** security-sentinel を検証する **WHEN** frontmatter を確認する **THEN** `skills: [iterative-retrieval, security-patterns]` が設定されている
- **GIVEN** performance-oracle を検証する **WHEN** frontmatter を確認する **THEN** `skills: [iterative-retrieval, next-best-practices, prisma-expert]` が設定されている
- **GIVEN** architecture-strategist を検証する **WHEN** frontmatter を確認する **THEN** `skills: [iterative-retrieval, architecture-patterns, next-best-practices]` が設定されている
- **GIVEN** prisma-guardian を検証する **WHEN** frontmatter を確認する **THEN** `skills: [iterative-retrieval, prisma-expert, database-migrations]` が設定されている
- **GIVEN** terraform-reviewer を検証する **WHEN** frontmatter を確認する **THEN** `skills: [iterative-retrieval, terraform-gcp-expert]` が設定されている
- **GIVEN** api-contract-reviewer を検証する **WHEN** frontmatter を確認する **THEN** `skills: [iterative-retrieval, nextjs-api-patterns, security-patterns]` が設定されている
- **GIVEN** 各 Review Agent を検証する **WHEN** SSOT ルールの有無を確認する **THEN** 「ドメイン Skill の内容と Agent 定義が矛盾する場合、ドメイン Skill を優先する」旨のルールが本文末尾に追加されている

#### Boundary Scenarios

- **GIVEN** type-safety-reviewer を検証する **WHEN** frontmatter を確認する **THEN** ドメイン Skill は追加されていない（横断的関心事のため）
- **GIVEN** Review Agent がドメイン Skill を参照する **WHEN** スキル名を確認する **THEN** サフィックスなし（SKILL.md 全体を参照する）

---

### Requirement: REQ-011 spec-validator の Last Responsible Moment チェック

`spec-validator` に検証項目9（Last Responsible Moment チェック）を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 仕様に含まれる各設計判断を分類する **WHEN** Type 1/Type 2 を判定する **THEN** Type 1（不可逆: データモデル、主要 API 契約、認証方式）は今確定すべきと判断し、Type 2（可逆: 内部実装詳細、ライブラリ選定、キャッシュ戦略）は実装に委譲可能と判断する
- **GIVEN** 仕様に Type 2 判断の詳細が含まれる **WHEN** 検証結果を出力する **THEN** 「この判断は実装段階に委譲すべきでは？」と指摘し、インターフェース/抽象化レベルの仕様記述を推奨する

---

### Requirement: REQ-012 `/compound` の派生ファイル同期

`/compound` コマンドにステップ4.5（Skill 派生ファイルの同期）を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** Learning Router でドメイン Skill の SKILL.md が更新される **WHEN** 同 Skill ディレクトリに design.md が存在する **THEN** 更新内容が設計知識に影響するか判定し、影響があれば design.md を同期更新する
- **GIVEN** SKILL.md が更新される **WHEN** 同 Skill ディレクトリに constraints.md が存在する **THEN** 更新内容が制約に影響するか判定し、影響があれば constraints.md を同期更新する
- **GIVEN** SKILL.md が更新される **WHEN** 同 Skill ディレクトリに design.md / constraints.md が存在しない **THEN** スキップする（分割未実施の Skill に対して新規生成は行わない）

#### Error Scenarios

- **GIVEN** 同期更新後の design.md が120行を超過する **WHEN** 検証する **THEN** 超過部分を SKILL.md に残し、design.md は120行以内に収める

---

### Requirement: REQ-013 `/review` のリスクベース深度調整

`/review` コマンドの Step 2 にリスクレベル判定（Step 2a）とリスクレベル別レビュアー構成（Step 2b）を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** `git diff --stat` の出力に `middleware.ts` の変更が含まれる **WHEN** リスクレベルを判定する **THEN** HIGH と判定する
- **GIVEN** `git diff --stat` の出力に `prisma/schema.prisma` の変更が含まれる **WHEN** リスクレベルを判定する **THEN** HIGH と判定する
- **GIVEN** `git diff --stat` の出力に `.css`, `.md`, `.test.ts` のみの変更 **WHEN** リスクレベルを判定する **THEN** LOW と判定する
- **GIVEN** リスクレベルが HIGH **WHEN** レビュアー構成を決定する **THEN** 全レビュアー + spec-compliance-reviewer を起動する
- **GIVEN** リスクレベルが LOW **WHEN** レビュアー構成を決定する **THEN** security-sentinel + type-safety-reviewer のみを起動する

#### Boundary Scenarios

- **GIVEN** 変更ファイルに HIGH 判定対象と LOW 判定対象が混在する **WHEN** リスクレベルを判定する **THEN** 最も高いレベル（HIGH）を採用する

---

### Requirement: REQ-014 `/compound` の Three Strikes Rule + Shift-Left 分類

`/compound` コマンドに Three Strikes Rule と Shift-Left フィードバック分類を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 同一種別の学びが `docs/compound/` に3回蓄積される **WHEN** 閾値ルールを適用する **THEN** 必ずプロセス改善を提案する。問題の根本原因を分析し、前段フェーズでの防止策を含める
- **GIVEN** /review で発見された問題を分類する **WHEN** Shift-Left 分類を実行する **THEN** 「設計で防げた問題」→ spec-validator チェック項目追加提案、「実装で防げた問題」→ ドメイン Skill 更新提案、「テストで防げた問題」→ テスト Skill 更新提案、のいずれかに分類する

#### Boundary Scenarios

- **GIVEN** 問題が複数のカテゴリに該当する **WHEN** Shift-Left 分類を行う **THEN** 最も早いフェーズ（最も Shift-Left 方向）のカテゴリを優先する

---

### Requirement: REQ-015 `/compound` のレビューメトリクス蓄積

`/compound` コマンドにステップ3.5（レビューメトリクス蓄積）を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** `reviews/review-summary.md` が存在する **WHEN** ステップ3.5 を実行する **THEN** P1/P2/P3/ノイズ候補、却下率、カバレッジ率を抽出し `docs/compound/metrics/review-metrics.md` に蓄積する
- **GIVEN** 既存のメトリクスファイルがある **WHEN** メトリクスを蓄積する **THEN** 既存データに追記する
- **GIVEN** メトリクスファイルが存在しない **WHEN** メトリクスを蓄積する **THEN** ディレクトリ含めて新規作成する

#### Boundary Scenarios

- **GIVEN** `reviews/review-summary.md` が存在しない **WHEN** ステップ3.5 を実行する **THEN** スキップする（メトリクス蓄積は行わない）

---

### Requirement: REQ-016 `/brainstorm` の constraints.md 参照

`/brainstorm` コマンドにステップ5.5（技術的制約チェック）を追加しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 要件が十分に固まった段階 **WHEN** ステップ5.5 を実行する **THEN** 対象領域からドメインを推論し、該当ドメイン Skill の constraints.md を参照し、要件と制約の矛盾をチェックする
- **GIVEN** 矛盾が検出される **WHEN** ユーザーに報告する **THEN** 「この要件は技術的制約 [X] と矛盾する可能性があります」と伝え、要件の修正を検討するよう提案する
- **GIVEN** 提案書を出力する **WHEN** 制約が検出されている **THEN** 「技術的考慮事項」セクションに関連制約を記載する

#### Boundary Scenarios

- **GIVEN** constraints.md が存在しない Skill **WHEN** ステップ5.5 を実行する **THEN** スキップする
- **GIVEN** 矛盾が検出されるが、ユーザーが「そのまま進める」と判断する **WHEN** チェック結果を確認する **THEN** ブロッキングではないため許可する

#### Non-Functional Requirements

- **USABILITY**: brainstorm は自由な発想を優先するため、constraints.md のみ参照し design.md は参照しない。チェックはブロッキングではない

---

### Requirement: REQ-017 core-essentials.md + CLAUDE.md の更新

全 Phase 完了後、`core-essentials.md` と `CLAUDE.md`（グローバル + プロジェクト）を更新しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 全 Phase が完了する **WHEN** core-essentials.md を検証する **THEN** 「Skill Orchestration」セクションが Phase-Aware 版に更新されている: `/brainstorm` → `<skill>/constraints`、`/spec` → `<skill>/design`、`/implement`, `/review` → `<skill>`（現行通り）
- **GIVEN** 全 Phase が完了する **WHEN** CLAUDE.md を検証する **THEN** Available Skills に `skill-phase-formatter` が追加されている
- **GIVEN** グローバル CLAUDE.md を更新する **WHEN** プロジェクト CLAUDE.md を検証する **THEN** 両方のファイルが同期されている

#### Error Scenarios

- **GIVEN** グローバル CLAUDE.md を更新する **WHEN** プロジェクト CLAUDE.md の同期を忘れる **THEN** 同期漏れが発生する（過去の学び: 同期漏れ事例あり）。最終検証で差分を確認する

---

### Requirement: REQ-018 最終検証

全作業完了後、検証チェックリストの全項目が合格しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** 全タスクが完了する **WHEN** 最終検証を実行する **THEN** 以下が全て合格する:
  1. 9個の Skill ディレクトリに design.md と constraints.md が存在する
  2. 各 design.md が120行以内、各 constraints.md が30行以内
  3. 各 design.md にコードブロックが含まれていない
  4. forge-skill-orchestrator にサフィックス判定ロジックが追加されている
  5. spec-writer の skills に `architecture-patterns` が含まれている
  6. spec-validator の検証項目が9個（既存7 + STRIDE + LRM）
  7. /review に Step 0（L1/L2）と Step 2a/2b（リスクベース）が追加されている
  8. 6個の Review Agent にドメイン Skill と SSOT ルールが追加されている
  9. /compound に派生同期（4.5）+ Three Strikes + Shift-Left + メトリクス（3.5）が追加されている
  10. /brainstorm に constraints.md 参照（5.5）と「技術的考慮事項」が追加されている
  11. core-essentials.md と CLAUDE.md が更新・同期されている

#### Error Scenarios

- **GIVEN** 検証で不合格項目がある **WHEN** 結果を確認する **THEN** 不合格項目を修正し、全項目が合格するまで再検証を繰り返す

## MODIFIED Requirements

### Requirement: REQ-M01 forge-skill-orchestrator のフェーズ検出テーブル拡張

既存のフェーズ検出テーブルに「Domain Skill サフィックス」列を追加し、Sub Agent 向けテンプレートを Phase-Aware 版と標準版に分離する。

**変更理由**: Phase-Aware File Structure のサフィックス指定をオーケストレーターレベルで標準化する必要がある。

#### Happy Path Scenarios

- **GIVEN** フェーズ検出テーブルを検証する **WHEN** 列構成を確認する **THEN** 「コマンド / 作業内容」「フェーズ」「Domain Skill サフィックス」の3列が存在する
- **GIVEN** Sub Agent 向けテンプレートを検証する **WHEN** テンプレート数を確認する **THEN** Phase-Aware テンプレート（/brainstorm, /spec 用）と標準テンプレート（/implement, /review 用）の2つが存在する

### Requirement: REQ-M02 spec-validator の品質基準拡張

既存の EARS ベース品質基準に Google Design Review 4観点を統合する。

**変更理由**: 仕様品質の評価基準を拡張し、Correctness, Completeness, Consistency, Clarity の観点を追加する。

#### Happy Path Scenarios

- **GIVEN** 品質基準セクションを検証する **WHEN** 内容を確認する **THEN** EARS 4基準（テスト可能性、振る舞い中心、一意解釈性、十分な完全性）と Google 4観点（Correctness, Completeness, Consistency, Clarity）の両方が含まれている

### Requirement: REQ-M03 `/compound` の閾値ルール拡張

既存の3段階閾値ルールを4段階に拡張し、Three Strikes Rule を追加する。

**変更理由**: 繰り返し発生する問題に対するプロセス改善を自動提案する仕組みが必要。

#### Happy Path Scenarios

- **GIVEN** 閾値ルールを検証する **WHEN** 段階数を確認する **THEN** 4段階（重大、3回ルール、中程度、軽微）が定義されている

## REMOVED Requirements

なし
