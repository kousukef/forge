# pre-push-verification デルタスペック

## ADDED Requirements

### Requirement: REQ-001 検証コマンドの情報源と取得

`/handle-pr-review` コマンドは、コミット前検証で使用するコマンド（lint, format, type-check, test 等）を以下の優先順で取得する（SHALL）:

1. `openspec/project.md` の検証コマンド定義
2. `CLAUDE.md` の検証コマンド定義
3. フォールバック: プロジェクト設定ファイル（`package.json` の scripts, `Makefile`, `pyproject.toml` 等）からの動的検出

取得したコマンドは format → lint → type-check → test の順序で実行する（SHALL）。ドメイン固有のツール名（`eslint`, `prettier` 等）をハードコードしない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `openspec/project.md` に `lint: npm run lint`, `test: npm test` が定義されている **WHEN** 検証コマンドの取得が実行される **THEN** `project.md` から定義されたコマンドが取得され、format → lint → type-check → test の順序で実行キューに追加される（定義のないカテゴリはスキップ）
- **GIVEN** `openspec/project.md` が存在せず、`CLAUDE.md` に検証コマンドの記述がある **WHEN** 検証コマンドの取得が実行される **THEN** `CLAUDE.md` から検証コマンドが取得される

#### Error Scenarios
- **GIVEN** `openspec/project.md` も `CLAUDE.md` も検証コマンドを含まず、プロジェクト設定ファイルも存在しない **WHEN** 検証コマンドの取得が実行される **THEN** 「検証コマンドが検出できませんでした。`/setup` を実行して project.md を生成するか、手動で検証コマンドを設定してください」とエラーメッセージを出力し、検証ステップをスキップせずコマンド全体を中断する（SHALL）
- **GIVEN** `openspec/project.md` に定義された検証コマンドが存在するが、実行時にコマンドが見つからない（`command not found`） **WHEN** 検証コマンドが実行される **THEN** 該当コマンドのエラーを出力し、残りの検証コマンドは実行せず検証失敗として扱う

#### Boundary Scenarios
- **GIVEN** `openspec/project.md` と `CLAUDE.md` の両方に検証コマンドが定義されている **WHEN** 検証コマンドの取得が実行される **THEN** `openspec/project.md` の定義が優先され、`CLAUDE.md` の定義は無視される
- **GIVEN** `openspec/project.md` に lint のみ定義されており、test は未定義 **WHEN** 検証コマンドの取得が実行される **THEN** lint のみが実行キューに追加され、未定義のカテゴリはスキップされる
- **GIVEN** `openspec/project.md` も `CLAUDE.md` も検証コマンドを含まないが、`package.json` の `scripts` に `lint`, `test` が定義されている **WHEN** 動的検出が実行される **THEN** scripts のキー名から format/lint/type-check/test に該当するコマンドを推論し（キーワードマッチ: `format`/`prettier` → format、`lint`/`eslint` → lint、`check-types`/`typecheck`/`tsc` → type-check、`test` → test）、実行キューに追加する
- **GIVEN** `openspec/project.md` に lint セクションが存在するが値が空文字である **WHEN** 検証コマンドの取得が実行される **THEN** 該当カテゴリを「未定義」として扱い、次の情報源（`CLAUDE.md`）にフォールバックする

#### Non-Functional Requirements
- **RELIABILITY**: 検証コマンド取得のフォールバックチェーンは3段階（project.md → CLAUDE.md → 動的検出）で、いずれも失敗した場合のみ中断する
- **COMPATIBILITY**: 既存の REQ-007（remove-domain-content）に準拠し、ツール名をハードコードしない

---

### Requirement: REQ-002 検証ステップの挿入位置とフロー

`/handle-pr-review` コマンドの Step 3（修正実装）と Step 4（コミット）の間に、新しい Step「コミット前検証」を挿入する（SHALL）。検証が全て成功した場合のみ Step 4（コミット）に進む（SHALL）。

#### Happy Path Scenarios
- **GIVEN** Step 3 で修正が実装され、検証コマンドが取得済みである **WHEN** コミット前検証ステップが実行される **THEN** 全検証コマンドが format → lint → type-check → test の順で実行され、全て成功した場合に Step 4（コミット）に進む
- **GIVEN** format コマンドが定義されている **WHEN** format コマンドが実行される **THEN** format は `--fix` モード（自動修正）で実行され、修正があった場合は自動的にステージングされる

#### Error Scenarios
- **GIVEN** lint コマンドが実行され失敗した **WHEN** 自動修正フローに入る **THEN** REQ-003 の自動修正フローが開始される（検証は中断されない）
- **GIVEN** 検証コマンドの実行中にタイムアウトが発生した **WHEN** タイムアウトを検知する **THEN** 該当コマンドを検証失敗として扱い、自動修正フローに入る。タイムアウトの閾値は実装に委譲する（Type 2 判断: プロジェクトの規模やテストスイートの実行時間に依存するため、コマンド定義では固定値を規定しない）

#### Non-Functional Requirements
- **COMPATIBILITY**: 既存の Step 番号体系を維持する。新ステップは「Step 3.5」ではなく、Step 3 と Step 4 の間に独立した Step として挿入し、後続 Step の番号を繰り下げる

---

