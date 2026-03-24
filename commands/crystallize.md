---
description: "蓄積された経験ログからパターンを抽出し、rules/skills/hooks に昇格させる"
argument-hint: "[--scope <all|recent|tag:xxx|project:xxx>] [--dry-run]"
---

# /crystallize コマンド

## 目的

プロジェクト横断のパターン抽出を行い、蓄積された経験ログから rules/skills/hooks に昇格させる。NFD の Deliberate Crystallization フェーズに相当する。

## 引数の解析

$ARGUMENTS から以下のオプションを解析する:

| 引数 | 説明 | デフォルト |
|---|---|---|
| `--scope all` | 全未結晶化エントリを対象 | all |
| `--scope recent` | 直近 30 日の未結晶化エントリを対象（30 日境界は inclusive） | - |
| `--scope tag:<tag>` | 指定タグの未結晶化エントリを対象 | - |
| `--scope project:<name>` | 指定プロジェクトの未結晶化エントリを対象 | - |
| `--dry-run` | パターン抽出のみ実行。昇格提案を生成するが適用しない | - |

## ワークフロー

### Phase 1: データ収集

1. `~/.claude/docs/experiential/logs/` の全 `.md` ファイルを Glob で取得する
   - ディレクトリが存在しない場合は「経験ログが見つかりません。`/compound` を実行して経験を蓄積してください。」と表示して終了する
2. 各ファイルから `crystallized: false` のエントリを抽出する
   - **Compound ログ**（`type: compound`）: YAML フロントマターで判定
   - **Nurture ログ**（`type: nurture`）: 各 `---` 区切りブロック内の `crystallized: false` で判定
3. `--scope` に応じてフィルタリングする
   - `all`: フィルタリングなし
   - `recent`: ファイル名の日付部分で直近 30 日以内のエントリに絞る（30 日前の日付を含む）
   - `tag:<tag>`: 指定タグに一致するエントリに絞る
   - `project:<name>`: 指定プロジェクトのエントリに絞る
4. `crystallized: false` のエントリが 0 件の場合、「未結晶化のエントリがありません。」と表示して終了する
   - `--scope` 指定時にマッチが 0 件の場合、「指定されたスコープに一致する未結晶化エントリがありません。」と表示して終了する
5. 収集結果のサマリーを表示する:
   ```
   N 件の未結晶化エントリを収集しました
   （compound: X 件, nurture: Y 件）
   プロジェクト別: project-A M件, project-B K件, ...
   タグ別: [CORRECTION] A件, [INSIGHT] B件, ...
   ```

### Phase 2: パターン抽出

1. 収集したエントリをタグ別にグループ化する
2. 各グループ内で以下の観点でパターンを抽出する（considering but not limited to:）
   - **繰り返し**: 同じ種類の問題・判断が 2 回以上出現しているか
   - **プロジェクト横断**: 異なるプロジェクトで同じパターンが出現しているか（特に高価値）
   - **因果関係**: ある問題が別の問題の原因になっているパターンはないか
   - **Shift-Left 機会**: レビューやテストで発見された問題で、仕様段階で防げたものはないか
3. 既存の rules/skills/hooks の内容を読み込み、抽出パターンとの重複・矛盾を検出する
4. パターン候補を `~/.claude/docs/experiential/patterns/PAT-NNN-<name>.md` に書き出す
   - ディレクトリが存在しない場合は再帰的に作成する

#### パターン候補フォーマット

```markdown
---
id: PAT-NNN
title: "[パターン名]"
status: pending # pending | approved | rejected
source_entries: [exp-NNNN, ...]
source_projects: [project-A, project-B]
evidence_count: N
cross_project: true # プロジェクト横断パターンかどうか
proposed_target: "[昇格先パス]"
date: YYYY-MM-DD
---

# [パターン名]

## 観察されたパターン

[複数のエントリから抽出された共通パターンの記述]

## 根拠となる経験

1. [exp-NNNN] [project-A] [概要] (YYYY-MM-DD)
2. [exp-NNNN] [project-B] [概要] (YYYY-MM-DD)
3. [exp-NNNN] [project-A] [概要] (YYYY-MM-DD)

## 汎化された原則（脱文脈化済み）

[特定状況に依存しない形で記述された原則]

## 昇格提案

- **対象**: [昇格先パス]
- **操作**: [追記 or 新規セクション or 新規ファイル]
- **内容**:
  [具体的な追記内容の案]
```

### Phase 3: 人間レビュー（必須）

1. 抽出されたパターン候補をユーザーに提示する
2. 各候補について以下の選択肢を AskUserQuestion で確認する:
   - **承認**: 昇格対象とする
   - **却下**: ノイズとして除外する
   - **修正**: 内容を調整してから昇格する
