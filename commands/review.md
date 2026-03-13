---
description: "実装済みコードをSpec-Awareレビュー（仕様コンテキスト注入 + 動的レビュアー選択 + カバレッジマトリクス）で多角的にレビューする"
disable-model-invocation: true
argument-hint: "<change-name>"
---

# /review コマンド

REQUIRED SKILLS:
- forge-skill-orchestrator

## 目的

実装済みコードを仕様準拠の観点を含めて多角的にレビューする。
delta-spec と design.md をレビュアーに必須入力として提供し、設計意図を理解した上でのレビューを実現する。

## 引数の解析

$ARGUMENTS から change-name を決定する:

- 指定あり: `openspec/changes/<change-name>/` を対象とする
- 省略: `openspec/changes/` 内のアクティブ変更（`archive/` 以外）を自動検出
  - 1つ → 自動選択
  - 複数 → AskUserQuestion で選択
  - 0 → エラー（先に `/brainstorm` を実行するよう案内）

## ワークフロー

### Step 0: L1/L2 自動チェック

LLM レビュアー起動前に、機械的に検出可能な問題を先行チェックする。

1. **L0: ドキュメント同期チェック**
   - プロジェクトの CLAUDE.md を Read し、`## Document Sync Rules` セクションの存在を確認
   - セクションが存在しない場合: `L0 (doc-sync): skipped (no rules found)` を記録しスキップ
   - セクションが存在する場合:
     1. ルールの自然言語記述を取得する
     2. `git diff --stat` の変更ファイル一覧とルールのマッピングを照合する
     3. マッピングに該当する変更がある場合: 対応するドキュメントが `git diff --stat` に含まれているか確認
        - 含まれている: `L0 (doc-sync): PASS` を記録
        - 含まれていない: `L0 (doc-sync): WARNING -- 以下のドキュメントが未更新: [ファイル一覧]` を記録
     4. マッピングに該当する変更がない場合: `L0 (doc-sync): PASS (no matching files)` を記録
   - L0 は WARNING のみ出力しブロッキングしない。doc-sync-reviewer が内容を精査して最終判断する

2. **L1: 型チェック**
   - プロジェクトの型チェッカーを実行（存在する場合）
   - 例: package.json の scripts、設定ファイル（tsconfig.json 等）から利用可能な型チェッカーを検出
   - 型チェッカーが存在しない場合はスキップする
   - 結果（エラー一覧またはエラーなし）を記録

3. **L2: linter 静的解析**
   - プロジェクトの linter を実行（存在する場合）
   - 例: package.json の scripts、設定ファイル（.eslintrc、biome.json 等）から利用可能な linter を検出
   - linter が存在しない場合はスキップする
   - 結果（エラー一覧またはエラーなし）を記録

4. **結果の記録**
   - L0/L1/L2 の結果を Step 1 の REVIEW CONTEXT に注入するために保持する
   - L0/L1/L2 でエラーや WARNING が検出されてもレビューフローは続行する（エラー修正は `/implement` の責務）

### Step 1: 仕様コンテキストの準備

1. `openspec/changes/<change-name>/specs/` 配下のデルタスペックファイル一覧を取得
2. `openspec/changes/<change-name>/design.md` のパスを確認
3. `git diff --stat` で変更ファイル一覧を取得

以下の REVIEW CONTEXT を全レビュアーのプロンプトに注入する:

```
REVIEW CONTEXT:
- delta-spec: openspec/changes/<change-name>/specs/[ファイル一覧]
- design.md: openspec/changes/<change-name>/design.md
- 変更ファイル: [git diff --stat の出力]
- リスクレベル: [Step 2a で判定した HIGH / MEDIUM / LOW]
- L0 (doc-sync) 結果: [Step 0 の L0 結果。スキップした場合は「ドキュメント同期ルール未検出のためスキップ」]
- L1 (型チェック) 結果: [Step 0 の L1 結果。スキップした場合は「型チェッカー未検出のためスキップ」]
- L2 (linter) 結果: [Step 0 の L2 結果。スキップした場合は「linter 未検出のためスキップ」]

REVIEW INSTRUCTION:
1. まず delta-spec と design.md を Read し、設計意図を理解すること
2. 設計上の意図的な選択を「問題」として指摘しないこと
3. 各指摘に「関連する仕様項目」を明記すること（仕様外の指摘は明示すること）
4. 各指摘に確信度（HIGH / MEDIUM / LOW）を付与すること
5. L1/L2 で既に検出された問題（型エラー、lint エラー）と同一の指摘は行わないこと。LLM レビュアーは L1/L2 では検出できない高次の問題（設計、セキュリティ、パフォーマンス等）に集中すること
```

### Step 2: 動的レビュアー選択

#### Step 2a: リスクレベル判定

`git diff --stat` の出力からリスクレベルを判定する。複数レベルの条件が混在する場合は最も高いレベルを採用する。

