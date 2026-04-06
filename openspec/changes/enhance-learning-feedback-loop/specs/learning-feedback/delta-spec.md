# learning-feedback デルタスペック

## ADDED Requirements

### Requirement: REQ-001 implementer Phase B シグナル分類

implementer は Spec Interpretation Log の Phase B（実装完了後の追記）に、シグナル分類セクションを追加する（SHALL）。分類は実装中に得られた学びの性質を構造化する。

#### Happy Path Scenarios

- **GIVEN** implementer がタスクの TDD サイクルを完了した **WHEN** Phase B を追記する **THEN** 「シグナル分類」セクションに `signal_class`（FIX/DERIVED/CAPTURED/NONE）、`related_skill`（関連スキル/ルール名）、`summary`（1行の学び要約）が記述される
- **GIVEN** implementer が実装中に既存ルールの不備で躓いた **WHEN** Phase B のシグナル分類を記述する **THEN** `signal_class: FIX` と `related_skill: [躓いたルール/スキル名]` が記載される
- **GIVEN** 実装中に特筆すべき学びがなかった **WHEN** Phase B のシグナル分類を記述する **THEN** `signal_class: NONE` と記載され、experiential logs への書き込みは行わない

#### Error Scenarios

- **GIVEN** implementer がシグナル分類の判断に迷った **WHEN** FIX/DERIVED/CAPTURED のいずれにも該当しない **THEN** `signal_class: NONE` を選択する（疑わしい場合はスキップが安全）
- **GIVEN** implementer の TDD サイクルが途中で中断された（テスト失敗が解消できず build-error-resolver に引き継いだ等） **WHEN** Phase B を追記する **THEN** `signal_class: NONE` とする。学びのメモがあれば summary にのみ残す

#### Boundary Scenarios

- **GIVEN** 1つのタスクで FIX と CAPTURED の両方に該当する学びが発生した **WHEN** シグナル分類を記述する **THEN** 優先順位 FIX > DERIVED > CAPTURED で最も高い1つを `signal_class` として選択し、他の学びは `summary` に含める。1タスク = 1シグナルエントリ
- **GIVEN** 同一タスクで同一 `signal_class` の学びが複数発生した **WHEN** シグナル分類を記述する **THEN** 最も影響度の高い1つを選択する。1タスク = 1シグナルエントリ

#### Non-Functional Requirements

- **COMPATIBILITY**: シグナル分類セクションは Phase B の既存セクション（変更ファイル一覧、実装の振り返り）の後に追加する。既存フォーマットを変更しない

---

### Requirement: REQ-002 シグナルエントリの即時書き込み

implementer は `signal_class` が NONE 以外の場合、Phase B 完了後に `~/.claude/docs/experiential/logs/` へシグナルエントリを即時書き込む（SHALL）。`/compound` の実行を待たない即時パスである。

#### シグナルエントリフォーマット

```markdown
---
id: sig-NNNN
type: signal
signal_class: FIX | DERIVED | CAPTURED
related_skill: "[関連スキル/ルール/領域名]"
project: <project-name>
task: "<task-name>"
date: YYYY-MM-DD
crystallized: false
---

# [学びの1行サマリー]

## コンテキスト
[実装中に何が起きたか -- 2-3文]

## 学び
[再利用可能な知見 -- 1-2文]
```

#### Happy Path Scenarios

