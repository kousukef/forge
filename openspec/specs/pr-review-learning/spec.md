# pr-review-learning スペック

## Requirements

### Requirement: REQ-001 学びの自動抽出・記録（Step 7）

commands/handle-pr-review.md の Step 6（スレッド返信）の後に Step 7「学習ループ」を追加する。レビュー指摘の修正内容から学びを自動抽出し、プロジェクト側の学び記録先に記録する SHALL。`--no-learn` フラグが指定されている場合はスキップする SHALL。本ステップは外部PRレビュー（人間/bot）の指摘に対する学習ループであり、`/review` の学習ループ（Forge LLMレビュー指摘に対するもの）とは異なる。記録先はプロジェクト側であり、Forge 本体は変更しない。

#### Happy Path Scenarios

- **GIVEN** handle-pr-review.md に Step 7「学習ループ」が定義されている **WHEN** Step 7 の内容を確認する **THEN** Step 6 完了後に (1) レビュー指摘と修正内容を分析し (2) 指摘パターンを種別分類し (3) 学びを抽出して記録先に保存し (4) 記録内容のサマリーを出力するワークフローが記述されている
- **GIVEN** `--no-learn` フラグが指定されていない **WHEN** Step 6 が完了する **THEN** Step 7 が実行され、学びが自動抽出・記録され、記録内容のサマリーがターミナルに出力される
- **GIVEN** プロジェクト側に学びの記録先が存在する **WHEN** 学びの記録を実行する **THEN** 既存の記録先ディレクトリに学びファイルが追加される

#### Error Scenarios

- **GIVEN** プロジェクト側に学びの記録先が存在しない **WHEN** Step 7 が実行される **THEN** `docs/compound/` ディレクトリを提案し、ユーザー確認後に作成して記録する。ユーザーが拒否した場合は代替パスを尋ね、代替パスも指定されない場合は記録をスキップし、スキップした旨を出力する
- **GIVEN** レビュー指摘がゼロ件だった（質問のみ等） **WHEN** Step 7 が実行される **THEN** 「記録可能な学びが抽出されませんでした」と出力し、Step 7 を正常終了する
- **GIVEN** 学びの記録中にファイル書き込みエラーが発生した **WHEN** 記録処理が失敗する **THEN** エラー内容を出力し、Step 7 を終了する。学びの記録失敗はコマンド全体をブロックしない

#### Boundary Scenarios

- **GIVEN** レビュー指摘が1件のみ **WHEN** Step 7 が実行される **THEN** その1件の指摘から学びを抽出して記録する
- **GIVEN** レビュー指摘が10件以上 **WHEN** Step 7 が実行される **THEN** 全指摘を分析し、類似パターンをグルーピングして学びを抽出する

#### Non-Functional Requirements

- **RELIABILITY**: 学びの記録失敗は /handle-pr-review 全体をブロックしない。エラー出力のみで正常終了する
- **COMPATIBILITY**: Step 7 の追加は既存の Step 1-6 の動作を変更しない
- **UX_PROGRESS**: Step 7 の各サブステップ開始時に進捗メッセージを出力する（例: 「[7a] レビュー指摘を分析中...」「[7b] 学びを記録中...」「[7c] レビュアー更新を提案中...」「[7d] コミット判断...」）

### Requirement: REQ-002 指摘パターンの種別分類

Step 7 において、レビュー指摘を以下の種別に分類する SHALL: コーディングパターン、設計・アーキテクチャ、テスト不足、ドキュメント不整合、セキュリティ、パフォーマンス、その他。分類結果は学び記録のメタデータとして含める SHALL。

#### Happy Path Scenarios

- **GIVEN** Step 7 でレビュー指摘を分析する **WHEN** 指摘パターンの種別を確認する **THEN** 各指摘がコーディングパターン / 設計・アーキテクチャ / テスト不足 / ドキュメント不整合 / セキュリティ / パフォーマンス / その他 のいずれかに分類されている
- **GIVEN** 学びが記録される **WHEN** 記録のメタデータを確認する **THEN** 指摘パターンの種別がメタデータに含まれている

#### Error Scenarios

- **GIVEN** 指摘内容が曖昧で種別分類が困難 **WHEN** 分類を試行する **THEN** 「その他」に分類し、指摘の原文を学び記録に含める

#### Non-Functional Requirements

- **COMPATIBILITY**: 種別分類は compound.md の Learning Router 分類テーブルとの親和性を考慮する。ただし Learning Router の閾値ルールは適用しない（proposal.md のスコープ外）

### Requirement: REQ-003 学び記録先の動的判断

Step 7 において、学びの記録先をプロジェクトの既存構造に合わせて動的に判断する SHALL。固定パスを強制しない SHALL。

#### Happy Path Scenarios

