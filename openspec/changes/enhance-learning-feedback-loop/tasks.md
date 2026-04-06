# enhance-learning-feedback-loop タスクリスト

## テスト戦略

### L1: Unit テスト

- 静的解析: 全変更対象の Markdown ファイルが構文的に正しいことを確認（YAML フロントマターのパース）
- 構造検証: シグナルエントリフォーマットの YAML フロントマターが正しい形式であることを確認

### L2: Integration テスト

- L2 対象なし（Markdown ベースのエージェント定義・コマンド定義の変更のため）

### L3: Acceptance テスト

- 受入テスト: US-001〜US-003 に対して手動検証を実施。各 US の検証シナリオは design.md の受入テスト計画に記載

## タスク

### Task 1: compound.md にシグナルエントリ形式を定義（推定: 3分）

- **対象ファイル**: `commands/compound.md`（既存）
- **やること**: 「複利ドキュメント形式」セクションの後に「### シグナルエントリ形式」サブセクションを追加する。delta-spec REQ-002 に定義されたフォーマット（YAML フロントマター 7 フィールド + 2 セクション）を記載する。ファイル命名規則（`YYYY-MM-DD-<project>-signals.md`）、ID 体系（`sig-NNNN`）、`---` 区切りによる複数エントリ追記方式を明記する
- **検証方法**: `commands/compound.md` に「シグナルエントリ形式」セクションが存在し、フロントマターフィールド 8 つ（id, type, signal_class, related_skill, project, task, date, crystallized）が記載されていることを確認
- **関連要件**: REQ-002
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-002`
- **依存**: なし

---

### Task 2: implementer.md Phase B にシグナル分類セクションを追加（推定: 4分）

- **対象ファイル**: `agents/implementation/implementer.md`（既存）
- **やること**: Spec Interpretation Log の Phase B テンプレート（「実装の振り返り」セクションの後、テンプレート閉じの ` ``` ` の前）に「### シグナル分類」セクションを追加する。`signal_class`（FIX/DERIVED/CAPTURED/NONE）の判断基準テーブル、`related_skill` の記入ガイド、`signal_class: NONE` 以外の場合の experiential logs 即時書き込み指示を記載する。書き込み先は「compound.md のシグナルエントリ形式に従う」と参照する
- **検証方法**: `agents/implementation/implementer.md` の Phase B テンプレートに「シグナル分類」セクションが存在し、4 つの signal_class の判断基準が記載されていることを確認
- **関連要件**: REQ-001, REQ-002
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-001`, `specs/learning-feedback/delta-spec.md#REQ-002`
- **依存**: Task 1

---

### Task 3: implementer.md に pre-flight ステップを追加（推定: 4分）

- **対象ファイル**: `agents/implementation/implementer.md`（既存）
- **やること**: 行動規範のステップ 2（タスク+デルタスペック読み込み）とステップ 3（Spec Interpretation Log 出力）の間に、ステップ 2.5 として pre-flight シグナル参照を追加する。`~/.claude/docs/experiential/logs/` 内の `signal_class: FIX` を Grep で検索する手順、直近 5 件制限、Spec Interpretation Log への「参照したシグナル」テーブル記載形式、ディレクトリ不在時・Grep 失敗時のスキップ動作を記載する
- **検証方法**: `agents/implementation/implementer.md` の行動規範にステップ 2.5 が存在し、Grep パターン・件数制限・エラーハンドリングが記載されていることを確認
- **関連要件**: REQ-003
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-003`
- **依存**: なし

---

### Task 4: implementer.md COMPLETION CRITERIA 更新（推定: 2分）

- **対象ファイル**: `agents/implementation/implementer.md`（既存）
- **やること**: COMPLETION CRITERIA セクションに以下の 2 項目を追加する: (a)「Phase B のシグナル分類セクションが記述済みであること」(b)「`signal_class` が NONE 以外の場合、シグナルエントリが experiential logs に書き込まれていること」
- **検証方法**: `agents/implementation/implementer.md` の COMPLETION CRITERIA に 2 項目が追加されていることを確認
- **関連要件**: REQ-001, REQ-002
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-001`, `specs/learning-feedback/delta-spec.md#REQ-002`
- **依存**: Task 2

---

### Task 5: crystallize.md Phase 1 サマリー表示の更新（推定: 3分）

