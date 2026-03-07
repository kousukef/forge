# traceability デルタスペック

## ADDED Requirements

### Requirement: REQ-001 traceability.md の自動生成（spec-writer）

`/spec` コマンドの spec-writer は、design.md / tasks.md と同時に `openspec/changes/<change-name>/traceability.md` を生成しなければならない (SHALL)。traceability.md は proposal.md のユーザーストーリー（US-xxx）、design.md の設計決定（DD-xxx）、tasks.md のタスク（T-xxx）、デルタスペックのテスト観点（TP-xxx）を双方向にマッピングする。

#### Happy Path Scenarios

- **GIVEN** proposal.md に `US-001: 開発者として、...` 形式のユーザーストーリーが3件記載されている **WHEN** spec-writer が /spec で仕様生成を完了する **THEN** `openspec/changes/<change-name>/traceability.md` が生成され、US-001, US-002, US-003 の各行に対応する DD-xxx, T-xxx, TP-xxx が Markdown テーブルで記載されている
- **GIVEN** design.md に「技術的アプローチ」配下に3つの見出し（`### 1. xxx`, `### 2. yyy`, `### 3. zzz`）がある **WHEN** spec-writer が traceability.md を生成する **THEN** DD-001, DD-002, DD-003 として各見出しが設計決定 ID にマッピングされる
- **GIVEN** tasks.md に Task 1 から Task 5 までのタスクがある **WHEN** spec-writer が traceability.md を生成する **THEN** T-001 から T-005 として各タスクがマッピングされる
- **GIVEN** delta-spec.md に REQ-001 の Happy Path Scenarios が3件、Error Scenarios が2件ある **WHEN** spec-writer が traceability.md を生成する **THEN** TP-001 から TP-005 として各シナリオがテスト観点にマッピングされる

#### Error Scenarios

- **GIVEN** proposal.md にユーザーストーリーが `US-xxx` 形式で記載されていない（自由形式の箇条書き等） **WHEN** spec-writer が traceability.md を生成する **THEN** proposal.md の箇条書き項目（`- ` / `* ` / `1. ` で始まる行）を順番に US-001, US-002, ... として自動付番し、traceability.md に記録する。元の記述をユーザーストーリー列に引用する
- **GIVEN** design.md の「技術的アプローチ」セクションが存在しない、または見出しが1つもない **WHEN** spec-writer が traceability.md を生成する **THEN** 設計決定列を「DD: N/A（design.md に技術的アプローチの見出しなし）」と記載し、生成を続行する

#### Boundary Scenarios

- **GIVEN** proposal.md にユーザーストーリーが1件のみ記載されている **WHEN** spec-writer が traceability.md を生成する **THEN** US-001 の1行のみのマッピングテーブルが生成される
- **GIVEN** US-001 に対して T-001, T-002 の2タスクと TP-001, TP-002, TP-003 の3テスト観点が対応する **WHEN** spec-writer が traceability.md を生成する **THEN** Forward Traceability テーブルで US-001 を3行に展開し、1行につき1つの T/TP の組み合わせを記載する（行複製方式）。例: `US-001 | ... | T-001 | ... | TP-001 | ...`、`US-001 | ... | T-001 | ... | TP-002 | ...`、`US-001 | ... | T-002 | ... | TP-003 | ...`
- **GIVEN** `specs/` 配下に `feature-a/delta-spec.md` と `feature-b/delta-spec.md` の2つの feature ディレクトリがある **WHEN** spec-writer が TP を抽出する **THEN** feature-a のシナリオを先に連番し、続けて feature-b のシナリオを連番する（feature ディレクトリのアルファベット順で通し連番）

#### Non-Functional Requirements

- **COMPATIBILITY**: traceability.md の生成は既存の design.md / tasks.md / delta-spec.md の生成フローに追加する形で実装し、既存の出力を変更しない
- **RELIABILITY**: traceability.md は /spec 実行時点のスナップショットに基づく。/spec 完了後のタスク追加・削除・変更には自動追従しない。タスク構成を変更した場合は /spec の再実行が必要

