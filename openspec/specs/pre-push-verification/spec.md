# pre-push-verification スペック

## Requirements

### Requirement: REQ-001 検証コマンドの情報源と取得

`/handle-pr-review` コマンドは、コミット前検証で使用するコマンド（lint, format, type-check, test 等）を以下の優先順で取得する（SHALL）:

1. `openspec/project.md` の検証コマンド定義
2. `CLAUDE.md` の検証コマンド定義
3. フォールバック: プロジェクト設定ファイル（`package.json` の scripts, `Makefile`, `pyproject.toml` 等）からの動的検出

取得したコマンドは format → lint → type-check → test の順序で実行する（SHALL）。ドメイン固有のツール名（`eslint`, `prettier` 等）をハードコードしない（SHALL）。

#### Scenario: project.md からの取得
- **GIVEN** `openspec/project.md` に `lint: npm run lint`, `test: npm test` が定義されている
- **WHEN** 検証コマンドの取得が実行される
- **THEN** `project.md` から定義されたコマンドが取得され、format → lint → type-check → test の順序で実行キューに追加される（定義のないカテゴリはスキップ）

#### Scenario: CLAUDE.md フォールバック
- **GIVEN** `openspec/project.md` が存在せず、`CLAUDE.md` に検証コマンドの記述がある
- **WHEN** 検証コマンドの取得が実行される
- **THEN** `CLAUDE.md` から検証コマンドが取得される

#### Scenario: 検出不可時の中断
- **GIVEN** `openspec/project.md` も `CLAUDE.md` も検証コマンドを含まず、プロジェクト設定ファイルも存在しない
- **WHEN** 検証コマンドの取得が実行される
- **THEN** エラーメッセージを出力し、検証ステップをスキップせずコマンド全体を中断する（SHALL）

#### Scenario: command not found
- **GIVEN** `openspec/project.md` に定義された検証コマンドが存在するが、実行時にコマンドが見つからない
- **WHEN** 検証コマンドが実行される
- **THEN** 該当コマンドのエラーを出力し、残りの検証コマンドは実行せず検証失敗として扱う

#### Scenario: 両方定義時の優先順位
- **GIVEN** `openspec/project.md` と `CLAUDE.md` の両方に検証コマンドが定義されている
- **WHEN** 検証コマンドの取得が実行される
- **THEN** `openspec/project.md` の定義が優先され、`CLAUDE.md` の定義は無視される

#### Scenario: 部分定義時のスキップ
- **GIVEN** `openspec/project.md` に lint のみ定義されており、test は未定義
- **WHEN** 検証コマンドの取得が実行される
- **THEN** lint のみが実行キューに追加され、未定義のカテゴリはスキップされる

#### Scenario: 動的検出のキーワードマッチ
- **GIVEN** `openspec/project.md` も `CLAUDE.md` も検証コマンドを含まないが、`package.json` の `scripts` に `lint`, `test` が定義されている
- **WHEN** 動的検出が実行される
- **THEN** scripts のキー名から format/lint/type-check/test に該当するコマンドを推論し、実行キューに追加する

#### Scenario: 空文字値のフォールバック
- **GIVEN** `openspec/project.md` に lint セクションが存在するが値が空文字である
- **WHEN** 検証コマンドの取得が実行される
- **THEN** 該当カテゴリを「未定義」として扱い、次の情報源（`CLAUDE.md`）にフォールバックする

---

### Requirement: REQ-002 検証ステップの挿入位置とフロー

`/handle-pr-review` コマンドの Step 3（修正実装）と Step 4（コミット）の間に、新しい Step「コミット前検証」を挿入する（SHALL）。検証が全て成功した場合のみ Step 4（コミット）に進む（SHALL）。

#### Scenario: 検証成功後にコミットへ進む
- **GIVEN** Step 3 で修正が実装され、検証コマンドが取得済みである
- **WHEN** コミット前検証ステップが実行される
- **THEN** 全検証コマンドが format → lint → type-check → test の順で実行され、全て成功した場合に Step 4（コミット）に進む

#### Scenario: format auto-fix
- **GIVEN** format コマンドが定義されている
- **WHEN** format コマンドが実行される
- **THEN** format は `--fix` モード（自動修正）で実行され、修正があった場合は自動的にステージングされる

#### Scenario: lint 失敗時の自動修正遷移
- **GIVEN** lint コマンドが実行され失敗した
- **WHEN** 自動修正フローに入る
- **THEN** REQ-003 の自動修正フローが開始される

