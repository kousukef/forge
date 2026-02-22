---
description: "開発から得た学びを文書化し、スペックマージとアーカイブを行い、将来の開発にフィードバックする"
disable-model-invocation: true
argument-hint: "<change-name>"
---

# /compound コマンド

## 目的

今回の開発から得た学びを文書化し、デルタスペックを累積スペックにマージし、将来の開発にフィードバックする。

## 引数の解析

$ARGUMENTS から change-name を決定する:

- 指定あり: `openspec/changes/<change-name>/` を対象とする
- 省略: `openspec/changes/` 内のアクティブ変更（`archive/` 以外）を自動検出
  - 1つ → 自動選択
  - 複数 → AskUserQuestion で選択
  - 0 → エラー（先に `/brainstorm` を実行するよう案内）

## 学習ソース

以下のファイルを学習ソースとして使用する。全て `openspec/changes/<change-name>/` 配下のファイルである。

| # | ファイル | 内容 | 必須 |
|---|---|---|---|
| 1 | `proposal.md` | 変更の意図 | No |
| 2 | `design.md` | 設計判断 | No |
| 3 | `interpretations/<task>.md` | 各タスクの判断ログ + 変更ファイル一覧 | No |
| 4 | `reviews/review-summary.md` | レビュー指摘と修正内容 | No |

### 読み込みフロー

1. `openspec/changes/<change-name>/` を基点ディレクトリとする
2. 以下の順序で各ファイルの存在チェックと読み込みを行う:
   1. `proposal.md` -- 存在すれば読み込む。存在しなければスキップし、欠落している旨を記録する
   2. `design.md` -- 存在すれば読み込む。存在しなければスキップし、欠落している旨を記録する
   3. `interpretations/*.md` -- ディレクトリ内の全 `.md` ファイルを読み込む。ディレクトリが存在しない、または中身が空の場合はスキップし、欠落している旨を記録する
   4. `reviews/review-summary.md` -- 存在すれば読み込む。存在しなければスキップする（`/review` 未実行の正常ケース）
3. 存在するファイルのみで学習を実行する。全ファイルが欠落していてもエラーにはしないが、有用な学びの抽出は限定的になる旨をユーザーに伝える

### フォールバック動作

- **proposal.md 欠落**: 存在するファイルのみで学習を実行。振り返りレポートに「proposal.md が欠落しているため、変更の意図に関する学びの抽出が限定的」と記録する
- **design.md 欠落**: 存在するファイルのみで学習を実行。振り返りレポートに「design.md が欠落しているため、設計判断に関する学びの抽出が限定的」と記録する
- **interpretations が0件**: proposal.md と design.md のみで学習を実行。振り返りレポートに「interpretations が欠落しているため、実装判断に関する学びの抽出が限定的」と記録する
- **review-summary.md 欠落**: スキップする。`/review` が実行されなかった正常ケースであり、特別な記録は不要

## ワークフロー

1. **学習ソースの読み込み**: 上記「学習ソース」セクションに従い、対象ファイルを読み込む

2. 読み込んだ学習ソースを元に、今回の開発セッションを振り返り、以下を抽出：
   - うまくいったパターン
   - 失敗して修正したこと
   - 予想外の落とし穴
   - 発見したベストプラクティス
   - 改善できるプロセス

3. `docs/compound/YYYY-MM-DD-<topic>.md` に出力（複利ドキュメント形式に従う）

4. **Learning Router** を適用：学びを分類テーブルに基づいて分類し、閾値ルールに従って更新提案を生成する
   - 各学びの `artifact-targets` を判定する
   - 重大な学びは即座に更新差分を生成して提案する
   - 繰り返し発生する学びは過去記録と照合し、2回以上なら更新を提案する
   - 更新提案はアーティファクト種別ごとにグループ化してユーザーに提示する
   - ユーザー承認後に適用する

5. **一時ファイルのクリーンアップ**: 学習抽出（ステップ1-4）が正常に完了した場合に限り、以下のディレクトリを削除する
   - `openspec/changes/<change-name>/interpretations/`
   - `openspec/changes/<change-name>/reviews/`
   - ディレクトリが存在しない場合はスキップする（エラーにしない）
   - 学習抽出が途中でエラーにより中断した場合はクリーンアップを実行しない（次回の `/compound` 実行で再利用可能にするため）