---

### Requirement: REQ-002 traceability.md のフォーマット定義

traceability.md は以下の Markdown テーブル形式で記述しなければならない (SHALL)。

```markdown
# <change-name> トレーサビリティマトリクス

## Forward Traceability（要件 → 実装）

1行につき1つの対応関係を記載する（行複製方式）。1つの US に複数の T/TP が対応する場合は US を複数行に展開する。

| US | User Story | DD | Design Decision | T | Task | TP | Test Point | impl | test |
|---|---|---|---|---|---|---|---|---|---|
| US-001 | [ストーリー概要] | DD-001 | [設計決定概要] | T-001 | [タスク概要] | TP-001 | [テスト観点概要] | - | - |
| US-001 | [ストーリー概要] | DD-001 | [設計決定概要] | T-001 | [タスク概要] | TP-002 | [テスト観点概要] | - | - |
| US-002 | [ストーリー概要] | DD-002 | [設計決定概要] | T-002 | [タスク概要] | TP-003 | [テスト観点概要] | - | - |

## Backward Traceability（実装 → 要件）

| impl/test | T | TP | DD | US |
|---|---|---|---|---|
| (implementer が更新) | | | | |

## Coverage Summary

| カテゴリ | 総数 | カバー済み | 未カバー |
|---|---|---|---|
| User Stories | N | N | 0 |
| Design Decisions | N | N | 0 |
| Tasks | N | N | 0 |
| Test Points | N | N | 0 |
```

#### Happy Path Scenarios

- **GIVEN** spec-writer が traceability.md を生成する **WHEN** 生成が完了する **THEN** Forward Traceability テーブル、Backward Traceability テーブル、Coverage Summary テーブルの3セクションが含まれている
- **GIVEN** traceability.md が生成された **WHEN** Coverage Summary を確認する **THEN** 未カバーの User Stories / Design Decisions / Tasks / Test Points の数が正確に集計されている

#### Error Scenarios

- **GIVEN** spec-writer が traceability.md を生成する **WHEN** 1つのユーザーストーリーに対応するタスクが存在しない **THEN** 該当行の T 列と TP 列を「-（未割当）」と記載し、Coverage Summary の未カバー数を1加算する

---

### Requirement: REQ-003 ID 体系と自動連番

トレーサビリティマトリクスの ID は以下の体系で自動連番しなければならない (SHALL):

- **US-xxx**: ユーザーストーリー（proposal.md から抽出、001 開始）
- **DD-xxx**: 設計決定（design.md の「技術的アプローチ」配下の `###` 見出しから抽出、001 開始）
- **T-xxx**: タスク（tasks.md の `### Task N:` から抽出、001 開始）
- **TP-xxx**: テスト観点（delta-spec.md の各シナリオから抽出、001 開始。Happy Path / Error / Boundary の全シナリオを対象）

#### Happy Path Scenarios

- **GIVEN** proposal.md に `US-001`, `US-002`, `US-003` と記載されている **WHEN** spec-writer が ID を抽出する **THEN** US-001, US-002, US-003 がそのまま使用される
- **GIVEN** proposal.md にユーザーストーリーが `- 開発者として、...` の箇条書き形式で記載されている（US-xxx 形式でない） **WHEN** spec-writer が ID を抽出する **THEN** 出現順に US-001, US-002, ... と自動付番される
- **GIVEN** design.md の「技術的アプローチ」に `### 1. コマンド定義`, `### 2. ワークフロー`, `### 3. 検索` の3見出しがある **WHEN** spec-writer が ID を抽出する **THEN** DD-001, DD-002, DD-003 として抽出される
- **GIVEN** tasks.md に `### Task 1:` から `### Task 8:` まで8タスクがある **WHEN** spec-writer が ID を抽出する **THEN** T-001 から T-008 として抽出される

