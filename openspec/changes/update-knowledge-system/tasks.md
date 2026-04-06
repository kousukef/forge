# update-knowledge-system タスクリスト

## テスト戦略

### L1: Unit テスト

- 静的解析: 全変更対象の Markdown ファイルが構文的に正しいことを確認（YAML フロントマターのパース、リンク切れ確認）
- 構造検証: `.claude/rules/` のルールファイルが `paths` フロントマターの正しい形式を持つことを確認

### L2: Integration テスト

- L2 対象なし（Markdown ベースの設定ファイル変更のため）

### L3: Acceptance テスト

- 受入テスト: US-001〜US-007 に対して手動検証を実施。各 US の検証シナリオは design.md の受入テスト計画に記載

## タスク

### Task 1: ディレクトリ構造の作成（推定: 2分）

- **対象ファイル**: `~/.claude/docs/experiential/logs/`（新規）, `~/.claude/docs/experiential/patterns/`（新規）, `~/.claude/docs/experiential/metrics/`（新規）, `.claude/rules/`（新規）
- **やること**: 経験ログ蓄積ディレクトリとプロジェクトレベルルールディレクトリを作成する。`~/.claude/docs/experiential/logs/`, `~/.claude/docs/experiential/patterns/`, `~/.claude/docs/experiential/metrics/` の 3 ディレクトリを再帰的に作成する。`.claude/rules/` ディレクトリを作成する
- **検証方法**: `ls -la ~/.claude/docs/experiential/` でサブディレクトリが存在することを確認。`ls -la .claude/rules/` でディレクトリが存在することを確認
- **関連要件**: REQ-001, REQ-009
- **関連スペック**: `specs/knowledge-system/delta-spec.md#経験ログの一元蓄積ディレクトリ`
- **依存**: なし

---

### Task 2: reference/ → .claude/rules/ 移行 -- プロセス系ルール（推定: 5分）

- **対象ファイル**: `reference/core-rules.md`（既存）→ `.claude/rules/core-rules.md`（新規）, `reference/workflow-rules.md`（既存）→ `.claude/rules/workflow-rules.md`（新規）, `reference/context-isolation.md`（既存）→ `.claude/rules/context-isolation.md`（新規）
- **やること**: プロセス系ルール 3 ファイルを `.claude/rules/` にコピーする。各ファイルの先頭に `paths` なしの YAML フロントマターを追加する（既に YAML フロントマターがある場合は `paths` なしを維持）。`reference/` のオリジナルファイルは削除せず残す
- **検証方法**: `.claude/rules/core-rules.md`, `.claude/rules/workflow-rules.md`, `.claude/rules/context-isolation.md` の存在と内容を確認。YAML フロントマターに `paths` が含まれていないことを確認
- **関連要件**: REQ-009
- **関連スペック**: `specs/knowledge-system/delta-spec.md#reference/ から .claude/rules/ への移行`
- **依存**: Task 1

---

### Task 3: reference/ → .claude/rules/ 移行 -- ファイル種別ルール（推定: 5分）

- **対象ファイル**: `reference/coding-standards.md`（既存）→ `.claude/rules/coding-standards.md`（新規）, `reference/common/testing.md`（既存）→ `.claude/rules/testing.md`（新規）
- **やること**: ファイル種別ルール 2 ファイルを `.claude/rules/` にコピーする。Forge 本体にはソースコードディレクトリが存在しないため、両ファイルとも `paths` なしで配置する。ファイル内にコメントで「ソースコードのあるプロジェクトでは `paths: ["src/**/*.{ts,tsx}"]` 等を追加する」旨を記載する。`reference/` のオリジナルは残す
- **検証方法**: `.claude/rules/coding-standards.md`, `.claude/rules/testing.md` の存在と内容を確認
- **関連要件**: REQ-009
- **関連スペック**: `specs/knowledge-system/delta-spec.md#reference/ から .claude/rules/ への移行`
- **依存**: Task 1

---

