# Context Isolation Policy（詳細）

Main Agent のコンテキストウィンドウを保護し、大規模実装でも破綻しないようにする2層分離ルール。

---

## 2層アーキテクチャ + 動的モード選択

```
Main Agent（オーケストレーション層 / チームリーダー）
  │ tasks.md + design.md の内容を読み込み
  │ タスク分析・依存関係構築
  │ 引数（--teams/--agents）でモード決定
  │
  ├─ [Teams モード] TeamCreate → チーム
  │   Main Agent = リーダー（Delegate モード推奨）
  │   teammate 間で SendMessage による直接通信
  │   完了後: TeamDelete でクリーンアップ
  │
  └─ [Sub Agents モード] Task(subagent) × N
      並列可能なタスクは同時に Task 起動
      結果のみ Main Agent に返される
```

> **設計背景**: Claude Code の制約により、サブエージェントは他のサブエージェントを起動できない（ネスト不可）。
> そのため Main Agent が直接 implementer を起動する2層構造を採用する。
> Teams モードではエージェント間通信により成果物の質が向上する場面で使用する。

## Teams vs Task 切り替え基準

| 条件 | 方式 | 理由 |
|---|---|---|
| エージェント間の情報共有・フィードバックが成果を改善する | Teams | SendMessage による協調で質が上がる |
| 各エージェントが独立して作業でき、やりとりが不要 | Task 並列 | Teams のオーバーヘッドなしに並列実行できる |
| 単発の委譲タスク | Task | 協調の必要なし |

**具体的な適用:**
- `/implement`: 独立タスクが2+で異なるファイルセットの場合に Teams を推奨。`--teams`/`--agents` 引数で指定（デフォルト: `agents`）
- `/spec`: リサーチャー間の相互参照 + spec-writer によるチーム内統合に Teams を推奨。`--teams`/`--agents` 引数で指定（デフォルト: `agents`）
- `/review`: 各レビューは独立作業のため Task 並列（Teams 不使用）

---

## Main Agent の責務（/implement 実行時）

- 仕様書・設計書・タスクリスト（`.md` ファイル）の読み込み
- タスク分析・依存関係に基づくバッチ構成
- モード選択（`--teams`/`--agents` 引数に基づく分岐）
- Teams モード: TeamCreate でチーム作成・タスク割り当て・監視・TeamDelete
- Sub Agents モード: `Task(implementer)` を直接起動（並列 or 順次）
- 検証コマンド実行（`npm test`, `tsc --noEmit`, `git diff --stat`）
- 検証失敗時: `Task(build-error-resolver)` に委譲（最大3回リトライ）
- スペック準拠確認: `Task(spec-compliance-reviewer)` に委譲
- `git diff --stat` で変更概要確認・ユーザーに報告

---

## エスカレーションフロー（Teams 内 → ユーザー）

Teams モードで Team Member がユーザー確認を必要とする場合:

```
Team Member（疑問発見）
  | SendMessage（選択肢を含めて送信）
  v
Main Agent（チームリーダー）
  | AskUserQuestion（選択肢をそのまま提示）
  v
ユーザー（回答）
  |
  v
Main Agent
  | SendMessage（回答をそのまま返信）
  v
Team Member（作業再開）
```

---

## implement-orchestrator（メインスレッド専用）

`claude --agent implement-orchestrator` で起動した場合のみ有効。**`/implement` コマンドからは使用しない。**

```
implement-orchestrator（メインスレッドとして起動）
  ├→ Task(implementer) × N
  ├→ Task(build-error-resolver)
  └→ Task(spec-compliance-reviewer)
```

**注意**: `Task(implement-orchestrator)` でサブエージェントとして起動した場合、Task ツールは利用できない（Claude Code の制約）。このため `/implement` コマンドでは使用しない。

---

## implementer の責務

- エージェント定義の `skills` frontmatter + プロンプト指定のスキルに従う（Claude Code が自動読み込み）
- デルタスペック・design.md を自分で Read
- コードベースを iterative-retrieval で探索
- **Spec Interpretation Log を出力**（TDD 開始前に必須。`openspec/changes/<name>/interpretations/<task>.md` に書き出し）
- TDD 実装（RED → GREEN → REFACTOR）
- テスト実行・型チェック
- Spec Interpretation Log の Phase B（変更ファイル一覧 + 振り返り）を追記
