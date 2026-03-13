# doc-sync デルタスペック

## ADDED Requirements

### Requirement: REQ-001 /implement のドキュメント同期自動更新

commands/implement.md の Step 5（検証）の後に Step 5.5「ドキュメント同期」を追加する。CLAUDE.md にドキュメント同期ルールが定義されている場合、implementer が `git diff --stat` の変更内容に基づいてドキュメントを自動更新し、コミット対象に含める。ルールが未定義の場合はスキップログを出力する。

#### Happy Path Scenarios

- **GIVEN** implement.md に Step 5.5「ドキュメント同期」が定義されている **WHEN** Step 5.5 の内容を確認する **THEN** CLAUDE.md からドキュメント同期ルールを読み取り、`git diff --stat` の変更ファイル一覧とルールを照合してドキュメント更新対象を特定するワークフローが記述されている
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されている **WHEN** 実装変更がルールのマッピングに該当する **THEN** implementer が対象ドキュメントを自動更新し、変更がワーキングツリーに含まれる
- **GIVEN** implement.md に Step 5.5 が定義されている **WHEN** ドキュメント更新の実行主体を確認する **THEN** Task(implementer) として起動され、implementer がドキュメントファイルを Read → 実装変更内容を反映 → Edit で更新するワークフローが記述されている

#### Error Scenarios

- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されていない **WHEN** Step 5.5 が実行される **THEN** `doc-sync: skipped (no rules found)` とスキップログを出力し、後続の Step 6 に進む
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されている **WHEN** `git diff --stat` の変更ファイルがルールのいずれのマッピングにも該当しない **THEN** `doc-sync: skipped (no matching files)` とスキップログを出力し、後続の Step 6 に進む
- **GIVEN** implementer がドキュメント更新中にエラーが発生した **WHEN** 更新処理が失敗する **THEN** エラー内容をログ出力し、ドキュメント更新をスキップして後続の Step 6 に進む（ドキュメント更新失敗は実装完了をブロックしない）
- **GIVEN** Step 5.5 で implementer が複数のドキュメントを更新中 **WHEN** 一部のドキュメント更新に成功し、一部が失敗した **THEN** 成功した更新はワーキングツリーに保持し、失敗したドキュメントのみエラーログに記載して Step 6 に進む

#### Boundary Scenarios

- **GIVEN** CLAUDE.md にドキュメント同期ルールが1つのみ定義されている **WHEN** Step 5.5 が実行される **THEN** その1つのルールに基づいてマッピング判定が行われる
- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されている **WHEN** `git diff --stat` の変更ファイルが1件のみで、ルールのマッピングに該当する **THEN** その1件の変更に基づいて対象ドキュメントの更新が実行される
- **GIVEN** CLAUDE.md にドキュメント同期ルールが複数定義されており、1つの変更ファイルが複数ルールにマッチする **WHEN** Step 5.5 が実行される **THEN** マッチした全ルールの対象ドキュメントが更新対象として特定される

#### Non-Functional Requirements

- **RELIABILITY**: ドキュメント更新の失敗は /implement 全体をブロックしない。エラーログ出力のみで後続処理を継続する
- **COMPATIBILITY**: Step 5.5 の追加は既存の Step 5（検証）と Step 6（完了報告）の動作を変更しない

### Requirement: REQ-002 implementer のドキュメント同期対応

agents/implementation/implementer.md の行動規範に、ドキュメント同期タスク（doc-sync タスク）を受け取った際の振る舞いを追加する。doc-sync タスクでは TDD は不要であり、ドキュメントの Read → 実装変更の反映 → Edit の流れで更新を行う。

#### Happy Path Scenarios

- **GIVEN** implementer.md に doc-sync タスクの振る舞いが定義されている **WHEN** doc-sync タスクの処理手順を確認する **THEN** (1) CLAUDE.md のドキュメント同期ルールを読み取り (2) `git diff --stat` で変更ファイルを確認し (3) ルールに基づいて対象ドキュメントを特定し (4) ドキュメントを Read し (5) 実装変更内容を反映して Edit するワークフローが記述されている
- **GIVEN** implementer.md に doc-sync タスクの振る舞いが定義されている **WHEN** TDD の適用有無を確認する **THEN** doc-sync タスクでは TDD サイクル（RED-GREEN-REFACTOR）は不要であり、Spec Interpretation Log も不要であることが明記されている

#### Error Scenarios

- **GIVEN** implementer が doc-sync タスクを受け取った **WHEN** 対象ドキュメントが存在しない **THEN** 「対象ドキュメントが見つかりません: [パス]」とログ出力し、タスクを完了する（エラーとしない）