- **対象ファイル**: `commands/crystallize.md`（既存）
- **やること**: Phase 1 データ収集のサマリー表示に `type: signal` の件数を追加する。現在の「compound: X 件, nurture: Y 件」を「compound: X 件, nurture: Y 件, signal: Z 件」に拡張する。signal エントリが存在する場合は `related_skill` 別の集計も表示する（例: "related_skill 別: Prisma 3件, React 2件"）。Phase 1 のエントリ型説明（Compound ログ、Nurture ログ）に Signal ログの説明を追加する
- **検証方法**: `commands/crystallize.md` の Phase 1 サマリー表示に `signal: Z 件` と `related_skill` 別集計が記載されていることを確認
- **関連要件**: REQ-005
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-005`
- **依存**: なし

---

### Task 6: crystallize.md Phase 2 に FIX 集積度を追加（推定: 3分）

- **対象ファイル**: `commands/crystallize.md`（既存）
- **やること**: Phase 2 パターン抽出の抽出観点リスト（現在 4 つ: 繰り返し、プロジェクト横断、因果関係、Shift-Left 機会）に 5 番目の観点「**FIX 集積度**: 同一 `related_skill` への FIX シグナルが 3 件以上蓄積している場合、当該スキルのパターン候補を優先する」を追加する。パターン候補のソート順序に FIX 集積度を反映する記述も追加する
- **検証方法**: `commands/crystallize.md` の Phase 2 に FIX 集積度の抽出観点が追加され、閾値（3 件以上）が記載されていることを確認
- **関連要件**: REQ-004
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-004`
- **依存**: なし

---

### Task 7: implement.md の COMPLETION CRITERIA テンプレート更新（推定: 2分）

- **対象ファイル**: `commands/implement.md`（既存）
- **やること**: 「implementer プロンプト構造」セクションの COMPLETION CRITERIA テンプレートに「Phase B のシグナル分類が記述済みであること」を追加する
- **検証方法**: `commands/implement.md` の COMPLETION CRITERIA テンプレートにシグナル分類の項目が含まれていることを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-006`
- **依存**: Task 2

---

### Task 8: implement-orchestrator.md の COMPLETION CRITERIA 更新（推定: 2分）

- **対象ファイル**: `agents/orchestration/implement-orchestrator.md`（既存）
- **やること**: implementer Sub Agent のディスパッチセクションにある COMPLETION CRITERIA テンプレートに「Phase B のシグナル分類が記述済みであること」を追加する
- **検証方法**: `agents/orchestration/implement-orchestrator.md` の COMPLETION CRITERIA にシグナル分類の項目が含まれていることを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-006`
- **依存**: Task 2

---

### Task 9: compound-learnings-researcher.md のフィルタリング更新（推定: 3分）

- **対象ファイル**: `agents/research/compound-learnings-researcher.md`（既存）
- **やること**: フィルタリング基準セクションに `type: signal` エントリの対応を追加する。Signal ログのフィルタリング方法（`signal_class` と `related_skill` による絞り込み）を記載する。description フロントマターも更新する（signal type への言及を追加）
- **検証方法**: `agents/research/compound-learnings-researcher.md` に signal type のフィルタリング基準が記載されていることを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-006`
- **依存**: なし

---

### Task 10: spec-compliance-reviewer.md の Phase B チェック更新（推定: 2分）

- **対象ファイル**: `agents/implementation/spec-compliance-reviewer.md`（既存）
- **やること**: 事後検証モードのチェックリスト（Phase B チェック項目）に「シグナル分類セクションの存在確認」を追加する
- **検証方法**: `agents/implementation/spec-compliance-reviewer.md` の事後検証モードチェックリストにシグナル分類の確認項目が含まれていることを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-006`
- **依存**: Task 2

---

### Task 11: Document Sync -- CLAUDE.md 確認・更新（推定: 3分）

- **対象ファイル**: `CLAUDE.md`（既存）, `~/.claude/CLAUDE.md`（既存）
- **やること**: Document Sync Rules に基づき以下を確認・更新する:
  1. `commands/crystallize.md` の変更 → CLAUDE.md の Experiential Learning セクションの `/crystallize` 説明を確認（FIX 集積度の追加を反映する必要があるか判断）
  2. `agents/implementation/implementer.md` の変更 → CLAUDE.md の Available Agents セクションを確認（implementer の description に変更が必要か判断）
  3. `agents/research/compound-learnings-researcher.md` の変更 → CLAUDE.md の Available Agents セクションを確認
  4. 必要な更新がある場合のみ編集を実施する（不要な場合はスキップ）
- **検証方法**: CLAUDE.md が変更を正しく反映していることを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/learning-feedback/delta-spec.md#REQ-006`
- **依存**: Task 1〜Task 10

---

### Task 12: 横断整合性チェック（推定: 5分）

- **対象ファイル**: プロジェクト全体
- **やること**: 全タスク完了後の最終チェック。以下を実行する:
  1. design.md のファイル間整合性テーブルの全エントリが整合していることを確認
  2. `grep -r "signal_class" --include="*.md"` で新概念の一貫した使用を確認
  3. `grep -r "type: signal" --include="*.md"` で signal type の記述が統一されていることを確認
  4. `grep -r "sig-NNNN\|sig-0001" --include="*.md"` で ID 体系の記述が統一されていることを確認
  5. implementer.md の COMPLETION CRITERIA と implement.md / implement-orchestrator.md のテンプレートが一致していることを確認
  6. 新規作成ファイルがないことを確認（本変更は全て既存ファイルへの追記）
- **検証方法**: 上記 6 項目の Grep/確認結果を記録し、全て PASS であることを確認
- **関連要件**: REQ-001〜REQ-006（全要件）
- **関連スペック**: `specs/learning-feedback/delta-spec.md`（全体）
- **依存**: Task 1〜Task 11（全タスク）