- **GIVEN** プロジェクトに `docs/compound/` ディレクトリが存在する **WHEN** 記録先を判断する **THEN** `docs/compound/` を記録先として使用する
- **GIVEN** プロジェクトに `docs/learnings/` や `.claude/learnings/` 等の学び記録用ディレクトリが存在する **WHEN** 記録先を判断する **THEN** 既存のディレクトリを記録先として使用する
- **GIVEN** 記録先が決定された **WHEN** 学びファイルを作成する **THEN** `YYYY-MM-DD-pr-<pr-number>-learnings.md` 形式のファイル名で記録する

#### Error Scenarios

- **GIVEN** プロジェクトに学び記録用ディレクトリが存在しない **WHEN** 記録先を判断する **THEN** `docs/compound/` ディレクトリの作成を提案し、ユーザー確認後に作成する。ユーザーが拒否した場合は代替パスを尋ねる。代替パスも指定されない場合は記録をスキップする

#### Boundary Scenarios

- **GIVEN** プロジェクトに学び記録用ディレクトリの候補が複数存在する **WHEN** 記録先を判断する **THEN** 最も適切な候補を提示し、ユーザーに確認する
- **GIVEN** 記録先に `YYYY-MM-DD-pr-<pr-number>-learnings.md` が既に存在する **WHEN** 学びを記録する **THEN** 既存ファイルに追記するか新規ファイル（サフィックス付き）を作成するかをユーザーに確認する

#### Non-Functional Requirements

- **DATA_INTEGRITY**: 既存のディレクトリ構造を破壊しない。新規ディレクトリ作成は必ずユーザー確認を得る。既存の学びファイルを上書きしない

### Requirement: REQ-004 レビュアー定義の更新提案

Step 7 において、レビュー指摘に基づいてプロジェクト側のレビュアー定義の更新（既存更新 or 新規作成）を提案する SHALL。提案はターミナルに表示し、ユーザーが承認/拒否を選択できる SHALL。

#### Happy Path Scenarios

- **GIVEN** Step 7 で指摘パターンが抽出された **WHEN** レビュアー更新の提案を確認する **THEN** (1) 既存レビュアーで対応可能な場合は既存レビュアーへのチェック項目追加を提案し (2) 新しい観点が必要な場合は新規レビュアーの作成を提案する
- **GIVEN** レビュアー更新提案がターミナルに表示される **WHEN** ユーザーが提案を確認する **THEN** 各提案に対して承認/拒否を選択でき、承認した提案のみ適用される
- **GIVEN** 既存レビュアーの更新が承認された **WHEN** 更新を適用する **THEN** プロジェクトの `agents/review/` 配下の該当レビュアーファイルにチェック項目が追加される

#### Error Scenarios

- **GIVEN** プロジェクトに `agents/review/` ディレクトリが存在しない **WHEN** レビュアー更新を提案する **THEN** ディレクトリの作成を含めた提案を行い、ユーザー確認を得る
- **GIVEN** ユーザーが全ての提案を拒否した **WHEN** 提案フローが完了する **THEN** 「レビュアー更新はスキップされました」と出力し、Step 7 を正常終了する
- **GIVEN** レビュアーファイルの更新中にエラーが発生した **WHEN** 更新処理が失敗する **THEN** エラー内容を出力し、該当提案をスキップして次の提案に進む

#### Boundary Scenarios

- **GIVEN** 提案対象のレビュアーが1件のみ **WHEN** 提案を表示する **THEN** その1件の提案が表示され、承認/拒否を選択できる
- **GIVEN** 指摘パターンからレビュアー更新提案の候補が4件以上生成された **WHEN** 提案を表示する **THEN** 優先度の高い順に上位3件のみを提案し、残りの候補は「他 N 件の提案候補があります」と表示する

#### Non-Functional Requirements

- **DATA_INTEGRITY**: レビュアーファイルの既存内容を破壊しない。チェック項目の追加は既存構造を維持した上で行う
- **ERROR_UX**: 提案内容は具体的に表示する（変更前後の差分、または新規ファイルの内容）
- **UX**: レビュアー更新提案は最大3件までとし、優先度の高い順に提示する

### Requirement: REQ-005 新規レビュアー作成テンプレート

REQ-004 で新規レビュアーの作成が提案される場合、プロジェクトの既存レビュアーのパターンに準拠したテンプレートを使用する SHALL。既存レビュアーが存在しない場合は Forge 標準のレビュアーテンプレートを使用する SHALL。

#### Happy Path Scenarios

- **GIVEN** 新規レビュアーの作成が提案される **WHEN** テンプレートの形式を確認する **THEN** プロジェクトの `agents/review/` 配下の既存レビュアーの frontmatter パターン（name, description, model, tools, skills）に準拠したテンプレートが使用されている
- **GIVEN** プロジェクトに既存レビュアーが存在する **WHEN** 新規レビュアーのテンプレートを生成する **THEN** 既存レビュアーの構造（セクション構成、出力形式等）を踏襲したテンプレートが生成される

#### Error Scenarios

- **GIVEN** プロジェクトに既存レビュアーが存在しない **WHEN** 新規レビュアーのテンプレートを生成する **THEN** Forge 標準のレビュアーテンプレート（`agents/review/doc-sync-reviewer.md` 相当の構造）をベースにしたテンプレートが生成される

