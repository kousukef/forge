# commit-workflow デルタスペック

## MODIFIED Requirements

### Requirement: REQ-001 implementer のコミット責務除去

implementer はタスク完了時に Git コミットを実行してはならない（SHALL NOT）。変更はワーキングツリーに残し、ユーザーの明示的な指示でのみコミットする。`/implement` コマンドおよび implement-orchestrator の COMPLETION CRITERIA からコミット関連の基準を削除する。

#### Happy Path Scenarios

- **GIVEN** implementer がタスクの TDD 実装を完了し、テストと型チェックがパスした状態 **WHEN** タスクが完了する **THEN** Git コミットを実行せず、変更をワーキングツリーに残す
- **GIVEN** implementer が複数タスクを順次実行する場合 **WHEN** 各タスクが完了する **THEN** いずれのタスク完了時にもコミットしない

#### Error Scenarios

- **GIVEN** implementer がタスク実行中にエラーで中断した場合 **WHEN** 途中までの変更がワーキングツリーに残っている **THEN** ワーキングツリーの既存の変更はそのまま残り、implementer は再実行時に既存の変更済みファイルを検出した上で追加の変更を行う

### Requirement: REQ-002 Spec Interpretation Log の拡充

implementer は Spec Interpretation Log に以下の情報を記録しなければならない（SHALL）:
1. 仕様解釈（既存: TDD 開始前に記述）
2. 変更ファイル一覧（新規: TDD 完了後に事後追記）
3. 実装判断の理由の強化（新規: 却下した代替案と根拠を含む）

#### Happy Path Scenarios

- **GIVEN** implementer がタスクの仕様解釈を完了した **WHEN** Spec Interpretation Log を作成する **THEN** 「対象要件」「実装判断」「必須チェック項目」「ギャップ検出」セクションを記述する（既存動作）
- **GIVEN** implementer が TDD 実装を完了した **WHEN** タスク完了処理を行う **THEN** Spec Interpretation Log に「変更ファイル一覧」セクションを追記し、作成・修正・削除したファイルをそれぞれリストアップする
- **GIVEN** implementer が実装方針を決定した **WHEN** 実装判断を記録する **THEN** 「採用した方針」「却下した代替案とその理由」「仕様の曖昧性への対処」を含める

#### Error Scenarios

- **GIVEN** implementer がタスク実行中にエラーで中断した場合 **WHEN** Spec Interpretation Log が途中までしか記述されていない **THEN** 変更ファイル一覧セクションが未追記の状態でも、仕様解釈セクションは残っている

#### Boundary Scenarios

- **GIVEN** タスクがファイル変更を伴わない場合（例: 調査のみのタスク） **WHEN** 変更ファイル一覧を記述する **THEN** 「変更なし」と明記する
- **GIVEN** タスクが非常に多数のファイル（50ファイル以上等）を変更した場合 **WHEN** 変更ファイル一覧を記述する **THEN** 全ファイルを列挙する（上限なし）
- **GIVEN** 仕様が一意に実装方針を指定しており却下した代替案が存在しない場合 **WHEN** 実装判断を記録する **THEN** 「代替案なし -- 仕様が一意に指定」と明記する

### Requirement: REQ-003 review-summary.md の新設

`/review` コマンド実行時に `openspec/changes/<name>/reviews/review-summary.md` を生成しなければならない（SHALL）。review-aggregator の統合結果をベースに、レビュー指摘と修正内容を1ファイルにまとめる。`/review` コマンドの Main Agent がファイルの生成と修正内容の追記を担当する。

review-summary.md のテンプレート構造:

```markdown
# Review Summary: [change-name]

## レビュー実施情報
- 実施日: [日付]
- 対象レビュアー: [実行されたレビュアー一覧]
- 失敗したレビュアー: [あれば]

## 指摘一覧

### [カテゴリ: Security / Performance / Architecture / Type Safety / etc.]

#### 指摘 1: [タイトル]
- **レビュアー**: [レビュアー名]
- **優先度**: Critical / High / Medium / Low
- **対象ファイル**: [ファイルパス]
- **指摘内容**: [詳細]
- **推奨修正**: [修正案]

## 修正内容

### 修正 1: [指摘1への対応]
- **対応**: 修正済み / スコープ外 / 次回対応
- **変更内容**: [何をどう修正したか]
- **変更ファイル**: [修正したファイルパス]
```

#### Happy Path Scenarios

- **GIVEN** `/review` コマンドが実行され、各レビュアーの分析が完了した **WHEN** review-aggregator が統合レポートを生成した **THEN** `/review` コマンドの Main Agent が `openspec/changes/<name>/reviews/review-summary.md` に上記テンプレートに従ってレポートを書き出す
- **GIVEN** review-summary.md が生成された **WHEN** `/review` コマンド内の自動修正（P1 Critical/High）が実施された **THEN** `/review` コマンドの Main Agent が「修正内容」セクションに対応内容を追記する（ユーザーの手動修正の追記はスコープ外）

#### Error Scenarios

- **GIVEN** `/review` コマンド実行時にアクティブな変更が特定できない場合 **WHEN** review-summary.md の出力先を決定する **THEN** エラーメッセージを表示し、change-name の指定を求める
- **GIVEN** レビュアーの一部が失敗した場合 **WHEN** review-aggregator が統合レポートを生成する **THEN** 成功したレビュアーの結果のみで review-summary.md を生成し、「失敗したレビュアー」に明記する
- **GIVEN** `reviews/` ディレクトリが存在しない場合 **WHEN** review-summary.md を書き出す **THEN** ディレクトリを自動作成してからファイルを生成する

#### Boundary Scenarios