#### Error Scenarios

- **GIVEN** proposal.md が存在しない **WHEN** spec-writer が traceability.md を生成しようとする **THEN** traceability.md の生成をスキップし、警告「proposal.md が見つからないため traceability.md を生成できません」を出力する
- **GIVEN** design.md の「技術的アプローチ」配下に `### 1. xxx` と `### yyy`（番号なし）の見出しが混在している **WHEN** spec-writer が DD を抽出する **THEN** 番号の有無に関わらず `###` レベルの見出しを出現順に DD-001, DD-002, ... として連番する（見出しテキストの形式は問わない）

#### Boundary Scenarios

- **GIVEN** delta-spec.md に 20 件以上のシナリオがある **WHEN** spec-writer が TP を抽出する **THEN** TP-001 から TP-020 以降まで全シナリオに連番が付与される（上限なし）

---

### Requirement: REQ-004 spec-validator によるトレーサビリティ網羅性チェック

spec-validator は traceability.md の網羅性を検証し、欠落を**警告レベル**（非ブロッキング）で報告しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** traceability.md が存在し、全ユーザーストーリーに対応するタスクとテスト観点が割り当てられている **WHEN** spec-validator が検証する **THEN** Spec Validation Report のトレーサビリティセクションに「トレーサビリティ: 全要件カバー済み」と記載する
- **GIVEN** traceability.md の Coverage Summary で US-003 に対応するタスクが未割当 **WHEN** spec-validator が検証する **THEN** Spec Validation Report に「警告: US-003 に対応するタスクが未割当です」と記載する。検証結果は PASS とする（ブロッキングしない）

#### Error Scenarios

- **GIVEN** traceability.md が存在しない **WHEN** spec-validator が検証する **THEN** Spec Validation Report に「警告: traceability.md が生成されていません」と記載する。検証結果は PASS とする（ブロッキングしない）

#### Non-Functional Requirements

- **RELIABILITY**: トレーサビリティ検証の失敗は spec-validator の全体結果をブロックしない。トレーサビリティは補助的な品質指標であり、欠落があっても仕様承認フローを妨げない

---

### Requirement: REQ-005 implementer によるトレーサビリティ更新

implementer は各タスク完了時に、traceability.md の Backward Traceability テーブルに実装ファイルパスとテストファイルパスを追記しなければならない (SHALL)。

#### Happy Path Scenarios

- **GIVEN** implementer が Task 1 を完了し、`src/commands/setup.md` を作成し、テストは対象外だった **WHEN** タスク完了処理を実行する **THEN** traceability.md の Backward Traceability テーブルに `src/commands/setup.md | T-001 | TP-001 | DD-001 | US-001` の行が追加される
- **GIVEN** implementer が Task 3 を完了し、`agents/spec/spec-writer.md` を修正し、構造検証で `grep` コマンドを実行した **WHEN** タスク完了処理を実行する **THEN** traceability.md の Backward Traceability テーブルに該当ファイルパスの行が追加される
- **GIVEN** implementer がタスクを完了し、impl 列と test 列にファイルパスを記入した **WHEN** Forward Traceability テーブルも更新する **THEN** Forward Traceability テーブルの該当 T-xxx 行の impl 列と test 列にもファイルパスが記入される

#### Error Scenarios

- **GIVEN** traceability.md が存在しない状態で implementer がタスクを完了する **WHEN** traceability.md の更新を試みる **THEN** 警告「traceability.md が見つかりません。更新をスキップします」を出力し、タスク完了処理は正常に続行する（ブロッキングしない）
- **GIVEN** implementer がファイル変更を伴わないタスク（調査のみ等）を完了する **WHEN** traceability.md の更新を試みる **THEN** Backward Traceability テーブルに `（変更なし）| T-xxx | - | - | -` の行を追加する

#### Boundary Scenarios

