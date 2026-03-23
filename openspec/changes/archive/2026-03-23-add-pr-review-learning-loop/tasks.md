# add-pr-review-learning-loop タスクリスト

## テスト戦略

### L1: Unit テスト
- ユニットテスト: Markdown ファイルの変更のみのためユニットテスト対象なし
- 静的解析: Markdown ファイルの構造が既存パターンに準拠していることを手動確認
- ビルド検証: ビルド対象なし

### L2: Integration テスト
- L2 対象なし（Markdown ファイルの変更のみ）

### L3: Acceptance テスト
- 受入テスト: design.md の受入テスト計画に基づき、各 US の構造的検証を実施

## タスク

### Task 1: handle-pr-review.md の frontmatter に `argument-hint` と `--no-learn` を追加（推定: 2分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: frontmatter に `argument-hint: "<pr-number> [--no-learn]"` を追加する。既存の `arguments` 配列はそのまま維持する。`--no-learn` の検出は Step 7 冒頭で `$ARGUMENTS` から行う方式とし（`commit.md` の `--no-verify` パターンに準拠）、`arguments` 配列には追加しない
- **検証方法**: ファイルを Read して (1) frontmatter に `argument-hint: "<pr-number> [--no-learn]"` が存在する (2) 既存の `arguments` 配列と `pr` 引数が変更されていない (3) `description`, `disable-model-invocation`, `allowed-tools` が変更されていない ことを確認
- **関連要件**: REQ-006
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-006`
- **依存**: なし

### Task 2: handle-pr-review.md に Step 7 学習ループのスキップ判定を追加（推定: 3分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: Step 6 の後に Step 7「学習ループ」セクションを追加する。(1) 冒頭に「本ステップは外部PRレビュー指摘に対する学習ループであり、/review の学習ループとは異なる。記録先はプロジェクト側」という区別を明記する。(2) `--no-learn` フラグの判定（`$ARGUMENTS` から検出）とスキップメッセージ出力を記述する
- **検証方法**: ファイルを Read して (1) Step 7 が Step 6 の後にある (2) `/review` Step 7 との区別が冒頭に明記されている (3) `--no-learn` 判定が `$ARGUMENTS` からのパースとして記述されている (4) スキップメッセージ「学習ループをスキップしました（--no-learn）」が記述されている ことを確認
- **関連要件**: REQ-006, REQ-001
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-006`, `specs/pr-review-learning/delta-spec.md#REQ-001`
- **依存**: Task 1

### Task 3: Step 7 に指摘分析・種別分類・学び抽出ロジックを追加（推定: 4分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: Step 7 内に (1) レビュー指摘と修正内容の分析 (2) 指摘パターンの7種別分類（コーディングパターン / 設計・アーキテクチャ / テスト不足 / ドキュメント不整合 / セキュリティ / パフォーマンス / その他）(3) 学びの抽出（何が問題だったか / なぜ発生したか / どう防止できるか）を記述する。指摘ゼロ件時のスキップ処理も含める。サブステップ開始時に進捗メッセージ「[7a] レビュー指摘を分析中...」を出力すること
- **検証方法**: ファイルを Read して (1) 7種別の分類が定義されている (2) 学び抽出の3観点が記述されている (3) 指摘ゼロ件時のスキップ処理がある ことを確認
- **関連要件**: REQ-001, REQ-002
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-001`, `specs/pr-review-learning/delta-spec.md#REQ-002`
- **依存**: Task 2

### Task 4: Step 7 に学び記録先の動的判断と記録処理を追加（推定: 4分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: Step 7 内に (1) 記録先の走査順序（`docs/compound/` → `docs/learnings/` → `.claude/learnings/` → `docs/`）(2) 記録先不在時のフォールバック（`docs/compound/` の作成提案、ユーザー確認）(3) 学びファイルの記録（`YYYY-MM-DD-pr-<pr-number>-learnings.md` 形式）(4) 記録内容のサマリー出力 を記述する。エラーハンドリング（書き込み失敗時の非ブロッキング動作）も含める。サブステップ開始時に進捗メッセージ「[7b] 学びを記録中...」を出力すること
- **検証方法**: ファイルを Read して (1) 走査順序が定義されている (2) フォールバック処理がある (3) ファイル名形式が正しい (4) サマリー出力が記述されている (5) エラーハンドリングが非ブロッキングである ことを確認
- **関連要件**: REQ-001, REQ-003
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-001`, `specs/pr-review-learning/delta-spec.md#REQ-003`
- **依存**: Task 3

