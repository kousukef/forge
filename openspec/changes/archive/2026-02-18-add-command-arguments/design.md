# add-command-arguments 技術設計

## 概要

Forge ワークフローコマンドに argument-hint・モードフラグ・change-name 引数を追加し、Skill Activation の冗長セクションを削除する。全て .md ファイルの編集のみ。

## リサーチサマリー

### 公式ドキュメントからの知見

- `argument-hint` は YAML フロントマターの文字列フィールド。タブ補完時にヒントを表示する
- `$ARGUMENTS` で全引数を文字列として取得、`$ARGUMENTS[0]`/`$0` で位置引数にアクセス可能
- `arguments` 配列（name/description/required）も使用可能だが、`argument-hint` と併用可能
- argument-hint は表示のみで、バリデーションは行わない

### コードベース分析

- 現在 `argument-hint` を使用しているコマンドはゼロ
- `handle-pr-review.md` のみ `arguments` 配列と `$ARGUMENTS` を使用中
- 全7コマンドに「Skill Activation」セクションが存在（implement.md は前回のリライトで削除済み）
- CLAUDE.md の「Skill Orchestration（1% ルール）」が全エージェントに自動ロードされる

### 過去の学び

- Context Isolation Policy: Main Agent が SKILL.md を Read してはならない
- review.md の Skill Activation に「SKILL.md を読み込み、タスクプロンプトに含める」という違反記述あり

## 技術的アプローチ

### 引数解析パターン

各コマンドのワークフロー冒頭に「引数の解析」セクションを追加する。$ARGUMENTS の解析ロジック:

```
$ARGUMENTS の解析:
1. `--teams` フラグが含まれていれば mode = teams、フラグを除去
2. `--agents` フラグが含まれていれば mode = agents、フラグを除去
3. 残りの文字列が change-name（空なら自動検出）
```

自動検出ロジック:
```
openspec/changes/ 内を Glob で走査:
- archive/ を除外
- 1つ → 自動選択
- 複数 → AskUserQuestion で選択
- 0 → エラー（/brainstorm を先に実行するよう案内）
```

### フロントマター設計

| コマンド | argument-hint | フラグ |
|---|---|---|
| brainstorm | `<topic>` | なし |
| spec | `<change-name> [--teams\|--agents]` | --teams, --agents |
| implement | `<change-name> [--teams\|--agents]` | --teams, --agents |
| review | `<change-name>` | なし |
| compound | `<change-name>` | なし |
| test | なし（change-name 不要） | なし |
| ship | `<change-name>` | なし（パイプライン内で各コマンドが個別判断） |

### 削除対象

全コマンドの「## Skill Activation」セクション（見出し + 内容）を削除:
- brainstorm.md（2行）
- spec.md（3行）
- review.md（3行）
- compound.md（2行）
- test.md（3行）
- ship.md（3行）

## リスクと注意点

- **argument-hint の表示挙動**: argument-hint は Claude Code のバージョンにより表示が異なる可能性がある。ただし表示のみで機能に影響なし
- **$ARGUMENTS の解析精度**: フラグ位置が前後しても正しく解析できるようにする必要がある（例: `--teams add-oauth-login` と `add-oauth-login --teams` の両方を許容）
- **プロジェクト/グローバル同期**: 全変更を `forge/commands/` と `~/.claude/commands/` の両方に反映する必要がある