- **GIVEN** implementer が1つのタスクで `agents/spec/spec-writer.md` と `agents/spec/spec-validator.md` の2ファイルを変更した **WHEN** traceability.md の Backward Traceability テーブルを更新する **THEN** 変更ファイルごとに1行追加する（2行: `agents/spec/spec-writer.md | T-xxx | ...` と `agents/spec/spec-validator.md | T-xxx | ...`）。Forward Traceability テーブルの該当 T-xxx 行も行複製方式でファイルごとに1行展開する

#### Non-Functional Requirements

- **RELIABILITY**: traceability.md の更新失敗は implementer のタスク完了をブロックしない。トレーサビリティ更新は best-effort で実行する
- **COMPATIBILITY**: implementer の既存の COMPLETION CRITERIA（テスト全パス、静的解析パス、Spec Interpretation Log 記述）には影響しない。traceability.md 更新は追加ステップとして実行する

---

### Requirement: REQ-006 /compound でのトレーサビリティアーカイブと累積反映

`/compound` コマンドは、traceability.md を含む変更ディレクトリ全体をアーカイブし、トレーサビリティ情報を累積スペックに反映しなければならない (SHALL)。累積先の feature 名は delta-spec.md の配置ディレクトリ名と一致させる（例: `openspec/changes/<change-name>/specs/traceability/delta-spec.md` → `openspec/specs/traceability/traceability.md`）。

#### Happy Path Scenarios

- **GIVEN** `openspec/changes/<change-name>/traceability.md` が存在し、Forward / Backward Traceability が完成している **WHEN** `/compound` コマンドのスペックマージ（ステップ6）を実行する **THEN** `openspec/specs/<feature>/traceability.md` に累積トレーサビリティとしてマージされる。既存の累積トレーサビリティがある場合は行を追記する
- **GIVEN** `/compound` コマンドの変更アーカイブ（ステップ7）を実行する **WHEN** アーカイブが完了する **THEN** `openspec/changes/archive/YYYY-MM-DD-<change-name>/traceability.md` として traceability.md もアーカイブされる

#### Error Scenarios

- **GIVEN** `openspec/changes/<change-name>/traceability.md` が存在しない **WHEN** `/compound` コマンドを実行する **THEN** トレーサビリティのマージをスキップし、他のマージ処理（delta-spec → 累積スペック）は正常に続行する
- **GIVEN** `openspec/specs/<feature>/traceability.md` が既に存在し、同名の US-xxx が含まれている **WHEN** 新しい変更の traceability.md をマージする **THEN** 新しい変更の US-xxx は連番を継続する形でリナンバリングし、既存の ID との衝突を回避する。リナンバリング時は Forward Traceability テーブルと Backward Traceability テーブルの両方で、リナンバリング対象の全 ID（US-xxx, DD-xxx, T-xxx, TP-xxx）の参照を同時に更新する

#### Non-Functional Requirements

- **DATA_INTEGRITY**: 累積トレーサビリティへのマージ時に既存のマッピング情報を破壊しない。追記のみ許可する
- **COMPATIBILITY**: /compound コマンドの既存ワークフロー（学習ソース読み込み → 学び抽出 → Learning Router → クリーンアップ → スペックマージ → アーカイブ）の順序を変更しない。トレーサビリティマージはスペックマージ（ステップ6）の追加サブステップとして実行する

---

## MODIFIED Requirements

### Requirement: REQ-007 spec-writer エージェント定義の出力追加

spec-writer エージェント定義（`agents/spec/spec-writer.md`）の出力セクションに traceability.md を追加する。

**変更理由**: spec-writer の生成物に traceability.md が加わるため、エージェント定義の出力リストを更新する必要がある。

#### Happy Path Scenarios

- **GIVEN** spec-writer エージェント定義を確認する **WHEN** 出力セクションを読む **THEN** 以下の4ファイルが出力として定義されている: (1) delta-spec.md, (2) design.md, (3) tasks.md, (4) traceability.md

