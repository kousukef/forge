# doc-sync スペック

## Requirements

### Requirement: /implement のドキュメント同期自動更新

commands/implement.md の Step 5（検証）の後に Step 5.5「ドキュメント同期」を追加する。CLAUDE.md にドキュメント同期ルールが定義されている場合、implementer が `git diff --stat` の変更内容に基づいてドキュメントを自動更新し、コミット対象に含める。ルールが未定義の場合はスキップログを出力する。

#### Scenario: ルール読み取り・照合
- **GIVEN** implement.md に Step 5.5「ドキュメント同期」が定義されている
- **WHEN** Step 5.5 の内容を確認する
- **THEN** CLAUDE.md からドキュメント同期ルールを読み取り、`git diff --stat` の変更ファイル一覧とルールを照合してドキュメント更新対象を特定するワークフローが記述されている

#### Scenario: ドキュメント自動更新
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されている
- **WHEN** 実装変更がルールのマッピングに該当する
- **THEN** implementer が対象ドキュメントを自動更新し、変更がワーキングツリーに含まれる

#### Scenario: implementer 起動
- **GIVEN** implement.md に Step 5.5 が定義されている
- **WHEN** ドキュメント更新の実行主体を確認する
- **THEN** Task(implementer) として起動され、implementer がドキュメントファイルを Read → 実装変更内容を反映 → Edit で更新するワークフローが記述されている

#### Scenario: ルール未定義スキップ
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されていない
- **WHEN** Step 5.5 が実行される
- **THEN** `doc-sync: skipped (no rules found)` とスキップログを出力し、後続の Step 6 に進む

#### Scenario: マッチなしスキップ
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されている
- **WHEN** `git diff --stat` の変更ファイルがルールのいずれのマッピングにも該当しない
- **THEN** `doc-sync: skipped (no matching files)` とスキップログを出力し、後続の Step 6 に進む

#### Scenario: 更新失敗時非ブロッキング
- **GIVEN** implementer がドキュメント更新中にエラーが発生した
- **WHEN** 更新処理が失敗する
- **THEN** エラー内容をログ出力し、ドキュメント更新をスキップして後続の Step 6 に進む（ドキュメント更新失敗は実装完了をブロックしない）

#### Scenario: 部分更新失敗
- **GIVEN** Step 5.5 で implementer が複数のドキュメントを更新中
- **WHEN** 一部のドキュメント更新に成功し、一部が失敗した
- **THEN** 成功した更新はワーキングツリーに保持し、失敗したドキュメントのみエラーログに記載して Step 6 に進む

### Requirement: implementer のドキュメント同期対応

agents/implementation/implementer.md の行動規範に、ドキュメント同期タスク（doc-sync タスク）を受け取った際の振る舞いを追加する。doc-sync タスクでは TDD は不要であり、ドキュメントの Read → 実装変更の反映 → Edit の流れで更新を行う。

#### Scenario: 処理手順
- **GIVEN** implementer.md に doc-sync タスクの振る舞いが定義されている
- **WHEN** doc-sync タスクの処理手順を確認する
- **THEN** (1) CLAUDE.md のドキュメント同期ルールを読み取り (2) `git diff --stat` で変更ファイルを確認し (3) ルールに基づいて対象ドキュメントを特定し (4) ドキュメントを Read し (5) 実装変更内容を反映して Edit するワークフローが記述されている

#### Scenario: TDD 不要
- **GIVEN** implementer.md に doc-sync タスクの振る舞いが定義されている
- **WHEN** TDD の適用有無を確認する
- **THEN** doc-sync タスクでは TDD サイクル（RED-GREEN-REFACTOR）は不要であり、Spec Interpretation Log も不要であることが明記されている

#### Scenario: ドキュメント不存在
- **GIVEN** implementer が doc-sync タスクを受け取った
- **WHEN** 対象ドキュメントが存在しない
- **THEN** 「対象ドキュメントが見つかりません: [パス]」とログ出力し、タスクを完了する（エラーとしない）

### Requirement: /review のドキュメント同期 L0 チェック

commands/review.md の Step 0（L1/L2 自動チェック）に L0「ドキュメント同期チェック」を追加する。CLAUDE.md のドキュメント同期ルールに基づき、`git diff --stat` の変更ファイルに対応するドキュメントの更新有無を機械的に検出する。

#### Scenario: L0 ルール読み取り・照合
- **GIVEN** review.md の Step 0 に L0 チェックが定義されている
- **WHEN** L0 の内容を確認する
- **THEN** CLAUDE.md からドキュメント同期ルールを読み取り、`git diff --stat` の変更ファイルとルールのマッピングを照合し、対応するドキュメントが変更されているか確認するワークフローが記述されている

#### Scenario: L0 PASS
- **GIVEN** L0 チェックで対応するドキュメントが変更されている
- **WHEN** L0 の結果を確認する
- **THEN** 「L0 (doc-sync): PASS」と記録される

#### Scenario: L0 WARNING
- **GIVEN** L0 チェックで対応するドキュメントが未変更である
- **WHEN** L0 の結果を確認する
- **THEN** 「L0 (doc-sync): WARNING -- 以下のドキュメントが未更新: [ファイル一覧]」と記録され、REVIEW CONTEXT に注入される

#### Scenario: L0 ルール未定義スキップ
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されていない
- **WHEN** L0 チェックが実行される
- **THEN** 「L0 (doc-sync): skipped (no rules found)」と記録し、L0 チェックをスキップする

### Requirement: doc-sync-reviewer エージェント定義