- **GIVEN** implementer が `signal_class: FIX` で Phase B を完了した **WHEN** シグナルエントリを書き込む **THEN** `~/.claude/docs/experiential/logs/YYYY-MM-DD-<project>-signals.md` にエントリが追記される。ファイルが存在しない場合は新規作成する
- **GIVEN** 同日に複数タスクで FIX シグナルが発生した **WHEN** 各タスクのシグナルを書き込む **THEN** 同一ファイルに `---` 区切りで複数エントリが追記される。各エントリの `id` はファイル内で一意（`sig-0001`, `sig-0002`, ...）
- **GIVEN** `signal_class: NONE`（REQ-001 の NONE 判定に該当） **WHEN** Phase B を完了する **THEN** experiential logs への書き込みは行わない

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` ディレクトリが存在しない **WHEN** シグナルエントリを書き込もうとする **THEN** ディレクトリを再帰的に作成してから書き込む。作成に失敗した場合は書き込みをスキップし、実装タスクの完了をブロックしない
- **GIVEN** シグナルファイルへの書き込みに失敗した（権限エラー、ディスク容量不足等） **WHEN** エントリを追記しようとする **THEN** 警告を出力し、書き込みをスキップする。実装タスクの完了はブロックしない

#### Boundary Scenarios

- **GIVEN** `related_skill` に該当するスキル/ルールが明確でない **WHEN** シグナル分類を記述する **THEN** `related_skill` には最も近い技術領域名を自由記述で記載する（例: "Prisma query optimization", "React Server Components"）

#### Non-Functional Requirements

- **DATA_INTEGRITY**: シグナルエントリは append-only。既存エントリの上書き・削除は行わない
- **GRACEFUL_DEGRADATION**: シグナル書き込みの失敗は実装の完了をブロックしない。学習ループの失敗が実装をブロックしてはならない

---

### Requirement: REQ-003 implementer pre-flight シグナル参照

implementer は Spec Interpretation Log 出力前に、過去のシグナル（特に `signal_class: FIX`）を参照する pre-flight ステップを実行する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` に過去のシグナルエントリが蓄積されている **WHEN** implementer が新タスクを開始する **THEN** ステップ 2（タスク+デルタスペック読み込み）の後、ステップ 3（Spec Interpretation Log 出力）の前に、experiential logs 内の `signal_class: FIX` エントリを Grep で検索する
- **GIVEN** `signal_class: FIX` のエントリが見つかった **WHEN** pre-flight を実行する **THEN** 全 FIX シグナルから直近 5 件（シグナルファイルの日付が最新のものから順、同日内では `sig-NNNN` の番号が大きい順）を取得し、Spec Interpretation Log の冒頭に「参照したシグナル」セクションとして `related_skill` と学び要約を記載する。implementer が内容を確認し、現在のタスクに関連する学びを仕様解釈に反映する
- **GIVEN** 関連する FIX シグナルが見つからなかった **WHEN** pre-flight を実行する **THEN** 「参照したシグナル: 該当なし」と記載し、通常のフローに進む

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` ディレクトリが存在しない **WHEN** pre-flight を実行する **THEN** pre-flight をスキップし、通常のフローに進む。エラーは出さない
- **GIVEN** Grep の実行に失敗した **WHEN** pre-flight を実行する **THEN** pre-flight をスキップし、通常のフローに進む。エラーは出さない
- **GIVEN** experiential logs 内のシグナルエントリのフロントマターが破損している（手動編集等） **WHEN** pre-flight で Grep を実行する **THEN** 破損エントリは無視し、パース可能なエントリのみを参照する

#### Boundary Scenarios

- **GIVEN** FIX シグナルが大量（6件以上）にマッチした **WHEN** pre-flight を実行する **THEN** 直近 5 件（シグナルファイルの日付が最新のものから順、同日内では `sig-NNNN` の番号が大きい順）のみを参照し、残りは件数のみ記載する（「他 N 件の FIX シグナルあり」）。コンテキストウィンドウの圧迫を防ぐ
- **GIVEN** FIX シグナルが 0 件 **WHEN** pre-flight を実行する **THEN** 「参照したシグナル: 該当なし」と記載し、通常のフローに進む（Happy Path 3番目と同一動作）

#### Non-Functional Requirements

- **PERFORMANCE**: pre-flight は Grep 1 回で完結する。compound-learnings-researcher の起動やネストされたエージェント呼び出しは行わない（サブエージェントのネスト不可制約）
- **NON_BLOCKING**: pre-flight の失敗は実装をブロックしない

---

### Requirement: REQ-004 /crystallize FIX 集積度による優先度付け

`/crystallize` コマンドの Phase 2（パターン抽出）に、FIX シグナルの集積度に基づく優先度スコアリングを追加する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` に `signal_class: FIX` かつ `related_skill: "Prisma"` のエントリが 3 件以上蓄積されている **WHEN** `/crystallize` の Phase 2 を実行する **THEN** "Prisma" 関連のパターン候補が FIX 集積度スコアにより優先的に抽出される
- **GIVEN** Phase 2 のパターン候補リストが生成された **WHEN** FIX 集積度スコアが付与されている **THEN** 候補リストは FIX 集積度の高い順にソートされて Phase 3（人間レビュー）に提示される

