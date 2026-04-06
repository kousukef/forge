# knowledge-system デルタスペック

## ADDED Requirements

### Requirement: REQ-001 経験ログの一元蓄積ディレクトリ

全プロジェクトの経験ログを `~/.claude/docs/experiential/` 配下に一元蓄積する（SHALL）。ディレクトリ構造は以下とする:

```
~/.claude/docs/experiential/
  ├── logs/           # タグ付き経験ログ（append-only）
  ├── patterns/       # /crystallize で抽出されたパターン候補
  ├── metrics/        # メトリクス蓄積
  └── crystallization-log.md  # 結晶化の実行履歴
```

#### Happy Path Scenarios

- **GIVEN** Forge がインストール済みの環境 **WHEN** `/compound` を初回実行する **THEN** `~/.claude/docs/experiential/logs/` ディレクトリが再帰的に作成され、経験ログファイルが配置される
- **GIVEN** 複数プロジェクトで `/compound` を実行済み **WHEN** `~/.claude/docs/experiential/logs/` を参照する **THEN** 全プロジェクトのログが `YYYY-MM-DD-<project>-<topic>.md` 形式で一箇所に蓄積されている

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/` ディレクトリが存在しない **WHEN** `/compound` を実行する **THEN** ディレクトリを再帰的に作成してからログを出力する。作成に失敗した場合は `docs/compound/` にフォールバックし、ユーザーに警告を表示する
- **GIVEN** `~/.claude/docs/experiential/logs/` への書き込み権限がない **WHEN** ログを記録しようとする **THEN** `docs/compound/` にフォールバックし、権限エラーの旨をユーザーに通知する

#### Non-Functional Requirements

- **DATA_INTEGRITY**: 経験ログファイルは append-only で運用する。既存エントリの自動削除・上書きは行わない
- **COMPATIBILITY**: `docs/compound/` が存在する環境では compound-learnings-researcher のフォールバック先として参照可能な状態を維持する
- **COMPATIBILITY**: `/compound` と `/crystallize` の並行実行はサポートしない（シングルユーザー CLI を前提とする）

---

### Requirement: REQ-002 /compound 出力先の変更

`/compound` コマンドの学びの出力先を `docs/compound/YYYY-MM-DD-<topic>.md` から `~/.claude/docs/experiential/logs/YYYY-MM-DD-<project>-<topic>.md` に変更する（SHALL）。ファイルのフロントマターに `project`, `crystallized: false`, `id: exp-NNNN`, `type: compound`, `source: forge-workflow` フィールドを追加する。The `id` field uses the format `exp-NNNN` where NNNN is a zero-padded sequential number unique within each log file. Cross-file uniqueness is ensured by the combination of `id` + `project` + `date` in the filename.

#### Happy Path Scenarios

- **GIVEN** プロジェクト `my-app` で変更 `auth-refactor` の `/compound` を実行する **WHEN** 学びが抽出される **THEN** `~/.claude/docs/experiential/logs/2026-03-24-my-app-auth-refactor.md` に出力され、フロントマターに `project: my-app`, `change: auth-refactor`, `crystallized: false` が含まれる
- **GIVEN** `/compound` で学びが抽出される **WHEN** 出力ファイルを検査する **THEN** 既存の複利ドキュメント形式（5セクション構造）を維持しつつ、追加フィールド（`id`, `type`, `source`, `project`, `crystallized`）がフロントマターに含まれる

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` が存在しない **WHEN** `/compound` の学び出力を実行する **THEN** ディレクトリを再帰的に作成する。作成失敗時は `docs/compound/YYYY-MM-DD-<topic>.md`（現行パス）にフォールバックする
- **GIVEN** カレントディレクトリがプロジェクトルートではない **WHEN** `/compound` を実行する **THEN** プロジェクト名が特定できない場合は `unknown` を `project` フィールドに使用する

#### Boundary Scenarios

- **GIVEN** project name contains filesystem-unsafe characters (e.g., "my.app/v2") **WHEN** filename is generated **THEN** unsafe characters are replaced with hyphens (e.g., "2026-03-24-my-app-v2-topic.md")
- **GIVEN** topic string exceeds 50 characters **WHEN** filename is generated **THEN** the topic portion is truncated to 50 characters

---

### Requirement: REQ-003 /compound メトリクス出力先の変更

