# forge-internal-optimization デルタスペック

## ADDED Requirements

### Requirement: REQ-002 プロジェクト/グローバル設定同期チェックフック

`.claude/settings.local.json` の hooks セクションに PostToolUse（matcher: "Write|Edit"）として同期チェックフックを登録し、プロジェクト側とグローバル側（`~/.claude/`）の設定ファイルの差異を自動検出しなければならない（SHALL）。比較対象ディレクトリは設定で拡張可能とし、デフォルトは `commands/` と `CLAUDE.md` とする。

#### Happy Path Scenarios
- **GIVEN** Write または Edit ツールが使用された **WHEN** PostToolUse フックとして同期チェックフックが実行される **THEN** プロジェクト側（デフォルト: `commands/`, `CLAUDE.md`）とグローバル側（`~/.claude/commands/`, `~/.claude/CLAUDE.md`）の対応ファイルを比較し、差異があれば一覧を stderr で警告表示する
- **GIVEN** プロジェクト側とグローバル側のファイルが完全に一致している **WHEN** 同期チェックフックが実行される **THEN** 差異なしとして正常終了する（メッセージなし）
- **GIVEN** フックの設定に比較対象ディレクトリが指定されている **WHEN** 同期チェックフックが実行される **THEN** 設定で指定されたディレクトリのみを比較対象とする

#### Error Scenarios
- **GIVEN** グローバル側のディレクトリ（`~/.claude/`）が存在しない **WHEN** 同期チェックフックが実行される **THEN** 「グローバル設定ディレクトリが見つかりません」と stderr で警告し、フック処理を exit 0 で終了する（ブロッキングしない）
- **GIVEN** プロジェクト側に対応するディレクトリが存在しない **WHEN** 同期チェックフックが実行される **THEN** 比較対象がないためスキップし、フック処理を exit 0 で正常終了する

#### Boundary Scenarios
- **GIVEN** 差異のあるファイルが10個以上 **WHEN** 差異を表示する **THEN** 全ファイルの差異を省略なく一覧表示する
- **GIVEN** バイナリファイルが比較対象に含まれる **WHEN** 比較を実行する **THEN** バイナリファイルはスキップし、テキストファイルのみ比較する
- **GIVEN** フックの設定に比較対象ディレクトリが未指定（デフォルト） **WHEN** 同期チェックフックが実行される **THEN** `commands/` と `CLAUDE.md` をデフォルトの比較対象とする

#### Non-Functional Requirements
- **PERFORMANCE**: フック実行時間は2秒以内に完了する SHALL（大量ファイルでも）
- **RELIABILITY**: フックの失敗がメインワークフローをブロックしない SHALL。フック内部でエラーが発生した場合は警告のみ出力して exit 0 で終了する

---

### Requirement: REQ-003 docs/compound/ 防止策棚卸し

既存の compound learnings に記載された防止策（`- [ ]` チェックボックス）の実施状況を棚卸しし、未実施の防止策を特定しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `docs/compound/` 配下に4件の compound learnings が存在する **WHEN** 棚卸しを実行する **THEN** 各ファイルの「防止策」セクションから未チェック（`- [ ]`）の項目を抽出し、一覧化する
- **GIVEN** 棚卸し結果に未実施の防止策がある **WHEN** 結果を確認する **THEN** 各防止策について「今回のスコープで対応可能か」の判定と対応方針を記載する

#### Error Scenarios
- **GIVEN** `docs/compound/` が空（.gitkeep のみ） **WHEN** 棚卸しを実行する **THEN** 「棚卸し対象の compound learnings がありません」と報告する
- **GIVEN** compound learnings ファイルに防止策セクションが存在しない **WHEN** 棚卸しを実行する **THEN** 当該ファイルは「防止策なし」として記録し、他のファイルの処理を継続する

#### Boundary Scenarios
- **GIVEN** 防止策が全て実施済み（`- [x]`） **WHEN** 棚卸しを実行する **THEN** 「未実施の防止策はありません」と報告する