### Task 5: Step 7 にレビュアー更新提案フローを追加（推定: 5分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: Step 7 内に (1) 指摘パターンに基づく既存レビュアー更新提案 (2) 新規レビュアー作成提案 (3) 新規レビュアーテンプレート（既存パターン準拠 / Forge 標準テンプレート） (4) 各提案の承認/拒否フロー (5) `agents/review/` 不在時のフォールバック を記述する。プロジェクト側のファイルのみを対象とする旨を明記する。サブステップ開始時に進捗メッセージ「[7c] レビュアー更新を提案中...」を出力すること
- **検証方法**: ファイルを Read して (1) 既存レビュアー更新と新規作成の両方が提案される (2) 承認/拒否の選択が可能 (3) テンプレート形式が記述されている (4) プロジェクト側限定の記述がある (5) エラーハンドリングがある ことを確認
- **関連要件**: REQ-004, REQ-005
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-004`, `specs/pr-review-learning/delta-spec.md#REQ-005`
- **依存**: Task 3

### Task 6: Step 7 にコミット判断フローを追加（推定: 3分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: Step 7 の末尾に (1) コミット方法の選択肢提示（現在のPRに追加コミット / ワーキングツリーに残す）(2) コミットメッセージ形式（`docs(<scope>): PRレビューからの学びを記録`）(3) `git push` の実行 (4) 記録もレビュアー更新もなかった場合のスキップ を記述する。サブステップ開始時に進捗メッセージ「[7d] コミット判断...」を出力すること
- **検証方法**: ファイルを Read して (1) コミット方法の選択肢が定義されている (2) コミットメッセージ形式が `<type>(<scope>): <説明>` に従っている (3) 変更なし時のスキップがある ことを確認
- **関連要件**: REQ-007
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-007`
- **依存**: Task 4, Task 5

### Task 7: Workflow Summary と Notes の更新（推定: 2分）
- **対象ファイル**: `commands/handle-pr-review.md`（既存）
- **やること**: (1) Workflow Summary に Step 7 の説明を追加 (2) Notes セクションに学習ループ関連の注意事項を追加（プロジェクト側のみ対象、`--no-learn` でスキップ可能）
- **検証方法**: ファイルを Read して (1) Workflow Summary に Step 7 が含まれている (2) Notes に学習ループ関連の注意事項がある (3) 既存の Summary と Notes の内容が変更されていない ことを確認
- **関連要件**: REQ-001, REQ-006
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#REQ-001`, `specs/pr-review-learning/delta-spec.md#REQ-006`
- **依存**: Task 6

### Task 8: 横断整合性チェック（推定: 4分）
- **対象ファイル**: `commands/handle-pr-review.md`
- **やること**: (1) delta-spec のファイル間整合性テーブルに基づき、全概念間の整合性を検証。特に: `argument-hint` と Step 7 のスキップ条件の一致、`/review` Step 7 との区別の明記、学び記録形式と compound.md の親和性、レビュアーテンプレートと既存レビュアーの形式一致、Forge 本体非変更の明記。(2) Step 番号体系（Step 1-6 -> Step 7）が維持されていることを確認。(3) コミットメッセージ形式が `<type>(<scope>): <日本語の説明>` に従っていることを確認。(4) 既存の Step 1-6 の内容が変更されていないことを確認。(5) `argument-hint` が既存の `arguments` 配列と矛盾しないことを確認
- **検証方法**: ファイルを Read して整合性テーブルの全項目を確認。既存ステップの差分がないことを確認。`/review` Step 7 との区別文言の存在を確認
- **関連要件**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007
- **関連スペック**: `specs/pr-review-learning/delta-spec.md#ファイル間整合性テーブル`
- **依存**: Task 7