- **GIVEN** 全レビュアーが成功し、指摘件数が0件の場合 **WHEN** review-summary.md を生成する **THEN** 「指摘なし」の review-summary.md を生成する（テンプレートの指摘一覧セクションに「指摘なし」と記載）
- **GIVEN** review-summary.md が既に存在する状態で `/review` が再実行された **WHEN** review-summary.md を生成する **THEN** 既存ファイルを上書きする

### Requirement: REQ-004 interpretations / reviews のコミット除外ルール

Forge のコミットルールとして、`openspec/changes/*/interpretations/` と `openspec/changes/*/reviews/` 配下のファイルを `git add` の対象に含めてはならない（SHALL NOT）。このルールは implementer の行動規範、`/commit` コマンド、および CLAUDE.md に記載する。`/commit` コマンドの「0件ステージ時の自動 `git add`」動作においても、これらのディレクトリを除外しなければならない（SHALL）。

#### Happy Path Scenarios

- **GIVEN** ユーザーがコミットを指示した **WHEN** `git add` でファイルをステージングする **THEN** `interpretations/` と `reviews/` 配下のファイルはステージング対象に含めない
- **GIVEN** `/commit` コマンドが実行され、ステージング済みファイルが0件の場合 **WHEN** 自動 `git add` で変更ファイルをステージングする **THEN** `openspec/changes/*/interpretations/` と `openspec/changes/*/reviews/` 配下のファイルを除外してステージングする

#### Error Scenarios

- **GIVEN** ユーザーが `git add .` や `git add -A` を手動で実行した場合 **WHEN** interpretations / reviews がステージングされる **THEN** Forge は追加のアクションを取らない（警告表示・自動除外なし）。手動での Git 操作は Forge のルール範囲外である

### Requirement: REQ-005 /compound の学習ソース変更

`/compound` コマンドは以下のファイルを学習ソースとして使用しなければならない（SHALL）:
1. `proposal.md` -- 変更の意図
2. `design.md` -- 設計判断
3. `interpretations/<task>.md` -- 各タスクの判断ログ + 変更ファイル一覧
4. `reviews/review-summary.md` -- レビュー指摘と修正内容（存在する場合）

#### Happy Path Scenarios

- **GIVEN** `/compound` コマンドが実行された **WHEN** 学習ソースを読み込む **THEN** proposal.md, design.md, 全 interpretations ファイル, review-summary.md を読み込んで振り返りを行う

#### Error Scenarios

- **GIVEN** `/review` が実行されなかったため review-summary.md が存在しない **WHEN** `/compound` が学習ソースを読み込む **THEN** review-summary.md をスキップし、存在するファイルのみで学習を実行する
- **GIVEN** interpretations ファイルが1つも存在しない **WHEN** `/compound` が学習ソースを読み込む **THEN** proposal.md と design.md のみで学習を実行し、interpretations が欠落している旨を記録する
- **GIVEN** proposal.md が存在しない **WHEN** `/compound` が学習ソースを読み込む **THEN** 存在するファイルのみで学習を実行し、proposal.md が欠落している旨を記録する
- **GIVEN** design.md が存在しない **WHEN** `/compound` が学習ソースを読み込む **THEN** 存在するファイルのみで学習を実行し、design.md が欠落している旨を記録する

### Requirement: REQ-006 /compound 実行時の一時ファイル自動削除

`/compound` コマンドは学習抽出が正常に完了した後に限り、`interpretations/` と `reviews/` ディレクトリを自動削除しなければならない（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `/compound` が学習抽出を正常に完了した **WHEN** アーカイブ処理を実行する **THEN** `openspec/changes/<name>/interpretations/` と `openspec/changes/<name>/reviews/` ディレクトリを削除する

#### Error Scenarios

- **GIVEN** interpretations / reviews ディレクトリが存在しない場合 **WHEN** 削除処理を実行する **THEN** エラーにせず、スキップする
- **GIVEN** `/compound` の学習抽出が途中でエラーにより中断した場合 **WHEN** クリーンアップステップに到達していない **THEN** interpretations / reviews はそのまま残す（次回の `/compound` 実行で再利用可能）

#### Boundary Scenarios

- **GIVEN** interpretations ディレクトリは存在するが中身が空の場合 **WHEN** 削除処理を実行する **THEN** 空ディレクトリを削除する

### Requirement: REQ-007 /ship パイプラインのコミットなし対応

`/ship` コマンドのパイプライン内ではコミットを実行しない（SHALL NOT）。パイプライン完了後にユーザーにコミットを促す。

#### Happy Path Scenarios

- **GIVEN** `/ship` パイプラインが `/compound` まで完了した **WHEN** 完了レポートを表示する **THEN** `git diff --stat` で変更概要を表示し、「変更内容を確認の上、コミットしてください」とユーザーに促す

#### Error Scenarios

- **GIVEN** `/ship` パイプラインが途中で失敗した場合 **WHEN** エラーレポートを表示する **THEN** 未コミットの変更がワーキングツリーに残っている旨を明記し、`git diff --stat` で変更概要を表示する

### Requirement: REQ-008 /implement 完了サマリーの変更

`/implement` コマンドおよび implement-orchestrator の完了サマリーから「コミット一覧」を削除し、`git diff --stat` による変更ファイル一覧に置き換えなければならない（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `/implement` の全タスクが完了した **WHEN** 完了サマリーを表示する **THEN** `git diff --stat` の結果を表示し、変更されたファイルの概要をユーザーに提示する

#### Error Scenarios

- **GIVEN** `git diff --stat` の実行に失敗した場合（Git リポジトリではない環境等） **WHEN** 完了サマリーを表示する **THEN** エラーメッセージとともに、手動で `git status` を実行して確認するよう案内する

#### Boundary Scenarios

- **GIVEN** ワーキングツリーに変更がない場合 **WHEN** 完了サマリーを表示する **THEN** 「変更なし」と表示する
