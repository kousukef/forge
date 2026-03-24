# add-pre-push-verification-to-handle-pr-review タスクリスト

## テスト戦略

### L1: Unit テスト
- ユニットテスト: Markdown ファイルの変更のみのためユニットテスト対象なし
- 静的解析: 変更後の Markdown ファイルの構造が既存パターンに準拠していることを確認
- ビルド検証: ビルド対象なし

### L2: Integration テスト
- L2 対象なし（Markdown ファイルの変更のみ）

### L3: Acceptance テスト
- 受入テスト: design.md の受入テスト計画（US-001）に基づき、検証ステップの構造的検証を実施

## タスク

### Task 1: allowed-tools の拡張（推定: 2分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: frontmatter の `allowed-tools` を `Bash(gh *), Bash(git *), Grep, Read, Edit, Write, Glob` から `Bash, Grep, Read, Edit, Write, Glob` に変更する。検証コマンド実行のための汎用 Bash 権限を付与する
- **検証方法**: ファイルを Read して frontmatter の `allowed-tools` が `Bash, Grep, Read, Edit, Write, Glob` になっていることを確認
- **関連要件**: REQ-004
- **関連スペック**: `specs/pre-push-verification/delta-spec.md#REQ-004`
- **依存**: なし

### Task 2: 検証ステップの挿入と後続 Step 番号の繰り下げ（推定: 5分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**:
  1. Step 3（Implement Fixes）と Step 4（Create Descriptive Commits）の間に新しい「## Step 4: Pre-commit Verification」を挿入する
  2. 旧 Step 4〜7 を Step 5〜8 に繰り下げる（見出し番号の更新）
  3. 旧 Step 7 のサブステップ [7a]〜[7d] を [8a]〜[8d] に更新する
  4. Workflow Summary セクションの番号を更新する
  5. 新 Step 4 に以下を記述する:
     - 検証コマンドの情報源と取得順序（project.md → CLAUDE.md → 動的検出）
     - 実行順序（format → lint → type-check → test）
     - 自動修正フロー（auto-fix → 原因推論 → 修正試行、最大3回リトライ）
     - 全検証成功時のみ Step 5（コミット）に進む
     - 検証コマンドが検出できない場合の中断とエラーメッセージ
     - gate-git-push フックとの責務分離の注記
- **検証方法**: ファイルを Read して (1) Step 4 が検証ステップである (2) Step 番号が1〜8で連続している (3) サブステップが [8a]〜[8d] に更新されている (4) Workflow Summary が更新されている ことを確認
- **関連要件**: REQ-001, REQ-002, REQ-003, REQ-005
- **関連スペック**: `specs/pre-push-verification/delta-spec.md#REQ-001`, `specs/pre-push-verification/delta-spec.md#REQ-002`, `specs/pre-push-verification/delta-spec.md#REQ-003`, `specs/pre-push-verification/delta-spec.md#REQ-005`
- **依存**: Task 1（allowed-tools が先に変更されている必要がある）

### Task 3: 横断整合性チェック（推定: 3分）
- **対象ファイル**: `commands/handle-pr-review.md`（変更後の全体）
- **やること**:
  1. delta-spec のファイル間整合性テーブルに基づき、全項目を検証する:
     - Step 番号の連続性（1〜8）
     - allowed-tools に Bash が含まれている
     - Workflow Summary に検証ステップが反映されている
     - gate-git-push との責務分離が注記されている
     - argument-hint が変更されていない
  2. 旧 Step 番号（Step 4: Create, Step 5: Push 等）の残存を Grep で確認し、全て更新されていることを確認
  3. サブステップ [7a]〜[7d] の残存がないことを確認
  4. `openspec/specs/pr-review-learning/spec.md` への影響がないことを確認
- **検証方法**: Grep で旧番号の残存確認、Read で全項目の目視確認
- **関連要件**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005
- **関連スペック**: `specs/pre-push-verification/delta-spec.md#ファイル間整合性テーブル`
- **依存**: Task 1, Task 2
