# commit-workflow スペック

## Requirements

### Requirement: REQ-001 implementer のコミット責務除去

implementer はタスク完了時に Git コミットを実行してはならない（SHALL NOT）。変更はワーキングツリーに残し、ユーザーの明示的な指示でのみコミットする。`/implement` コマンドおよび implement-orchestrator の COMPLETION CRITERIA からコミット関連の基準を削除する。

#### Scenario: Happy Path - タスク完了時
- **GIVEN** implementer がタスクの TDD 実装を完了し、テストと型チェックがパスした状態
- **WHEN** タスクが完了する
- **THEN** Git コミットを実行せず、変更をワーキングツリーに残す

#### Scenario: Happy Path - 複数タスク順次実行
- **GIVEN** implementer が複数タスクを順次実行する場合
- **WHEN** 各タスクが完了する
- **THEN** いずれのタスク完了時にもコミットしない

#### Scenario: Error - タスク中断時
- **GIVEN** implementer がタスク実行中にエラーで中断した場合
- **WHEN** 途中までの変更がワーキングツリーに残っている
- **THEN** ワーキングツリーの既存の変更はそのまま残り、implementer は再実行時に既存の変更済みファイルを検出した上で追加の変更を行う

### Requirement: REQ-002 Spec Interpretation Log の拡充

implementer は Spec Interpretation Log に以下の情報を記録しなければならない（SHALL）:
1. 仕様解釈（既存: TDD 開始前に記述）
2. 変更ファイル一覧（新規: TDD 完了後に事後追記）
3. 実装判断の理由の強化（新規: 却下した代替案と根拠を含む）

#### Scenario: Happy Path - 仕様解釈の記述
- **GIVEN** implementer がタスクの仕様解釈を完了した
- **WHEN** Spec Interpretation Log を作成する
- **THEN** 「対象要件」「実装判断」「必須チェック項目」「ギャップ検出」セクションを記述する

#### Scenario: Happy Path - 変更ファイル一覧の追記
- **GIVEN** implementer が TDD 実装を完了した
- **WHEN** タスク完了処理を行う
- **THEN** Spec Interpretation Log に「変更ファイル一覧」セクションを追記し、作成・修正・削除したファイルをそれぞれリストアップする

#### Scenario: Happy Path - 実装判断の記録
- **GIVEN** implementer が実装方針を決定した
- **WHEN** 実装判断を記録する
- **THEN** 「採用した方針」「却下した代替案とその理由」「仕様の曖昧性への対処」を含める

#### Scenario: Error - タスク中断時
- **GIVEN** implementer がタスク実行中にエラーで中断した場合
- **WHEN** Spec Interpretation Log が途中までしか記述されていない
- **THEN** 変更ファイル一覧セクションが未追記の状態でも、仕様解釈セクションは残っている

#### Scenario: Boundary - ファイル変更なし
- **GIVEN** タスクがファイル変更を伴わない場合（例: 調査のみのタスク）
- **WHEN** 変更ファイル一覧を記述する
- **THEN** 「変更なし」と明記する

#### Scenario: Boundary - 大量ファイル変更
- **GIVEN** タスクが非常に多数のファイル（50ファイル以上等）を変更した場合
- **WHEN** 変更ファイル一覧を記述する
- **THEN** 全ファイルを列挙する（上限なし）

#### Scenario: Boundary - 代替案なし
- **GIVEN** 仕様が一意に実装方針を指定しており却下した代替案が存在しない場合
- **WHEN** 実装判断を記録する
- **THEN** 「代替案なし -- 仕様が一意に指定」と明記する

### Requirement: REQ-003 review-summary.md の新設

`/review` コマンド実行時に `openspec/changes/<name>/reviews/review-summary.md` を生成しなければならない（SHALL）。review-aggregator の統合結果をベースに、レビュー指摘と修正内容を1ファイルにまとめる。`/review` コマンドの Main Agent がファイルの生成と修正内容の追記を担当する。

