---
description: "仕様書のタスクリストに基づきTDD駆動で実装する。Main Agentがタスク分析し、Teams/Sub Agentsモードを選択して実行"
disable-model-invocation: true
argument-hint: "<change-name> [--teams|--agents]"
---

# /implement コマンド

## 目的

仕様書のタスクリストに基づいてTDD駆動でコードを実装する。
Main Agent がチームリーダーとして直接管理する2層アーキテクチャを採用し、Teams モードと Sub Agents モードを動的に選択する。

## 2層アーキテクチャ

```
Main Agent（チームリーダー）
  | tasks.md + design.md の内容を読み込み
  | タスク分析・依存関係構築
  | 引数（--teams/--agents）でモード決定
  |
  +-- [Teams モード] TeamCreate -> 実装チーム
  |   +-- implementer teammates x N（各自が異なるファイルセットを所有）
  |   +-- spec-compliance-reviewer（逸脱検出 -> implementer に直接フィードバック）
  |   +-- build-error-resolver（ビルドエラー時に投入）
  |   Main Agent = リーダー（Delegate モード推奨）
  |   完了後: TeamDelete でクリーンアップ
  |
  +-- [Sub Agents モード] Task(implementer) x N
      並列可能なタスクは同時に Task 起動
      検証失敗時: Task(build-error-resolver) で修正
      スペック準拠: Task(spec-compliance-reviewer) で確認
```

## Main Agent 禁止事項（Context Isolation Policy）

以下の操作は Context Isolation Policy により禁止:

1. **Write / Edit ツールで実装ファイルを編集してはならない**
2. **実装ファイル（`.ts`, `.tsx` 等）を Read してはならない**
3. **SKILL.md を Read してはならない**
4. **型エラー・lint エラーを直接修正してはならない**
5. **テストコードを直接記述してはならない**
6. **「自分でやった方が速い」と判断してはならない**

全ての実装作業は implementer / build-error-resolver / spec-compliance-reviewer に委譲する。

## ワークフロー

### Step 0: 引数の解析

$ARGUMENTS を解析し、以下を決定する:

1. **change-name**: `--teams`/`--agents` フラグを除いた文字列
   - 指定あり: `openspec/changes/<change-name>/` を対象とする
   - 省略: `openspec/changes/` 内のアクティブ変更（`archive/` 以外）を自動検出
     - 1つ → 自動選択
     - 複数 → AskUserQuestion で選択
     - 0 → エラー（先に `/brainstorm` を実行するよう案内）
2. **mode**: `--teams` → Teams モード、`--agents` → Sub Agents モード、省略 → デフォルト（`agents`）

### Step 1: 準備

1. git worktree を作成（`git worktree add`）してブランチを分離
2. `openspec/changes/<change-name>/` から以下を読み込む:
   - `tasks.md`（タスクリスト）
   - `design.md`（技術設計）
   - `specs/` -- **Glob でファイルパス一覧のみ取得。内容は読まない**

### Step 2: タスク分析

1. tasks.md のタスク依存関係を分析
2. 独立タスク（依存なし）が2つ以上あるか判定
3. 独立タスクが異なるファイルセットを編集するか判定

### Step 3: モード分岐

Step 0 で決定した mode に基づいて分岐する:

- **`teams`**: Step 4a（Teams モード）に進む
- **`agents`**（デフォルト）: Step 4b（Sub Agents モード）に進む

### Step 4a: Teams モードの実行

1. **TeamCreate で実装チームを作成**
   - Delegate モード推奨（Main Agent が自分で実装するのを防ぐ）
   - implementer teammates x N を起動（各自が異なるファイルセットを所有）
   - spec-compliance-reviewer を teammate として起動（逸脱検出 -> implementer に直接フィードバック）
   - build-error-resolver は必要時にのみ追加

2. **タスクはチーム内の TaskList で管理**
   - 各 implementer に担当タスクとファイルセットを明確に割り当てる
   - 5-6 タスク / teammate を目安に分割

3. **Teams 内エスカレーションフロー**
   - Team Member が疑問発見 -> SendMessage で Main Agent に選択肢付きで送信
   - Main Agent -> AskUserQuestion でユーザーに選択肢をそのまま提示
   - ユーザー回答 -> Main Agent -> SendMessage で Team Member に回答をそのまま返信

4. **全タスク完了後: TeamDelete でクリーンアップ**

### Step 4b: Sub Agents モードの実行

1. **各タスクに対して Task(implementer) を起動**
   - 並列可能なタスクは単一メッセージで複数 Task を同時起動
   - 依存タスクは前タスク完了後に順次起動
   - 各 implementer プロンプトにスキル名（名前のみ）を含める

2. **implementer 完了後の検証**
   - `npx vitest run` / `npx tsc --noEmit` / `git diff --stat`
   - 失敗時: Task(build-error-resolver) に委譲（最大3回リトライ）
   - 成功時: Task(spec-compliance-reviewer) でスペック準拠確認

### Step 5: 検証

全タスク完了後:
1. `npx vitest run` で全テスト実行
2. `npx tsc --noEmit` で型チェック
3. `git diff --stat` で変更ファイル一覧を確認

### Step 6: 完了報告

実装完了サマリーをユーザーに出力する。

## 実装サマリー形式

```markdown
# 実装完了サマリー

## 完了タスク
- [x] Task 1: [タスク名]
- [x] Task 2: [タスク名]
...

## 変更ファイル一覧（`git diff --stat`）
[git diff --stat の出力]

## テスト結果
[テスト実行結果]

## 注意事項
[あれば記載]
```

## implementer プロンプト構造

Sub Agents モードで Task(implementer) を起動する際のプロンプトテンプレート:

```
TASK: [タスクテキスト]

REQUIRED SKILLS:
- test-driven-development
- iterative-retrieval
- verification-before-completion
- [ドメイン固有スキル名]

PROJECT RULES（自分で Read して従うこと）:
- CLAUDE.md

SPEC FILES（自分で Read して実装すること）:
- openspec/changes/<CHANGE_NAME>/specs/[該当スペックファイル]
- openspec/changes/<CHANGE_NAME>/design.md

INTERPRETATION REQUIREMENT:
TDD 開始前に Spec Interpretation Log を openspec/changes/<CHANGE_NAME>/interpretations/<task>.md に出力すること。
必須チェック項目に「仕様に未記載」がある場合は AskUserQuestion でエスカレーションすること。

COMPLETION CRITERIA:
- Spec Interpretation Log が出力済みであること
- テストがパスすること
- 型チェックがパスすること
- Spec Interpretation Log の Phase B が追記済みであること
```
