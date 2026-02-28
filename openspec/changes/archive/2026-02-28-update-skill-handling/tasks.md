# update-skill-handling タスクリスト

## テスト戦略

- ユニットテスト: 該当なし（Skill/Agent/Command 定義はマークダウンファイルであり、テストコード対象外）
- 統合テスト: 該当なし
- 検証: 各 Phase 完了時に検証チェックリストを実施。最終検証で全項目の自動チェックを実施

## 作業の前提

- 全ファイルは `~/.claude/` 配下に配置する
- 分割対象のドメイン Skill 9個は既に SKILL.md が存在する
- Phase-Aware File Structure のサフィックス指定が Claude Code で機能するかは Phase 1 完了時に検証する

## タスク

---

## Phase 1: 基盤整備 + Skill 分割

### Task 1-1: `skill-phase-formatter` Skill の作成

- **対象ファイル**: `~/.claude/skills/skill-phase-formatter/SKILL.md`（新規作成）
- **やること**:
  1. `~/.claude/skills/skill-phase-formatter/` ディレクトリを作成
  2. SKILL.md を作成。内容: SSOT 原則、分割基準（constraints.md / design.md の含める/含めないもの）、分割手順、同期手順、検証項目
  3. frontmatter に `name: skill-phase-formatter`, `description` を設定
  4. `disable-model-invocation: true` を設定（方法論 Skill のため明示呼び出しのみ）
- **検証方法**: ファイルが存在する。frontmatter が正しい。分割基準・手順・同期手順・検証項目が全て含まれている
- **関連要件**: REQ-001, REQ-002
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-001`, `specs/skill-handling/delta-spec.md#REQ-002`
- **依存**: なし

### Task 1-2: `/skill-format` コマンドの作成

- **対象ファイル**: `~/.claude/commands/skill-format.md`（新規作成）
- **やること**:
  1. コマンド定義ファイルを作成。frontmatter に `description`, `argument-hint: "<skill-name|--all|--check|--sync skill-name>"` を設定
  2. 4つのモードを定義: 単一分割、一括分割（`--all`）、状況確認（`--check`）、同期（`--sync`）
  3. `skill-phase-formatter` Skill との連携を明記
  4. 各モードのワークフロー（Skill 検索 → 既存ファイル確認 → 分割実行 → 検証 → 結果出力）を定義
- **検証方法**: ファイルが存在する。4つのモードが定義されている。`skill-phase-formatter` との連携が明記されている
- **関連要件**: REQ-003
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-003`
- **依存**: Task 1-1

### Task 1-3: 主要ドメイン Skill 9個のファイル分割

- **対象ファイル**: 以下の18ファイルを新規作成
  ```
  ~/.claude/skills/prisma-expert/{design.md, constraints.md}
  ~/.claude/skills/database-migrations/{design.md, constraints.md}
  ~/.claude/skills/next-best-practices/{design.md, constraints.md}
  ~/.claude/skills/nextjs-api-patterns/{design.md, constraints.md}
  ~/.claude/skills/security-patterns/{design.md, constraints.md}
  ~/.claude/skills/architecture-patterns/{design.md, constraints.md}
  ~/.claude/skills/terraform-gcp-expert/{design.md, constraints.md}
  ~/.claude/skills/vercel-react-best-practices/{design.md, constraints.md}
  ~/.claude/skills/vercel-composition-patterns/{design.md, constraints.md}
  ```
- **やること**:
  1. Task 1-1, 1-2 完了後、`/skill-format --all` を実行（または各 Skill を個別に分割）
  2. 各 SKILL.md を分析し、`skill-phase-formatter` の分割基準に従って design.md と constraints.md を生成
  3. 各ファイルの検証を実施
- **検証方法**:
  - 9個の各 Skill ディレクトリに design.md と constraints.md が存在する
  - 各 constraints.md が30行以内
  - 各 design.md が120行以内
  - 各 design.md にコードブロック（` ``` `）が含まれていない
  - 全内容が対応する SKILL.md の部分集合である
