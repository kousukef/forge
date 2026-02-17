# Command Args スペック

## Requirements

### Requirement: argument-hint フロントマター
各コマンドの YAML フロントマターに `argument-hint` フィールドを追加し、タブ補完時に期待される引数の形式を表示する SHALL。

#### Scenario: spec コマンドの argument-hint
- **GIVEN** ユーザーがターミナルで `/spec` と入力している
- **WHEN** タブ補完が発動する
- **THEN** `<change-name> [--teams|--agents]` がヒントとして表示される

#### Scenario: implement コマンドの argument-hint
- **GIVEN** ユーザーがターミナルで `/implement` と入力している
- **WHEN** タブ補完が発動する
- **THEN** `<change-name> [--teams|--agents]` がヒントとして表示される

#### Scenario: review コマンドの argument-hint
- **GIVEN** ユーザーがターミナルで `/review` と入力している
- **WHEN** タブ補完が発動する
- **THEN** `<change-name>` がヒントとして表示される

#### Scenario: compound コマンドの argument-hint
- **GIVEN** ユーザーがターミナルで `/compound` と入力している
- **WHEN** タブ補完が発動する
- **THEN** `<change-name>` がヒントとして表示される

#### Scenario: brainstorm コマンドの argument-hint
- **GIVEN** ユーザーがターミナルで `/brainstorm` と入力している
- **WHEN** タブ補完が発動する
- **THEN** `<topic>` がヒントとして表示される

### Requirement: モードフラグ引数
spec.md と implement.md は `--teams` / `--agents` フラグを $ARGUMENTS から解析し、Agent Teams モードまたは Sub Agents モードを選択する SHALL。フラグ省略時はデフォルトモード（Sub Agents）を使用する SHALL。

#### Scenario: --teams フラグ指定
- **GIVEN** ユーザーが `/spec add-oauth-login --teams` を実行する
- **WHEN** コマンドが $ARGUMENTS を解析する
- **THEN** change-name = `add-oauth-login`、mode = `teams` と判定し、AskUserQuestion によるモード選択を行わない

#### Scenario: --agents フラグ指定
- **GIVEN** ユーザーが `/implement add-oauth-login --agents` を実行する
- **WHEN** コマンドが $ARGUMENTS を解析する
- **THEN** change-name = `add-oauth-login`、mode = `agents` と判定し、AskUserQuestion によるモード選択を行わない

#### Scenario: フラグ省略
- **GIVEN** ユーザーが `/spec add-oauth-login` を実行する（フラグなし）
- **WHEN** コマンドが $ARGUMENTS を解析する
- **THEN** change-name = `add-oauth-login`、mode = デフォルト（`agents`）と判定する

### Requirement: change-name 引数
spec, implement, review, compound コマンドは $ARGUMENTS から change-name を解析する SHALL。省略時は `openspec/changes/` 内のアクティブ変更を自動検出する SHALL。

#### Scenario: change-name 指定
- **GIVEN** ユーザーが `/review add-oauth-login` を実行する
- **WHEN** コマンドが $ARGUMENTS を解析する
- **THEN** `openspec/changes/add-oauth-login/` を対象として処理する

#### Scenario: change-name 省略（アクティブ変更が1つ）
- **GIVEN** `openspec/changes/` に `archive/` 以外のディレクトリが `add-oauth-login` のみ存在する
- **WHEN** ユーザーが `/implement` を実行する（引数なし）
- **THEN** `add-oauth-login` を自動選択する

#### Scenario: change-name 省略（アクティブ変更が複数）
- **GIVEN** `openspec/changes/` に `archive/` 以外のディレクトリが複数存在する
- **WHEN** ユーザーが `/compound` を実行する（引数なし）
- **THEN** AskUserQuestion で変更名の選択を求める

#### Scenario: change-name 省略（アクティブ変更がゼロ）
- **GIVEN** `openspec/changes/` に `archive/` 以外のディレクトリが存在しない
- **WHEN** ユーザーが `/spec` を実行する（引数なし）
- **THEN** エラーメッセージを表示し、先に `/brainstorm` を実行するよう案内する

### Requirement: brainstorm topic 引数
brainstorm コマンドは $ARGUMENTS からトピックを受け取る MAY。指定時はトピックを初期コンテキストとして使用し、省略時は従来通りユーザーに質問する SHALL。

#### Scenario: topic 指定
- **GIVEN** ユーザーが `/brainstorm OAuth ログイン追加` を実行する
- **WHEN** brainstorm コマンドが開始する
- **THEN** 「OAuth ログイン追加」をトピックとして対話を開始する

#### Scenario: topic 省略
- **GIVEN** ユーザーが `/brainstorm` を実行する（引数なし）
- **WHEN** brainstorm コマンドが開始する
- **THEN** 従来通り「何を作りたいですか？」と質問する

### Requirement: Skill Activation は CLAUDE.md に統一
各コマンドに個別の Skill Activation セクションを持たない SHALL。CLAUDE.md の「Skill Orchestration（1% ルール）」が全エージェントに自動ロードされ、フェーズ・ドメインに応じたスキルが自動適用される。

#### Scenario: CLAUDE.md によるスキル自動適用
- **GIVEN** ユーザーが任意のコマンドを実行する
- **WHEN** Main Agent および Sub Agent/Teammate が起動する
- **THEN** CLAUDE.md の「Skill Orchestration（1% ルール）」に従いスキルが自動適用される（コマンド側の明示的指示は不要）