| リスクレベル | 判定条件 |
|---|---|
| **HIGH** | 以下のいずれかに該当: 認証・認可関連ファイルの変更、環境設定ファイル（`.env` 等）の変更、CI/CD 設定の変更 |
| **LOW** | 変更ファイルがドキュメント (.md)、テストファイル (.test.*, .spec.*)、スタイルシート (.css) のみ |
| **MEDIUM** | HIGH にも LOW にも該当しない |

リスクレベルは REVIEW CONTEXT に含める（Step 1 の REVIEW CONTEXT テンプレートの `リスクレベル` フィールドに設定）。

#### Step 2b: 動的レビュアー検出

`agents/review/` ディレクトリ内のエージェント定義ファイルを動的にスキャンし、変更内容に関連するレビュアーを選択する。

**検出手順:**

1. `agents/review/` 配下の全 `*.md` ファイルを一覧取得する（`review-aggregator.md` は除外する）
2. 各ファイルの YAML frontmatter をパースし、`name` と `description` を抽出する
   - **エラーハンドリング**: frontmatter が存在しない、YAML 構文エラーがある、または `name` フィールドが欠落している場合は、該当ファイルをスキップし警告を出力する（例: `WARNING: agents/review/broken.md をスキップしました（frontmatter パースエラー）`）
3. `git diff --stat` の変更ファイル一覧と各レビュアーの `description` を LLM に渡し、セマンティック判定で関連性を評価する
   - 判定プロンプト: 「このレビュアーの description と今回の変更内容は関連するか？」
   - 関連すると判定されたレビュアーを起動候補とする

**リスクレベル別の起動ルール:**

- **HIGH の場合**: `agents/review/` 配下の全レビュアー + **spec-compliance-reviewer** を起動する（安全側に倒す）
- **MEDIUM の場合**: 上記の動的検出で関連すると判定されたレビュアーのみを起動する
- **LOW の場合**: 上記の動的検出で関連すると判定されたレビュアーのみを起動する

**0 件マッチ時の手動選択:**

動的検出で関連レビュアーが 0 件の場合、以下のフローでユーザーに手動選択を求める:

1. 利用可能なレビュアー一覧（`agents/review/` から検出された全レビュアーの name と description）をユーザーに提示する
2. AskUserQuestion でユーザーに起動するレビュアーを選択させる
3. ユーザーが選択したレビュアーを起動する

**レビュアー定義が 0 件の場合**（`review-aggregator.md` のみ存在）:

review-aggregator のみを起動し、「レビュアーが見つかりませんでした。`agents/review/` にレビュアー定義を追加してください」とユーザーに案内する。

**注意**: review-aggregator は変更内容に関わらず常時起動する（結果統合のため）。

### Step 2c: レビュアー別 Skill 自動注入

Step 2b で選択された各レビュアーのプロンプトに、`REQUIRED SKILLS` としてスキルを自動注入する。

**注入ルール:**

1. 各レビュアーのエージェント定義ファイル（`agents/review/*.md`）の YAML frontmatter から `skills` フィールドを読み取る
2. `skills` に記載されたスキル名を REQUIRED SKILLS に追加する
3. `skills` フィールドが存在しない場合は、追加のドメインスキルなしで起動する（Methodology Skills のみ適用）

#### プロンプトへの注入形式

```
REQUIRED SKILLS:
- iterative-retrieval
- [エージェント定義の skills frontmatter から取得したスキル]
```

### Step 3: レビュアー並列実行

Step 2 で選択されたレビュアーを**並列で** Task として起動する。
各レビュアーには Step 1 で準備した REVIEW CONTEXT と Step 2c で決定した REQUIRED SKILLS を注入する。

**レビュアーの役割**: 各レビュアーの具体的なチェック項目・責務は `agents/review/*.md` のエージェント定義を参照すること。

### Step 4: review-aggregator による統合

レビュアー並列実行の完了後、**review-aggregator** を Task として起動する。

review-aggregator には以下を入力として提供する:
- 全レビュアーの出力テキスト
- delta-spec ファイルパス一覧
- design.md ファイルパス

review-aggregator は以下を実行する:
1. **重複排除**: 同一箇所への複数指摘を最も具体的なものに統合
2. **矛盾解決**: 相反する指摘をフラグ
3. **優先度調整**: 確信度に基づく横断的再評価。LOW 確信度の P2/P3 はノイズ候補として分離
4. **カバレッジマトリクス生成**: delta-spec の各要件・シナリオに対するレビューカバレッジを可視化

### Step 5: review-summary.md の生成

review-aggregator の統合レポートを受領後、Main Agent が以下を実行する:

1. `openspec/changes/<change-name>/reviews/` ディレクトリが存在しない場合は自動作成する
2. review-aggregator の統合結果をベースに `openspec/changes/<change-name>/reviews/review-summary.md` を生成する
3. `/review` 再実行時は既存の review-summary.md を上書きする