- **関連要件**: REQ-004
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-004`
- **依存**: Task 1-1, Task 1-2

### Task 1-4: forge-skill-orchestrator にファイルサフィックス判定を追加

- **対象ファイル**: `~/.claude/skills/forge-skill-orchestrator/SKILL.md`（変更）
- **やること**:
  1. フェーズ検出テーブルに「Domain Skill サフィックス」列を追加
     - `/brainstorm` → `/constraints`、`/spec` → `/design`、`/implement`, `/review` → なし
  2. Sub Agent 向けプロンプト記載テンプレートを Phase-Aware 版と標準版の2つに分離
  3. 決定フローチャートの呼び出しステップにサフィックス付与ロジックを追加
  4. フォールバックセクションを新設（サフィックス付きファイルが存在しない場合は SKILL.md にフォールバック）
- **検証方法**:
  - フェーズ検出テーブルにサフィックス列がある
  - テンプレートが Phase-Aware 版と標準版の2つに分かれている
  - フォールバックセクションが追加されている
- **関連要件**: REQ-005
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-005`
- **依存**: なし（Task 1-3 と並行可能）

---

## Phase 2: フェーズ別 Skill 注入

### Task 2-1: spec-writer にドメイン Skill 注入

- **対象ファイル**: `~/.claude/agents/spec/spec-writer.md`（変更）
- **やること**:
  1. frontmatter の skills に `architecture-patterns` を追加
  2. 仕様生成セクションにドメイン Skill 参照ガイダンスを追加（設計パターン選択、アンチパターン回避、トレードオフ説明にドメイン Skill を活用する指示）
- **検証方法**: frontmatter に `architecture-patterns` が含まれている。ドメイン Skill 参照ガイダンスが追加されている
- **関連要件**: REQ-006
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-006`
- **依存**: Task 1-3（design.md が存在すること）, Task 1-4（サフィックス判定）

### Task 2-2: `/spec` コマンドにドメイン判定ロジックを追加

- **対象ファイル**: `~/.claude/commands/spec.md`（変更）
- **やること**:
  1. Phase 1b と Phase 2 の間に Phase 1.7（ドメイン判定）を挿入
  2. キーワード推論テーブルを定義（proposal.md のキーワード → ドメイン → 注入する Skill のマッピング）
  3. 判定ルール（Union、architecture-patterns 常時含む、最大5個）を定義
  4. spec-writer / spec-validator のプロンプトにドメイン Skill を注入する仕組みを記述
- **検証方法**: Phase 1.7 が追加されている。キーワード推論テーブルが定義されている。注入の仕組みが記述されている
- **関連要件**: REQ-007
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-007`
- **依存**: Task 1-4（サフィックス判定）, Task 2-1（spec-writer 更新）

### Task 2-3: spec-validator に STRIDE + Google 4観点を追加

- **対象ファイル**: `~/.claude/agents/spec/spec-validator.md`（変更）
- **やること**:
  1. frontmatter の skills に `architecture-patterns` を追加
  2. 検証項目8（STRIDE 簡易チェック）を追加: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege。セキュリティ無関係な仕様ではスキップ可能
  3. 品質基準に Google Design Review 4観点を統合: Correctness, Completeness, Consistency, Clarity
- **検証方法**: frontmatter に `architecture-patterns` がある。検証項目8が追加されている。Google 4観点が品質基準に統合されている
- **関連要件**: REQ-008
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-008`
- **依存**: Task 1-3（design.md が存在すること）

### Task 2-4: `/review` コマンドに L1/L2 チェック（Step 0）を追加

- **対象ファイル**: `~/.claude/commands/review.md`（変更）
- **やること**:
  1. Step 1 の前に Step 0（L1/L2 自動チェック）を挿入
  2. L1: `npx tsc --noEmit` の実行と結果記録
  3. L2: `npx eslint --quiet` の実行と結果記録
  4. 結果を REVIEW CONTEXT に追加注入（重複指摘防止の指示を含む）
  5. 既存 Step 1-7 のフローは変更しない
- **検証方法**: Step 0 が Step 1 の前に追加されている。tsc と eslint の実行が含まれている。REVIEW CONTEXT への注入が記述されている。既存フローが変更されていない
- **関連要件**: REQ-009
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-009`
- **依存**: なし

### Task 2-5: Review Agent 6個にドメイン Skill 宣言を追加

- **対象ファイル**: 以下の6ファイル（変更）
  ```
  ~/.claude/agents/review/security-sentinel.md       → + security-patterns
  ~/.claude/agents/review/performance-oracle.md       → + next-best-practices, prisma-expert
  ~/.claude/agents/review/architecture-strategist.md  → + architecture-patterns, next-best-practices
  ~/.claude/agents/review/prisma-guardian.md           → + prisma-expert, database-migrations
  ~/.claude/agents/review/terraform-reviewer.md       → + terraform-gcp-expert
  ~/.claude/agents/review/api-contract-reviewer.md    → + nextjs-api-patterns, security-patterns
  ```