#### Boundary Scenarios

- **GIVEN** implementer が doc-sync タスクを受け取った **WHEN** 対象ドキュメントが1ファイルのみ **THEN** その1ファイルに対して Read → Edit の更新処理が実行される

#### Non-Functional Requirements

- **COMPATIBILITY**: doc-sync タスクの追加は、通常の実装タスク（TDD ベース）の振る舞いを変更しない。タスク種別の判定は呼び出し元のプロンプトに「doc-sync タスク」と明記することで行う

### Requirement: REQ-003 /review のドキュメント同期 L0 チェック

commands/review.md の Step 0（L1/L2 自動チェック）に L0「ドキュメント同期チェック」を追加する。CLAUDE.md のドキュメント同期ルールに基づき、`git diff --stat` の変更ファイルに対応するドキュメントの更新有無を機械的に検出する。

#### Happy Path Scenarios

- **GIVEN** review.md の Step 0 に L0 チェックが定義されている **WHEN** L0 の内容を確認する **THEN** CLAUDE.md からドキュメント同期ルールを読み取り、`git diff --stat` の変更ファイルとルールのマッピングを照合し、対応するドキュメントが変更されているか確認するワークフローが記述されている
- **GIVEN** L0 チェックで対応するドキュメントが変更されている **WHEN** L0 の結果を確認する **THEN** 「L0 (doc-sync): PASS -- ドキュメント更新済み」と記録される
- **GIVEN** L0 チェックで対応するドキュメントが未変更である **WHEN** L0 の結果を確認する **THEN** 「L0 (doc-sync): WARNING -- 以下のドキュメントが未更新: [ファイル一覧]」と記録され、REVIEW CONTEXT に注入される

#### Error Scenarios

- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されていない **WHEN** L0 チェックが実行される **THEN** 「L0 (doc-sync): skipped (no rules found)」と記録し、L0 チェックをスキップする
- **GIVEN** L0 チェックでドキュメント未更新が検出されたが、実際にはドキュメント更新が不要な変更である **WHEN** レビュー結果を確認する **THEN** L0 は WARNING のみ出力し、ブロッキングしない。doc-sync-reviewer が内容を精査して最終判断する
- **GIVEN** L0 チェックで WARNING が出力された **WHEN** doc-sync-reviewer が精査した結果、ドキュメント更新が実際に不要と判断した **THEN** WARNING を解消し、最終結果を「L0 (doc-sync): PASS（レビュアー精査済み）」に更新する

#### Non-Functional Requirements

- **COMPATIBILITY**: L0 チェックの追加は既存の L1（型チェック）と L2（linter）の動作を変更しない。L0 は L1 の前に追加される
- **ERROR_UX**: L0 の結果は REVIEW CONTEXT に含まれ、レビュアーが参照できる形式で出力される

### Requirement: REQ-004 doc-sync-reviewer エージェント定義

agents/review/doc-sync-reviewer.md を新規作成する。ドキュメントの更新有無だけでなく、実装変更との整合性・ドキュメント品質（記載漏れ、古い情報の残存等）をチェックするレビュアーエージェント。

#### Happy Path Scenarios

- **GIVEN** agents/review/doc-sync-reviewer.md が存在する **WHEN** frontmatter を確認する **THEN** `name: doc-sync-reviewer`、`description` にドキュメント同期の検証に関する記述、`tools: [Read, Grep, Glob]`、`skills: [iterative-retrieval]` が含まれている
- **GIVEN** doc-sync-reviewer が起動される **WHEN** レビュー処理を確認する **THEN** (1) CLAUDE.md のドキュメント同期ルールを読み取り (2) `git diff --stat` の変更ファイルから影響を受けるドキュメントを特定し (3) 各ドキュメントと対応するコードを突き合わせ (4) 整合性・品質をチェックするワークフローが記述されている
- **GIVEN** doc-sync-reviewer がレビュー結果を出力する **WHEN** 出力形式を確認する **THEN** review-aggregator が統合可能な形式（指摘ID、優先度、確信度、対象ファイル、指摘内容、推奨修正、関連仕様）で出力されている

#### Error Scenarios

- **GIVEN** CLAUDE.md にドキュメント同期ルールが定義されていない **WHEN** doc-sync-reviewer が起動される **THEN** 「ドキュメント同期ルールが未定義のためレビューをスキップします」と出力し、指摘0件で終了する
- **GIVEN** doc-sync-reviewer が起動される **WHEN** 対象ドキュメントファイルが存在しない **THEN** 「対象ドキュメントが見つかりません: [パス]」を P2 指摘として報告する