3. 承認・修正されたパターンのみを Phase 4 に進める
4. 全パターンが却下された場合は Phase 4 をスキップし、Phase 5 で却下されたパターンの status を `rejected` に更新する

### Phase 4: 昇格実行

`--dry-run` が指定されている場合は、昇格提案を表示するのみでファイルへの変更は一切行わない。

承認されたパターンごとに以下を実行する:

1. **脱文脈化**: 特定のプロジェクト・状況に依存する記述を汎用的な原則に変換する

2. **昇格先の決定と実行**:

   | パターンの性質 | 昇格先 | 操作 |
   |---|---|---|
   | 設計判断の基準・原則 | `skills/<domain>/SKILL.md` のデシジョンセクション | 追記 or 新規セクション |
   | 実装時の制約・禁止事項 | `skills/<domain>/constraints.md` | 追記 |
   | 実装パターン・リファレンス | `skills/<domain>/SKILL.md` のパターンセクション | 追記 or 新規セクション |
   | 汎用的な行動原則 | `.claude/rules/`（`paths` なし） or `reference/` | 追記 or 新規ルールファイル |
   | ファイル種別に紐づく規約 | `.claude/rules/`（`paths` 付き） | 新規ルールファイル |
   | 自動検出可能な問題 | `hooks/` | 新規フック作成 |
   | 仕様品質に関するパターン | spec-validator のチェックリスト or `.claude/rules/` | 追記 |
   | ワークフロー改善 | `commands/` | 修正 |
   | エージェントの判断基準 | `agents/` の行動規範 | 追記 |

3. **`paths` フロントマターの自動付与**: 昇格先が `.claude/rules/` の場合、パターンの適用範囲に応じて適切な `paths` を付与する

   | パターンの適用範囲 | 昇格先レベル | `paths` |
   |---|---|---|
   | 特定プロジェクトのみ | プロジェクト `.claude/rules/` | ディレクトリ glob 可 |
   | 特定言語・フレームワーク全般 | ユーザー `~/.claude/rules/` | 拡張子・ファイル名 glob のみ |
   | 全プロジェクト・全ファイル共通 | ユーザー `~/.claude/rules/` | `paths` なし（常時ロード） |

   プロジェクトレベルの例:
   ```yaml
   ---
   paths:
     - "src/api/**/*.ts"
   ---
   # [CRYSTALLIZED] API エラーレスポンス統一規約
   <!-- hypothesis: confidence=0.7 source=crystallize-YYYY-MM-DD evidence=N -->
   ```

   ユーザーレベルの例:
   ```yaml
   ---
   paths:
     - "**/*.tsx"
     - "**/*.jsx"
   ---
   # [CRYSTALLIZED] React コンポーネント設計パターン
   <!-- hypothesis: confidence=0.7 source=crystallize-YYYY-MM-DD evidence=N -->
   ```

   `paths` を付与しないケース: プロセス系・行動原則系のルールはファイルパスに紐づかないため `paths` なし（常時ロード）とする。

4. **仮説タグの付与**: 結晶化で生成された知識にはコメント形式の仮説メタデータを付与する

   ```
   <!-- hypothesis: confidence=0.7 source=crystallize-YYYY-MM-DD evidence=N -->
   ```

   - `confidence`: 初期値 0.7。ライフサイクルに従い `/compound` の Learning Router で更新される
   - `source`: 結晶化実行日
   - `evidence`: 結晶化時の根拠エントリ数

5. **Phase-Aware 派生ファイルの同期**: SKILL.md を更新した場合、`/compound` ステップ 4.5 と同じ手順で `design.md` / `constraints.md` を同期する

6. **ユーザー承認**: 昇格内容の差分をユーザーに提示し、承認後に適用する

#### エラーハンドリング

- 昇格先ファイルへの書き込みに失敗した場合は、失敗した昇格をスキップし、残りの昇格を続行する。失敗した件はユーザーに通知する

### Phase 5: 後処理

1. 処理済みエントリの `crystallized: false` を `crystallized: true` に更新する
   - Phase 4 の昇格実行が正常に完了したエントリのみに適用する。途中失敗したエントリは `crystallized: false` を維持する
2. `~/.claude/docs/experiential/patterns/` の承認済みパターンの status を `approved` に更新する
3. 却下されたパターンの status を `rejected` に更新する
4. `~/.claude/docs/experiential/crystallization-log.md` に実行記録を追記する

#### 結晶化ログフォーマット

```markdown
## YYYY-MM-DD Crystallization

- スキャン対象: N 件（プロジェクト: A, B, C）
- パターン抽出: M 件（うちプロジェクト横断: J 件）
- 承認・昇格: K 件
- 昇格先:
  - skills/: [更新したスキル名]
  - rules/: [更新したルール名]
  - hooks/: [追加したフック名]
```