- **やること**:
  1. 各 Agent の frontmatter skills にドメイン Skill を追加
  2. 各 Agent の本文末尾に SSOT ルールを追加（ドメイン Skill の内容と Agent 定義が矛盾する場合、ドメイン Skill を優先）
- **検証方法**: 6個の Agent の frontmatter にドメイン Skill が追加されている。SSOT ルールが各 Agent に追加されている。サフィックスなし（SKILL.md 全体参照）であること
- **関連要件**: REQ-010
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-010`
- **依存**: なし（Phase 1 と並行可能）

---

## Phase 3: フィードバックループ + 検証強化

### Task 3-1: spec-validator に Last Responsible Moment チェックを追加

- **対象ファイル**: `~/.claude/agents/spec/spec-validator.md`（変更）
- **やること**:
  1. 検証項目9（Last Responsible Moment）を追加
  2. Type 1（不可逆: データモデル、主要 API 契約、認証方式）→ 今確定すべき
  3. Type 2（可逆: 内部実装詳細、ライブラリ選定、キャッシュ戦略）→ 実装に委譲可能
  4. 判定の目安を具体例付きで記述
- **検証方法**: 検証項目9が追加されている。Type 1/Type 2 の分類基準と判定の目安が記述されている
- **関連要件**: REQ-011
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-011`
- **依存**: Task 2-3（spec-validator の他の更新と一緒に適用可能）

### Task 3-2: `/compound` に派生ファイル同期ロジックを追加

- **対象ファイル**: `~/.claude/commands/compound.md`（変更）
- **やること**:
  1. ステップ4（Learning Router）の後にステップ4.5（Skill 派生ファイルの同期）を挿入
  2. SKILL.md 更新時に design.md/constraints.md の存在確認 → 影響判定 → 同期更新のフローを定義
  3. `skill-phase-formatter` の同期手順との連携を明記
  4. 存在しない場合はスキップ（新規生成は行わない）
- **検証方法**: ステップ4.5 が追加されている。存在チェックとフォールバックが記述されている。`skill-phase-formatter` との連携が明記されている
- **関連要件**: REQ-012
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-012`
- **依存**: Task 1-1（skill-phase-formatter Skill）

### Task 3-3: `/review` にリスクベースのレビュー深度調整を追加

- **対象ファイル**: `~/.claude/commands/review.md`（変更）
- **やること**:
  1. Step 2 にリスクレベル判定（Step 2a）を追加
  2. HIGH/MEDIUM/LOW の判定基準を `git diff --stat` ベースで定義
  3. リスクレベル別レビュアー構成（Step 2b）を定義
  4. リスクレベルを REVIEW CONTEXT に含める
- **検証方法**: Step 2a/2b が追加されている。HIGH/MEDIUM/LOW の判定基準が明確。リスクレベル別のレビュアー構成が定義されている
- **関連要件**: REQ-013
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-013`
- **依存**: Task 2-4（Step 0 追加）

### Task 3-4: `/compound` に Three Strikes Rule + Shift-Left フィードバック分類を追加

- **対象ファイル**: `~/.claude/commands/compound.md`（変更）
- **やること**:
  1. 閾値ルールに Three Strikes Rule（3回ルール）を追加（3段階→4段階）
  2. Learning Router セクションに Shift-Left フィードバック分類を追加
     - 設計で防げた問題（→ spec-validator チェック項目追加提案）
     - 実装で防げた問題（→ ドメイン Skill 更新提案）
     - テストで防げた問題（→ テスト Skill 更新提案）
  3. 分類の判断基準を明記
- **検証方法**: Three Strikes Rule が追加されている。Shift-Left 分類が追加されている。判断基準が明確
- **関連要件**: REQ-014
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-014`
- **依存**: なし

### Task 3-5: `/compound` にレビューメトリクス蓄積を追加

- **対象ファイル**: `~/.claude/commands/compound.md`（変更）
- **やること**:
  1. ステップ3（学び抽出後）にステップ3.5（レビューメトリクス蓄積）を追加
  2. 追跡メトリクス定義: P1/P2/P3/ノイズ候補、却下率（レビュアー別）、カバレッジ率
  3. 蓄積先: `docs/compound/metrics/review-metrics.md`
  4. 蓄積ルール: review-summary.md 存在時のみ、追記/新規作成
- **検証方法**: ステップ3.5 が追加されている。メトリクス定義が明確。蓄積先とフォーマットが定義されている
- **関連要件**: REQ-015
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-015`
- **依存**: なし