`/compound` のレビューメトリクス蓄積先を `docs/compound/metrics/review-metrics.md` から `~/.claude/docs/experiential/metrics/review-metrics.md` に変更する（SHALL）。

#### Happy Path Scenarios

- **GIVEN** `reviews/review-summary.md` が存在する状態で `/compound` を実行する **WHEN** メトリクス蓄積ステップが実行される **THEN** `~/.claude/docs/experiential/metrics/review-metrics.md` にメトリクスが追記される

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/metrics/` ディレクトリが存在しない **WHEN** メトリクス蓄積を実行する **THEN** ディレクトリを再帰的に作成してからメトリクスを出力する
- **GIVEN** metrics file write fails (permission error, disk full) **WHEN** metrics accumulation is attempted **THEN** metrics recording is skipped with a warning, and `/compound` continues without blocking

---

### Requirement: REQ-004 /compound 結晶化チェック（ステップ 4.3）

`/compound` のステップ 4（Learning Router）と 4.5（Skill 派生ファイル同期）の間に結晶化チェックステップ 4.3 を追加する（SHALL）。

1. `~/.claude/docs/experiential/logs/` 内の全 `.md` ファイルから `crystallized: false` を Grep し、未結晶化エントリ数を集計する
2. 件数が閾値（デフォルト 15 件）を超過する場合、`/crystallize` の実行を推奨する通知をユーザーに表示する
3. 現在の `/compound` で抽出した学びに `[CORRECTION]` tag criteria (as defined in REQ-005) に該当する content がある場合、即座に昇格を提案する

#### Happy Path Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` に `crystallized: false` のエントリが 20 件ある **WHEN** `/compound` のステップ 4.3 を実行する **THEN** 「未結晶化の経験ログが 20 件蓄積されています。`/crystallize` の実行を推奨します。」と通知される
- **GIVEN** 今回の `/compound` で `[CORRECTION]` tag criteria (as defined in REQ-005) に該当する学びが抽出された **WHEN** ステップ 4.3 を実行する **THEN** 該当する学びについて skills/constraints.md, hooks/, rules/ への即座の昇格が提案され、ステップ 4 の Learning Router 提案とマージしてユーザーに一括提示される
- **GIVEN** 未結晶化エントリが 10 件（閾値未満） **WHEN** ステップ 4.3 を実行する **THEN** 結晶化推奨通知は表示されない

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` ディレクトリが存在しない **WHEN** ステップ 4.3 を実行する **THEN** このステップをスキップし、エラーを出さない

#### Boundary Scenarios

- **GIVEN** 未結晶化エントリがちょうど 15 件 **WHEN** ステップ 4.3 を実行する **THEN** 結晶化推奨通知は表示されない（閾値は「超過」で判定、15 件丁度は含まない）

---

### Requirement: REQ-005 Nurturing Protocol（全対話での経験ログ自動蓄積）

`~/.claude/CLAUDE.md`（USER-CLAUDE.md）に Nurturing Protocol セクションを追加し、Forge ワークフロー外の全対話で経験ログの自動蓄積を有効にする（SHALL）。

記録対象の 6 タグ分類体系:

| タグ | 条件 | 結晶化優先度 |
|---|---|---|
| `[CORRECTION]` | ユーザーが Claude の提案を修正・却下し、理由を説明した（例: ユーザーが「そうではなく、Xすべき。なぜなら Y だから」と修正した場合）。非対象の例: ユーザーが「ありがとう」と返答した場合 | 最高 |
| `[INSIGHT]` | 対話中に再利用可能な原則が言語化された | 高 |
| `[DECISION]` | 設計・実装の判断とその理由が議論された | 中 |
| `[PATTERN]` | 複数場面で繰り返し観察されるパターンが認識された | 中 |
| `[ERROR]` | エラーが発生し根本原因が特定された | 中 |
| `[CONTEXT]` | プロジェクト固有の環境・制約情報が共有された | 低 |

Nurture ログ形式: 1 日 1 ファイル `~/.claude/docs/experiential/logs/YYYY-MM-DD-nurture.md` に `---` 区切りで追記する。各エントリは `project`, `context`, `user_said`/`reasoning`, `learning`, `tags`, `crystallized: false` フィールドを含む。

#### Happy Path Scenarios

- **GIVEN** Forge ワークフロー外の対話でユーザーが Claude の提案を修正し理由を説明した **WHEN** Claude が `[CORRECTION]` を検出する **THEN** `~/.claude/docs/experiential/logs/YYYY-MM-DD-nurture.md` に `[CORRECTION]` タグ付きエントリが追記される
- **GIVEN** ワークフロー外の対話で再利用可能な原則が言語化された **WHEN** Claude が `[INSIGHT]` を検出する **THEN** Nurture ログにエントリが追記され、`project` フィールドにカレントプロジェクト名が記録される
- **GIVEN** プロジェクト外の対話（グローバルコンテキスト）で学びが検出された **WHEN** ログを記録する **THEN** `project` フィールドに `global` と記録される

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` ディレクトリが存在しない **WHEN** Nurture ログを記録しようとする **THEN** ディレクトリとファイルを再帰的に作成する。作成に失敗した場合はログ記録をスキップし、エラーを出さない（セッションの主目的を妨げない）
- **GIVEN** 単純なファイル操作指示（「このファイルをリネームして」）の対話 **WHEN** 対話終了時に記録判断する **THEN** 記録対象外と判断し、ログを記録しない