#### Scenario: Happy Path - review-summary.md 生成
- **GIVEN** `/review` コマンドが実行され、各レビュアーの分析が完了した
- **WHEN** review-aggregator が統合レポートを生成した
- **THEN** `/review` コマンドの Main Agent が `openspec/changes/<name>/reviews/review-summary.md` にテンプレートに従ってレポートを書き出す

#### Scenario: Happy Path - 修正内容の追記
- **GIVEN** review-summary.md が生成された
- **WHEN** `/review` コマンド内の自動修正（P1 Critical/High）が実施された
- **THEN** `/review` コマンドの Main Agent が「修正内容」セクションに対応内容を追記する

#### Scenario: Error - アクティブ変更なし
- **GIVEN** `/review` コマンド実行時にアクティブな変更が特定できない場合
- **WHEN** review-summary.md の出力先を決定する
- **THEN** エラーメッセージを表示し、change-name の指定を求める

#### Scenario: Error - レビュアー一部失敗
- **GIVEN** レビュアーの一部が失敗した場合
- **WHEN** review-aggregator が統合レポートを生成する
- **THEN** 成功したレビュアーの結果のみで review-summary.md を生成し、「失敗したレビュアー」に明記する

#### Scenario: Error - reviews/ ディレクトリなし
- **GIVEN** `reviews/` ディレクトリが存在しない場合
- **WHEN** review-summary.md を書き出す
- **THEN** ディレクトリを自動作成してからファイルを生成する

#### Scenario: Boundary - 指摘0件
- **GIVEN** 全レビュアーが成功し、指摘件数が0件の場合
- **WHEN** review-summary.md を生成する
- **THEN** 「指摘なし」の review-summary.md を生成する

#### Scenario: Boundary - 再実行
- **GIVEN** review-summary.md が既に存在する状態で `/review` が再実行された
- **WHEN** review-summary.md を生成する
- **THEN** 既存ファイルを上書きする

### Requirement: REQ-004 interpretations / reviews のコミット除外ルール

Forge のコミットルールとして、`openspec/changes/*/interpretations/` と `openspec/changes/*/reviews/` 配下のファイルを `git add` の対象に含めてはならない（SHALL NOT）。このルールは implementer の行動規範、`/commit` コマンド、および CLAUDE.md に記載する。`/commit` コマンドの「0件ステージ時の自動 `git add`」動作においても、これらのディレクトリを除外しなければならない（SHALL）。

#### Scenario: Happy Path - コミット時の除外
- **GIVEN** ユーザーがコミットを指示した
- **WHEN** `git add` でファイルをステージングする
- **THEN** `interpretations/` と `reviews/` 配下のファイルはステージング対象に含めない

#### Scenario: Happy Path - 自動 git add での除外
- **GIVEN** `/commit` コマンドが実行され、ステージング済みファイルが0件の場合
- **WHEN** 自動 `git add` で変更ファイルをステージングする
- **THEN** `openspec/changes/*/interpretations/` と `openspec/changes/*/reviews/` 配下のファイルを除外してステージングする

#### Scenario: Error - 手動操作
- **GIVEN** ユーザーが `git add .` や `git add -A` を手動で実行した場合
- **WHEN** interpretations / reviews がステージングされる
- **THEN** Forge は追加のアクションを取らない。手動での Git 操作は Forge のルール範囲外である

### Requirement: REQ-005 /compound の学習ソース変更

`/compound` コマンドは以下のファイルを学習ソースとして使用しなければならない（SHALL）:
1. `proposal.md` -- 変更の意図
2. `design.md` -- 設計判断
3. `interpretations/<task>.md` -- 各タスクの判断ログ + 変更ファイル一覧
4. `reviews/review-summary.md` -- レビュー指摘と修正内容（存在する場合）

#### Scenario: Happy Path - 全ソース読み込み
- **GIVEN** `/compound` コマンドが実行された
- **WHEN** 学習ソースを読み込む
- **THEN** proposal.md, design.md, 全 interpretations ファイル, review-summary.md を読み込んで振り返りを行う

