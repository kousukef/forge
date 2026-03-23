# add-pr-review-learning-loop 技術設計

## 概要

`/handle-pr-review` コマンドに Step 7「学習ループ」を追加し、PRレビュー指摘から学びを自動抽出・記録し、プロジェクト側のレビュアー定義の更新を提案する仕組みを導入する。

本変更は Markdown ファイルへの記述追加が主体であり、プログラムコードの実装は含まない。対象ファイルは `commands/handle-pr-review.md` の1ファイルのみ。

## リサーチサマリー

### 公式ドキュメントからの知見

- **コマンド定義パターン**: frontmatter は YAML + Markdown body の2部構成。`$ARGUMENTS` で全引数を受け取り、本文内でパースする。`$ARGUMENTS[N]` や `$N` で個別引数にアクセス可能
- **`argument-hint` フィールド**: オートコンプリート時に表示されるヒント文字列。handle-pr-review.md は現在 `argument-hint` を持たないため、`"<pr-number> [--no-learn]"` として追加すべき
- **`arguments` 配列形式**: handle-pr-review.md が使用する `arguments` 配列形式は公式ドキュメントに記載がなく、Forge プロジェクト独自の拡張と思われる。`--no-learn` のようなフラグは `$ARGUMENTS` から本文内でパースする方式が標準パターン
- **`--no-verify` の先行例**: `commands/commit.md` は frontmatter に引数定義なし。本文の "Command Options" セクションで `--no-verify` を記述し、`$ARGUMENTS` から手動パースしている
- **エージェント定義の構造**: frontmatter に `name`（必須）, `description`（必須）, `tools`, `model`, `skills` 等。`description` は Claude がいつ委譲すべきか判断するための説明で、セマンティック判定に使用される
- **GitHub CLI**: `gh pr view {pr} --json reviews,reviewThreads` で基本データ取得。Step 7 の学習抽出は取得済みデータの分析のみで追加 API コール不要

### Web検索からの知見

- **最新ツールの学習ループ実装**:
  - CodeRabbit: チャットフィードバックから「Learnings」を自動生成し、将来のレビューに反映。リポジトリ/Org レベルで記憶を保持
  - Greptile: エンジニアのPRコメントを読み取りコーディング標準を学習。リアクションで有用なコメント種別を推論し、カスタムルールを自動生成
  - Bito: 提案を「irrelevant」に3回マークすると自動でカスタムルール作成
- **指摘パターン分類の学術研究**:
  - Atlassian 6カテゴリ: Readability / Bugs / Maintainability / Design 等。LLM-as-a-Judge で自動分類
  - Li et al. (SEKE 2017): 4カテゴリ x 11サブカテゴリの2段階分類
  - 業界標準では 5-10 カテゴリが適切。多すぎると分類の曖昧性が増し、少なすぎると有用性が下がる
- **Compound Engineering パターン**: 各作業単位が次の作業を容易にする4フェーズループ（Plan -> Work -> Review -> Compound）。学びをエージェント指示に体系化し「収穫逓増」に転換
- **既知の落とし穴**:
  - AIレビューコメントの75%は開発者に「対応されない」（arXiv 2025）。分類粒度と行動喚起力が重要
  - 過剰分類: 全ての指摘から学びを抽出するとノイズが増える
  - レビュアー定義の品質: 自動生成は品質が低くなりがち。ユーザー承認を必須にすることで品質担保
- **閾値なし設計の妥当性**: Bito は3回で自動ルール化するが、Forge は常時提案+ユーザー承認制なので、閾値不要の proposal.md の設計方針は合理的

### コードベース分析（既存スペックとの関連含む）

**直接変更対象ファイル（1箇所）:**

1. `commands/handle-pr-review.md` -- Step 7「学習ループ」の追加、`--no-learn` 引数の追加、`argument-hint` の追加、Workflow Summary の更新

**間接的に影響を受けるファイル: なし**

以下は意図的に変更しない:

- `commands/compound.md` -- Learning Router は /compound の責務。/handle-pr-review は独自の軽量学習ループを持つ。compound.md の分類テーブルとの親和性は保つが、閾値ルールは適用しない（proposal.md のスコープ外）
- `agents/review/` 配下 -- レビュアー定義の更新は Step 7 の実行時にプロジェクト側で行う。Forge 本体のレビュアーは変更しない
- `docs/compound/` -- 学びの記録先はプロジェクト側。Forge 本体の compound ディレクトリは変更しない

**`/review` Step 7 との責務区別（重要）:**