---

### Requirement: REQ-004 docs/domain/ ディレクトリの新設

`docs/domain/` ディレクトリを新設し、プロジェクト固有ドメイン知識の配置場所を提供しなければならない（SHALL）。初期配置は README.md のみとし、空のドメイン知識ファイルは作成しない。

#### Happy Path Scenarios
- **GIVEN** `docs/domain/` が存在しない **WHEN** 初期化を実行する **THEN** `docs/domain/README.md` が作成され、以下のガイドを含む: 配置すべきファイルの種類（business-rules.md, domain-model.md, stakeholders.md, tech-constraints.md, runbooks/）、各ファイルの目的と記述例、`/forge-init` で自動生成される旨の説明
- **GIVEN** `docs/domain/README.md` が存在する **WHEN** `/brainstorm` を実行する **THEN** `docs/domain/` 配下のファイル（README.md 以外）が参照されて提案の品質が向上する

#### Error Scenarios
- **GIVEN** `docs/` ディレクトリが存在しない **WHEN** `docs/domain/` を作成しようとする **THEN** `docs/` ディレクトリを先に作成してから `docs/domain/` を作成する

#### Non-Functional Requirements
- **COMPATIBILITY**: 既存の `docs/compound/` ディレクトリと競合しない配置とする

---

### Requirement: REQ-005 docs/inbox/ ディレクトリの新設

`docs/inbox/` ディレクトリを新設し、未分類知識の一時退避場所を提供しなければならない（SHALL）。初期配置は README.md のみとする。

#### Happy Path Scenarios
- **GIVEN** `docs/inbox/` が存在しない **WHEN** 初期化を実行する **THEN** `docs/inbox/README.md` が作成され、以下のガイドを含む: 配置すべきファイルの種類（分類前のメモ、未整理の知見）、`/compound` 実行時に自動スキャンされて `docs/domain/` への移動が提案される旨の説明
- **GIVEN** `docs/inbox/` にファイルが配置されている **WHEN** `/compound` を実行する **THEN** `docs/inbox/` 内のファイルがスキャンされ、分類可能な知識について `docs/domain/` への移動が提案される

#### Error Scenarios
- **GIVEN** `docs/inbox/` のファイルがどのドメインカテゴリにも分類できない **WHEN** `/compound` でスキャンする **THEN** 当該ファイルを `docs/inbox/` に残し、「分類不明のため保留」と報告する

#### Boundary Scenarios
- **GIVEN** `docs/inbox/` に Markdown 以外のファイル（画像、PDF 等）が配置されている **WHEN** `/compound` でスキャンする **THEN** 非 Markdown ファイルはスキャン対象外としてスキップし、「非対応形式のためスキップ: [ファイル名]」と報告する

---

### Requirement: REQ-006 Learning Router へのドメインルール分類追加

`/compound` コマンドの Learning Router にドメインルール分類を追加し、ドメイン知識を `docs/domain/` 配下の適切なファイルに自動ルーティングしなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `/compound` 実行時にビジネスルールに関する学びが抽出された **WHEN** Learning Router が分類を実行する **THEN** 学びを `docs/domain/business-rules.md` にルーティングする更新提案を生成する
- **GIVEN** `/compound` 実行時にドメインモデルに関する学びが抽出された **WHEN** Learning Router が分類を実行する **THEN** 学びを `docs/domain/domain-model.md` にルーティングする更新提案を生成する
- **GIVEN** `/compound` 実行時にステークホルダー要件に関する学びが抽出された **WHEN** Learning Router が分類を実行する **THEN** 学びを `docs/domain/stakeholders.md` にルーティングする更新提案を生成する
- **GIVEN** `/compound` 実行時に技術的制約に関する学びが抽出された **WHEN** Learning Router が分類を実行する **THEN** 学びを `docs/domain/tech-constraints.md` にルーティングする更新提案を生成する
- **GIVEN** `/compound` 実行時に運用知識に関する学びが抽出された **WHEN** Learning Router が分類を実行する **THEN** 学びを `docs/domain/runbooks/` 配下にルーティングする更新提案を生成する