#### Scenario: Error - review-summary.md なし
- **GIVEN** `/review` が実行されなかったため review-summary.md が存在しない
- **WHEN** `/compound` が学習ソースを読み込む
- **THEN** review-summary.md をスキップし、存在するファイルのみで学習を実行する

#### Scenario: Error - interpretations なし
- **GIVEN** interpretations ファイルが1つも存在しない
- **WHEN** `/compound` が学習ソースを読み込む
- **THEN** proposal.md と design.md のみで学習を実行し、interpretations が欠落している旨を記録する

#### Scenario: Error - proposal.md なし
- **GIVEN** proposal.md が存在しない
- **WHEN** `/compound` が学習ソースを読み込む
- **THEN** 存在するファイルのみで学習を実行し、proposal.md が欠落している旨を記録する

#### Scenario: Error - design.md なし
- **GIVEN** design.md が存在しない
- **WHEN** `/compound` が学習ソースを読み込む
- **THEN** 存在するファイルのみで学習を実行し、design.md が欠落している旨を記録する

### Requirement: REQ-006 /compound 実行時の一時ファイル自動削除

`/compound` コマンドは学習抽出が正常に完了した後に限り、`interpretations/` と `reviews/` ディレクトリを自動削除しなければならない（SHALL）。

#### Scenario: Happy Path - 正常完了時の削除
- **GIVEN** `/compound` が学習抽出を正常に完了した
- **WHEN** アーカイブ処理を実行する
- **THEN** `openspec/changes/<name>/interpretations/` と `openspec/changes/<name>/reviews/` ディレクトリを削除する

#### Scenario: Error - ディレクトリなし
- **GIVEN** interpretations / reviews ディレクトリが存在しない場合
- **WHEN** 削除処理を実行する
- **THEN** エラーにせず、スキップする

#### Scenario: Error - 学習抽出中断
- **GIVEN** `/compound` の学習抽出が途中でエラーにより中断した場合
- **WHEN** クリーンアップステップに到達していない
- **THEN** interpretations / reviews はそのまま残す（次回の `/compound` 実行で再利用可能）

#### Scenario: Boundary - 空ディレクトリ
- **GIVEN** interpretations ディレクトリは存在するが中身が空の場合
- **WHEN** 削除処理を実行する
- **THEN** 空ディレクトリを削除する

### Requirement: REQ-007 /ship パイプラインのコミットなし対応

`/ship` コマンドのパイプライン内ではコミットを実行しない（SHALL NOT）。パイプライン完了後にユーザーにコミットを促す。

#### Scenario: Happy Path - パイプライン完了
- **GIVEN** `/ship` パイプラインが `/compound` まで完了した
- **WHEN** 完了レポートを表示する
- **THEN** `git diff --stat` で変更概要を表示し、「変更内容を確認の上、コミットしてください」とユーザーに促す

#### Scenario: Error - パイプライン途中失敗
- **GIVEN** `/ship` パイプラインが途中で失敗した場合
- **WHEN** エラーレポートを表示する
- **THEN** 未コミットの変更がワーキングツリーに残っている旨を明記し、`git diff --stat` で変更概要を表示する

### Requirement: REQ-008 /implement 完了サマリーの変更

`/implement` コマンドおよび implement-orchestrator の完了サマリーから「コミット一覧」を削除し、`git diff --stat` による変更ファイル一覧に置き換えなければならない（SHALL）。

#### Scenario: Happy Path - 完了サマリー表示
- **GIVEN** `/implement` の全タスクが完了した
- **WHEN** 完了サマリーを表示する
- **THEN** `git diff --stat` の結果を表示し、変更されたファイルの概要をユーザーに提示する

#### Scenario: Error - git diff 失敗
- **GIVEN** `git diff --stat` の実行に失敗した場合（Git リポジトリではない環境等）
- **WHEN** 完了サマリーを表示する
- **THEN** エラーメッセージとともに、手動で `git status` を実行して確認するよう案内する

#### Scenario: Boundary - 変更なし
- **GIVEN** ワーキングツリーに変更がない場合
- **WHEN** 完了サマリーを表示する
- **THEN** 「変更なし」と表示する
