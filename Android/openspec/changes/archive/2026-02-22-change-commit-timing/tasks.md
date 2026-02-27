# change-commit-timing タスクリスト

## テスト戦略

本変更は Forge ワークフローの設定ファイル（Markdown + JavaScript hooks）の変更であり、アプリケーションコードの変更ではない。テストフレームワークによる自動テストは対象外。

- 検証方法: 各ファイルの変更内容を目視確認 + 変更後のファイル全体を通読し新方針と矛盾する記述がないことを確認
- 最終検証: 全タスク完了後に変更対象ファイル間の整合性を確認

## タスク

### Task 1: implementer.md のコミット責務除去（推定: 3分）

- **対象ファイル**: `~/.claude/agents/implementation/implementer.md`（既存）
- **やること**:
  1. 「コミット責務」セクション（39-45行目付近）を削除し、「コミットしない。変更はワーキングツリーに残す」旨に置き換える
  2. 「コミットメッセージ形式」セクション（116-122行目付近）を削除
  3. 行動規範に「interpretations / reviews 配下のファイルは git add しない」を追加
- **検証方法**: ファイル全体を通読し、コミットを実行する旨の記述が残っていないことを確認
- **関連要件**: REQ-001, REQ-004
- **関連スペック**: `specs/commit-workflow/delta-spec.md#implementer のコミット責務除去`
- **依存**: なし

### Task 2: implementer.md の interpretations テンプレート拡充（推定: 3分）

- **対象ファイル**: `~/.claude/agents/implementation/implementer.md`（既存）
- **やること**:
  1. Spec Interpretation Log テンプレートに Phase B（事後追記）セクションを追加:
     - 「変更ファイル一覧」（作成・修正・削除）
     - 「実装の振り返り」（曖昧性への対処、却下した代替案、想定外の発見）
  2. COMPLETION CRITERIA に「Spec Interpretation Log の Phase B（変更ファイル一覧 + 振り返り）が追記済みであること」を追加
  3. 既存の「実装判断」テーブルに「却下理由」列の記載ルールを明確化
- **検証方法**: テンプレートに Phase B セクションが存在し、COMPLETION CRITERIA に Phase B 追記が含まれていることを確認
- **関連要件**: REQ-002
- **関連スペック**: `specs/commit-workflow/delta-spec.md#Spec Interpretation Log の拡充`
- **依存**: Task 1（同一ファイルのため順次実行）

### Task 3: commit.md の interpretations / reviews 除外ルール追加（推定: 2分）

- **対象ファイル**: `~/.claude/commands/commit.md`（既存）
- **やること**:
  1. 「0件ステージ時の自動 `git add`」動作に `openspec/changes/*/interpretations/` と `openspec/changes/*/reviews/` の除外ルールを追加
  2. 除外対象のパスパターンを明記
- **検証方法**: ファイル内に interpretations / reviews の除外ルールが明記されていることを確認
- **関連要件**: REQ-004
- **関連スペック**: `specs/commit-workflow/delta-spec.md#interpretations / reviews のコミット除外ルール`
- **依存**: なし

### Task 4: implement.md のコミット関連記述変更（推定: 3分）

- **対象ファイル**: `~/.claude/commands/implement.md`（既存）
- **やること**:
  1. COMPLETION CRITERIA から「コミット済みであること（Interpretation Log を含む）」を削除
  2. COMPLETION CRITERIA に「Spec Interpretation Log の Phase B が追記済みであること」を追加
  3. 完了サマリーの「コミット一覧」セクションを「変更ファイル一覧（`git diff --stat`）」に置き換え
  4. `git log --oneline` による確認を `git diff --stat` に変更
  5. implementer への指示部分からコミット関連の記述を除去
- **検証方法**: ファイル全体を通読し、「git commit」「git log」「コミット一覧」が残っていないことを確認
- **関連要件**: REQ-001, REQ-008
- **関連スペック**: `specs/commit-workflow/delta-spec.md#implementer のコミット責務除去`, `specs/commit-workflow/delta-spec.md#/implement 完了サマリーの変更`
- **依存**: なし

### Task 5: implement-orchestrator.md のコミット関連記述変更（推定: 2分）

- **対象ファイル**: `~/.claude/agents/orchestration/implement-orchestrator.md`（既存）
- **やること**:
  1. COMPLETION CRITERIA からコミット指示（85行目付近）を削除
  2. 完了サマリーの「コミット一覧」を「変更ファイル一覧（`git diff --stat`）」に置き換え
  3. `git log --oneline` による確認を `git diff --stat` に変更
- **検証方法**: ファイル全体を通読し、コミットを実行する旨の記述が残っていないことを確認
- **関連要件**: REQ-001, REQ-008
- **関連スペック**: `specs/commit-workflow/delta-spec.md#implementer のコミット責務除去`, `specs/commit-workflow/delta-spec.md#/implement 完了サマリーの変更`
- **依存**: なし

### Task 6: review.md に review-summary.md 出力ステップ追加（推定: 4分）

- **対象ファイル**: `~/.claude/commands/review.md`（既存）
- **やること**:
  1. review-aggregator の統合レポート受領後に `openspec/changes/<name>/reviews/review-summary.md` へ Write するステップを追加（Main Agent が担当）
  2. `reviews/` ディレクトリの自動作成ステップを追加
  3. レビュー指摘に基づく修正実施後、修正内容を review-summary.md の「修正内容」セクションに追記するステップを追加
  4. review-summary.md のテンプレート形式を記載（delta-spec のテンプレートに準拠）
  5. change-name の特定方法を明記（アクティブ変更の自動検出 or 引数指定）
  6. `/review` 再実行時は既存 review-summary.md を上書きする旨を明記
