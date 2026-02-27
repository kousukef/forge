# Workflow Redesign デルタスペック

## ADDED Requirements

### Requirement: Teams vs Sub Agents 切り替え基準
各コマンドは、エージェント間通信が成果物の質を改善し、かつタスクが独立して実行可能な場合に Agent Teams を使用する SHALL。

#### Scenario: /implement で独立タスクが2つ以上ある場合
- **GIVEN** tasks.md に並列実行可能な独立タスクが2つ以上あり
- **WHEN** /implement コマンドを実行し、ユーザーが Teams モードを選択した場合
- **THEN** TeamCreate で実装チームを作成し、各 implementer teammate にタスクを割り当てる

#### Scenario: /implement で依存チェーンのみの場合
- **GIVEN** tasks.md の全タスクが依存チェーンを形成している
- **WHEN** /implement コマンドを実行した場合
- **THEN** Task(implementer) を順次起動して実行する（Teams は使用しない）

#### Scenario: /implement で単発タスクの場合
- **GIVEN** tasks.md にタスクが1つのみ
- **WHEN** /implement コマンドを実行した場合
- **THEN** Task(implementer) を直接起動する（Teams は使用しない）

#### Scenario: ユーザーが Sub Agents のみモードを選択
- **GIVEN** タスク構成に関わらず
- **WHEN** ユーザーがコマンド実行時に「Sub Agents のみ」を選択した場合
- **THEN** Agent Teams を使用せず、全タスクを Task(subagent) で実行する

### Requirement: /implement コマンドのモード選択
/implement コマンドは実行開始時に AskUserQuestion でモード選択を提示する SHALL。

#### Scenario: モード選択の提示
- **GIVEN** /implement コマンドが起動された
- **WHEN** タスク分析が完了した後
- **THEN** 「Teams モード（推奨: 独立タスクN個検出）」と「Sub Agents のみモード」の選択肢を提示する

### Requirement: /spec リサーチ＆スペックチーム
/spec コマンドは Agent Teams を使ってリサーチャー群と spec-writer を協調させる SHALL。

#### Scenario: /spec でリサーチチームを起動
- **GIVEN** proposal.md が存在する
- **WHEN** /spec コマンドを実行し、ユーザーが Teams モードを選択した場合
- **THEN** TeamCreate でリサーチ＆スペックチームを作成し、codebase-analyzer, stack-docs-researcher, web-researcher, compound-learnings-researcher, spec-writer を teammate として起動する

#### Scenario: spec-writer がリサーチ結果を統合
- **GIVEN** リサーチ＆スペックチームが起動されている
- **WHEN** リサーチャーがタスクを完了した
- **THEN** spec-writer がリサーチ結果を踏まえて design.md, tasks.md, specs/ を生成し、Main Agent にサマリーのみ送信する

#### Scenario: spec-writer がリサーチャーに追加調査を依頼
- **GIVEN** spec-writer が Spec 生成中
- **WHEN** 追加の情報が必要な場合
- **THEN** SendMessage で該当リサーチャーに追加調査を依頼する

#### Scenario: /spec で Sub Agents のみモード
- **GIVEN** ユーザーが「Sub Agents のみ」を選択した
- **WHEN** /spec コマンドを実行した場合
- **THEN** リサーチャー群を Task(subagent) で並列起動し、Main Agent がリサーチ結果を統合して Spec を生成する

### Requirement: /review は Task 並列
/review コマンドは Task(subagent) 並列で実行する SHALL。Agent Teams は使用しない。

#### Scenario: レビュー並列実行
- **GIVEN** レビュー対象のコードが存在する
- **WHEN** /review コマンドを実行した場合
- **THEN** 各レビューエージェントを Task(subagent) で並列起動する

### Requirement: エスカレーションフロー
Team Member はエスカレーションが必要な場合、SendMessage で Main Agent に具体的な選択肢を含めて送信する SHALL。Main Agent はその選択肢をそのまま AskUserQuestion でユーザーに提示する SHALL。

#### Scenario: Team Member がエスカレーション
- **GIVEN** Team Member が仕様の曖昧性を発見した
- **WHEN** エスカレーションが必要と判断した
- **THEN** SendMessage で Main Agent に「選択肢A: ..., 選択肢B: ...」の形式で送信する

#### Scenario: Main Agent がユーザーに確認
- **GIVEN** Team Member からエスカレーションメッセージを受信した
- **WHEN** AskUserQuestion でユーザーに提示する
- **THEN** Team Member の選択肢をそのまま提示し、ユーザーの回答をそのまま Team Member に返す

### Requirement: spec-writer エージェント定義
spec-writer エージェントを新規作成する SHALL。

#### Scenario: spec-writer の役割
- **GIVEN** spec-writer エージェントが定義されている
- **WHEN** /spec のリサーチ＆スペックチーム内で起動される
- **THEN** リサーチ結果を統合し design.md, tasks.md, delta-spec を生成する

## MODIFIED Requirements

### Requirement: /implement コマンドの実行方式
3層アーキテクチャ（implement-orchestrator 経由）から2層アーキテクチャ（Main Agent 直接管理）に変更する。
**変更理由**: Claude Code の制約により Sub Agent は Sub Agent を起動できないため、3層は機能しない。

#### Scenario: Main Agent が直接管理
- **GIVEN** /implement コマンドが起動された
- **WHEN** タスク実行フェーズに入る
- **THEN** Main Agent が直接 Task(implementer) または TeamCreate で実装を管理する（implement-orchestrator は使用しない）

### Requirement: implement-orchestrator の位置づけ
implement-orchestrator は /implement コマンドからは使用しない。`claude --agent implement-orchestrator` でメインスレッドとして起動する場合のみ有効とする。
**変更理由**: Sub Agent としては Task ツールが利用できず機能しないため。

#### Scenario: メインスレッド専用
- **GIVEN** implement-orchestrator エージェント定義
- **WHEN** エージェント定義のドキュメントを確認する
- **THEN** 「メインスレッド専用（claude --agent で起動）」と明記されている

### Requirement: CLAUDE.md の整合性
CLAUDE.md（プロジェクト + グローバル）の Context Isolation Policy、Available Agents、2層アーキテクチャの記載を実際の設計と整合させる。
**変更理由**: implement.md（3層）と CLAUDE.md（2層）の矛盾を解消するため。

#### Scenario: ドキュメント整合
- **GIVEN** CLAUDE.md の記載内容
- **WHEN** Context Isolation Policy セクションを確認する
- **THEN** Agent Teams の活用方針、Teams vs Task の切り替え基準、エスカレーションフロー、2層アーキテクチャが正確に記載されている

## REMOVED Requirements

### Requirement: /implement からの implement-orchestrator 起動
/implement コマンドから Task(implement-orchestrator) を起動する設計を削除する。
**削除理由**: Claude Code の制約により Sub Agent は Sub Agent を起動できないため、3層アーキテクチャは機能しない。
