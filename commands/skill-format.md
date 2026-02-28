---
description: "ドメイン Skill を Phase-Aware File Structure（SKILL.md / design.md / constraints.md）に分割・検証・同期する"
disable-model-invocation: true
argument-hint: "<skill-name|--all|--check|--sync skill-name>"
---

# /skill-format コマンド

## 目的

ドメイン Skill を Phase-Aware File Structure に分割し、フェーズごとに最適な粒度の知識を提供する。分割基準は `skill-phase-formatter` Skill に従う。

## 前提

`skill-phase-formatter` Skill を読み込んでから実行する。分割基準・検証項目・同期手順は全て `skill-phase-formatter` に定義されている。

REQUIRED SKILLS:
- skill-phase-formatter

## 引数の解析

$ARGUMENTS からモードを判定する:

| 引数 | モード |
|---|---|
| `<skill-name>` | 単一分割 |
| `--all` | 一括分割 |
| `--check` | 状況確認 |
| `--sync <skill-name>` | 同期 |
| 省略 | AskUserQuestion でモードを選択 |

## モード別ワークフロー

### 1. 単一分割モード: `/skill-format <skill-name>`

1. Skill ディレクトリを検索する
   - プロジェクト固有: `<project>/.claude/skills/<skill-name>/SKILL.md`
   - グローバル: `~/.claude/skills/<skill-name>/SKILL.md`
   - 見つからない場合: エラー「Skill '<skill-name>' が見つかりません」
2. 既存の design.md / constraints.md の有無を確認する
   - 既に存在する場合: AskUserQuestion で上書き確認を行う
   - 拒否された場合: 中断
3. SKILL.md を全文読み込む
4. `skill-phase-formatter` の分割基準に従って分割する:
   - 技術的制約を抽出 → constraints.md を生成
   - 設計指針・パターン選択基準を抽出 → design.md を生成
5. `skill-phase-formatter` の検証項目で検証する:
   - constraints.md ≤ 30行
   - design.md ≤ 120行
   - design.md にコードブロックなし
   - 全内容が SKILL.md の部分集合
   - ヘッダー規約準拠
6. 検証失敗時: 問題を修正して再検証
7. 結果を出力する:
   - 生成したファイルのパス
   - 各ファイルの行数
   - 検証結果

### 2. 一括分割モード: `/skill-format --all`

1. `~/.claude/skills/` と `<project>/.claude/skills/`（存在する場合）をスキャンする
2. 各 Skill について分割対象かを判定する:
   - **スキップ対象**:
     - 方法論 Skill（forge-skill-orchestrator, test-driven-development, systematic-debugging, verification-before-completion, iterative-retrieval, strategic-compact, skill-phase-formatter 等）
     - ユーティリティ Skill（find-skills 等）
     - 50行以下の軽量 Skill
     - 既に design.md / constraints.md が存在する Skill（上書きしない）
   - **分割対象**: 上記以外のドメイン Skill
3. 分割対象の各 Skill に対して単一分割モードと同じ手順を実行する
4. 全体の結果サマリーを出力する:
   - 分割済み / スキップ / エラーの件数
   - 各 Skill の状態

### 3. 状況確認モード: `/skill-format --check`

1. `~/.claude/skills/` と `<project>/.claude/skills/`（存在する場合）をスキャンする
2. 各 Skill について以下を確認する:
   - SKILL.md の行数
   - design.md の有無と行数
   - constraints.md の有無と行数
   - スキップ理由（方法論/ユーティリティ/軽量/対象外）
3. 結果を一覧表形式で出力する:

```
| Skill | SKILL.md | design.md | constraints.md | Status |
|---|---|---|---|---|
| prisma-expert | 500行 | 105行 | 25行 | OK |
| next-best-practices | 446行 | - | - | 未分割 |
| test-driven-development | 47行 | - | - | スキップ（方法論） |
```

### 4. 同期モード: `/skill-format --sync <skill-name>`

1. Skill ディレクトリを検索する（単一分割モードと同じ）
2. design.md / constraints.md の存在を確認する
   - 存在しない場合: 「派生ファイルが存在しません。先に `/skill-format <skill-name>` で分割してください」
3. `skill-phase-formatter` の同期手順に従って同期する:
   - SKILL.md の現在の内容を読み込む
   - constraints.md の内容が SKILL.md の部分集合であるか確認
   - design.md の内容が SKILL.md の部分集合であるか確認
   - 乖離がある場合: SKILL.md から再抽出して更新
4. 更新後の検証を実施する
5. 変更差分を出力する