`/review` の Step 7 に既に「レビュー学習ループ」が存在する。両者は類似した機構（学び抽出 -> 記録 -> レビュアー更新提案）を持つが、以下の点で明確に異なる:

| 観点 | `/review` Step 7 | `/handle-pr-review` Step 7 |
|---|---|---|
| 学習ソース | Forge のLLMレビュー指摘 | 外部PRレビュー（人間/bot）の指摘 |
| 記録先 | Forge 本体 `docs/compound/` | プロジェクト側（動的判断） |
| 閾値ルール | Learning Router の閾値適用 | 閾値なし（常に記録・提案） |
| トリガー | レビュー却下時 | 全指摘修正後 |

Step 7 の記述に「本ステップは外部PRレビュー指摘に対する学習ループであり、/review の学習ループ（Forge LLMレビュー指摘に対するもの）とは異なる」と明記する。

**既存スペックとの関連:**

- `openspec/specs/command-args/spec.md`: `--no-learn` フラグの追加と `argument-hint` の追加が必要。既存の引数パターンに準拠する
- `openspec/specs/doc-sync/spec.md`: handle-pr-review.md は `commands/` 配下のため、Document Sync Rules に該当する可能性がある。ただし CLAUDE.md の更新は不要（学習ループの追加は CLAUDE.md の Available Agents や Forge ワークフローに影響しない）
- 直接関連する既存の累積スペックはなし（`/handle-pr-review` に関する既存スペックは存在しない）

**`arguments` frontmatter 形式の一貫性:**

handle-pr-review.md は唯一 `arguments` 配列形式を使用している。他のコマンドは `argument-hint` + 本文内 `$ARGUMENTS` パース。`--no-learn` 追加にあたり:
- 既存の `arguments` 配列はそのまま維持する（後方互換性）
- `argument-hint: "<pr-number> [--no-learn]"` を frontmatter に追加する（オートコンプリート対応）
- `--no-learn` の検出は Step 7 冒頭で `$ARGUMENTS` から行う（`commit.md` の `--no-verify` パターンに準拠）

### 過去の学び

1. **既存パターン準拠が仕様精度を高める**（doc-sync-check 教訓）-- review-aggregator.md パターンを踏襲して doc-sync-reviewer を作成した結果、interpretation での曖昧性がゼロだった。レビューエージェント追加時は既存の review-aggregator パターンを必ず踏襲すべき
2. **横断整合性テーブルを仕様に含める**（3回成功パターン）-- delta-spec にファイル間整合性テーブルを含める。今回は変更対象が1ファイルのみだが、概念間の整合性を重点的にカバー
3. **横断チェックタスクは必須**（remove-domain-skills で3回ルール発動）-- 最終タスクに横断チェックを配置
4. **概念変更は横断 grep で残存確認が必要**（change-commit-timing 教訓）-- `/handle-pr-review` が既存コマンドのフロー（特に /compound）と概念的に関連するため整合性チェックが重要
5. **形式統一テーブルは設計段階で作るべき**（doc-sync-check 教訓）-- delta-spec にファイル間整合性テーブルを含める
6. **YAGNI はセキュリティ防御策に適用しない**（compound 教訓）-- ユーザー確認フローは省略しない（学び記録先の作成、レビュアー更新、コミット判断）
7. **argument-hint は全コマンドに必須**（add-command-arguments 教訓）-- `/handle-pr-review` にも `argument-hint` を含める
8. **レビューエージェント追加時は動的検出の仕組みを活用**（remove-domain-skills 教訓）-- `agents/review/` に追加すれば自動認識される設計
9. **/compound との整合性確認**（traceability 教訓）-- 学びの記録フローが既存の `/compound` コマンドの Compound Learning ルーティング方式と矛盾しないこと

## 技術的アプローチ

### 1. frontmatter の更新（commands/handle-pr-review.md）

`argument-hint` の追加と `--no-learn` のドキュメント化を行う。

**変更内容:**

```yaml
---
description: "PRレビューコメントを分析し、修正・コミット・プッシュ・スレッド返信を行う"
disable-model-invocation: true
allowed-tools: Bash(gh *), Bash(git *), Grep, Read, Edit, Write, Glob
argument-hint: "<pr-number> [--no-learn]"
arguments:
  - name: pr
    description: PR number to handle review comments for
    required: true
---
```

**引数解析**: Step 7 の冒頭で `$ARGUMENTS` に `--no-learn` が含まれているか判定する。`commit.md` の `--no-verify` パターンに準拠。