### Task 3-6: `/brainstorm` に constraints.md 参照を追加

- **対象ファイル**: `~/.claude/commands/brainstorm.md`（変更）
- **やること**:
  1. ステップ5.5（技術的制約チェック）を追加
  2. ドメイン推論 → constraints.md 参照（存在する場合のみ）→ 矛盾チェック
  3. constraints.md のみ参照（design.md は参照しない）と明記
  4. ブロッキングではないことを明記
  5. 提案書に「技術的考慮事項」セクションを追加
- **検証方法**: ステップ5.5 が追加されている。constraints.md のみ参照が明記。ブロッキングでないことが明記。提案書テンプレートに「技術的考慮事項」がある
- **関連要件**: REQ-016
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-016`
- **依存**: Task 1-3（constraints.md が存在すること）

---

## Phase 完了後: ドキュメント更新

### Task 4-1: core-essentials.md + CLAUDE.md の更新

- **対象ファイル**: `~/.claude/rules/core-essentials.md`（変更）, `~/.claude/CLAUDE.md`（変更）, `/Users/kosuke/forge/CLAUDE.md`（変更）
- **やること**:
  1. core-essentials.md の「Skill Orchestration」セクションを Phase-Aware 版に更新
  2. CLAUDE.md の Available Skills に `skill-phase-formatter` を追加
  3. CLAUDE.md の Available Commands に `/skill-format` を追加（暗黙的記載）
  4. グローバルとプロジェクトの CLAUDE.md を同期
- **検証方法**: core-essentials.md が更新されている。CLAUDE.md に新 Skill/コマンドが記載されている。グローバル/プロジェクト CLAUDE.md が同期されている
- **関連要件**: REQ-017
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-017`
- **依存**: 全 Phase 完了後

### Task 4-2: 最終検証

- **対象ファイル**: 全新規・更新ファイル
- **やること**: 以下を全て検証
  1. `/skill-format --check` で9個の Skill が分割済みと表示される
  2. 各 design.md が120行以内、constraints.md が30行以内
  3. forge-skill-orchestrator にサフィックス判定ロジックが追加されている
  4. spec-writer の frontmatter skills に `architecture-patterns` が含まれている
  5. spec-validator の検証項目が9個（既存7 + STRIDE + LRM）
  6. /review に Step 0（L1/L2 チェック）が追加されている
  7. 6個の Review Agent にドメイン Skill が追加されている
  8. /compound に派生同期（4.5）+ Three Strikes（閾値4段階）+ メトリクス（3.5）が追加されている
  9. /brainstorm に constraints.md 参照（5.5）が追加されている
  10. core-essentials.md と CLAUDE.md が更新されている
- **検証方法**: 全項目が合格する
- **関連要件**: REQ-018
- **関連スペック**: `specs/skill-handling/delta-spec.md#REQ-018`
- **依存**: Task 4-1

---

## タスク依存関係グラフ

```
Phase 1:
  Task 1-1 (skill-phase-formatter) ─→ Task 1-2 (/skill-format) ─→ Task 1-3 (9個分割)
  Task 1-4 (orchestrator サフィックス) ──── 並行可能 ──────────────┘

Phase 2:
  Task 1-3 + Task 1-4 ─→ Task 2-1 (spec-writer)
  Task 2-1 ─→ Task 2-2 (/spec ドメイン判定)
  Task 1-3 ─→ Task 2-3 (spec-validator STRIDE+Google)
  Task 2-4 (/review Step 0) ← 独立
  Task 2-5 (Review Agent Skill) ← 独立

Phase 3:
  Task 2-3 ─→ Task 3-1 (spec-validator LRM)
  Task 1-1 ─→ Task 3-2 (/compound 派生同期)
  Task 2-4 ─→ Task 3-3 (/review リスクベース)
  Task 3-4 (/compound Three Strikes) ← 独立
  Task 3-5 (/compound メトリクス) ← 独立
  Task 1-3 ─→ Task 3-6 (/brainstorm constraints)

Phase 完了後:
  全 Phase ─→ Task 4-1 (ドキュメント更新) ─→ Task 4-2 (最終検証)
```

**並列実行可能なタスク:**
- Task 1-4 と Task 1-1/1-2 は並列可能
- Task 2-4 と Task 2-5 は他のタスクと独立して並列可能
- Task 3-4 と Task 3-5 は独立して並列可能