agents/review/doc-sync-reviewer.md を新規作成する。ドキュメントの更新有無だけでなく、実装変更との整合性・ドキュメント品質をチェックするレビュアーエージェント。

#### Scenario: frontmatter
- **GIVEN** agents/review/doc-sync-reviewer.md が存在する
- **WHEN** frontmatter を確認する
- **THEN** `name: doc-sync-reviewer`、`description` にドキュメント同期の検証に関する記述、`tools: [Read, Grep, Glob]`、`skills: [iterative-retrieval]` が含まれている

#### Scenario: 検証処理
- **GIVEN** doc-sync-reviewer が起動される
- **WHEN** レビュー処理を確認する
- **THEN** (1) CLAUDE.md のドキュメント同期ルールを読み取り (2) `git diff --stat` の変更ファイルから影響を受けるドキュメントを特定し (3) 各ドキュメントと対応するコードを突き合わせ (4) 整合性・品質をチェックするワークフローが記述されている

#### Scenario: 出力形式
- **GIVEN** doc-sync-reviewer がレビュー結果を出力する
- **WHEN** 出力形式を確認する
- **THEN** review-aggregator が統合可能な形式で出力されている

#### Scenario: ルール未定義スキップ
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されていない
- **WHEN** doc-sync-reviewer が起動される
- **THEN** 「ドキュメント同期ルールが未定義のためレビューをスキップします」と出力し、指摘0件で終了する

### Requirement: doc-sync-reviewer の検証観点

doc-sync-reviewer は以下の3つの観点でドキュメントを検証する: (1) 更新有無（L0 結果の補完）、(2) 実装変更との整合性、(3) ドキュメント品質。

#### Scenario: 3段階チェック
- **GIVEN** doc-sync-reviewer の検証観点が定義されている
- **WHEN** 各検証観点の内容を確認する
- **THEN** 更新有無チェック（L0 結果の補完）、整合性チェック（実装と矛盾する記述の検出）、品質チェック（古い情報の残存検出）の3段階が記述されている

#### Scenario: 無関係な変更
- **GIVEN** doc-sync-reviewer が整合性チェックを実行する
- **WHEN** 実装変更がドキュメントに無関係（テストコードのみの変更等）である
- **THEN** 「ドキュメント更新不要と判断」として指摘を出さない

#### Scenario: 低確信度報告
- **GIVEN** doc-sync-reviewer が品質チェックを実行する
- **WHEN** ドキュメントの変更差分が大きく、実装変更との対応関係を特定できない
- **THEN** 「確信度: LOW」として P3 指摘で報告し、人間のレビューを推奨する

### Requirement: /setup のドキュメント同期ルール設定

commands/setup.md のステップ6の後にステップ6.5「ドキュメント同期ルール設定」を追加する。プロジェクト内のドキュメントディレクトリを自動検出し、マッピングを対話的に設定し、CLAUDE.md にルールを追記する。

#### Scenario: 全フロー
- **GIVEN** setup.md にステップ6.5 が定義されている
- **WHEN** ステップ6.5 の内容を確認する
- **THEN** (1) ドキュメントディレクトリ自動検出 (2) 検出結果表示 (3) マッピング設定対話 (4) CLAUDE.md 追記のワークフローが記述されている

#### Scenario: CLAUDE.md 追記
- **GIVEN** ステップ6.5 でマッピング設定が完了した
- **WHEN** CLAUDE.md への追記内容を確認する
- **THEN** CLAUDE.md の末尾に `## Document Sync Rules` セクションが追記され、自然言語でマッピングルールが記述されている

#### Scenario: 検出失敗フォールバック
- **GIVEN** ステップ6.5 でドキュメントディレクトリが検出されなかった
- **WHEN** 検出結果を確認する
- **THEN** 「ドキュメントディレクトリが検出されませんでした。手動で指定しますか？」とユーザーに問いかける

#### Scenario: 既存セクション確認
- **GIVEN** ステップ6.5 が実行される
- **WHEN** CLAUDE.md に既に `## Document Sync Rules` セクションが存在する
- **THEN** 既存のルールを表示し、「既存のルールを更新しますか？」とユーザーに確認する

### Requirement: /setup のドキュメントディレクトリ自動検出

setup.md のステップ6.5 において、プロジェクト内のドキュメントディレクトリを自動検出する。

#### Scenario: 検出パターン
- **GIVEN** ステップ6.5 のドキュメントディレクトリ検出が定義されている
- **WHEN** 検出パターンを確認する
- **THEN** `docs/`, `doc/`, `documentation/`, `wiki/`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/` 配下の Markdown ファイルが検出対象として含まれている

#### Scenario: 検出失敗
- **GIVEN** ドキュメントディレクトリ検出が実行される
- **WHEN** 検出パターンのいずれにも一致しない
- **THEN** 空のリストを返し、フォールバック処理に進む

### Requirement: /setup の CLAUDE.md ドキュメント同期ルール形式

setup.md のステップ6.5 で CLAUDE.md に追記するドキュメント同期ルールの形式を定義する。ルールは自然言語で記述し、LLM が文脈で解釈する。

#### Scenario: ルール形式
- **GIVEN** CLAUDE.md にドキュメント同期ルールが追記された
- **WHEN** ルールの形式を確認する
- **THEN** `## Document Sync Rules` セクション配下に自然言語でマッピングルールが記述されている

#### Scenario: 冪等性
- **GIVEN** CLAUDE.md に `## Document Sync Rules` セクションが追記済みである
- **WHEN** /setup を再実行する
- **THEN** 既存のルールを上書きせず、ユーザーに確認してから更新する