#### Error Scenarios
- **GIVEN** 学びがドメイン分類テーブルのどのカテゴリにも該当しない **WHEN** Learning Router が分類を実行する **THEN** 既存の技術的分類テーブルにフォールバックする
- **GIVEN** ルーティング先のファイル（例: `docs/domain/business-rules.md`）が存在しない **WHEN** ルーティングを実行する **THEN** ファイルを新規作成して内容を配置する（空ファイル禁止原則: 内容がある場合のみ作成）
- **GIVEN** 学びが複数のドメインカテゴリに該当する **WHEN** Learning Router が分類を実行する **THEN** 最も関連度の高いカテゴリを選択し、ユーザーに確認を求める

#### Boundary Scenarios
- **GIVEN** 分類不明な学びがある **WHEN** Learning Router が分類を実行する **THEN** `docs/inbox/` にルーティングし、次回の `/compound` で再分類を試みる

#### Non-Functional Requirements
- **ROUTING_PRIORITY**: ドメイン分類は既存の技術的分類（gotcha, ADR, metrics 等）の後に判定する SHALL。技術的分類に該当した学びはドメイン分類の対象外とする。両方に該当する可能性がある場合は技術的分類を優先する

---

### Requirement: REQ-007 /compound の docs/inbox/ 自動スキャン

`/compound` 実行時に `docs/inbox/` を自動スキャンし、分類可能になった知識を `docs/domain/` への移動を提案しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `docs/inbox/` にファイルが存在する **WHEN** `/compound` が実行される **THEN** 各ファイルの内容を分析し、ドメイン分類テーブルに基づいて移動先を提案する
- **GIVEN** `docs/inbox/` のファイルが `docs/domain/business-rules.md` に分類可能と判断された **WHEN** 移動提案をユーザーが承認する **THEN** ファイル内容を `docs/domain/business-rules.md` に追記（または新規作成）し、元ファイルを `docs/inbox/` から削除する

#### Error Scenarios
- **GIVEN** `docs/inbox/` が存在しない **WHEN** `/compound` がスキャンを試みる **THEN** スキャンをスキップし、正常に続行する
- **GIVEN** `docs/inbox/` が空（README.md のみ） **WHEN** `/compound` がスキャンを試みる **THEN** スキャン対象なしとして正常にスキップする

#### Boundary Scenarios
- **GIVEN** `docs/inbox/` に README.md 以外のファイルが20件以上存在する **WHEN** スキャンを実行する **THEN** 全件を処理し、分類結果をまとめて1回のユーザー確認で提示する

---

### Requirement: REQ-008 /brainstorm への docs/domain/ 参照ステップ追加

`/brainstorm` コマンドに `docs/domain/` の情報を参照するステップを追加し、ドメイン知識に基づいた高品質な提案を生成可能にしなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `docs/domain/` に知識ファイルが存在する **WHEN** `/brainstorm` が実行される **THEN** ワークフローの質問開始前に `docs/domain/` 配下のファイルを読み込み、ドメインコンテキストを把握した状態で対話を開始する
- **GIVEN** `docs/domain/` に `business-rules.md` が存在する **WHEN** 提案書を生成する **THEN** ビジネスルールとの整合性を確認した提案内容になる

#### Error Scenarios
- **GIVEN** `docs/domain/` が存在しない、または README.md のみ **WHEN** `/brainstorm` が実行される **THEN** ドメイン参照ステップをスキップし、従来通りの対話を開始する（ブロッキングしない）

#### Boundary Scenarios
- **GIVEN** `docs/domain/` 配下のファイル合計が1000行を超過する **WHEN** `/brainstorm` が参照ステップを実行する **THEN** 以下の優先順位でファイルを読み込む: (1) business-rules.md、(2) domain-model.md、(3) tech-constraints.md、(4) stakeholders.md、(5) runbooks/ 配下。合計1000行に達した時点で残りのファイルはスキップし、「読み込み上限に達したためスキップ: [ファイル名]」と報告する

