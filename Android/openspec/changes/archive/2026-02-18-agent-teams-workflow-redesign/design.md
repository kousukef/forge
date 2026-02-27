# Agent Teams ワークフロー再設計 技術設計

## 概要

Forge ワークフローの /implement, /spec, /review コマンドを再設計し、Agent Teams と Sub Agents を適材適所で活用する。破綻している3層アーキテクチャを廃止し、CLAUDE.md・コマンド定義・エージェント定義の矛盾を一括解消する。

## リサーチサマリー

### 公式ドキュメントからの知見

**Agent Teams の適切な用途** (https://code.claude.com/docs/en/agent-teams):
- New modules or features: teammates can each own a separate piece without stepping on each other
- Research and review: multiple teammates can investigate different aspects simultaneously
- Cross-layer coordination: frontend, backend, tests
- Debugging with competing hypotheses

**Agent Teams が非効率な場面:**
- Same-file edits（上書きが発生）
- Work with many dependencies
- Sequential tasks
- Routine tasks

**Sub Agents との比較:**

|  | Sub Agents | Agent Teams |
|---|---|---|
| Context | 独自コンテキスト、結果を caller に返す | 独自コンテキスト、完全に独立 |
| Communication | Main Agent にのみ結果報告 | Teammate 間で直接メッセージ |
| Coordination | Main Agent が全管理 | 共有タスクリストで自己コーディネーション |
| Best for | 結果のみが重要な集中タスク | ディスカッションとコラボレーションが必要な複雑作業 |
| Token cost | 低い: 結果がメインコンテキストに要約 | 高い: 各 teammate が別の Claude インスタンス |

**重要なベストプラクティス:**
- "Break the work so each teammate owns a different set of files"
- "5-6 tasks per teammate keeps everyone productive"
- Delegate モードで Lead が自分で実装するのを防ぐ
- Plan Approval で teammate に計画承認を要求可能
- TeammateIdle / TaskCompleted フックで品質ゲートを設定可能
- CLAUDE.md は teammate に自動ロードされる

**制約:**
- 実験的機能（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 が必要）
- 通常セッションの約7倍のトークン消費
- セッション再開不可（/resume は in-process teammate を復元しない）
- 1セッション1チーム
- ネストしたチーム不可
- Lead は固定（移譲不可）

### Web検索からの知見

- Sub Agents のネスト不可は公式に明記: "Subagents cannot spawn other subagents"
- Agent Teams はネスト制約の直接的回避策ではなく、Lead がフラットに全メンバーを管理する構造
- broadcast はチームサイズに比例してコストがスケール
- アイドルの teammate もトークンを消費し続ける → 完了後は必ずクリーンアップ

### コードベース分析

**現在の矛盾:**
- `commands/implement.md`: 3層アーキテクチャ（orchestrator 経由）を定義
- `CLAUDE.md` (プロジェクト + グローバル): 2層アーキテクチャを推奨
- `agents/orchestration/implement-orchestrator.md`: メインスレッド専用と明記しているが、implement.md はこれを Sub Agent として起動する設計

**変更が必要なファイル:**
1. `commands/implement.md` -- 3層→2層+Teams/SubAgents選択
2. `commands/spec.md`（存在する場合）-- リサーチ＆スペックチーム追加
3. `commands/review.md`（存在する場合）-- Task並列の明記
4. `agents/orchestration/implement-orchestrator.md` -- メインスレッド専用の明確化
5. `agents/spec-writer.md` -- 新規作成
6. `CLAUDE.md`（プロジェクト）-- Context Isolation Policy + Available Agents 更新
7. `~/.claude/CLAUDE.md`（グローバル）-- 同上

### 過去の学び

docs/compound/ は空（.gitkeep のみ）。過去の学びは蓄積されていない。今回の再設計作業自体を学びの蓄積の起点とすべき。

## 技術的アプローチ

### 1. /implement の再設計

**2層アーキテクチャ + 動的モード選択:**

```
Main Agent（チームリーダー）
  │ tasks.md + design.md を読み込み
  │ タスク分析・依存関係構築
  │ AskUserQuestion でモード選択を提示
  │
  ├─ [Teams モード] TeamCreate → 実装チーム
  │   条件: 独立タスクが2+、ユーザーが Teams を選択
  │   ├─ implementer teammates × N（各自が異なるファイルセットを所有）
  │   ├─ spec-compliance-reviewer（逸脱検出→implementer に直接フィードバック）
  │   └─ build-error-resolver（ビルドエラー時に投入）
  │   Main Agent = リーダー（Delegate モード推奨）
  │   完了後: TeamDelete でクリーンアップ
  │
  └─ [Sub Agents モード] Task(implementer) × N
      条件: 依存チェーン、単発タスク、またはユーザー選択
      並列可能なタスクは同時に Task 起動
      検証失敗時: Task(build-error-resolver) で修正
      スペック準拠: Task(spec-compliance-reviewer) で確認
```

**モード選択の判断基準（Main Agent が分析）:**
1. tasks.md のタスク依存関係を分析
2. 独立タスク（依存なし）が2つ以上あるか判定
3. 独立タスクが異なるファイルセットを編集するか判定
4. 結果を AskUserQuestion で提示: 「Teams（推奨: 独立タスクN個）」or「Sub Agents のみ」

### 2. /spec の再設計

**リサーチ＆スペックチーム:**

```
Main Agent（チームリーダー）
  │ proposal.md の内容をプロンプトで渡す
  │ AskUserQuestion でモード選択を提示
  │
  ├─ [Teams モード] TeamCreate → リサーチ＆スペックチーム
  │   ├─ codebase-analyzer
  │   ├─ stack-docs-researcher
  │   ├─ web-researcher
  │   ├─ compound-learnings-researcher
  │   └─ spec-writer（リサーチ結果統合→Spec生成→サマリーを Main に送信）
  │   Main Agent はサマリーのみ受け取る（コンテキスト保護）
  │   完了後: TeamDelete でクリーンアップ
  │
  └─ [Sub Agents モード] 4つの Task(researcher) を並列起動
      Main Agent がリサーチ結果を統合して Spec 生成
```

### 3. /review は Task 並列（変更なし）

```
Main Agent
  ├→ Task(security-sentinel)       ─┐
  ├→ Task(performance-oracle)       │
  ├→ Task(architecture-strategist)  │ 並列実行
  ├→ Task(type-safety-reviewer)     │
  ├→ Task(api-contract-reviewer)    │
  ├→ Task(prisma-guardian)          │ ← 対象ファイルがある場合のみ
  └→ Task(terraform-reviewer)      ─┘ ← 対象ファイルがある場合のみ
```

### 4. エスカレーションフロー

```
Team Member（疑問発見）
  │ SendMessage（選択肢を含めて送信）
  ▼
Main Agent（チームリーダー）
  │ AskUserQuestion（選択肢をそのまま提示）
  ▼
ユーザー（回答）
  │
  ▼
Main Agent
  │ SendMessage（回答をそのまま返信）
  ▼
Team Member（作業再開）
```

### 5. spec-writer エージェント定義

新規エージェント `agents/spec/spec-writer.md`:
- tools: [Read, Write, Edit, Glob, Grep]
- skills: [iterative-retrieval, verification-before-completion]
- 役割: リサーチ結果を統合し design.md / tasks.md / delta-spec を生成
- SendMessage でリサーチャーに追加調査を依頼可能
- 完了時にサマリーを Main Agent に送信

### 6. ドキュメント整合

**CLAUDE.md（プロジェクト + グローバル）の更新箇所:**

1. **Context Isolation Policy セクション:**
   - 2層アーキテクチャの図を更新（Teams/SubAgents モード選択を反映）
   - Teams 使用時の Main Agent の役割（チームリーダー、Delegate モード）
   - エスカレーションフローの追加

2. **Available Agents セクション:**
   - spec-writer エージェントの追加
   - implement-orchestrator の「メインスレッド専用」の明記

3. **Teams vs Task 切り替え基準の追加:**
   - エージェント間通信が成果物の質を改善するか
   - タスクが独立して実行可能か（異なるファイルセット）
   - ユーザーがモードを選択可能

## リスクと注意点

1. **Agent Teams は実験的機能**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 が必要。セッション再開不可、タスクステータスの遅延など既知の制約がある。Sub Agents のみモードをフォールバックとして常に提供する。

2. **トークンコスト**: Agent Teams は通常の約7倍のトークンを消費。コスト意識が高い場合は Sub Agents のみモードを選択可能。

3. **ファイル衝突**: /implement Teams モードでは、各 teammate が異なるファイルセットを所有するようにタスクを分割する必要がある。Main Agent のタスク分析精度が重要。

4. **broadcast コスト**: broadcast はチームサイズに比例してスケール。DM を優先し、broadcast は全員に影響する重要情報のみに限定するガイドラインが必要。

5. **/spec での spec-writer コンテキスト**: 4リサーチャーの結果を全部受け取るため spec-writer のコンテキストは膨れるが、使い捨ての teammate なので Main Agent のコンテキスト保護には影響しない。