### 2. Step 7: 学習ループ（commands/handle-pr-review.md）

Step 6（スレッド返信）の後に Step 7「学習ループ」を追加する。

**冒頭の明確化**: 「本ステップは外部PRレビュー（人間/bot）の指摘に対する学習ループです。/review の学習ループ（Forge LLMレビュー指摘に対するもの）とは異なります。記録先はプロジェクト側です。」

**処理フロー:**

1. **スキップ判定**: `--no-learn` フラグが指定されていれば「学習ループをスキップしました（--no-learn）」と出力してスキップ
2. **指摘分析**: Step 2 で分析したレビューコメントと Step 3 で実施した修正内容を照合
3. **種別分類**: 各指摘をコーディングパターン / 設計・アーキテクチャ / テスト不足 / ドキュメント不整合 / セキュリティ / パフォーマンス / その他 に分類
4. **学び抽出**: 指摘パターンから「何が問題だったか」「なぜ発生したか」「どう防止できるか」を抽出
5. **記録先判断**: プロジェクトの既存構造を走査して記録先を動的に決定
   - 走査順序: `docs/compound/` -> `docs/learnings/` -> `.claude/learnings/` -> `docs/`
   - 見つからない場合: `docs/compound/` の作成を提案
6. **学び記録**: `YYYY-MM-DD-pr-<pr-number>-learnings.md` 形式で記録
7. **レビュアー更新提案**: 指摘パターンに基づき、プロジェクトの `agents/review/` 配下のレビュアー定義の更新 or 新規作成を提案
8. **ユーザー確認**: 各提案に対して承認/拒否を選択
9. **コミット判断**: 学び記録・レビュアー更新のコミット方法をユーザーに確認
10. **サマリー出力**: 記録した学びの概要をターミナルに出力

**スコープ制限**: プロジェクト側のファイルのみを対象とする。Forge 本体（`~/.claude/` 配下や Forge リポジトリ自体）は変更しない。

**エラーハンドリング**: Step 7 内の各サブステップが失敗しても、/handle-pr-review 全体をブロックしない。エラーログを出力して次のサブステップに進む。

### 3. 学び記録の形式

compound.md の複利ドキュメント形式との親和性を持つ形式を採用する。プロジェクトに既存の学び記録形式がある場合はそちらを優先する。

```markdown
---
source: pr-review
pr: <pr-number>
date: YYYY-MM-DD
categories: [コーディングパターン, セキュリティ]
---

# PR #<pr-number> レビューからの学び

## 指摘サマリー

| # | 指摘内容 | 種別 | 修正内容 |
|---|---|---|---|
| 1 | [指摘の要約] | [種別] | [修正の要約] |

## 学び

### [学びのタイトル]
- **何が問題だったか**: [問題の説明]
- **なぜ発生したか**: [根本原因]
- **どう防止できるか**: [防止策]
```

### 4. レビュアー更新提案の形式

提案はターミナルに以下の形式で表示する:

```
=== レビュアー更新提案 ===

[提案 1] 既存レビュアー更新: <reviewer-name>
  追加チェック項目: <具体的な項目>
  理由: <指摘パターンに基づく根拠>
  -> 承認 (y) / 拒否 (n)?

[提案 2] 新規レビュアー作成: <new-reviewer-name>
  対象: <チェック対象の説明>
  理由: <既存レビュアーでカバーされていない観点>
  -> 承認 (y) / 拒否 (n)?
```

### 5. 新規レビュアーのテンプレート

プロジェクトの `agents/review/` 配下に既存レビュアーが存在する場合、そのパターン（frontmatter 構造、セクション構成、出力形式）を踏襲する。存在しない場合は以下の Forge 標準テンプレートを使用する:

```yaml
---
name: <reviewer-name>
description: "<指摘パターンに基づく説明>"
model: opus
tools: [Read, Grep, Glob]
skills: [iterative-retrieval]
---

# <Reviewer Name>

## 役割
[レビュアーの責務]

## 処理手順
[Step N 形式]

## 出力形式
[review-aggregator 入力仕様に準拠: 指摘番号、レビュアー名、優先度、確信度、対象ファイル、指摘内容、推奨修正、関連仕様]
```

### 6. Workflow Summary の更新

既存の Workflow Summary に Step 7 を追加する:

```
7. レビュー指摘から学びを抽出・記録し、レビュアー更新を提案（`--no-learn` でスキップ）
```

## 受入テスト計画