#### Non-Functional Requirements
- **PERFORMANCE**: `docs/domain/` 配下のファイル読み込みは、合計1000行以内を上限とする SHALL。超過する場合は上記優先順位に基づき部分読み込みする

---

### Requirement: REQ-009 /forge-init コマンドの新設

既存プロジェクトに Forge を導入する際にソクラテス式対話で AI にドメイン知識を移転する `/forge-init` コマンドを新設しなければならない（SHALL）。5フェーズ構成（自動分析 -> ソース提供 -> コア5質問 -> 深掘り質問（オプション） -> ドキュメント生成）で実行する。

> **K1-K15 知識領域の定義**: K1(ビジネスルール), K2(ドメインモデル), K3(ステークホルダー), K4(ユーザーペルソナ), K5(技術スタック), K6(技術的制約), K7(DB スキーマ), K8(API 設計), K9(テスト戦略), K10(運用知識), K11(セキュリティ要件), K12(パフォーマンス要件), K13(UI/UX ガイドライン), K14(外部連携), K15(規制・コンプライアンス)。詳細は `openspec/changes/obsidian-forge-integration/discussion-report.md` のナレッジマトリクスを参照。

#### Happy Path Scenarios
- **GIVEN** Forge が未導入のプロジェクト **WHEN** `/forge-init` を実行する **THEN** Phase 1（自動分析）で codebase-analyzer がプロジェクトを解析し、技術スタック・依存関係・DB スキーマ等（K5-K8, K10, K15）を自動抽出する
- **GIVEN** Phase 1 が完了した **WHEN** Phase 2（ソース提供）に進む **THEN** ユーザーに既存ドキュメント（README、Wiki、仕様書等）の提供を求め、提供されたドキュメントを解析して不足知識領域を特定する
- **GIVEN** Phase 2 が完了した **WHEN** Phase 3（コア5質問）に進む **THEN** 以下のソクラテス式質問を一つずつ実施する: (1) ビジネスルールの核心、(2) ドメインモデルの主要概念、(3) ステークホルダーの優先度、(4) 既知の技術的負債、(5) 運用上の制約
- **GIVEN** Phase 3 が完了した **WHEN** Phase 4（深掘り質問、オプション）に進む **THEN** カバレッジが60%未満の知識領域について追加質問を動的に生成し、ユーザーが「十分」と判断するまで質問を継続する。カバレッジ = K1-K15 の各領域について「情報が1項目以上収集された領域数 / 15」で算出する
- **GIVEN** Phase 4 が完了した（またはスキップされた） **WHEN** Phase 5（ドキュメント生成）に進む **THEN** project-knowledge-writer が収集情報から以下を生成する: `openspec/project.md`、`docs/domain/business-rules.md`（K1 収集時）、`docs/domain/domain-model.md`（K2 収集時）、`docs/domain/stakeholders.md`（K3 収集時）、`docs/domain/tech-constraints.md`（K6,K11 等収集時）、`docs/domain/runbooks/`（K10 等収集時）。情報が収集された領域のみファイル生成する（空ファイル禁止）
- **GIVEN** Phase 5 が完了した **WHEN** 最終レポートを表示する **THEN** 生成されたファイルの一覧とカバレッジサマリー（K1-K15 の各領域のカバー率）を表示する

#### Error Scenarios
- **GIVEN** Phase 2 でユーザーがドキュメントを提供しない **WHEN** 「ドキュメントがない」と回答する **THEN** Phase 2 をスキップし、Phase 3 に進む
- **GIVEN** Phase 4 でユーザーが「十分」と即座に回答する **WHEN** 深掘り質問が1問も実施されない **THEN** Phase 4 をスキップし、Phase 5 に進む
- **GIVEN** codebase-analyzer がプロジェクトの解析に失敗する **WHEN** Phase 1 でエラーが発生する **THEN** 自動分析結果なしで Phase 2 に進み、手動情報収集を重視する
- **GIVEN** Phase 1-4 のいずれかの実行中にセッションが切断される **WHEN** セッション再開後に `/forge-init` を再実行する **THEN** 既に生成済みの `docs/domain/` ファイルを検出し、未収集の知識領域のみを対象として Phase 1 から再開する（収集済みデータの二重取得を避ける）