### Requirement: REQ-003 検証失敗時の自動修正フロー

検証コマンドが失敗した場合、Claude は原因を推論し修正を試行する（SHALL）。修正試行は最大3回まで行う（SHALL）。

自動修正は2段階で行う:
1. **auto-fix 可能なコマンド**（format, lint の `--fix` オプション）: ツールの auto-fix を実行し、再検証する
2. **auto-fix 不可能な失敗**（test 失敗、型エラー等）: Claude がエラー出力を分析し、原因を推論してから修正を実装する

#### Happy Path Scenarios
- **GIVEN** lint コマンドが失敗し、`--fix` オプションが利用可能である **WHEN** 自動修正フローが開始される **THEN** まず `--fix` オプション付きで再実行し、修正後に検証を再実行する。成功した場合は次の検証コマンドに進む
- **GIVEN** test コマンドが失敗した **WHEN** 自動修正フローが開始される **THEN** Claude はテスト失敗のエラー出力を分析し、「なぜ失敗しているか」を推論した上で修正を実装し、検証を再実行する

#### Error Scenarios
- **GIVEN** 自動修正を3回試行したが検証が依然として失敗している **WHEN** 3回目の修正後に再検証が失敗する **THEN** 「自動修正の上限（3回）に達しました。以下のエラーが解消されていません: [エラー概要]」と出力し、コマンドを中断する（SHALL）。コミットもプッシュも行わない
- **GIVEN** Claude が修正を試みたが、修正により新たなエラーが発生した **WHEN** 再検証で以前とは異なるエラーが検出される **THEN** 新たなエラーも含めてリトライ回数にカウントし、3回の上限内で修正を試行する

#### Boundary Scenarios
- **GIVEN** format の auto-fix で全問題が解消された **WHEN** auto-fix 後に再検証が成功する **THEN** リトライ回数にカウントせず、次の検証コマンドに進む（auto-fix 成功は「失敗→修正」ではなく「正常な自動修正」として扱う）
- **GIVEN** リトライ回数が2回目で、2つの異なる検証コマンドが失敗している **WHEN** 修正を試行する **THEN** リトライ回数は検証フロー全体で共有し（個別コマンドごとではない）、残り1回の修正試行で全エラーを解消する必要がある
- **GIVEN** lint `--fix` が部分的に成功し、一部のエラーのみ解消された **WHEN** auto-fix 後に再検証が失敗する **THEN** `--fix` で解消されなかったエラーのみを対象に Claude が原因推論・修正を実装し、リトライ回数にカウントする（auto-fix で解消された分はカウント外）

#### Non-Functional Requirements
- **ERROR_UX**: 修正試行の各ラウンドで「修正試行 N/3: [修正内容の概要]」と進捗を出力する
- **RELIABILITY**: 修正前に必ず「なぜ失敗しているか」を推論し、ブラインド修正（パターンマッチのみの修正）を避ける

---

### Requirement: REQ-004 allowed-tools の拡張

`/handle-pr-review` コマンドの frontmatter `allowed-tools` に、検証コマンド実行用の Bash 権限を追加する（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `commands/handle-pr-review.md` の frontmatter に allowed-tools が定義されている **WHEN** 検証コマンドを実行する必要がある **THEN** `Bash` ツールが検証コマンドの実行に使用できる

#### Error Scenarios
- **GIVEN** allowed-tools に Bash 権限が不足している **WHEN** 検証コマンドの実行を試みる **THEN** ツール権限エラーが発生し、コマンドが中断される

#### Non-Functional Requirements
- **SECURITY**: allowed-tools を汎用 `Bash` に拡張する。検証コマンド以外の用途での Bash 使用はコマンド定義のプロンプトで制限する

---

### Requirement: REQ-005 gate-git-push フックとの責務分離

コミット前検証（本変更）と gate-git-push フック（既存）は補完的に動作する（SHALL）。責務の重複や競合がないことを明確にする。

- コミット前検証（REQ-002）: 検証コマンドの**実行**を行い、失敗時は自動修正を試みる
- gate-git-push フック: push 時のチェックリスト**表示**と force push のブロックを行う

#### Happy Path Scenarios
- **GIVEN** コミット前検証が成功し、コミットが作成された **WHEN** `git push` が実行される **THEN** gate-git-push フックは通常通り動作し、push 前のチェックリストを表示する。コミット前検証とは独立して動作する

#### Error Scenarios
- **GIVEN** コミット前検証が失敗しコマンドが中断された **WHEN** ユーザーが手動で `git push` を試みる **THEN** gate-git-push フックが通常通り動作する（コミット前検証の失敗状態は gate-git-push には伝播しない）

## ファイル間整合性テーブル

| 項目 | ファイル | 確認内容 |
|---|---|---|
| Step 番号の連続性 | `commands/handle-pr-review.md` | 新ステップ挿入後も Step 番号が連続している |
| allowed-tools | `commands/handle-pr-review.md` frontmatter | Bash 権限が追加されている |
| Workflow Summary | `commands/handle-pr-review.md` | 新ステップが反映されている |
| gate-git-push 記述 | `commands/handle-pr-review.md` | フックとの責務分離が注記されている |
| argument-hint | `commands/handle-pr-review.md` frontmatter | 変更なし（`<pr-number> [--no-learn]`） |