#### Boundary Scenarios

- **GIVEN** doc-sync-reviewer が起動される **WHEN** L0 の REVIEW CONTEXT に WARNING が含まれていない（L0 PASS の場合） **THEN** 更新有無チェックをスキップし、整合性チェックと品質チェックのみ実行する

#### Non-Functional Requirements

- **COMPATIBILITY**: doc-sync-reviewer は /review の動的レビュアー選択（Step 2b）で自動検出される。既存の review-aggregator との統合に追加変更は不要（既存パターンに従う）

### Requirement: REQ-005 doc-sync-reviewer の検証観点

doc-sync-reviewer は以下の3つの観点でドキュメントを検証する: (1) 更新有無（L0 結果の補完）、(2) 実装変更との整合性、(3) ドキュメント品質。

#### Happy Path Scenarios

- **GIVEN** doc-sync-reviewer の検証観点が定義されている **WHEN** 更新有無チェックの内容を確認する **THEN** L0 チェック結果（REVIEW CONTEXT に含まれる）を参照し、未更新ドキュメントの報告を引き継ぐワークフローが記述されている
- **GIVEN** doc-sync-reviewer の検証観点が定義されている **WHEN** 整合性チェックの内容を確認する **THEN** 実装変更（git diff）の内容とドキュメントの記述を突き合わせ、実装と矛盾する記述、実装に追加された機能の記載漏れを検出するワークフローが記述されている
- **GIVEN** doc-sync-reviewer の検証観点が定義されている **WHEN** 品質チェックの内容を確認する **THEN** ドキュメント内の古い情報の残存（変更前の仕様記述が残っている等）、説明の不正確さを検出するワークフローが記述されている

#### Error Scenarios

- **GIVEN** doc-sync-reviewer が整合性チェックを実行する **WHEN** 実装変更がドキュメントに無関係（テストコードのみの変更等）である **THEN** 「ドキュメント更新不要と判断」として指摘を出さない
- **GIVEN** doc-sync-reviewer が品質チェックを実行する **WHEN** ドキュメントの変更差分が大きく、実装変更との対応関係を特定できない **THEN** 「確信度: LOW -- 対応関係の特定が困難」として P3 指摘で報告し、人間のレビューを推奨する

#### Non-Functional Requirements

- **COMPATIBILITY**: REQ-005 の3つの検証観点は doc-sync-reviewer.md（REQ-004）に記載される検証ロジック内で実装され、独立したファイルとしては存在しない

### Requirement: REQ-006 /setup のドキュメント同期ルール設定

commands/setup.md のステップ6（スキル作成提案）の後にステップ6.5「ドキュメント同期ルール設定」を追加する。プロジェクト内のドキュメントディレクトリを自動検出し、ファイル変更とドキュメントのマッピングを対話的に設定し、CLAUDE.md にルールを追記する。

#### Happy Path Scenarios

- **GIVEN** setup.md にステップ6.5 が定義されている **WHEN** ステップ6.5 の内容を確認する **THEN** (1) プロジェクト内のドキュメントディレクトリを自動検出し (2) 検出結果をユーザーに提示し (3) ファイル変更パターンとドキュメントのマッピングを対話的に設定し (4) CLAUDE.md にルールを追記するワークフローが記述されている
- **GIVEN** ステップ6.5 でドキュメントディレクトリが検出された **WHEN** 検出結果の表示を確認する **THEN** 検出されたディレクトリ一覧が表示され、ユーザーが追加・削除できる対話が提供されている
- **GIVEN** ステップ6.5 でマッピング設定が完了した **WHEN** CLAUDE.md への追記内容を確認する **THEN** CLAUDE.md の末尾に `## Document Sync Rules` セクションが追記され、自然言語でマッピングルールが記述されている。既存セクションの途中には挿入しない

#### Error Scenarios

- **GIVEN** ステップ6.5 でドキュメントディレクトリが検出されなかった **WHEN** 検出結果を確認する **THEN** 「ドキュメントディレクトリが検出されませんでした。手動で指定しますか？」とユーザーに問いかけ、ユーザーが辞退した場合はステップ6.5 をスキップする
- **GIVEN** ステップ6.5 が実行される **WHEN** CLAUDE.md に既に `## Document Sync Rules` セクションが存在する **THEN** 既存のルールを表示し、「既存のルールを更新しますか？」とユーザーに確認する。ユーザーが辞退した場合は既存ルールを保持する

#### Boundary Scenarios