#### Boundary Scenarios
- **GIVEN** `/forge-init` が既に実行済みで `docs/domain/` にファイルが存在する **WHEN** `/forge-init` を再実行する **THEN** Phase 1 で既存の `docs/domain/` と `openspec/project.md` を読み込み、K1-K15 のカバレッジを算出する。カバレッジが低い（情報なし）領域を特定し、Phase 2-3 は該当領域に絞った質問のみ実施する。Phase 4 は通常通り60%未満の領域について深掘りする。Phase 5 では既存ファイルへの差分追記を提案する（上書きしない）
- **GIVEN** コア5質問の回答が非常に短い（1行以下） **WHEN** Phase 3 を完了する **THEN** 回答が不十分な領域を Phase 4 の深掘り質問候補に追加する

#### Non-Functional Requirements
- **ERROR_UX**: 各フェーズの開始時に現在のフェーズ番号と全体進捗を表示する
- **COMPATIBILITY**: 既存の `/brainstorm` の OpenSpec 初期化（`openspec/project.md` 自動生成）と競合しない。`/forge-init` が先に実行されている場合は `/brainstorm` の自動生成をスキップする

---

### Requirement: REQ-010 project-knowledge-writer エージェント定義

`/forge-init` の Phase 5（ドキュメント生成）で使用する project-knowledge-writer エージェントを定義しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** project-knowledge-writer エージェント定義が必要 **WHEN** エージェントを定義する **THEN** 既存の spec-writer パターンを踏襲し、以下の仕様を持つエージェントが定義される: (1) 入力として収集済みの知識データ（Phase 1-4 の結果）を受け取る、(2) `docs/domain/` 配下にドメイン知識ファイルを生成する、(3) `openspec/project.md` を生成する、(4) 情報が収集された領域のみファイル生成する（空ファイル禁止）
- **GIVEN** project-knowledge-writer がドキュメントを生成する **WHEN** 生成後にカバレッジを計算する **THEN** K1-K15 の各領域について情報の有無とカバー率を計算し、レポートとして出力する

#### Error Scenarios
- **GIVEN** 収集データが極端に少ない（K1-K15 のうちカバーが2領域以下） **WHEN** ドキュメント生成を実行する **THEN** 「情報不足のため最小限のドキュメントのみ生成します」と警告し、存在する情報のみでファイルを生成する
- **GIVEN** Phase 1（自動分析）の結果と Phase 3（コア質問）のユーザー回答が矛盾する（例: 自動検出した技術スタックとユーザー申告が異なる） **WHEN** ドキュメント生成を実行する **THEN** 矛盾を検出した箇所をユーザーに提示し、どちらの情報を優先するか確認を求める。ユーザーの判断を反映してドキュメントを生成する

---

### Requirement: REQ-011 /forge-init コマンド定義

`.claude/commands/forge-init.md` にコマンド定義ファイルを作成しなければならない（SHALL）。既存のコマンド定義パターン（frontmatter + ワークフロー記述）に従う。

#### Happy Path Scenarios
- **GIVEN** forge-init コマンド定義が必要 **WHEN** コマンド定義を作成する **THEN** `.claude/commands/forge-init.md` が以下を含む: (1) frontmatter（description, disable-model-invocation, argument-hint）、(2) 5フェーズのワークフロー記述、(3) コア5質問の定義、(4) カバレッジマトリクスの説明、(5) project-knowledge-writer の起動手順
- **GIVEN** ユーザーが `/forge-init` を実行する **WHEN** コマンドが起動される **THEN** Phase 1 から順にワークフローが実行される