### Task 4: CLAUDE.md Rules セクション更新（推定: 3分）

- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**: Rules セクションの手動読み込み指示テーブルを `.claude/rules/` の自動ロード説明に置き換える。`paths` なしルール（core-rules, workflow-rules, context-isolation）と `paths` 付きルール（coding-standards, testing）の区別を説明する。`rules/core-essentials.md` は従来通り常時読み込みと記載する
- **検証方法**: CLAUDE.md の Rules セクションが自動ロード説明に更新されていることを確認。旧テーブルが残っていないことを確認
- **関連要件**: REQ-011
- **関連スペック**: `specs/knowledge-system/delta-spec.md#CLAUDE.md Rules セクションの更新`
- **依存**: Task 2, Task 3

---

### Task 5: CLAUDE.md Compound Learning → Experiential Learning 更新（推定: 3分）

- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**: Compound Learning セクションを Experiential Learning セクションに書き換える。`~/.claude/docs/experiential/` のディレクトリ構造、`/compound` の役割（変更単位の学び抽出 + 結晶化チェック）、`/crystallize` の役割（プロジェクト横断パターン抽出 + 昇格）をテーブル形式で記載する。Available Agents セクションは変更なし（compound-learnings-researcher の名前は変わらない）
- **検証方法**: CLAUDE.md の Compound Learning セクションが存在せず、Experiential Learning セクションに置き換わっていることを確認
- **関連要件**: REQ-010
- **関連スペック**: `specs/knowledge-system/delta-spec.md#CLAUDE.md の Experiential Learning セクション更新`
- **依存**: なし

---

### Task 6: commands/compound.md -- 出力先変更（推定: 4分）

- **対象ファイル**: `commands/compound.md`（既存）
- **やること**: ステップ 3 の出力先を `docs/compound/YYYY-MM-DD-<topic>.md` から `~/.claude/docs/experiential/logs/YYYY-MM-DD-<project>-<topic>.md` に変更する。ディレクトリ不在時の再帰作成を明記する。フォールバック先として `docs/compound/` を記載する。ステップ 3.5 のメトリクス蓄積先を `~/.claude/docs/experiential/metrics/review-metrics.md` に変更する。メトリクス書き込み失敗時は警告を出して `/compound` を続行する仕様を明記する。複利ドキュメント形式のフロントマターに `id: exp-NNNN`, `type: compound`, `source: forge-workflow`, `project: <project-name>`, `change: <change-name>`, `crystallized: false` フィールドを追加する。`exp-NNNN` はファイル内で連番一意、クロスファイル一意性は `id` + `project` + ファイル名日付の組み合わせで担保する。ファイル名生成時のルールも明記する: プロジェクト名のファイルシステム非安全文字はハイフンに置換、topic が 50 文字超の場合は切り詰め
- **検証方法**: `commands/compound.md` のステップ 3 とステップ 3.5 のパスが更新されていることを確認。フロントマター形式に追加フィールドが記載されていることを確認。ファイル名生成ルール（unsafe 文字置換、50 文字制限）が記載されていることを確認。メトリクス書き込み失敗時の graceful degradation が記載されていることを確認
- **関連要件**: REQ-002, REQ-003
- **関連スペック**: `specs/knowledge-system/delta-spec.md#/compound 出力先の変更`, `specs/knowledge-system/delta-spec.md#/compound メトリクス出力先の変更`
- **依存**: なし

---

### Task 7: commands/compound.md -- 結晶化チェック追加（推定: 4分）

- **対象ファイル**: `commands/compound.md`（既存）
- **やること**: ステップ 4（Learning Router）と 4.5（Skill 派生ファイル同期）の間にステップ 4.3 結晶化チェックを追加する。NFD 提案書第 3 章 3.2 の「変更 3」に記載の仕様に基づき、未結晶化エントリ数の集計、閾値（15 件）超過時の通知、`[CORRECTION]` 相当の即座昇格提案の 3 つのアクションを記述する
- **検証方法**: `commands/compound.md` にステップ 4.3 が存在し、3 つのアクションが記述されていることを確認。ステップ番号の順序が 4 → 4.3 → 4.5 → 5 であることを確認
- **関連要件**: REQ-004
- **関連スペック**: `specs/knowledge-system/delta-spec.md#/compound 結晶化チェック（ステップ 4.3）`
- **依存**: Task 6