#### Error Scenarios

- **GIVEN** `type: signal` のエントリが 0 件 **WHEN** Phase 2 を実行する **THEN** FIX 集積度スコアリングをスキップし、既存の 4 つの抽出観点（繰り返し、プロジェクト横断、因果関係、Shift-Left）のみで抽出する

#### Boundary Scenarios

- **GIVEN** 同一 `related_skill` への FIX シグナルが 2 件（閾値未満） **WHEN** Phase 2 を実行する **THEN** FIX 集積度による優先度付けは適用されない（閾値は 3 件以上）
- **GIVEN** 同一 `related_skill` への FIX シグナルが 3 件（閾値丁度） **WHEN** Phase 2 を実行する **THEN** FIX 集積度による優先度付けが適用される（閾値は 3 件以上、inclusive）

#### Non-Functional Requirements

- **EXTENSIBILITY**: FIX 集積度は既存の 4 つの抽出観点に追加される 5 番目の観点であり、既存観点を置換しない

---

### Requirement: REQ-005 /crystallize Phase 1 シグナルエントリ対応

`/crystallize` の Phase 1（データ収集）のサマリー表示に `type: signal` のエントリ件数を追加する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** experiential logs に compound 5 件、nurture 3 件、signal 8 件が蓄積されている **WHEN** `/crystallize` Phase 1 のサマリーを表示する **THEN** 「N 件の未結晶化エントリを収集しました（compound: 5 件, nurture: 3 件, signal: 8 件）」と表示される
- **GIVEN** サマリーを表示する **WHEN** signal エントリが含まれている **THEN** `related_skill` 別の集計も表示される（例: "related_skill 別: Prisma 3件, React 2件, ..."）

#### Error Scenarios

- **GIVEN** `type: signal` のエントリが 0 件 **WHEN** サマリーを表示する **THEN** 「signal: 0 件」と表示する（signal 行自体は省略しない）

#### Boundary Scenarios

- **GIVEN** `related_skill` の表記にばらつきがある（例: "Prisma", "prisma", "Prisma ORM"） **WHEN** `related_skill` 別の集計を表示する **THEN** 大文字小文字を無視して集計する（case-insensitive）。完全一致でない表記ゆれ（"Prisma" vs "Prisma ORM"）は別カウントとする
- **GIVEN** `related_skill` のユニーク種類数が 10 を超える **WHEN** サマリーを表示する **THEN** FIX 件数の多い上位 10 件を表示し、残りは「他 N 種類」と省略する

---

### Requirement: REQ-006 間接影響ファイルの整合性更新

implementer の変更に伴い、implementer を参照する間接影響ファイルのテンプレートやチェック項目を更新する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `commands/implement.md` の implementer プロンプト構造にある COMPLETION CRITERIA **WHEN** 本変更を適用する **THEN** 「Phase B のシグナル分類が記述済みであること」が COMPLETION CRITERIA に追加される
- **GIVEN** `agents/orchestration/implement-orchestrator.md` の implementer 起動テンプレート **WHEN** 本変更を適用する **THEN** COMPLETION CRITERIA に Phase B シグナル分類の項目が追加される
- **GIVEN** `agents/research/compound-learnings-researcher.md` のフィルタリング基準 **WHEN** 本変更を適用する **THEN** `type: signal` エントリの `signal_class` と `related_skill` によるフィルタリングが可能であることが記載される
- **GIVEN** `agents/implementation/spec-compliance-reviewer.md` の事後検証モード **WHEN** 本変更を適用する **THEN** Phase B チェック項目に「シグナル分類セクションの存在」が追加される

#### Error Scenarios

- **GIVEN** 間接影響ファイルのいずれかが存在しない **WHEN** 更新を試みる **THEN** 存在しないファイルの更新をスキップし、存在するファイルのみ更新する