#### Error Scenarios
- **GIVEN** `/forge-init` と `/brainstorm` が同時に実行される **WHEN** 双方が `openspec/project.md` を生成しようとする **THEN** 先に存在するファイルを優先し、後発の生成をスキップする

---

### Requirement: REQ-012 CLAUDE.md の Available Agents 更新

プロジェクト CLAUDE.md とグローバル CLAUDE.md の Available Agents テーブルに project-knowledge-writer を追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** project-knowledge-writer および domain-analyzer エージェントが定義された **WHEN** CLAUDE.md を更新する **THEN** Available Agents テーブルの適切なカテゴリに `project-knowledge-writer` と `domain-analyzer` が追加されている
- **GIVEN** グローバル CLAUDE.md を更新する **WHEN** プロジェクト CLAUDE.md を検証する **THEN** 両方のファイルの Available Agents テーブルが同一内容である

#### Error Scenarios
- **GIVEN** CLAUDE.md の更新が一方のみ実施された **WHEN** 同期チェックフック（REQ-002）が実行される **THEN** 差異が検出され警告が表示される

---

### Requirement: REQ-013 同期チェックフックの実装

同期チェックフック `~/.claude/hooks/check-config-sync.js` を作成しなければならない（SHALL）。既存のフック定義パターン（`~/.claude/hooks/block-unnecessary-files.js` 等）に従う。

#### Happy Path Scenarios
- **GIVEN** `~/.claude/hooks/check-config-sync.js` が作成されている **WHEN** `.claude/settings.local.json` の hooks セクションに PostToolUse（matcher: "Write|Edit"）として登録される **THEN** Write/Edit ツール使用後にフックが自動実行される
- **GIVEN** フックがプロジェクト側とグローバル側の両方に存在するファイルを比較する **WHEN** 内容が異なる **THEN** 差異のあるファイル名を警告表示する
- **GIVEN** `~/.claude/hooks/check-config-sync.js` がデフォルト設定で実行される **WHEN** 比較対象を決定する **THEN** `commands/` と `CLAUDE.md` を比較対象とする

#### Error Scenarios
- **GIVEN** フック実行中にファイル読み込みエラーが発生する **WHEN** 比較対象ファイルのパスが不正 **THEN** エラーをキャッチし、exit 0 で終了する（メインワークフローをブロックしない）
- **GIVEN** 現在 `~/.claude/settings.json` に hooks キーが存在しない（フック基盤が非アクティブ） **WHEN** 同期チェックフックを登録する **THEN** プロジェクトレベルの `.claude/settings.local.json` に hooks セクションを新規追加して登録する

#### Boundary Scenarios
- **GIVEN** プロジェクト側にのみ存在するファイル（グローバル側に対応ファイルがない） **WHEN** 比較を実行する **THEN** 比較対象外としてスキップする（プロジェクト側のみの運用が意図的な可能性があるため）
- **GIVEN** フック設定でカスタム比較対象（例: `agents/`, `reference/`）が追加指定されている **WHEN** 比較を実行する **THEN** デフォルト対象に加えてカスタム対象も比較する

#### Non-Functional Requirements
- **RELIABILITY**: フックの失敗はメインワークフローをブロックしない SHALL。全てのエラーケースで exit 0 で終了する
- **PERFORMANCE**: ファイル比較は大きなファイルでも2秒以内に完了する SHALL

---

### Requirement: REQ-014 フック設定の更新

CLAUDE.md の Hook 自動ガードレールテーブルに同期チェックフックを追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** check-config-sync フックが実装された **WHEN** CLAUDE.md の Hook テーブルを更新する **THEN** `| check-config-sync | プロジェクト/グローバル設定差異を警告 |` の行が追加されている

#### Error Scenarios
- **GIVEN** CLAUDE.md の Hook テーブルの更新がプロジェクト側のみ実施された **WHEN** 同期を検証する **THEN** グローバル CLAUDE.md も同一内容に更新する