#### Boundary Scenarios

- **GIVEN** a single session produces multiple recordable learnings **WHEN** nurture log is appended **THEN** each learning is appended as a separate entry with `---` separator (no per-session cap)
- **GIVEN** nurture log file for today already exists with entries **WHEN** new entry is recorded **THEN** the new entry is appended to the end of the existing file (not overwritten)

#### Non-Functional Requirements

- **RELIABILITY**: ログ記録の失敗はセッションの主目的を妨げてはならない（graceful degradation）
- **COMPATIBILITY**: CLAUDE.md の追記は 200 行制限を意識し、Nurturing Protocol セクションは簡潔に記述する。詳細ルールは `.claude/rules/` に `paths` なしで配置する

---

### Requirement: REQ-006 /crystallize コマンドの新規作成

プロジェクト横断のパターン抽出を行い、rules/skills/hooks に昇格させる `/crystallize` コマンドを新規作成する（SHALL）。5 つの Phase で構成する。

Phase 1（データ収集）: `~/.claude/docs/experiential/logs/` から `crystallized: false` のエントリを収集し、`--scope` に応じてフィルタリングする。

Phase 2（パターン抽出）: タグ別グループ化を行い、considering but not limited to: 繰り返し・プロジェクト横断・因果関係・Shift-Left 機会の観点でパターンを抽出する。既存 rules/skills/hooks との重複・矛盾を検出する。パターン候補を `~/.claude/docs/experiential/patterns/PAT-NNN-<name>.md` に書き出す。

Phase 3（人間レビュー）: 抽出されたパターン候補をユーザーに提示し、承認/却下/修正の選択を AskUserQuestion で確認する。

Phase 4（昇格実行）: 承認されたパターンを脱文脈化し、昇格先テーブルに基づいて rules/skills/hooks/agents/commands に反映する。`.claude/rules/` への昇格時は適切な `paths` フロントマターを自動付与する。結晶化で生成された知識には仮説タグ `<!-- hypothesis: confidence=0.7 source=crystallize-YYYY-MM-DD evidence=N -->` を付与する。

Phase 5（後処理）: 処理済みエントリの `crystallized` を `true` に更新。crystallization-log.md に実行記録を追記する。

引数:

| 引数 | 説明 | デフォルト |
|---|---|---|
| `--scope all` | 全未結晶化エントリを対象 | all |
| `--scope recent` | 直近 30 日の未結晶化エントリを対象 | - |
| `--scope tag:<tag>` | 指定タグの未結晶化エントリを対象 | - |
| `--scope project:<name>` | 指定プロジェクトの未結晶化エントリを対象 | - |
| `--dry-run` | パターン抽出のみ実行。昇格提案を生成するが適用しない | - |