#### Scenario: タイムアウト
- **GIVEN** 検証コマンドの実行中にタイムアウトが発生した
- **WHEN** タイムアウトを検知する
- **THEN** 該当コマンドを検証失敗として扱い、自動修正フローに入る

---

### Requirement: REQ-003 検証失敗時の自動修正フロー

検証コマンドが失敗した場合、Claude は原因を推論し修正を試行する（SHALL）。修正試行は最大3回まで行う（SHALL）。

自動修正は2段階で行う:
1. auto-fix 可能なコマンド（format, lint の `--fix` オプション）: ツールの auto-fix を実行し、再検証する
2. auto-fix 不可能な失敗（test 失敗、型エラー等）: Claude がエラー出力を分析し、原因を推論してから修正を実装する

#### Scenario: auto-fix 成功
- **GIVEN** lint コマンドが失敗し、`--fix` オプションが利用可能である
- **WHEN** 自動修正フローが開始される
- **THEN** まず `--fix` オプション付きで再実行し、修正後に検証を再実行する。成功した場合は次の検証コマンドに進む

#### Scenario: test 失敗の原因推論・修正
- **GIVEN** test コマンドが失敗した
- **WHEN** 自動修正フローが開始される
- **THEN** Claude はテスト失敗のエラー出力を分析し、「なぜ失敗しているか」を推論した上で修正を実装し、検証を再実行する

#### Scenario: 3回リトライ後の中断
- **GIVEN** 自動修正を3回試行したが検証が依然として失敗している
- **WHEN** 3回目の修正後に再検証が失敗する
- **THEN** エラー概要を出力し、コマンドを中断する（SHALL）

#### Scenario: 修正で新エラー発生
- **GIVEN** Claude が修正を試みたが、修正により新たなエラーが発生した
- **WHEN** 再検証で以前とは異なるエラーが検出される
- **THEN** 新たなエラーも含めてリトライ回数にカウントし、3回の上限内で修正を試行する

#### Scenario: auto-fix はリトライカウント外
- **GIVEN** format の auto-fix で全問題が解消された
- **WHEN** auto-fix 後に再検証が成功する
- **THEN** リトライ回数にカウントせず、次の検証コマンドに進む

#### Scenario: リトライ回数は全体共有
- **GIVEN** リトライ回数が2回目で、2つの異なる検証コマンドが失敗している
- **WHEN** 修正を試行する
- **THEN** リトライ回数は検証フロー全体で共有し、残り1回の修正試行で全エラーを解消する必要がある

#### Scenario: 部分 auto-fix 後の手動修正
- **GIVEN** lint `--fix` が部分的に成功し、一部のエラーのみ解消された
- **WHEN** auto-fix 後に再検証が失敗する
- **THEN** `--fix` で解消されなかったエラーのみを対象に Claude が原因推論・修正を実装し、リトライ回数にカウントする

---

### Requirement: REQ-004 allowed-tools の拡張

`/handle-pr-review` コマンドの frontmatter `allowed-tools` に、検証コマンド実行用の Bash 権限を追加する（SHALL）。

#### Scenario: Bash で検証コマンド実行可能
- **GIVEN** `commands/handle-pr-review.md` の frontmatter に allowed-tools が定義されている
- **WHEN** 検証コマンドを実行する必要がある
- **THEN** `Bash` ツールが検証コマンドの実行に使用できる

#### Scenario: 権限不足時のエラー
- **GIVEN** allowed-tools に Bash 権限が不足している
- **WHEN** 検証コマンドの実行を試みる
- **THEN** ツール権限エラーが発生し、コマンドが中断される

---

### Requirement: REQ-005 gate-git-push フックとの責務分離

コミット前検証（本変更）と gate-git-push フック（既存）は補完的に動作する（SHALL）。

- コミット前検証: 検証コマンドの実行を行い、失敗時は自動修正を試みる
- gate-git-push フック: push 時のチェックリスト表示と force push のブロックを行う

#### Scenario: 補完的動作
- **GIVEN** コミット前検証が成功し、コミットが作成された
- **WHEN** `git push` が実行される
- **THEN** gate-git-push フックは通常通り動作し、push 前のチェックリストを表示する。コミット前検証とは独立して動作する

#### Scenario: 検証失敗後の手動 push
- **GIVEN** コミット前検証が失敗しコマンドが中断された
- **WHEN** ユーザーが手動で `git push` を試みる
- **THEN** gate-git-push フックが通常通り動作する（コミット前検証の失敗状態は gate-git-push には伝播しない）