---

### Requirement: REQ-015 compound コマンドのドメイン分類テーブル追加

`commands/compound.md` の Learning Router セクションに、ドメイン知識の分類テーブルを追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** compound.md を更新する **WHEN** Learning Router の分類テーブルを検証する **THEN** 以下のルーティングが追加されている:

| 学びの種別 | 更新対象アーティファクト |
|---|---|
| ビジネスルール | `docs/domain/business-rules.md` |
| ドメインモデル | `docs/domain/domain-model.md` |
| ステークホルダー要件 | `docs/domain/stakeholders.md` |
| 技術的制約 | `docs/domain/tech-constraints.md` |
| 運用知識 | `docs/domain/runbooks/` |
| 分類不明 | `docs/inbox/` |

#### Error Scenarios
- **GIVEN** 既存の分類テーブルとの統合が不整合 **WHEN** 更新を検証する **THEN** 既存の技術的分類テーブルが維持され、ドメイン分類テーブルが追加される形式とする

---

### Requirement: REQ-016 compound コマンドの inbox スキャンステップ追加

`commands/compound.md` のワークフローに `docs/inbox/` 自動スキャンステップを追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** compound.md のワークフローにスキャンステップが追加されている **WHEN** ステップの位置を検証する **THEN** ステップ 4.5（Shift-Left フィードバック）の後、ステップ 5（一時ファイルクリーンアップ）の前にステップ 4.7 として配置されている
- **GIVEN** スキャンステップが実行される **WHEN** `docs/inbox/` にファイルが存在する **THEN** 各ファイルをドメイン分類テーブルに基づいて分析し、移動先の提案をユーザーに提示する

#### Error Scenarios
- **GIVEN** スキャンステップが実行される **WHEN** `docs/inbox/` が存在しない **THEN** スキャンをスキップし、次のステップに進む

---

### Requirement: REQ-017 brainstorm コマンドの docs/domain/ 参照ステップ追加

`commands/brainstorm.md` のワークフローに `docs/domain/` 参照ステップを追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** brainstorm.md のワークフローに参照ステップが追加されている **WHEN** ステップの位置を検証する **THEN** ワークフローのステップ1（トピック確認）の後、ステップ2（質問開始）の前に配置されている
- **GIVEN** 参照ステップが実行される **WHEN** `docs/domain/` に知識ファイルが存在する **THEN** README.md 以外の全ファイルを読み込み、ドメインコンテキストとして対話に活用する

#### Error Scenarios
- **GIVEN** 参照ステップが実行される **WHEN** `docs/domain/` が存在しない、または README.md のみ **THEN** ステップをスキップし、従来通りの対話を開始する

---

### Requirement: REQ-018 domain-analyzer エージェント定義

`/spec` コマンドのリサーチフェーズで使用する domain-analyzer エージェントを定義しなければならない（SHALL）。domain-analyzer は `docs/domain/` および `docs/inbox/` からドメイン知識を読み込み、delta-spec のシナリオ生成に必要なドメイン制約を抽出・構造化する。

> **根拠**: /brainstorm は要件レベルの議論に留まるため、proposal.md にはドメイン知識が部分的にしか反映されない。/spec で Error Scenarios（ビジネスルール違反）、Boundary Scenarios（ドメインモデル制約）、NFR（技術的制約・SLA）を正確に定義するには、ドメイン知識の専門的な分析が必要。codebase-analyzer はコード構造分析に特化すべきであり、ドメイン知識分析は責務が異なるため専用エージェントを設ける。