#### Happy Path Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` に `crystallized: false` のエントリが 20 件存在する **WHEN** `/crystallize` を実行する **THEN** Phase 1 でエントリを収集し、サマリー（件数、プロジェクト別、タグ別）を表示する
- **GIVEN** Phase 2 で 3 件のパターン候補が抽出された **WHEN** Phase 3 で全て承認される **THEN** Phase 4 で各パターンが脱文脈化され、昇格先テーブルに基づいて rules/skills/hooks に反映され、仮説タグが付与される
- **GIVEN** `/crystallize --scope tag:CORRECTION` を実行する **WHEN** `[CORRECTION]` タグのエントリのみが収集される **THEN** `[CORRECTION]` タグに絞ったパターン抽出が実行される
- **GIVEN** `/crystallize --dry-run` を実行する **WHEN** パターン抽出が完了する **THEN** 昇格提案が表示されるが、ファイルへの変更は一切行われない
- **GIVEN** Phase 4 で `.claude/rules/` に新規ルールを昇格する **WHEN** パターンが特定プロジェクトのみに適用される **THEN** プロジェクトレベル `.claude/rules/` にディレクトリ glob 付き `paths` で配置される
- **GIVEN** Phase 4 で `.claude/rules/` に新規ルールを昇格する **WHEN** パターンが特定言語・フレームワーク全般に適用される **THEN** ユーザーレベル `~/.claude/rules/` に拡張子・ファイル名 glob の `paths` で配置される
- **GIVEN** Phase 5 が完了する **WHEN** crystallization-log.md を確認する **THEN** スキャン対象件数、パターン抽出件数（プロジェクト横断件数含む）、承認・昇格件数、昇格先の詳細が記録されている

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` ディレクトリが存在しない **WHEN** `/crystallize` を実行する **THEN** 「経験ログが見つかりません。`/compound` を実行して経験を蓄積してください。」と表示して終了する
- **GIVEN** `crystallized: false` のエントリが 0 件 **WHEN** `/crystallize` を実行する **THEN** 「未結晶化のエントリがありません。」と表示して終了する
- **GIVEN** Phase 3 でユーザーが全パターンを却下した **WHEN** Phase 4 に進む **THEN** 昇格実行をスキップし、Phase 5 で却下されたパターンの status を `rejected` に更新する
- **GIVEN** Phase 4 で昇格先ファイルへの書き込みに失敗した **WHEN** エラーが発生する **THEN** 失敗した昇格をスキップし、残りの昇格を続行する。失敗した件はユーザーに通知する

#### Boundary Scenarios

- **GIVEN** `--scope recent` is specified **WHEN** an entry's date is exactly 30 days ago **THEN** the entry is included (30-day boundary is inclusive)
- **GIVEN** 0 undissolved entries match `--scope tag:CORRECTION` **WHEN** `/crystallize --scope tag:CORRECTION` is executed **THEN** "No undissolved entries found for the specified scope" is displayed

#### Non-Functional Requirements

- **DATA_INTEGRITY**: Phase 5 での `crystallized: true` 更新は、Phase 4 の昇格実行が正常に完了したエントリのみに適用する。途中失敗した場合は `crystallized: false` を維持する

---

### Requirement: REQ-007 仮説検証ループ

結晶化で rules/skills/hooks に追加された知識にコメント形式の仮説メタデータを付与し、経験に基づいて confidence スコアを更新する（SHALL）。

初期値: `confidence=0.7`, `evidence=N`（N は結晶化時の根拠エントリ数）

ライフサイクル:
- ユーザーがこの知識に基づく出力を承認 → evidence +1, confidence +0.05
- ユーザーがこの知識に基づく出力を修正 → evidence +1, confidence -0.15
- confidence >= 0.9 → 仮説タグを削除（確立された知識）
- confidence <= 0.4 → 次回 `/crystallize` で再検討候補に含める

検証タイミング: `/compound` の Learning Router が学びを処理する際に、関連する仮説タグ付き知識が存在すれば、確認・矛盾を判定してメタデータを更新する。

#### Happy Path Scenarios

- **GIVEN** `/crystallize` で skills/SKILL.md に仮説タグ付きの知識が追加された（confidence=0.7, evidence=3） **WHEN** 次回の `/compound` で同じ知識に基づく出力がユーザーに承認された **THEN** confidence が 0.75 に更新され、evidence が 4 に更新される
- **GIVEN** 仮説タグ付きの知識の confidence が 0.9 に達した **WHEN** `/compound` の Learning Router が処理する **THEN** 仮説タグが削除され、確立された知識として扱われる
- **GIVEN** 仮説タグ付きの知識の confidence が 0.4 以下になった **WHEN** `/crystallize` を実行する **THEN** 該当知識が再検討候補として Phase 3 でユーザーに提示される

#### Error Scenarios

- **GIVEN** 仮説タグのフォーマットが不正（手動編集により破損） **WHEN** `/compound` の Learning Router が処理しようとする **THEN** 不正なタグを無視し、ユーザーにタグの修正を促すメッセージを表示する

#### Boundary Scenarios

- **GIVEN** confidence が 0.85 の仮説 **WHEN** ユーザーが出力を承認する（+0.05） **THEN** confidence が 0.9 になり、仮説タグが削除される
- **GIVEN** confidence が 0.55 の仮説 **WHEN** ユーザーが出力を修正する（-0.15） **THEN** confidence が 0.4 になり、再検討候補としてマークされる

#### Non-Functional Requirements

- **DATA_INTEGRITY**: Confidence score updates SHALL be idempotent. Processing the same `/compound` output twice SHALL NOT double-count evidence.

---

### Requirement: REQ-008 compound-learnings-researcher の検索対象変更

compound-learnings-researcher エージェントの検索対象を `docs/compound/` から `~/.claude/docs/experiential/logs/` に変更する（SHALL）。`docs/compound/` はフォールバック先として維持する。Nurture ログも検索対象に含め、タグと #tags でフィルタリングする。`project` フィールドで現プロジェクトの学びを優先しつつ、他プロジェクトの関連する学びも含める。

#### Happy Path Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` にログが存在する **WHEN** compound-learnings-researcher がスキャンを実行する **THEN** `~/.claude/docs/experiential/logs/` の全 `.md` ファイルがスキャン対象となり、フロントマターの category, stack, tags でフィルタリングされる
- **GIVEN** Nurture ログ（`YYYY-MM-DD-nurture.md`）に関連するエントリがある **WHEN** compound-learnings-researcher がフィルタリングする **THEN** タグ（`[CORRECTION]`, `[INSIGHT]` 等）と #tags でフィルタリングされ、関連する経験が抽出される
- **GIVEN** 現プロジェクト「my-app」の学びと他プロジェクト「other-app」の関連する学びがある **WHEN** compound-learnings-researcher が結果を返す **THEN** `project: my-app` のエントリが優先表示され、`project: other-app` の関連エントリも含まれる

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/logs/` ディレクトリが存在しない **WHEN** compound-learnings-researcher がスキャンを開始する **THEN** `docs/compound/` にフォールバックして検索する
- **GIVEN** `~/.claude/docs/experiential/logs/` と `docs/compound/` の両方が存在しない **WHEN** compound-learnings-researcher がスキャンする **THEN** 「関連する過去の学びはありません」と明示する

---

### Requirement: REQ-009 reference/ から .claude/rules/ への移行

`reference/` に配置されているルールファイルを `.claude/rules/` に移行し、Claude Code の自動ロード機能を活用する（SHALL）。

移行対象:

| 移行元 | 移行先 | paths |
|---|---|---|
| `reference/coding-standards.md` | `.claude/rules/coding-standards.md` | プロジェクトの構造に応じて調整（ソースコードが存在しないプロジェクトでは `paths` なし） |
| `reference/common/testing.md` | `.claude/rules/testing.md` | プロジェクトの構造に応じて調整（テストファイルが存在しないプロジェクトでは `paths` なし） |
| `reference/core-rules.md` | `.claude/rules/core-rules.md` | `paths` なし（常時ロード） |
| `reference/workflow-rules.md` | `.claude/rules/workflow-rules.md` | `paths` なし（常時ロード） |
| `reference/context-isolation.md` | `.claude/rules/context-isolation.md` | `paths` なし（常時ロード） |

移行方針:
- プロセス系ルール（core-rules, workflow-rules, context-isolation）は `paths` なし（常時ロード）
- ファイル種別に紐づくルール（coding-standards, testing）は、プロジェクトのソースコード構造が存在する場合のみ `paths` 付き。Forge 本体のようにソースコードがないプロジェクトでは `paths` なし
- `reference/` ディレクトリは削除せず、長文リファレンスや補足資料の配置先として残す

#### Happy Path Scenarios

- **GIVEN** `reference/core-rules.md` が `.claude/rules/core-rules.md` に移行済み **WHEN** 新しいセッションを開始する **THEN** `.claude/rules/core-rules.md` が `paths` なしルールとして毎セッション自動ロードされる
- **GIVEN** `reference/coding-standards.md` が `.claude/rules/coding-standards.md` に `paths: ["src/**/*.{ts,tsx}"]` 付きで移行済み **WHEN** `src/` 配下の TypeScript ファイルを操作する **THEN** coding-standards ルールが自動ロードされる
- **GIVEN** 移行後の `.claude/rules/` にルールが配置されている **WHEN** CLAUDE.md の Rules セクションを確認する **THEN** 手動読み込み指示テーブルが自動ロード説明に置き換わっている

#### Error Scenarios

- **GIVEN** `.claude/rules/` ディレクトリが存在しない **WHEN** 移行を実行する **THEN** ディレクトリを作成してからルールファイルを配置する
- **GIVEN** Forge プロジェクト自体（ソースコードなし）で移行を実行する **WHEN** coding-standards.md の `paths` を決定する **THEN** ソースコードディレクトリが存在しないため `paths` なし（常時ロード）とする

#### Non-Functional Requirements

- **COMPATIBILITY**: 移行後も `reference/` ディレクトリは削除せず、長文リファレンスや補足資料の配置先として残す。`.claude/rules/` のルールから `<!-- 詳細は reference/xxx.md を参照 -->` で参照可能とする

---

### Requirement: REQ-010 CLAUDE.md の Experiential Learning セクション更新

Forge 本体の `CLAUDE.md` の Compound Learning セクションを Experiential Learning セクションに更新する（SHALL）。経験データの一元蓄積先、`/compound` と `/crystallize` の役割、ディレクトリ構造を記載する。

#### Happy Path Scenarios

- **GIVEN** CLAUDE.md を更新する **WHEN** Compound Learning セクションを Experiential Learning に置き換える **THEN** `~/.claude/docs/experiential/` のディレクトリ構造、`/compound` の役割（変更単位の学び抽出 + 結晶化チェック）、`/crystallize` の役割（プロジェクト横断パターン抽出 + 昇格）がテーブル形式で記載される
- **GIVEN** CLAUDE.md の Rules セクションを更新する **WHEN** reference/ → .claude/rules/ 移行後の状態を反映する **THEN** 手動読み込み指示テーブルが自動ロード説明に置き換わり、`paths` なしルールと `paths` 付きルールの区別が説明される

#### Error Scenarios

- **GIVEN** CLAUDE.md の更新時 **WHEN** Document Sync Rules に違反する変更を検出する **THEN** commands/ や agents/ の関連セクションも同時に確認・更新する

---

### Requirement: REQ-011 CLAUDE.md Rules セクションの更新

CLAUDE.md の Rules セクションから手動読み込み指示テーブルを削除し、`.claude/rules/` の自動ロード説明に置き換える（SHALL）。`rules/core-essentials.md` は従来通り常時読み込み。

#### Happy Path Scenarios

- **GIVEN** `.claude/rules/` に移行済みルールが配置されている **WHEN** CLAUDE.md の Rules セクションを確認する **THEN** `paths` なしのルール（core-rules, workflow-rules, context-isolation）は毎セッション自動ロード、`paths` 付きのルール（coding-standards, testing）は対象ファイル操作時に自動ロードと説明されている

#### Error Scenarios

- **GIVEN** Rules セクション更新時 **WHEN** `rules/core-essentials.md` の `reference/context-isolation.md` 参照を確認する **THEN** 参照先を `.claude/rules/context-isolation.md` に更新する

---

### Requirement: REQ-012 間接影響ファイルのパス参照更新

`/compound` 出力先変更と `reference/` → `.claude/rules/` 移行に伴い、間接影響を受けるファイルのパス参照を更新する（SHALL）。

更新対象:

| ファイル | 更新内容 |
|---|---|
| `commands/ship.md` | 完了レポートの `docs/compound/` パスを `~/.claude/docs/experiential/logs/` に更新 |
| `commands/spec.md` | compound-learnings-researcher の `docs/compound/` 参照（3 箇所）を更新 |
| `reference/workflow-rules.md` | Compound Learning セクション + `docs/compound/` パス参照を更新 |
| `rules/core-essentials.md` | `reference/context-isolation.md` 参照を `.claude/rules/context-isolation.md` に更新 |
| `agents/orchestration/implement-orchestrator.md` | `reference/` 言及を `.claude/rules/` に更新 |

#### Happy Path Scenarios

- **GIVEN** 全間接影響ファイルのパス参照を更新する **WHEN** プロジェクト全体で `docs/compound/` を Grep する **THEN** 新規出力パスへの参照に置き換わっており、旧パスへの参照は compound-learnings-researcher のフォールバック説明のみに残る
- **GIVEN** 全間接影響ファイルのパス参照を更新する **WHEN** プロジェクト全体で `reference/context-isolation` を Grep する **THEN** `.claude/rules/context-isolation` に置き換わっている

#### Error Scenarios

- **GIVEN** パス参照更新で漏れがある **WHEN** 横断 Grep チェックを実行する **THEN** 漏れたファイルを検出し、追加で更新する

---

### Requirement: REQ-013 既存データのマイグレーション手順ドキュメント

各プロジェクトの `docs/compound/` に存在する既存データの移行手順を design.md 内に記載する（SHALL）。自動マイグレーションは行わず、ユーザーが手動で実行判断する手順を提供する。

手順:
1. `~/.claude/docs/experiential/logs/` にコピーする
2. ファイル名にプロジェクト名を追加する（`YYYY-MM-DD-<topic>.md` → `YYYY-MM-DD-<project>-<topic>.md`）
3. フロントマターに `project: <project-name>` と `crystallized: false` を追加する
4. `docs/compound/metrics/` → `~/.claude/docs/experiential/metrics/` にコピーする
5. 移行後も `docs/compound/` は削除しない（後方互換性のため保持）

#### Happy Path Scenarios

- **GIVEN** `docs/compound/` に既存ログが 5 件ある **WHEN** マイグレーション手順に従って移行する **THEN** `~/.claude/docs/experiential/logs/` に 5 件のファイルがプロジェクト名付きファイル名で配置され、各ファイルに `project` と `crystallized: false` フィールドが追加されている

#### Error Scenarios

- **GIVEN** `docs/compound/` が存在しない **WHEN** マイグレーション手順を実行しようとする **THEN** 「移行対象のデータがありません」と表示し、手順をスキップする
- **GIVEN** `docs/compound/` contains files without `crystallized` field (pre-migration format) **WHEN** migration procedure is followed **THEN** the procedure includes adding `crystallized: false` to all migrated files' frontmatter

---

### Requirement: REQ-014 パターン候補のフォーマット定義

`/crystallize` で抽出されるパターン候補ファイル（`~/.claude/docs/experiential/patterns/PAT-NNN-<name>.md`）のフォーマットを定義する（SHALL）。

```
---
id: PAT-NNN
title: "[パターン名]"
status: pending | approved | rejected
source_entries: [exp-NNNN, ...]
source_projects: [project-A, project-B]
evidence_count: N
cross_project: true | false
proposed_target: [昇格先パス]
date: YYYY-MM-DD
---
```

セクション構成: 観察されたパターン、根拠となる経験、汎化された原則（脱文脈化済み）、昇格提案

#### Happy Path Scenarios

- **GIVEN** `/crystallize` の Phase 2 でパターンが抽出される **WHEN** パターン候補ファイルを生成する **THEN** 上記フォーマットに準拠し、`status: pending` で `~/.claude/docs/experiential/patterns/` に書き出される
- **GIVEN** Phase 3 でパターンが承認された **WHEN** Phase 5 で後処理する **THEN** status が `approved` に更新される

#### Error Scenarios

- **GIVEN** `~/.claude/docs/experiential/patterns/` ディレクトリが存在しない **WHEN** パターン候補を書き出す **THEN** ディレクトリを再帰的に作成する

---

## MODIFIED Requirements

### Requirement: REQ-015 累積スペック remove-domain-content REQ-006 の参照更新

`openspec/specs/remove-domain-content/spec.md` の REQ-006 が `reference/` への追加をガイダンスとして記載している。`.claude/rules/` への移行後、拡張ガイダンスの記述を実態に合わせて更新する（SHOULD）。

**変更理由**: `reference/` → `.claude/rules/` 移行により、REQ-006 の「リファレンスは `reference/` に追加」というガイダンスが移行後の実態と乖離するため。

#### Happy Path Scenarios

- **GIVEN** REQ-006 の拡張ガイダンスを更新する **WHEN** CLAUDE.md の拡張方法案内セクションを確認する **THEN** `.claude/rules/` への配置方法（`paths` 付き/なしの使い分け含む）がガイダンスに含まれ、`reference/` は補足資料用途として記載されている

#### Error Scenarios

- **GIVEN** REQ-006 の更新が累積スペックの他の要件と矛盾する **WHEN** 更新内容を確認する **THEN** 矛盾を検出し、整合性を保つように調整する

---

## REMOVED Requirements

（なし）