- **検証方法**: review コマンドのフローに review-summary.md の生成・追記ステップが含まれていることを確認
- **関連要件**: REQ-003
- **関連スペック**: `specs/commit-workflow/delta-spec.md#review-summary.md の新設`
- **依存**: なし

### Task 7: review-aggregator.md の出力形式明確化（推定: 2分）

- **対象ファイル**: `~/.claude/agents/review/review-aggregator.md`（既存）
- **やること**:
  1. 統合レポートの出力形式を明確化（review-summary.md のテンプレートに沿った構造化形式）
  2. レポートに含めるべき項目を明記: レビュアー名、指摘カテゴリ、指摘内容、優先度、推奨修正
- **検証方法**: 出力形式のテンプレートが定義されていることを確認
- **関連要件**: REQ-003
- **関連スペック**: `specs/commit-workflow/delta-spec.md#review-summary.md の新設`
- **依存**: なし

### Task 8: compound.md の学習ソース変更（推定: 3分）

- **対象ファイル**: `~/.claude/commands/compound.md`（既存）
- **やること**:
  1. 学習ソースを明示化: proposal.md, design.md, interpretations/*.md, reviews/review-summary.md
  2. 各ソースの読み込みフローを記述（存在チェック + フォールバック動作: 存在しないファイルはスキップして記録）
  3. proposal.md / design.md が欠落している場合のフォールバック動作を記述
- **検証方法**: 学習ソースの一覧とフォールバック動作が明記されていることを確認
- **関連要件**: REQ-005
- **関連スペック**: `specs/commit-workflow/delta-spec.md#/compound の学習ソース変更`
- **依存**: なし

### Task 9: compound.md に自動削除ステップ追加（推定: 2分）

- **対象ファイル**: `~/.claude/commands/compound.md`（既存）
- **やること**:
  1. 学習抽出が正常完了した後のクリーンアップステップを追加: `interpretations/` と `reviews/` ディレクトリの削除
  2. 学習抽出が失敗した場合はクリーンアップを実行しない旨を明記
  3. ディレクトリが存在しない場合のスキップ動作を明記
- **検証方法**: クリーンアップステップが学習抽出成功後に実行される旨が明記されていることを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/commit-workflow/delta-spec.md#/compound 実行時の一時ファイル自動削除`
- **依存**: Task 8（同一ファイルのため順次実行）

### Task 10: ship.md のコミットなし対応（推定: 3分）

- **対象ファイル**: `~/.claude/commands/ship.md`（既存）
- **やること**:
  1. 完了レポートから「コミット数: X」を削除
  2. パイプライン完了後に `git diff --stat` で変更概要を表示し、「変更内容を確認の上、コミットしてください」とユーザーに促すステップを追加
  3. パイプライン途中失敗時に未コミット変更の存在を明記し `git diff --stat` を表示するステップを追加
- **検証方法**: 完了レポートにコミット数が含まれていないこと、コミット促進ステップが存在することを確認
- **関連要件**: REQ-007
- **関連スペック**: `specs/commit-workflow/delta-spec.md#/ship パイプラインのコミットなし対応`
- **依存**: なし

### Task 11: CLAUDE.md の更新（推定: 3分）

- **対象ファイル**: `~/forge/CLAUDE.md`（既存）, `~/.claude/CLAUDE.md`（既存）
- **やること**:
  1. implementer の責務セクションから「Git コミット（Interpretation Log を含む）」を削除し、「Spec Interpretation Log の Phase B（変更ファイル一覧 + 振り返り）を追記」に置き換え
  2. OpenSpec 構造の図に `reviews/` ディレクトリを追加（`interpretations/` と同階層）
  3. OpenSpec 構造の図の `interpretations/` と `reviews/` の説明に「コミット対象外、/compound 後に削除」を追加
  4. 両ファイル（プロジェクト版 + グローバル版）に同じ変更を適用
- **検証方法**: 両ファイルで implementer の責務にコミット関連が含まれていないこと、OpenSpec 構造に `reviews/` が含まれていることを確認
- **関連要件**: REQ-001, REQ-002, REQ-003
- **関連スペック**: `specs/commit-workflow/delta-spec.md#implementer のコミット責務除去`
- **依存**: Task 1, Task 2（implementer の責務変更に合わせる）

### Task 12: workflow-rules.md のコミットタイミング記述変更（推定: 2分）

- **対象ファイル**: `~/.claude/reference/workflow-rules.md`（既存）
- **やること**:
  1. 「小さな単位でコミット」（30行目付近）をユーザー明示指示によるコミットに変更
  2. 「テスト通過を確認してコミット」（74行目付近）のコミットタイミングに関する記述を変更
  3. ファイル全体を通読し、コミットタイミングに関する記述が新方針と矛盾しないことを確認
- **検証方法**: ファイル全体を通読し、全てのコミット関連記述が新方針と整合していることを確認
- **関連要件**: REQ-001
- **関連スペック**: `specs/commit-workflow/delta-spec.md#implementer のコミット責務除去`
- **依存**: なし

### Task 13: spec-compliance-reviewer.md の interpretations 検証項目追加（推定: 2分）

- **対象ファイル**: `~/.claude/agents/implementation/spec-compliance-reviewer.md`（既存）
- **やること**:
  1. Interpretation Log の検証項目に Phase B（変更ファイル一覧 + 振り返り）の存在チェックを追加
  2. 「変更ファイル一覧が空でないこと」の検証を追加（ファイル変更を伴うタスクの場合）
- **検証方法**: 検証チェックリストに Phase B 関連の項目が含まれていることを確認
- **関連要件**: REQ-002
- **関連スペック**: `specs/commit-workflow/delta-spec.md#Spec Interpretation Log の拡充`
- **依存**: Task 2（テンプレート変更に合わせる）