### US-001: PRレビュー指摘の修正後に学びが自動的に抽出・記録される

- **テストレベル**: L1
- **GIVEN** commands/handle-pr-review.md に Step 7「学習ループ」が定義されている **WHEN** Step 7 の内容を検証する **THEN** レビュー指摘の分析、指摘パターンの種別分類、学びの抽出・記録、記録先の動的判断、サマリー出力のワークフローが記述されており、記録先不在時のフォールバック（ディレクトリ作成提案）が明記されている
- **GIVEN** commands/handle-pr-review.md の Step 7 にコミット判断フローが定義されている **WHEN** コミット判断の内容を検証する **THEN** コミット方法の選択肢（PRに追加コミット / ワーキングツリーに残す）が記述されており、`git push` 失敗時のリカバリ手順案内と変更なし時のスキップが明記されている

### US-002: レビュアー定義の更新がプロジェクト側に提案される

- **テストレベル**: L1
- **GIVEN** commands/handle-pr-review.md の Step 7 にレビュアー更新提案が定義されている **WHEN** 提案フローの内容を検証する **THEN** 既存レビュアーの更新提案と新規レビュアーの作成提案が記述されており、各提案に対して承認/拒否の選択が可能で、提案内容がターミナルに表示される形式で記述されている

### US-003: `--no-learn` フラグで学習ループをスキップできる

- **テストレベル**: L1
- **GIVEN** commands/handle-pr-review.md の frontmatter に `argument-hint` と `--no-learn` 関連の記述がある **WHEN** フラグ定義と Step 7 のスキップ条件を検証する **THEN** `argument-hint` に `[--no-learn]` が含まれ、Step 7 の冒頭で `--no-learn` 判定とスキップメッセージ出力が記述されている

## リスクと注意点

### 未解決の疑問点への解決案

**1. プロジェクト側に学びの記録先が存在しない場合のディレクトリ構造**

解決案: 走査順序（`docs/compound/` -> `docs/learnings/` -> `.claude/learnings/` -> `docs/`）で既存ディレクトリを検索し、見つからない場合は `docs/compound/` を提案する。compound.md の学び形式との親和性が最も高いため。

**2. 指摘パターンの種別分類の粒度**

解決案: 7種別（コーディングパターン / 設計・アーキテクチャ / テスト不足 / ドキュメント不整合 / セキュリティ / パフォーマンス / その他）。Atlassian の6カテゴリ研究や compound.md の Learning Router 分類テーブルとの対応関係を維持しつつ、/handle-pr-review に特化した粒度に調整。Web検索結果からも 5-10 カテゴリが適切とされており、7種別は妥当な範囲。

**3. レビュアー新規作成時のテンプレート形式**

解決案: プロジェクトの既存レビュアーパターンを優先し、存在しない場合は Forge 標準テンプレート（doc-sync-reviewer.md 相当）をベースにする。review-aggregator の入力仕様（指摘ID、優先度、確信度、対象ファイル、指摘内容、推奨修正、関連仕様）に準拠する。

### 変更対象が1ファイルのリスク

handle-pr-review.md は `disable-model-invocation: true` であり、コマンド定義の Markdown テキストが直接 LLM のプロンプトとして機能する。Step 7 の記述が曖昧だと実行時の振る舞いが不安定になる。

**対策**: Step 7 の各サブステップを具体的に記述し、判断基準を明確にする。既存の Step 1-6 の記述スタイル（具体的なコマンド例、判断基準の列挙）を踏襲する。

### `/review` Step 7 との責務重複

`/review` の Step 7 と `/handle-pr-review` の Step 7 は類似した機構を持つが、学習ソース・記録先・閾値ルールが異なる。混同を防ぐため、Step 7 の冒頭に明確な区別を記述する。

### 学びの記録とレビュアー更新のスコープ

proposal.md で「Forge 本体は変更しない」と明記されている。学びの記録先判断やレビュアー更新提案で、誤って Forge 本体のファイルを変更対象にしないよう注意が必要。

**対策**: Step 7 の記述に「プロジェクト側のファイルのみを対象とする。Forge 本体（`~/.claude/` 配下や Forge リポジトリ自体）は変更しない」と明記する。

### `arguments` frontmatter 形式の一貫性

handle-pr-review.md は唯一 `arguments` 配列形式を使用している。今回は既存の `arguments` 配列を維持しつつ `argument-hint` を追加することで、後方互換性とオートコンプリート対応を両立する。`arguments` 配列形式の統一は本変更のスコープ外とする。