6. **スペックマージ**: `openspec/changes/<change-name>/specs/` → `openspec/specs/` にマージ
   - ADDED: `openspec/specs/<feature>/spec.md` に追記（なければ新規作成）
   - MODIFIED: 同名要件を置換
   - REMOVED: 該当要件を削除
   - マージ後は ADDED/MODIFIED/REMOVED 接頭辞を除去し累積形式にする

7. **変更アーカイブ**: `openspec/changes/<change-name>/` → `openspec/changes/archive/YYYY-MM-DD-<change-name>/` に移動

## 複利ドキュメント形式

```markdown
---
category: [bug-fix | performance | architecture | security | testing | devops | pattern | spec-gap | escalation-failure | review-gap]
stack: [nextjs | prisma | terraform | gcp | typescript | general]
severity: [critical | important | minor]
date: YYYY-MM-DD
tags: [関連タグをカンマ区切り]
artifact-targets: [rules | skills | hooks | agents | commands | spec-template | reference]
---

# [学びのタイトル]

## 何が起きたか
[状況の説明]

## なぜ起きたか
[根本原因]

## どう解決したか
[解決策]

## 教訓
[将来に向けた教訓。次回同じ状況に遭遇した場合にどうすべきか]

## 防止策と更新提案

### ルール更新
- [ ] [具体的な更新内容と対象ファイル]

### スキル更新
- [ ] [具体的な更新内容と対象ファイル]

### フック更新
- [ ] [具体的な更新内容と対象ファイル]

### エージェント定義更新
- [ ] [具体的な更新内容と対象ファイル]

### コマンドフロー更新
- [ ] [具体的な更新内容と対象ファイル]

### 仕様テンプレート更新
- [ ] [具体的な更新内容と対象ファイル]
```

## 累積スペック形式

マージ後の `openspec/specs/<feature>/spec.md` は以下の形式になる：

```markdown
# [feature] スペック

## Requirements

### Requirement: [要件名]
[RFC 2119 準拠の記述]

#### Scenario: [シナリオ名]
- **GIVEN** [前提条件]
- **WHEN** [アクション]
- **THEN** [期待結果]
```

## マージルール

- **ADDED** → 累積スペックの末尾に追加
- **MODIFIED** → 同名要件を置換
- **REMOVED** → 該当セクションを削除
- マージ結果をユーザーに提示して確認を得る

## Learning Router（学びの分類ルーティング）

学びの種別に応じて、適切なアーティファクトへの更新を自動提案する。

### 分類テーブル

| 学びの種別 | 更新対象アーティファクト | 例 |
|---|---|---|
| コーディングパターンの発見 | `rules/` または `reference/` | 「Prisma の findMany には必ず take を付ける」 |
| 仕様作成時の見落としパターン | spec-writer テンプレート / spec-validator チェックリスト | 「認証 API には必ずトークン期限切れシナリオを含める」 |
| 実装時の解釈誤りパターン | implementer の必須チェック項目 | 「"適切に処理する" という記述は常にエスカレーション対象」 |
| レビュー見落としパターン | レビュアーのチェックリスト | 「Server Actions の CSRF 対策は security-sentinel が常にチェック」 |
| ワークフロープロセスの改善 | コマンド定義 (`commands/`) | 「/implement の前に必ず型定義ファイルを先行生成する」 |
| 繰り返し発生するビルドエラー | build-error-resolver の知識ベース / フック | 「特定の import パターンでエラーが発生する → フックで検出」 |
| エスカレーション判断の誤り | implementer / spec-compliance-reviewer のエスカレーション条件 | 「DB のカスケード削除は常にエスカレーション」 |

### 閾値ルール（3段階）

| 閾値 | アクション |
|---|---|
| **重大**（100ドル超相当） | ルール / スキル / フック / エージェント定義 / コマンド / 仕様テンプレートの更新を強く提案 |
| **中程度**（繰り返し発生） | 同一種別の学びが `docs/compound/` に2回以上蓄積した場合、更新を提案 |
| **軽微**（初回発生） | `docs/compound/` に記録のみ。次回同一種別が発生した場合に中程度に昇格 |

### ルーティング手順

1. 学びを抽出し、分類テーブルに基づいて種別を判定する
2. `artifact-targets` に対応するアーティファクト種別を記録する
3. 閾値ルールに基づき更新提案の要否を判定する:
   - 重大: 即座に具体的な更新差分を生成し提案
   - 中程度: `docs/compound/` 内で同一種別の過去記録を Grep し、2回以上あれば更新差分を生成し提案
   - 軽微: 記録のみ
4. 更新提案はアーティファクト種別ごとにグループ化してユーザーに提示する
5. ユーザー承認後に適用する