---

### Task 8: compound-learnings-researcher の検索対象変更（推定: 4分）

- **対象ファイル**: `agents/research/compound-learnings-researcher.md`（既存）
- **やること**: 行動規範セクションの検索対象を `docs/compound/` から `~/.claude/docs/experiential/logs/` に変更する。フォールバック先として `docs/compound/` を記載する。Nurture ログ（`YYYY-MM-DD-nurture.md`）の検索対応を追加する。`project` フィールドで現プロジェクト優先 + 他プロジェクトの関連学びも含める仕様を追記する。description フロントマターも更新する
- **検証方法**: `agents/research/compound-learnings-researcher.md` の行動規範が更新され、新しい検索先とフォールバック先が記載されていることを確認
- **関連要件**: REQ-008
- **関連スペック**: `specs/knowledge-system/delta-spec.md#compound-learnings-researcher の検索対象変更`
- **依存**: なし

---

### Task 9: USER-CLAUDE.md に Nurturing Protocol 追加（推定: 5分）

- **対象ファイル**: `~/.claude/CLAUDE.md`（既存）
- **やること**: NFD 提案書第 4 章 4.1 に基づき、Nurturing Protocol セクションを追加する。6 タグ分類体系（CORRECTION, INSIGHT, DECISION, PATTERN, ERROR, CONTEXT）の記録対象テーブル、記録対象外リスト、記録方法（1 日 1 ファイル追記方式）を簡潔に記載する。200 行制限を意識し、20-30 行程度に収める。Nurture ログの詳細形式は参照先として記載する
- **検証方法**: `~/.claude/CLAUDE.md` に Nurturing Protocol セクションが存在し、6 タグ分類が記載されていることを確認。ファイル全体が 200 行以内であることを確認。行数超過する場合は詳細を外部ファイルに分離する
- **関連要件**: REQ-005
- **関連スペック**: `specs/knowledge-system/delta-spec.md#Nurturing Protocol（全対話での経験ログ自動蓄積）`
- **依存**: Task 1

---

### Task 10: /crystallize コマンド定義の作成（推定: 5分）

- **対象ファイル**: `commands/crystallize.md`（新規）
- **やること**: NFD 提案書第 3 章 3.3 に基づき、`/crystallize` コマンド定義を作成する。YAML フロントマター（description, argument-hint）+ 引数テーブル（--scope, --dry-run）+ 5 Phase のワークフロー定義 + パターン候補フォーマット + 昇格先テーブル + paths フロントマター自動付与ルール + 仮説タグ形式 + 結晶化ログフォーマットを含む。Forge の既存コマンド設計パターン（YAML フロントマター + セクション構造）に従う
- **検証方法**: `commands/crystallize.md` が存在し、YAML フロントマターが正しい形式であることを確認。5 Phase の全てが記述されていることを確認。引数テーブルに --scope と --dry-run が記載されていることを確認
- **関連要件**: REQ-006, REQ-014
- **関連スペック**: `specs/knowledge-system/delta-spec.md#/crystallize コマンドの新規作成`, `specs/knowledge-system/delta-spec.md#パターン候補のフォーマット定義`
- **依存**: なし

---

### Task 11: 仮説検証ループの仕様を /compound と /crystallize に反映（推定: 3分）