#### Happy Path Scenarios
- **GIVEN** domain-analyzer エージェント定義が必要 **WHEN** エージェントを定義する **THEN** 既存のリサーチエージェントパターンを踏襲し、以下の仕様を持つエージェントが定義される: (1) `docs/domain/` 配下のファイルを読み込む、(2) `docs/inbox/` の未分類知識も参照する、(3) proposal.md の変更内容に関連するドメイン制約を抽出する、(4) 抽出結果を「Error Scenarios 候補」「Boundary Scenarios 候補」「NFR 候補」の3カテゴリに構造化して spec-writer に送信する
- **GIVEN** `docs/domain/business-rules.md` が存在する **WHEN** domain-analyzer が分析を実行する **THEN** ビジネスルール違反に対応するエラーシナリオ候補が抽出される
- **GIVEN** `docs/domain/domain-model.md` が存在する **WHEN** domain-analyzer が分析を実行する **THEN** ドメインモデルの制約（値の範囲、状態遷移等）に対応する境界値シナリオ候補が抽出される

#### Error Scenarios
- **GIVEN** `docs/domain/` が存在しない、または README.md のみ **WHEN** domain-analyzer が起動される **THEN** 「ドメイン知識ファイルが未配置です。/forge-init の実行を推奨します」と報告し、空の分析結果を返す（ブロッキングしない）
- **GIVEN** `docs/domain/` 配下のファイル内容が proposal.md の変更内容と無関係 **WHEN** domain-analyzer が分析を実行する **THEN** 「関連するドメイン制約は検出されませんでした」と報告する

#### Non-Functional Requirements
- **PERFORMANCE**: `docs/domain/` + `docs/inbox/` 配下のファイル読み込みは合計1000行以内を上限とする SHALL。REQ-008（/brainstorm）と同じ優先順位ルールを適用する

---

### Requirement: REQ-019 /spec コマンドへの domain-analyzer 統合

`/spec` コマンドのリサーチフェーズに domain-analyzer を5番目のリサーチャーとして追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** `/spec` コマンドが Sub Agents モードで実行される **WHEN** リサーチフェーズが開始される **THEN** 既存の4リサーチャー（codebase-analyzer, stack-docs-researcher, web-researcher, compound-learnings-researcher）と並列で domain-analyzer が起動される
- **GIVEN** `/spec` コマンドが Teams モードで実行される **WHEN** リサーチ＆スペックチームが作成される **THEN** 6 teammate（既存5 + domain-analyzer）でチームが構成される
- **GIVEN** domain-analyzer の分析結果が spec-writer に渡される **WHEN** delta-spec を生成する **THEN** ドメイン制約に基づく Error/Boundary/NFR シナリオが delta-spec に含まれる

#### Error Scenarios
- **GIVEN** domain-analyzer がエラーで結果を返さない **WHEN** spec-writer が統合を行う **THEN** domain-analyzer の結果なしで残り4リサーチャーの結果のみで delta-spec を生成する（ブロッキングしない）

---

### Requirement: REQ-020 /spec コマンド定義の更新

`commands/spec.md` のリサーチフェーズの記述に domain-analyzer を追加しなければならない（SHALL）。

#### Happy Path Scenarios
- **GIVEN** spec.md を更新する **WHEN** Sub Agents モードのリサーチフェーズを検証する **THEN** 5番目のリサーチャーとして domain-analyzer の記述が追加されている
- **GIVEN** spec.md を更新する **WHEN** Teams モードのリサーチフェーズを検証する **THEN** 6 teammate 構成（codebase-analyzer, stack-docs-researcher, web-researcher, compound-learnings-researcher, spec-writer, domain-analyzer）が記述されている

#### Error Scenarios
- **GIVEN** spec.md の更新がプロジェクト側のみ実施された **WHEN** 同期を検証する **THEN** グローバル側の spec.md も同一内容に更新する

---

## REMOVED Requirements

### Requirement: REQ-001 memory/MEMORY.md の初期化
**削除理由**: memory/MEMORY.md は Claude Code がユーザーのオンデマンド要求に応じてセッション間メモを記録する機能であり、ワークフローで事前に構造化データを配置する用途は想定されていない。プロジェクト基本情報は openspec/project.md（/forge-init で生成）および CLAUDE.md が担うべきであり、memory/ の用途と重複する。

## MODIFIED Requirements

なし