#### Non-Functional Requirements

- **COMPATIBILITY**: 生成されるレビュアー定義は review-aggregator の入力仕様（指摘ID、優先度、確信度、対象ファイル、指摘内容、推奨修正、関連仕様）に準拠する

### Requirement: REQ-006 `--no-learn` フラグによるスキップと `argument-hint` の追加

handle-pr-review.md の frontmatter に `argument-hint: "<pr-number> [--no-learn]"` を追加する SHALL。`--no-learn` が `$ARGUMENTS` に含まれている場合、Step 7 をスキップし、スキップした旨のメッセージを出力する SHALL。デフォルト（フラグ未指定）では Step 7 を実行する SHALL。`--no-learn` の検出は `commit.md` の `--no-verify` パターンに準拠し、Step 7 冒頭で `$ARGUMENTS` から判定する SHALL。

#### Happy Path Scenarios

- **GIVEN** handle-pr-review.md の frontmatter に `argument-hint: "<pr-number> [--no-learn]"` が定義されている **WHEN** frontmatter を確認する **THEN** `argument-hint` にPR番号と `--no-learn` フラグのヒントが含まれている
- **GIVEN** `--no-learn` フラグが指定されている **WHEN** Step 6 が完了する **THEN** 「学習ループをスキップしました（--no-learn）」と出力し、Step 7 を実行しない
- **GIVEN** `--no-learn` フラグが指定されていない **WHEN** Step 6 が完了する **THEN** Step 7 が通常通り実行される

#### Error Scenarios

- **GIVEN** `--no-learn` フラグと他の不明なフラグが同時に指定された **WHEN** 引数を解析する **THEN** `--no-learn` は正常に処理し、不明なフラグは無視する（既存の引数解析パターンに従う）

#### Non-Functional Requirements

- **COMPATIBILITY**: `--no-learn` フラグと `argument-hint` の追加は既存の `pr` 引数（必須）および既存の `arguments` 配列の動作を変更しない

### Requirement: REQ-007 学び記録のコミット判断

Step 7 で学びの記録とレビュアー更新が完了した後、コミット方法（同一PRに含める / 別コミットとする / コミットしない）をユーザーに確認する SHALL。

#### Happy Path Scenarios

- **GIVEN** Step 7 で学びの記録とレビュアー更新が完了した **WHEN** コミット判断を確認する **THEN** ユーザーに以下の選択肢を提示する: (1) 現在のPRに追加コミットとして含める (2) コミットせずワーキングツリーに残す
- **GIVEN** ユーザーがPRへの追加コミットを選択した **WHEN** コミットを実行する **THEN** `docs(<scope>): PRレビューからの学びを記録` 形式のコミットメッセージでコミットし、`git push` する

#### Error Scenarios

- **GIVEN** Step 7 で学び記録のみ完了しレビュアー更新は拒否された **WHEN** コミット判断を確認する **THEN** 学び記録ファイルのみを対象としたコミット判断を提示する
- **GIVEN** Step 7 で記録もレビュアー更新も行われなかった **WHEN** Step 7 が完了する **THEN** コミット判断の提示をスキップする
- **GIVEN** ユーザーがPRへの追加コミットを選択した **WHEN** `git push` が失敗する **THEN** エラー内容を出力し、「手動で push してください」とリカバリ手順を案内する。コミット自体はローカルに残す

#### Non-Functional Requirements

- **DATA_INTEGRITY**: コミット前に `git diff` で変更内容を表示し、ユーザーが確認できるようにする

## ファイル間整合性テーブル

| 概念 | 参照元ファイル | 整合性ポイント |
|---|---|---|
| Step 7 の位置 | commands/handle-pr-review.md | Step 6 の後、Workflow Summary の前に配置されること |
| `--no-learn` フラグ | commands/handle-pr-review.md frontmatter `argument-hint`、Step 7 内 | `argument-hint` のヒント文字列と Step 7 のスキップ条件が一致すること |
| `argument-hint` | commands/handle-pr-review.md frontmatter | `"<pr-number> [--no-learn]"` 形式で、既存の `arguments` 配列と矛盾しないこと |
| `/review` Step 7 との区別 | commands/handle-pr-review.md Step 7 | 外部PRレビュー指摘 vs Forge LLMレビュー指摘の区別が明記されていること。記録先がプロジェクト側であることが明記されていること |
| 学び記録先の判断ロジック | commands/handle-pr-review.md Step 7 | compound.md の学び記録形式との親和性（category, severity, tags 等のメタデータ）。Forge 本体には記録しないこと |
| レビュアー定義の形式 | commands/handle-pr-review.md Step 7 | agents/review/ 配下の既存レビュアーの frontmatter パターンとの一致。review-aggregator 入力仕様への準拠 |
| コミットメッセージ形式 | commands/handle-pr-review.md Step 7 | `<type>(<scope>): <日本語の説明>` 形式に従うこと |