- **対象ファイル**: `commands/compound.md`（既存）, `commands/crystallize.md`（Task 10 で新規作成）
- **やること**: `/compound` の Learning Router セクションに仮説検証の記述を追加する。Learning Router が学びを処理する際に、関連する仮説タグ付き知識が存在すれば confidence スコアを更新する仕様を記載する。ライフサイクル（承認 → +0.05、修正 → -0.15、>= 0.9 → タグ削除、<= 0.4 → 再検討候補）を明記する。`/crystallize` の Phase 4 に仮説タグ付与の仕様が含まれていることを確認する（Task 10 で作成済み）
- **検証方法**: `commands/compound.md` に仮説検証の記述が追加されていることを確認。confidence のライフサイクルが記載されていることを確認
- **関連要件**: REQ-007
- **関連スペック**: `specs/knowledge-system/delta-spec.md#仮説検証ループ`
- **依存**: Task 7, Task 10

---

### Task 12: commands/ship.md のパス参照更新（推定: 2分）

- **対象ファイル**: `commands/ship.md`（既存）
- **やること**: 完了レポートの `docs/compound/YYYY-MM-DD-<topic>.md` を `~/.claude/docs/experiential/logs/YYYY-MM-DD-<project>-<topic>.md` に更新する
- **検証方法**: `commands/ship.md` 内で `docs/compound/` が参照されていないことを Grep で確認
- **関連要件**: REQ-012
- **関連スペック**: `specs/knowledge-system/delta-spec.md#間接影響ファイルのパス参照更新`
- **依存**: なし

---

### Task 13: commands/spec.md のパス参照更新（推定: 3分）

- **対象ファイル**: `commands/spec.md`（既存）
- **やること**: compound-learnings-researcher の `docs/compound/` 参照（3 箇所: Phase 1a の teammate 説明、Phase 1b の起動説明、compound-learnings-researcher の説明）を `~/.claude/docs/experiential/logs/` に更新する
- **検証方法**: `commands/spec.md` 内で compound-learnings-researcher の説明に `docs/compound/` が参照されていないことを Grep で確認（3 箇所全て更新済み）
- **関連要件**: REQ-012
- **関連スペック**: `specs/knowledge-system/delta-spec.md#間接影響ファイルのパス参照更新`
- **依存**: なし

---

### Task 14: reference/workflow-rules.md のパス参照更新（推定: 3分）

- **対象ファイル**: `reference/workflow-rules.md`（既存）
- **やること**: Compound Learning セクションの `docs/compound/` パス参照を `~/.claude/docs/experiential/logs/` に更新する。セクション名を Experiential Learning に変更するか、新しいパスを反映する。`reference/context-isolation.md` への参照が含まれている場合は `.claude/rules/context-isolation.md` に更新する
- **検証方法**: `reference/workflow-rules.md` 内で `docs/compound/` への参照が更新されていることを Grep で確認
- **関連要件**: REQ-012
- **関連スペック**: `specs/knowledge-system/delta-spec.md#間接影響ファイルのパス参照更新`
- **依存**: なし

---

### Task 15: rules/core-essentials.md の参照先更新（推定: 2分）

- **対象ファイル**: `rules/core-essentials.md`（既存）
- **やること**: `reference/context-isolation.md` への参照を `.claude/rules/context-isolation.md` に更新する。「オンデマンドルール参照先」セクションの `reference/` への言及を `.claude/rules/` の自動ロード説明に更新する
- **検証方法**: `rules/core-essentials.md` 内で `reference/context-isolation.md` が参照されていないことを Grep で確認
- **関連要件**: REQ-012
- **関連スペック**: `specs/knowledge-system/delta-spec.md#間接影響ファイルのパス参照更新`
- **依存**: Task 2

---

### Task 16: implement-orchestrator.md の reference/ 言及更新（推定: 2分）

- **対象ファイル**: `agents/orchestration/implement-orchestrator.md`（既存）
- **やること**: `reference/` への言及を `.claude/rules/` に更新する
- **検証方法**: `agents/orchestration/implement-orchestrator.md` 内で `reference/` への直接参照が適切に更新されていることを確認
- **関連要件**: REQ-012
- **関連スペック**: `specs/knowledge-system/delta-spec.md#間接影響ファイルのパス参照更新`
- **依存**: Task 2

