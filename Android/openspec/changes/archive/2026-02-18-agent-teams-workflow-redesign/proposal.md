# Agent Teams ワークフロー再設計 提案書

## 意図（Intent）

現在の Forge ワークフローには構造的問題がある:

1. **3層アーキテクチャの破綻**: `/implement` コマンドが `Task(implement-orchestrator)` を起動する設計だが、Claude Code の制約（Sub Agent は Sub Agent を起動できない）により、orchestrator が implementer を起動できず機能しない
2. **ドキュメント間の矛盾**: `CLAUDE.md` は2層構造を記載、`implement.md` は3層構造を記載しており、実際の運用で混乱が発生している
3. **Agent Teams の未活用**: TeamCreate/SendMessage による協調作業の仕組みが存在するが、コマンドパイプラインで活用されていない

これらを解決し、**エージェント間通信が成果物の質を向上させるフェーズ**に Agent Teams を導入するワークフロー全体の再設計を行う。

## スコープ（Scope）

### ユーザーストーリー

- 開発者として、`/implement` で implementer 同士が型定義やAPI変更を共有しながら協調実装してほしい。なぜなら独立したSub Agentでは他の実装者の成果を知れず、整合性の問題が生じるから。
- 開発者として、`/implement` で spec-compliance-reviewer が implementer に直接フィードバックし、修正ループを回してほしい。なぜなら Main Agent を経由するとコンテキストが膨らみ遅延するから。
- 開発者として、`/spec` でリサーチャー間が相互に情報を共有しながら調査し、その結果を踏まえて spec-writer がSpec を生成してほしい。なぜなら独立したリサーチでは相互活用できず、Main Agent がリサーチ結果を統合するとコンテキストが膨らむから。
- 開発者として、ドキュメント（CLAUDE.md・コマンド定義・エージェント定義）が整合していてほしい。なぜなら矛盾があると実行時に予期しない動作になるから。

### 対象領域

- **コマンド定義**: `commands/implement.md`, `commands/spec.md`（存在すれば）, `commands/review.md`（存在すれば）
- **エージェント定義**: `~/.claude/agents/orchestration/implement-orchestrator.md`、新規 spec-writer エージェント
- **統合設定**: `CLAUDE.md`（プロジェクト）, `~/.claude/CLAUDE.md`（グローバル）
- **切り替え基準の策定**: Teams vs Task の判断ルール

### 設計方針

#### Teams vs Task の切り替え基準

**基準: エージェント間のやりとりが成果物の質を改善するか？**

| 条件 | 方式 | 理由 |
|---|---|---|
| エージェント間の情報共有・フィードバックが成果を改善する | Teams | SendMessage による協調で質が上がる |
| 各エージェントが独立して作業でき、やりとりが不要 | Task 並列 | Teams のオーバーヘッドなしに並列実行できる |
| 単発の委譲タスク | Task | 協調の必要なし |

#### 1. /implement の再設計（3層 → 2層 + Teams）

**Teams を使う理由**: implementer 同士の協調（型定義・API変更の共有）、spec-compliance-reviewer → implementer のフィードバックループ

**現状（破綻）:**
```
Main Agent
  └→ Task(implement-orchestrator)  ← 何もできない
       └→ Task(implementer) × N    ← 起動不可
```

**新設計:**
```
Main Agent（チームリーダー）
  │ tasks.md + design.md を読み込み
  │ タスク分析・依存関係構築
  │
  ├─ [タスク2+] TeamCreate → 実装チーム
  │   ├─ implementer-1: 「Task A の型定義を export した」→ implementer-2 に通知
  │   ├─ implementer-2: implementer-1 の成果を踏まえて実装
  │   ├─ spec-compliance-reviewer: 逸脱を検出 → implementer に直接フィードバック
  │   └─ build-error-resolver: ビルドエラー時に投入
  │   Main Agent がタスク割り当て・進捗監視・完了確認
  │
  └─ [単発タスク] Task(implementer) 直接起動
```

**エージェント間通信の具体例:**
- implementer-A → implementer-B: 「UserService の createUser() の戻り値型を変更した。import パスは `@/services/user`」
- spec-compliance-reviewer → implementer-A: 「specs/auth.md の要件3に未対応。エラーレスポンスに code フィールドが必要」
- implementer-A → spec-compliance-reviewer: 「修正完了。確認をお願いします」