---

### Requirement: REQ-008 spec-validator エージェント定義のチェック項目追加

spec-validator エージェント定義（`agents/spec/spec-validator.md`）の検証項目にトレーサビリティ網羅性チェックを追加する。

**変更理由**: spec-validator の検証スコープにトレーサビリティが加わるため、エージェント定義の入力ファイルリストと検証項目を更新する必要がある。

#### Happy Path Scenarios

- **GIVEN** spec-validator エージェント定義を確認する **WHEN** 検証項目リストを読む **THEN** 「10. トレーサビリティ網羅性チェック（警告レベル）」が追加されている
- **GIVEN** spec-validator エージェント定義を確認する **WHEN** 入力ファイルリストを読む **THEN** `traceability.md` が入力ファイルとして追加されている

---

### Requirement: REQ-009 implementer エージェント定義の完了条件追加

implementer エージェント定義（`agents/implementation/implementer.md`）の COMPLETION CRITERIA と Spec Interpretation Log Phase B にトレーサビリティ更新ステップを追加する。

**変更理由**: implementer のタスク完了時に traceability.md の更新が必要になるため、完了条件とワークフローを更新する必要がある。

#### Happy Path Scenarios

- **GIVEN** implementer エージェント定義を確認する **WHEN** COMPLETION CRITERIA を読む **THEN** 「traceability.md の Backward Traceability テーブルに実装ファイルパスを追記済みである（traceability.md が存在する場合のみ）」が追加されている
- **GIVEN** implementer エージェント定義を確認する **WHEN** 行動規範を読む **THEN** タスク完了時の traceability.md 更新手順が記載されている

---

### Requirement: REQ-010 /compound コマンドのマージステップ追加

`/compound` コマンド定義（`commands/compound.md`）のスペックマージ（ステップ6）に traceability.md のマージサブステップを追加する。

**変更理由**: /compound で変更ディレクトリをアーカイブする際、traceability.md も累積スペックに反映する必要がある。

#### Happy Path Scenarios

- **GIVEN** /compound コマンド定義を確認する **WHEN** スペックマージ（ステップ6）の手順を読む **THEN** traceability.md のマージサブステップが記載されている: 「`openspec/changes/<change-name>/traceability.md` を `openspec/specs/<feature>/traceability.md` にマージする（feature 名は delta-spec.md の配置ディレクトリ名と一致）。ADDED の場合は新規作成、既存の場合は行を追記する」

---

### Requirement: REQ-011 /spec コマンドの出力ファイルリスト更新

`/spec` コマンド定義（`commands/spec.md`）の Phase 2 出力ファイルリストに traceability.md を追加する。

**変更理由**: /spec の出力に traceability.md が加わるため、コマンド定義のドキュメントを更新する必要がある。

#### Happy Path Scenarios

- **GIVEN** /spec コマンド定義を確認する **WHEN** Phase 2 の出力ファイルリストを読む **THEN** 以下の4ファイルが記載されている: (1) delta-spec.md, (2) design.md, (3) tasks.md, (4) traceability.md
- **GIVEN** /spec コマンド定義を確認する **WHEN** Phase 5（ユーザー確認）の提示内容を読む **THEN** 生成されたファイルの場所に traceability.md が含まれている

---

### Requirement: REQ-012 OpenSpec 構造の更新

CLAUDE.md の OpenSpec 構造セクションに traceability.md を追加する。

**変更理由**: OpenSpec のディレクトリ構造に traceability.md が加わるため、ドキュメントを更新する必要がある。

#### Happy Path Scenarios

- **GIVEN** CLAUDE.md の OpenSpec 構造セクションを確認する **WHEN** 変更ディレクトリの構造を読む **THEN** `traceability.md` が `design.md` / `tasks.md` と同階層に記載されている

---

## REMOVED Requirements

なし