---

### Task 17: USER-CLAUDE.md の同期（推定: 2分）

- **対象ファイル**: `~/.claude/CLAUDE.md`（既存）
- **やること**: Task 9 で Nurturing Protocol を追加した後、CLAUDE.md の Experiential Learning セクション（Task 5）と整合性があることを確認する。USER-CLAUDE.md にも Experiential Learning への言及があれば更新する。Document Sync Rules に基づき、commands/ の変更が CLAUDE.md に反映されていることを確認する
- **検証方法**: `~/.claude/CLAUDE.md` の内容が Forge 本体の `CLAUDE.md` と整合していることを確認
- **関連要件**: REQ-005, REQ-010
- **関連スペック**: `specs/knowledge-system/delta-spec.md#Nurturing Protocol（全対話での経験ログ自動蓄積）`
- **依存**: Task 5, Task 9

---

### Task 18: 累積スペック remove-domain-content REQ-006 の更新（推定: 3分）

- **対象ファイル**: `openspec/specs/remove-domain-content/spec.md`（既存）
- **やること**: REQ-006 の拡張ガイダンスにおいて、`reference/` への追加を案内している記述を `.claude/rules/` への配置方法（`paths` 付き/なしの使い分け含む）に更新する。`reference/` は補足資料用途として残す旨を記載する
- **検証方法**: `openspec/specs/remove-domain-content/spec.md` の REQ-006 が `.claude/rules/` への配置方法を記載していることを確認
- **関連要件**: REQ-015
- **関連スペック**: `specs/knowledge-system/delta-spec.md#累積スペック remove-domain-content REQ-006 の参照更新`
- **依存**: Task 2, Task 3

---

### Task 19: Document Sync Rules 適用チェック（推定: 3分）

- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**: Document Sync Rules に基づき、以下の同期を確認する。(1) commands/ の変更（compound.md, crystallize.md, ship.md, spec.md）→ CLAUDE.md の Forge ワークフローセクションを確認・更新。(2) agents/ の変更（compound-learnings-researcher.md）→ CLAUDE.md の Available Agents セクションを確認（名前変更なし）。(3) rules/ の変更（core-essentials.md）→ CLAUDE.md の Rules セクションを確認（Task 4 で更新済み）
- **検証方法**: CLAUDE.md の各セクションが変更を反映していることを確認
- **関連要件**: REQ-010, REQ-011, REQ-012
- **関連スペック**: `specs/knowledge-system/delta-spec.md#CLAUDE.md の Experiential Learning セクション更新`
- **依存**: Task 4, Task 5, Task 6, Task 7, Task 12, Task 13

---

### Task 20: 横断整合性チェック（推定: 5分）

- **対象ファイル**: プロジェクト全体
- **やること**: 全タスク完了後の最終チェック。以下を実行する:
  1. `grep -r "docs/compound/" --include="*.md"` でプロジェクト全体を検索し、更新漏れがないことを確認する（compound-learnings-researcher のフォールバック説明のみに残るべき）
  2. `grep -r "reference/context-isolation" --include="*.md"` で旧参照が残っていないことを確認する
  3. `grep -r "reference/core-rules\|reference/workflow-rules\|reference/coding-standards\|reference/common/testing" --include="*.md"` で移行対象の旧参照が残っていないことを確認する（reference/ の README 的な言及は許容）
  4. design.md のファイル間整合性テーブルの全エントリが更新済みであることを確認する
  5. CLAUDE.md が全変更を反映していることを確認する
  6. 新規作成ファイル（`commands/crystallize.md`, `.claude/rules/*.md`）が全て存在することを確認する
- **検証方法**: 上記 6 項目の Grep/確認結果を記録し、全て PASS であることを確認する
- **関連要件**: REQ-001〜REQ-015（全要件）
- **関連スペック**: `specs/knowledge-system/delta-spec.md`（全体）
- **依存**: Task 1〜Task 19（全タスク）