#### 2. /spec の再設計（リサーチ＆スペックチーム）

**Teams を使う理由**: リサーチャー間の相互参照で調査の質が向上する + spec-writer がリサーチャーに追加調査を依頼できる + Main Agent のコンテキスト保護（リサーチ結果の統合をチーム内で完結）

**現状:** Main Agent が順次リサーチエージェントを起動 → 結果が独立していて相互活用できない → Main Agent がリサーチ結果を全て受け取ってSpec生成 → コンテキスト膨張

**新設計:**
```
Main Agent（チームリーダー）
  │ proposal.md の内容をプロンプトで渡してチーム起動
  │
  ├─ TeamCreate → リサーチ＆スペックチーム
  │   ├─ codebase-analyzer: 「既存コードでは Repository パターンを使用」→ 全員に共有
  │   ├─ stack-docs-researcher: codebase-analyzer の発見を踏まえて公式ドキュメントを調査
  │   ├─ web-researcher: 「この手法には既知の落とし穴がある」→ codebase-analyzer に確認依頼
  │   ├─ compound-learnings-researcher: 「過去に同様の実装で問題が起きた」→ 全員に共有
  │   └─ spec-writer: リサーチ結果を統合し design.md / tasks.md / specs/ を生成
  │       リサーチャーに追加調査を依頼可能
  │       完了時にサマリーのみ Main Agent に送信
  │
  │ Main Agent はサマリーのみ受け取る（コンテキスト保護）
  │ ユーザーに承認を求める
  │
  └─ TeamDelete → クリーンアップ
```

**エージェント間通信の具体例:**
- codebase-analyzer → stack-docs-researcher: 「既存コードで Prisma の softDelete パターンを使っている。これの公式推奨パターンを調べてほしい」
- web-researcher → codebase-analyzer: 「Next.js 15 で Server Actions の挙動が変わった報告がある。既存コードに影響ないか確認してほしい」
- compound-learnings-researcher → 全員: 「2024-12 に N+1 クエリで障害があった。DB アクセスパターンは要注意」
- spec-writer → stack-docs-researcher: 「認可パターンの公式推奨がもう少し欲しい。RBAC vs ABAC の比較は？」
- spec-writer → Main Agent: 「Spec生成完了。サマリー: 認証にNextAuth.js v5を採用、3つのAPIエンドポイント、Prismaスキーマ変更あり」

#### 3. /review は Task 並列（Teams 不要）

**Task を使う理由**: 各レビューは「読んで指摘する」独立作業。レビュアー間のやりとりで成果が改善するケースは稀。

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

#### 4. エスカレーションフロー（Teams 内 → ユーザー）

Team Member はユーザーと直接やりとりできない。エスカレーションは Main Agent 経由:

```
Team Member（疑問発見）
  │ SendMessage（具体的な選択肢を含めて送信）
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

**ルール:**
- Team Member はエスカレーション時に具体的な選択肢を含めて送る
- Main Agent は選択肢をそのまま AskUserQuestion に渡す（解釈を加えない）
- ユーザーの回答もそのまま Team Member に返す
- エスカレーション中の Team Member は idle 状態。他のメンバーの作業は続行可能

#### 5. implement-orchestrator の位置づけ

- `claude --agent implement-orchestrator` でメインスレッドとして起動する場合のみ有効
- `/implement` コマンドからは使用しない（明示的にメインスレッド専用と記載）
- CLAUDE.md の記載を整合させる

## スコープ外（Out of Scope）

- **/brainstorm の Agent Teams 化**: 対話中心のフェーズでエージェント間通信の必要なし -- YAGNI
- **/review の Agent Teams 化**: 各レビューは独立作業、エージェント間のやりとりで質が向上しない -- YAGNI
- **/compound の Agent Teams 化**: 学び記録は単発作業 -- YAGNI
- **/test の Agent Teams 化**: テスト実行は Main Agent が直接実行可能 -- YAGNI
- **スキル定義の変更**: スキルの仕組み自体は変更しない

## 未解決の疑問点（Open Questions）

- implementer チームメンバーの最大同時実行数に実用的な上限はあるか？（API レート制限等）
- Teams のメッセージングで broadcast を使うべき場面と DM を使うべき場面のガイドラインが必要か？（broadcast は N 人分のコストがかかる）