- **GIVEN** ステップ6.5 で検出されたドキュメントディレクトリが1つのみの場合 **WHEN** マッピング設定を確認する **THEN** その1つのディレクトリに対してマッピング設定が行われる

#### Non-Functional Requirements

- **COMPATIBILITY**: ステップ6.5 の追加は既存のステップ6（スキル作成提案）とステップ7（設定ファイル生成）の動作を変更しない
- **DATA_INTEGRITY**: CLAUDE.md の既存内容を破壊しない。`## Document Sync Rules` セクションの追記のみ許可する

### Requirement: REQ-007 /setup のドキュメントディレクトリ自動検出

setup.md のステップ6.5 において、プロジェクト内のドキュメントディレクトリを以下のパターンで自動検出する。

#### Happy Path Scenarios

- **GIVEN** ステップ6.5 のドキュメントディレクトリ検出が定義されている **WHEN** 検出パターンを確認する **THEN** 以下のパターンが検出対象として含まれている: `docs/`, `doc/`, `documentation/`, `wiki/`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/` 配下の Markdown ファイル
- **GIVEN** ドキュメントディレクトリ検出が実行される **WHEN** プロジェクトルートに `docs/` ディレクトリが存在する **THEN** `docs/` が検出結果に含まれる

#### Error Scenarios

- **GIVEN** ドキュメントディレクトリ検出が実行される **WHEN** 検出パターンのいずれにも一致しない **THEN** 空のリストを返し、ステップ6.5 がフォールバック処理（手動指定の問いかけ）に進む

#### Boundary Scenarios

- **GIVEN** ドキュメントディレクトリ検出が実行される **WHEN** 検出パターンに一致するディレクトリが1つのみ存在する **THEN** その1つのディレクトリのみが検出結果に含まれる

### Requirement: REQ-008 /setup の CLAUDE.md ドキュメント同期ルール形式

setup.md のステップ6.5 で CLAUDE.md に追記するドキュメント同期ルールの形式を定義する。ルールは自然言語で記述し、LLM が文脈で解釈する。

#### Happy Path Scenarios

- **GIVEN** CLAUDE.md にドキュメント同期ルールが追記された **WHEN** ルールの形式を確認する **THEN** `## Document Sync Rules` セクション配下に、自然言語でマッピングルールが記述されている（例: 「`commands/` 配下のファイルを変更したら `CLAUDE.md` の Forge ワークフロー セクションを確認・更新する」）
- **GIVEN** ドキュメント同期ルールが CLAUDE.md に記述されている **WHEN** implementer がルールを読み取る **THEN** ルールの自然言語記述から、変更ファイルパターンと対象ドキュメントの対応関係を解釈できる

#### Error Scenarios

- **GIVEN** CLAUDE.md に `## Document Sync Rules` セクションが追記済みである **WHEN** /setup を再実行する **THEN** 既存のルールを上書きせず、ユーザーに確認してから更新する

#### Non-Functional Requirements

- **COMPATIBILITY**: ルール形式は自然言語のみとする。YAML 等の構造化形式は使用しない（proposal.md のスコープ外に準拠）

## ファイル間整合性テーブル

以下の概念が複数ファイルで参照されるため、整合性を維持する必要がある:

| 概念 | 参照元ファイル | 整合性ポイント |
|---|---|---|
| ドキュメント同期ルール読み取り | commands/implement.md Step 5.5、commands/review.md Step 0 L0、agents/review/doc-sync-reviewer.md、agents/implementation/implementer.md | 全てが CLAUDE.md の `## Document Sync Rules` セクションを参照すること |
| スキップログ形式 | commands/implement.md Step 5.5、commands/review.md Step 0 L0 | ルール未定義時のスキップログはプレフィックスが各コマンドの文脈に応じて異なる（implement: `doc-sync: skipped (...)`, review: `L0 (doc-sync): skipped (...)`）。サフィックス部分 `skipped (no rules found)` が統一されていること |
| L0 チェック結果の REVIEW CONTEXT 注入 | commands/review.md Step 0、commands/review.md Step 1 REVIEW CONTEXT | L0 結果が REVIEW CONTEXT テンプレートに含まれていること |
| doc-sync-reviewer の出力形式 | agents/review/doc-sync-reviewer.md、agents/review/review-aggregator.md | doc-sync-reviewer の出力形式が review-aggregator の入力仕様に準拠していること |
| /setup のドキュメント同期ルール形式 | commands/setup.md ステップ6.5、CLAUDE.md の `## Document Sync Rules` | /setup で生成するルール形式と /implement・/review が解釈するルール形式が一致すること |

## REMOVED Requirements

なし