**注意**: change-name は「引数の解析」セクションで決定済みの値を使用する。

review-summary.md のテンプレート:

```markdown
# Review Summary: [change-name]

## レビュー実施情報
- 実施日: [日付]
- 対象レビュアー: [実行されたレビュアー一覧]
- 失敗したレビュアー: [あれば。なければ「なし」]

## 指摘一覧

### [カテゴリ: レビュアー名から動的に決定]

#### 指摘 1: [タイトル]
- **レビュアー**: [レビュアー名]
- **優先度**: Critical / High / Medium / Low
- **対象ファイル**: [ファイルパス]
- **指摘内容**: [詳細]
- **推奨修正**: [修正案]

## 修正内容

### 修正 1: [指摘への対応]
- **対応**: 修正済み / スコープ外 / 次回対応
- **変更内容**: [何をどう修正したか]
- **変更ファイル**: [修正したファイルパス]
```

**指摘が0件の場合**: 「指摘一覧」セクションに「指摘なし」と記載し、「修正内容」セクションは空とする。

**レビュアーの一部が失敗した場合**: 成功したレビュアーの結果のみで review-summary.md を生成し、「失敗したレビュアー」に失敗したレビュアー名を明記する。

### Step 6: 結果提示と修正ループ

review-aggregator の統合レポートをユーザーに提示し、以下のフローで対応する:

#### P1 あり（修正ループ）

```
P1 指摘あり
  │
  ├── アーキテクチャ変更を伴う（エスカレーションフラグあり）
  │   → AskUserQuestion でユーザーに修正方針を確認
  │
  └── アーキテクチャ変更不要
      → Task(implementer) で自動修正
      → 修正部分のみ、関連レビュアーのみで再レビュー（最大 1 回）
      → 再レビューで新たな P1 が出た場合はユーザーに報告（無限ループ防止）
```

#### P2 のみ

ユーザーに修正するかどうかの判断を委ねる。

#### P3 のみ

レポートのみ出力。

#### 修正実施後の review-summary.md 追記

P1/P2 指摘に基づく修正（自動修正またはユーザー指示による修正）が実施された場合、Main Agent が review-summary.md の「修正内容」セクションに修正内容を追記する。各修正について以下を記録する:
- **対応**: 修正済み / スコープ外 / 次回対応
- **変更内容**: 何をどう修正したか
- **変更ファイル**: 修正したファイルパス

### Step 7: レビュー学習ループ

レビュー結果の提示後、ユーザーの反応を記録する:

1. ユーザーが指摘を**却下**した場合（修正不要と判断）:
   - 却下理由をユーザーに確認
   - `docs/compound/` に以下の形式で記録:
     ```
     category: review-gap
     レビュアー: [レビュアー名]
     指摘ID: [SECURITY-001 等]
     却下理由: [ユーザーの理由]
     ```

2. 同一パターンの却下が **2 回以上**蓄積した場合:
   - Learning Router が該当レビュアーのチェックリスト更新を提案
   - 例: 「あるレビュアーが特定の設計パターンを常に指摘するが、このプロジェクトでは設計上許容している」
     → 該当レビュアーのチェックリストにプロジェクト固有の例外を追加提案

3. ノイズ候補（LOW 確信度 P2/P3）が却下された場合:
   - `docs/compound/` に `category: review-gap` で記録
   - 同一パターンの蓄積でレビュアー改善提案に昇格

## レビュー出力形式

review-aggregator の出力形式に従う。最終的にユーザーに提示する形式:

```markdown
# コードレビュー結果（Spec-Aware Review）

## サマリー
- P1（修正必須）: X件
- P2（修正推奨）: X件
- P3（あると良い）: X件
- ノイズ候補（低確信度）: X件
- 矛盾検出: X件
- 起動レビュアー: [起動されたレビュアー名の一覧]

## P1: クリティカル
### [REVIEWER-001] [指摘タイトル]
- **重要度**: P1
- **確信度**: HIGH
- **ファイル**: [対象ファイルパス:行番号]
- **問題**: [問題の詳細]
- **修正案**: [修正案の詳細]
- **レビュアー**: [レビュアー名]
- **関連仕様**: [関連する仕様項目]

## P2: 重要
...

## P3: 軽微
...

## 矛盾検出
...

## ノイズ候補（低確信度 P2/P3）
...

## Review Coverage Matrix

列は起動されたレビュアー名を動的に構成する:

| 仕様項目 | [レビュアー1] | [レビュアー2] | ... | カバー状態 |
|---|---|---|---|---|
| REQ-001: Happy Path | - | REVIEWER2-001 | ... | Covered |
| REQ-001: Error Scenario | REVIEWER1-003 | - | ... | Covered |
| REQ-002: Boundary | - | - | ... | **UNCOVERED** |

### 未カバー項目
- REQ-002: Boundary Scenario -- どのレビュアーも検証していない。追加レビューを推奨。
```
