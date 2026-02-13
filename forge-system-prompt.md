# Claude Codeプラグイン統合システム構築プロンプト

## 概要

3つのClaude Codeプラグイン（everything-claude-code、compound-engineering-plugin、superpowers）の最良部分を統合した、コマンドベースの開発ワークフローシステムを構築してください。

プロジェクト名は `forge` とします。（鍛冶場＝コードを鍛え上げる場所）

## 技術スタック前提

このシステムが対象とする開発環境は以下の通りです：

- **フロントエンド & バックエンド**: Next.js（App Router）── フロントもバックエンドもNext.js一本で開発
- **ORM**: Prisma
- **IaC**: Terraform
- **クラウド**: Google Cloud Platform（GCP）
- **言語**: TypeScript
- **テスト**: Vitest + Playwright
- **パッケージマネージャ**: pnpm

FastAPIは使用しません。Next.jsのRoute Handlers / Server Actionsでバックエンド処理を行います。

---

## ディレクトリ構造

以下の構造で `.claude/` 配下にプラグインを構成してください：

```
.claude/
├── commands/                    # スラッシュコマンド定義
│   ├── brainstorm.md
│   ├── spec.md
│   ├── implement.md
│   ├── review.md
│   ├── test.md
│   ├── compound.md
│   └── ship.md
│
├── agents/                      # エージェント定義
│   ├── research/                # リサーチフェーズ用
│   │   ├── stack-docs-researcher.md
│   │   ├── codebase-analyzer.md
│   │   ├── web-researcher.md
│   │   └── compound-learnings-researcher.md
│   │
│   ├── implementation/          # 実装フェーズ用
│   │   ├── implementer.md
│   │   ├── spec-compliance-reviewer.md
│   │   └── build-error-resolver.md
│   │
│   └── review/                  # レビューフェーズ用
│       ├── security-sentinel.md
│       ├── performance-oracle.md
│       ├── architecture-strategist.md
│       ├── prisma-guardian.md
│       ├── terraform-reviewer.md
│       ├── type-safety-reviewer.md
│       └── api-contract-reviewer.md
│
├── skills/                      # スキル定義
│   ├── test-driven-development/
│   │   └── SKILL.md
│   ├── systematic-debugging/
│   │   └── SKILL.md
│   ├── verification-before-completion/
│   │   └── SKILL.md
│   ├── iterative-retrieval/
│   │   └── SKILL.md
│   └── strategic-compact/
│       └── SKILL.md
│
├── rules/                       # ルール定義
│   ├── common/
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── testing.md
│   │   ├── security.md
│   │   └── performance.md
│   ├── nextjs/
│   │   └── conventions.md
│   ├── prisma/
│   │   └── conventions.md
│   └── terraform/
│       └── conventions.md
│
├── hooks/
│   ├── block-unnecessary-files.js
│   ├── detect-console-log.js
│   ├── require-tmux-for-servers.js
│   └── gate-git-push.js
│
├── docs/
│   └── compound/               # 複利ドキュメント格納先
│       └── .gitkeep
│
└── settings.json               # フック設定

注意: `openspec/` ディレクトリはプロジェクトルートに作成され、`openspec` CLI と互換性のある構造を持ちます。
```

---

## 各コマンドの詳細仕様

### 1. `/brainstorm` コマンド

**ファイル**: `commands/brainstorm.md`

**目的**: 機能設計の前にソクラテス式対話で要件を深掘りする

**インスパイア元**: superpowersのbrainstormingスキル

**仕様**:

```yaml
---
description: "機能設計の前にソクラテス式対話で要件を深掘りする"
---
```

以下のワークフローを実装してください：

1. ユーザーのやりたいことを聞く
2. **一度に1つだけ質問する**（複数質問を一度に投げない）
3. 可能な限り**選択肢形式**で質問する（A/B/C方式）
4. **YAGNI原則**を徹底適用する ── 「それは本当に今必要か？」を常に問う
5. 要件が十分に固まったら変更名をkebab-caseで自動導出し、`openspec/changes/<change-name>/proposal.md` に提案書を出力
6. 提案書には以下を含む：
   - 意図（なぜこの変更が必要か）
   - ユーザーストーリー
   - 対象領域
   - スコープ外の明示（YAGNIで除外したもの）
   - 未解決の疑問点

**重要なルール**:
- コードの話は一切しない。設計の話だけ。
- ユーザーが「十分」と言うまで質問を続ける
- 過剰な機能提案をしない。ミニマルに保つ

---

### 2. `/spec` コマンド

**ファイル**: `commands/spec.md`

**目的**: 設計ドキュメントから詳細な実装仕様と実行可能なタスクリストを作成する

**インスパイア元**: superpowersのwriting-plansスキル + CEPのplanコマンド

**仕様**:

```yaml
---
description: "設計ドキュメントから実装仕様とタスクリストを作成する。リサーチエージェントを並列起動し、Web検索とContext7 MCPで最新情報を収集する"
---
```

以下のワークフローを実装してください：

#### Phase 1: リサーチ（並列エージェント起動）

以下の4つのリサーチエージェントを**並列で**起動する：

1. **stack-docs-researcher** ── Context7 MCP経由で関連フレームワーク（Next.js, Prisma, Terraform, GCP等）の公式ドキュメントから該当機能のベストプラクティスを取得
2. **web-researcher** ── Web Search（Brave Search MCP or Tavily MCP）を使って以下を検索：
   - 該当技術の最新のベストプラクティス記事
   - 既知の落とし穴やバグレポート
   - コミュニティでの推奨パターン
   - 類似実装の参考例
3. **codebase-analyzer** ── 現在のプロジェクト構造を分析：
   - 既存の規約・パターンを抽出
   - 影響を受けるファイルを特定
   - 依存関係を把握
   - `openspec/specs/` の既存スペックを読み込み、関連する要件とシナリオを抽出
4. **compound-learnings-researcher** ── `docs/compound/` 配下の過去の学びを検索し、関連する教訓を抽出

#### Phase 2: 仕様統合

リサーチ結果を統合し、`openspec/changes/<change-name>/` 配下に以下の3ファイルを出力する：

1. `specs/<feature>/delta-spec.md` -- デルタ要件（ADDED/MODIFIED/REMOVED + Given/When/Then）
2. `design.md` -- リサーチサマリー + 技術設計
3. `tasks.md` -- タスクリスト

**デルタスペック形式** (`specs/<feature>/delta-spec.md`):

```markdown
# [feature] デルタスペック

## ADDED Requirements

### Requirement: [要件名]
[RFC 2119: SHALL, SHOULD, MAY]

#### Scenario: [シナリオ名]
- **GIVEN** [前提条件]
- **WHEN** [アクション]
- **THEN** [期待結果]

## MODIFIED Requirements

### Requirement: [要件名]
[変更後の記述]
**変更理由**: [理由]

#### Scenario: [シナリオ]
- **GIVEN** / **WHEN** / **THEN**

## REMOVED Requirements

### Requirement: [要件名]
**削除理由**: [理由]
```

**設計ドキュメント形式** (`design.md`):

```markdown
# [変更名] 技術設計

## 概要
## リサーチサマリー
### 公式ドキュメントからの知見
### Web検索からの知見
### コードベース分析（既存スペックとの関連含む）
### 過去の学び
## 技術的アプローチ
## リスクと注意点
```

**タスクリスト形式** (`tasks.md`):

```markdown
# [変更名] タスクリスト

## テスト戦略
## タスク

### Task 1: [タスク名]（推定: X分）
- **対象ファイル**: `src/app/xxx/page.tsx`（新規 or 既存）
- **やること**: [具体的な変更内容]
- **検証方法**: [テストコマンド]
- **関連スペック**: `specs/<feature>/delta-spec.md#[要件名]`
```

**タスク分解のルール**:
- 1タスクは**2〜5分**で完了できるサイズ
- 各タスクに**正確なファイルパス**を含める
- 各タスクに**検証方法**を必ず含める
- タスクの依存関係を明示する
- テストタスクを実装タスクの**前**に配置する（TDD）
- 各タスクに関連デルタスペック要件へのリンクを含める
- テストケースは Given/When/Then シナリオから導出する

**Phase 3: ユーザー確認**

仕様書を出力した後、**ユーザーが明示的に承認するまで実装に進まない**。
「この仕様で実装を開始してよいですか？」と確認する。

---

### 3. `/implement` コマンド

**ファイル**: `commands/implement.md`

**目的**: 仕様書のタスクリストに基づいてTDD駆動でコードを実装する

**インスパイア元**: superpowersのsubagent-driven-development + executing-plans + ECCのbuild-error-resolver

**仕様**:

```yaml
---
description: "仕様書のタスクリストに基づきTDD駆動で実装する。タスクごとにサブエージェントをディスパッチし、デュアルレビューで品質を担保する"
---
```

以下のワークフローを実装してください：

#### Step 1: 準備

1. gitワークツリーを作成（`git worktree add`）してブランチを分離
2. `openspec/changes/<change-name>/` から以下の3ファイルを読み込む：
   - `tasks.md`（タスクリスト）
   - `specs/`（デルタスペック）
   - `design.md`（技術設計）
3. タスクリストを解析し、実行順序を決定

#### Step 2: タスク実行ループ（各タスクごとに繰り返し）

各タスクに対して以下の3つのサブエージェントを**順次**起動する：

**A. implementerサブエージェント**:
- タスクテキスト + プロジェクトコンテキスト + デルタスペックの Given/When/Then を受け取る
- **TDD厳守**：必ずテストを先に書く（RED → GREEN → REFACTOR）
  - RED: Given/When/Then シナリオから失敗するテストを書く
  - GREEN: テストを通す最小限のコードを書く
  - REFACTOR: コードを整理する
- テストの前にコードを書いた場合、**そのコードを削除してやり直す**
- `iterative-retrieval`スキルを使用して、必要なコンテキストを段階的に取得
- ビルドエラーが発生した場合は `build-error-resolver` エージェントに委譲

**B. spec-compliance-reviewerサブエージェント**:
- implementerの成果物をデルタスペックと照合
- ADDED/MODIFIED/REMOVED 各要件タイプ別に確認
- Given/When/Then シナリオとテストの対応を検証
- 逸脱がある場合はimplementerに差し戻し

**C. code-quality-reviewerサブエージェント**:
- コード品質をチェック（型安全性、エラーハンドリング、パフォーマンス）
- 軽微な問題はそのまま通す（P3）
- 重大な問題（P1/P2）はimplementerに差し戻し

#### Step 3: タスク間チェックポイント

- 3タスクごとに全テストを実行して回帰がないか確認
- ビルドが通るか確認（`pnpm build`）
- 失敗した場合はそのタスクの修正を優先

#### Step 4: 完了

- 全タスク完了後、全テスト実行
- gitコミット（コンベンショナルコミット形式）
- 実装サマリーを出力

---

### 4. `/review` コマンド

**ファイル**: `commands/review.md`

**目的**: 実装済みコードを多角的にレビューする

**インスパイア元**: CEPの並列レビュースウォーム + ECCのセキュリティレビュー

**仕様**:

```yaml
---
description: "実装済みコードを7つの専門レビュアーエージェントで並列レビューする"
---
```

以下の7つのレビューエージェントを**並列で**起動する：

1. **security-sentinel**: OWASP Top 10、シークレット検出、XSS/CSRF、認証・認可の穴、Terraformセキュリティ（IAM、ファイアウォール）
2. **performance-oracle**: PrismaのN+1クエリ、Next.jsバンドルサイズ、不要な再レンダリング、キャッシュ戦略、Server Components最適化
3. **architecture-strategist**: コンポーネント境界、責務分離、App Router規約準拠、Route Handlers設計、レイヤー構成
4. **prisma-guardian**: マイグレーション安全性、参照整合性、クエリ最適化、インデックスカバレッジ、トランザクション境界
5. **terraform-reviewer**: IaCベストプラクティス、GCPリソース設定、ステート管理、ドリフト検出、セキュリティグループ
6. **type-safety-reviewer**: TypeScript strictモード準拠、Zodスキーマ検証、any型の排除、型の整合性（Server/Client間、API層）
7. **api-contract-reviewer**: Route Handlers / Server Actionsの入出力型整合性、エラーレスポンス統一、バリデーション

**レビュー出力形式**:

```markdown
# コードレビュー結果

## サマリー
- P1（修正必須）: X件
- P2（修正推奨）: X件
- P3（あると良い）: X件

## P1: クリティカル
### [SECURITY-001] SQLインジェクションの可能性
- **ファイル**: `src/app/api/users/route.ts:42`
- **問題**: ユーザー入力が直接クエリに渡されている
- **修正案**: Prismaのパラメータ化クエリを使用
- **レビュアー**: security-sentinel

## P2: 重要
### [PERF-001] N+1クエリの検出
...

## P3: 軽微
...
```

**レビュー後のアクション**:
- P1がある場合: **即座に修正を提案**（ユーザーの承認後に自動修正エージェントを起動）
- P2がある場合: 修正を推奨するが、ユーザーに判断を委ねる
- P3のみの場合: レポートのみ出力

---

### 5. `/test` コマンド

**ファイル**: `commands/test.md`

**目的**: テストスイートを実行し、結果を検証する

**インスパイア元**: ECCのe2e-runner + superpowersのverification-before-completion

**仕様**:

```yaml
---
description: "テストスイートを実行し、カバレッジと結果を検証する。修正が機能することを証明するまで完了としない"
---
```

以下のワークフローを実装してください：

1. **ユニットテスト実行**: `pnpm vitest run`
2. **型チェック**: `pnpm tsc --noEmit`
3. **リント**: `pnpm eslint .`
4. **ビルド検証**: `pnpm build`
5. **E2Eテスト実行**（該当する場合）: `pnpm playwright test`
6. **カバレッジ確認**: 80%以上を目標

**verification-before-completion**:
- テストが全てパスするまで「完了」と宣言しない
- 失敗したテストがある場合、根本原因を分析して修正を提案
- 修正後に再度全テストを実行して回帰がないことを確認
- 「テストがパスしました」ではなく、**テスト実行結果を実際に貼り付けて**証明する

---

### 6. `/compound` コマンド

**ファイル**: `commands/compound.md`

**目的**: 今回の開発から得た学びを文書化し、将来の開発にフィードバックする

**インスパイア元**: CEPのcompoundフェーズ + ECCの継続的学習

**仕様**:

```yaml
---
description: "開発から得た学びを文書化し、スペックマージとアーカイブを行い、将来の開発にフィードバックする"
---
```

以下のワークフローを実装してください：

1. 今回の開発セッションを振り返り、以下を抽出：
   - うまくいったパターン
   - 失敗して修正したこと
   - 予想外の落とし穴
   - 発見したベストプラクティス
   - 改善できるプロセス

2. `docs/compound/YYYY-MM-DD-<topic>.md` に以下の形式で出力：

```markdown
---
category: [bug-fix | performance | architecture | security | testing | devops | pattern]
stack: [nextjs | prisma | terraform | gcp | typescript | general]
severity: [critical | important | minor]
date: YYYY-MM-DD
tags: [関連タグをカンマ区切り]
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

## 防止策
[再発防止のための具体的なアクション]
- [ ] ルールの追加・更新が必要か
- [ ] スキルの追加・更新が必要か
- [ ] フックの追加・更新が必要か
```

3. **100ドルルール**を適用：防げたはずの失敗が起きた場合、ルール・スキル・フックの更新を提案する

4. **スペックマージ**: `openspec/changes/<change-name>/specs/` → `openspec/specs/` にマージ
   - ADDED: `openspec/specs/<feature>/spec.md` に追記（なければ新規作成）
   - MODIFIED: 同名要件を置換
   - REMOVED: 該当要件を削除
   - マージ後は ADDED/MODIFIED/REMOVED 接頭辞を除去し累積形式にする
   - マージ結果をユーザーに提示して確認を得る

5. **変更アーカイブ**: `openspec/changes/<change-name>/` → `openspec/changes/archive/YYYY-MM-DD-<change-name>/` に移動

**累積スペック形式** (`openspec/specs/<feature>/spec.md`):

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

**マージルール**:
- ADDED → 累積スペックの末尾に追加
- MODIFIED → 同名要件を置換
- REMOVED → 該当セクションを削除

---

### 7. `/ship` コマンド

**ファイル**: `commands/ship.md`

**目的**: `/brainstorm` → `/spec` → `/implement` → `/review` → `/test` → `/compound` を連鎖実行する完全自律モード

**仕様**:

```yaml
---
description: "設計から実装、レビュー、テスト、学びの文書化までを連鎖実行する完全自律モード"
---
```

以下のワークフローを実装してください：

1. `/brainstorm` を実行 → 提案書を `openspec/changes/<change-name>/proposal.md` に出力 → **ここでユーザーの承認を待つ**
2. `/spec` を実行 → `openspec/changes/<change-name>/` 配下に3ファイルを出力 → **ここでユーザーの承認を待つ**
3. 以降は自律実行：
   - `/implement` を実行
   - `/review` を実行
   - P1/P2の発見事項を自動修正
   - `/test` を実行
   - テスト失敗があれば修正→再テスト（最大3回リトライ）
   - `/compound` を実行（学びの文書化 + デルタスペックを `openspec/specs/` にマージ + 変更をアーカイブ）
4. 最終サマリーを出力

**重要**: brainstormとspecの後には必ずユーザーの承認を取る。それ以降は自律的に動く。

---

## エージェント詳細仕様

### 共通フォーマット

すべてのエージェントは以下のYAMLフロントマターを持つ：

```yaml
---
name: エージェント名
description: "エージェントの説明"
model: [opus | sonnet]  # レビュアーはopus、実装系はsonnet
tools: [Read, Write, Edit, Bash, Glob, Grep, Task]  # 必要なものだけ
---
```

### リサーチエージェント

#### stack-docs-researcher

```yaml
---
name: stack-docs-researcher
description: "Context7 MCP経由でNext.js、Prisma、Terraform、GCPの公式ドキュメントからベストプラクティスを取得する"
tools: [Read, Grep, Glob, Task]
---
```

**行動規範**:
- Context7 MCPサーバーを使用して公式ドキュメントを検索
- 対象フレームワーク: Next.js (App Router), Prisma, Terraform (GCP Provider), Google Cloud
- 該当機能に関連するベストプラクティス、推奨パターン、非推奨パターンを抽出
- コード例がある場合はそのまま引用
- ドキュメントのバージョンを明記

#### web-researcher

```yaml
---
name: web-researcher
description: "Web検索で最新のベストプラクティス、既知の落とし穴、コミュニティの推奨パターンを調査する"
tools: [Read, Bash, Task]
---
```

**行動規範**:
- Web Search MCP（Brave Search or Tavily）を使用
- 検索クエリを3〜5個生成し、以下の観点で検索：
  1. `[技術名] best practices [年]` ── 最新ベストプラクティス
  2. `[技術名] [機能名] pitfalls` ── 既知の落とし穴
  3. `[技術名] [機能名] example implementation` ── 参考実装
  4. `[技術名] [機能名] known issues` ── 既知の問題
  5. `[技術名] [機能名] [関連技術名] integration` ── 統合パターン
- 検索結果から信頼性の高いソース（公式ブログ、主要技術ブログ、Stack Overflow高評価回答）を優先
- 結果をカテゴリ別に整理して返す
- 情報の鮮度（日付）を必ず明記

#### codebase-analyzer

```yaml
---
name: codebase-analyzer
description: "現在のプロジェクト構造を分析し、OpenSpecスペックを含む既存のパターン・規約・影響範囲を特定する"
tools: [Read, Grep, Glob]
---
```

**行動規範**:
- プロジェクトのディレクトリ構造をスキャン
- 既存のコーディングパターンを抽出（命名規約、ファイル構成、コンポーネント設計）
- 影響を受けるファイルを特定
- 既存のテストパターンを確認
- package.jsonの依存関係を確認
- tsconfig.jsonの設定を確認
- `openspec/specs/` の既存スペックを読み込み、関連する要件とシナリオを抽出
- `openspec/project.md` のプロジェクトコンテキストを確認

#### compound-learnings-researcher

```yaml
---
name: compound-learnings-researcher
description: "docs/compound/配下の過去の学びを検索し、関連する教訓を抽出する"
tools: [Read, Grep, Glob]
---
```

**行動規範**:
- `docs/compound/` ディレクトリの全ファイルをスキャン
- YAMLフロントマターのcategory, stack, tagsでフィルタリング
- 今回の機能に関連する過去の学びを抽出
- 特に「防止策」セクションのアクションアイテムを確認
- 該当する学びがない場合は「関連する過去の学びはありません」と明示

### 実装エージェント

#### implementer

```yaml
---
name: implementer
description: "タスク単位でTDD駆動の実装を行うサブエージェント"
tools: [Read, Write, Edit, Bash, Glob, Grep]
---
```

**行動規範**:
- 受け取ったタスクテキスト + デルタスペックの Given/When/Then に基づいて実装
- Given/When/Then シナリオからテストケースを導出する（GIVEN → Arrange、WHEN → Act、THEN → Assert）
- **TDD厳守**: テストを先に書く。テスト前のコードは書かない。書いた場合は削除してやり直す
- RED → GREEN → REFACTOR のサイクルを守る
- `iterative-retrieval`スキルでコンテキストを段階的に取得
- 1タスクの実装が完了したら、テストがパスすることを確認してから次に進む
- コンベンショナルコミット形式でコミットメッセージを作成

#### spec-compliance-reviewer

```yaml
---
name: spec-compliance-reviewer
description: "実装結果がデルタスペックに準拠しているか検証する"
model: opus
tools: [Read, Grep, Glob]
---
```

**行動規範**:
- `openspec/changes/<change-name>/specs/` 配下のデルタスペックを読み込む
- ADDED/MODIFIED/REMOVED 各要件タイプ別に実装結果を確認：
  - ADDED: 新規要件が全て実装されているか
  - MODIFIED: 変更が正しく反映されているか
  - REMOVED: コードが適切に処理（削除・無効化）されているか
- Given/When/Then シナリオとテストの対応を確認
- 逸脱がある場合は具体的な指摘とともにimplementerに差し戻し

#### build-error-resolver

```yaml
---
name: build-error-resolver
description: "TypeScriptのビルドエラーを最小限の差分で解決する"
tools: [Read, Write, Edit, Bash, Grep]
---
```

**行動規範**:
- ビルドエラーのスタックトレースを解析
- エラーの根本原因を特定
- **最小限の変更**で修正（大規模なリファクタリングはしない）
- 修正後にビルドが通ることを確認
- 型エラー、インポートエラー、設定エラーをそれぞれ適切に処理

### レビューエージェント

全レビューエージェントは `model: opus`、`tools: [Read, Grep, Glob]`（読み取り専用）で統一。

#### security-sentinel

**チェック項目**:
- OWASP Top 10（特にXSS、CSRF、SQLインジェクション、認証バイパス）
- ハードコードされたシークレット・APIキー
- 環境変数の適切な使用
- 認証・認可ロジックの穴
- Next.jsのセキュリティヘッダー設定
- Server ActionsのCSRF対策
- Terraformセキュリティ（IAM最小権限、ファイアウォールルール、暗号化設定）

#### performance-oracle

**チェック項目**:
- PrismaのN+1クエリ（`include`/`select`の最適化）
- Next.jsバンドルサイズ（dynamic import、tree shaking）
- 不要な再レンダリング（`use client`の範囲最小化）
- Server Components vs Client Componentsの適切な使い分け
- キャッシュ戦略（`unstable_cache`、`revalidate`、ISR）
- 画像最適化（`next/image`の使用）
- データベースクエリの実行計画

#### architecture-strategist

**チェック項目**:
- App Router規約の準拠（ファイル構成、メタデータ、ローディング、エラーハンドリング）
- コンポーネントの責務分離（Container/Presentational）
- Route Handlers / Server Actionsの設計
- レイヤー構成（presentation → application → domain → infrastructure）
- 共通化すべきロジックの検出
- ファイルサイズ制限（200〜400行を推奨、800行を上限）

#### prisma-guardian

**チェック項目**:
- マイグレーションの安全性（データ損失リスク、ダウンタイム）
- 参照整合性（外部キー制約、カスケード設定）
- クエリ最適化（select/includeの適切な使用、不要なフィールド取得の排除）
- インデックスカバレッジ（頻出クエリに対するインデックス）
- トランザクション境界（`$transaction`の適切な使用）
- スキーマ設計（命名規約、リレーション設計）

#### terraform-reviewer

**チェック項目**:
- IaCベストプラクティス（モジュール化、変数化、出力定義）
- GCPリソース設定（リージョン、ゾーン、マシンタイプ）
- ステート管理（リモートステート、ロック設定）
- セキュリティ（IAM最小権限、VPCファイアウォール、暗号化）
- コスト最適化（不要なリソース、過剰なスペック）
- 命名規約の統一

#### type-safety-reviewer

**チェック項目**:
- TypeScript strictモード準拠
- `any`型の使用箇所（代替型の提案）
- Zodスキーマによるランタイムバリデーション
- Server/Client間の型の整合性
- API層の入出力型定義
- 型ガードの適切な使用
- ジェネリクスの適切な使用

#### api-contract-reviewer

**チェック項目**:
- Route Handlersの入出力型定義
- Server Actionsの引数・戻り値型
- エラーレスポンスの統一（形式、ステータスコード）
- バリデーション（Zodスキーマの適用）
- レスポンスの型安全性（型アサーションの排除）
- API版管理の考慮

---

## スキル詳細仕様

### Skill Activation パターン

全てのスキルは YAML frontmatter（`name` + `description`）を持ち、Claude Code のネイティブ Skill 機構で自動判定される。加えて、以下の仕組みで確実な適用を保証する:

1. **メタスキル `forge-skill-orchestrator`**: 全セッションの最初に呼び出され、フェーズ+ドメイン判定に基づいて適用すべき Skill を決定する
2. **コマンドの `## Skill Activation` セクション**: 各コマンドがどの Skill を呼び出すべきかを明示
3. **エージェントの `skills` frontmatter + `## Required Skills`**: サブエージェントに必要な Skill を宣言。親コマンドが SKILL.md を読み込みタスクプロンプトに含める
4. **1% ルール**: 1% でも適用される可能性があれば、そのスキルを呼び出す

### Skill frontmatter 構造

```yaml
---
name: skill-name
description: "Use when ... MUST be invoked before/when ..."
---
```

- `name`: スキルの一意識別子（kebab-case）
- `description`: LLM がセマンティック判定に使用するトリガー説明（1024文字以内）

### forge-skill-orchestrator（メタスキル）

**ファイル**: `skills/forge-skill-orchestrator/SKILL.md`

全セッションの最初に呼び出されるメタスキル。タスクに応じた Skill の選択を強制する。

- **1% ルール**: 1% でも適用される可能性があれば呼び出す
- **フェーズ検出**: コマンド名・作業内容からフェーズを判定
- **ドメイン検出**: ファイルパスパターンからドメインを判定
- **Skill レジストリ**: 全 Skill を一覧化（フェーズ/ドメイン/トリガー条件）
- **サブエージェント向け指示**: 親コマンドがエージェントの `skills` frontmatter を読み、SKILL.md をタスクプロンプトに含める
- **決定フロー**: フェーズ判定 → ドメイン判定 → レジストリ照合 → Union → 呼び出し

### Methodology Skills（universal）

| Skill | ファイル | 適用フェーズ |
|---|---|---|
| `test-driven-development` | `skills/test-driven-development/SKILL.md` | implementation, debug |
| `systematic-debugging` | `skills/systematic-debugging/SKILL.md` | debug, implementation, test |
| `verification-before-completion` | `skills/verification-before-completion/SKILL.md` | ALL（完了境界） |
| `iterative-retrieval` | `skills/iterative-retrieval/SKILL.md` | ALL |
| `strategic-compact` | `skills/strategic-compact/SKILL.md` | ALL |

### Domain Skills（将来追加枠）

新しいドメイン Skill は以下のテンプレートで追加する:

```yaml
---
name: domain-skill-name
description: "Use when working with [technology/framework] files ([file patterns]). Provides [specific patterns and guidance]."
---
```

追加手順:
1. `skills/<domain-skill-name>/SKILL.md` を作成（frontmatter + 本文 + Applicability）
2. `forge-skill-orchestrator` の Skill レジストリに登録
3. 関連するエージェントの `skills` frontmatter と `## Required Skills` に追加
4. 関連するコマンドの `## Skill Activation` に必要に応じて追記

ドメイン Skill の例:
- `nextjs-frontend`: `.tsx`/`.jsx` ファイル、`src/app/` 配下の変更時
- `typescript-backend`: Route Handlers、Server Actions の変更時
- `prisma-database`: Prisma スキーマ、マイグレーション、クエリの変更時
- `terraform-infrastructure`: `.tf` ファイルの変更時

---

## ルール詳細仕様

### rules/common/coding-style.md

```markdown
# コーディングスタイル

## ファイルサイズ
- 推奨: 200〜400行
- 上限: 800行
- 超える場合は分割を検討

## 命名規約
- コンポーネント: PascalCase（`UserProfile.tsx`）
- ユーティリティ: camelCase（`formatDate.ts`）
- 定数: UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- 型: PascalCase + suffix（`UserResponse`, `CreateUserInput`）
- ファイル: kebab-case（`user-profile.tsx`）※コンポーネントファイルはPascalCaseも可

## インポート順序
1. React/Next.js
2. 外部ライブラリ
3. 内部モジュール（`@/`パス）
4. 型インポート（`type`）
5. スタイル

## コメント
- 「何をしているか」ではなく「なぜそうしているか」を書く
- TODOコメントには担当者と日付を含める: `// TODO(kosuke 2025-01-01): 理由`
- JSDocはパブリックAPIにのみ
```

### rules/common/git-workflow.md

```markdown
# Gitワークフロー

## ブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- `feature/<issue-id>-<short-description>`: 機能開発
- `fix/<issue-id>-<short-description>`: バグ修正
- `chore/<description>`: メンテナンス

## コミットメッセージ（Conventional Commits）
- `feat: 新機能の追加`
- `fix: バグ修正`
- `refactor: リファクタリング`
- `test: テスト追加・修正`
- `docs: ドキュメント更新`
- `chore: ビルド・ツール設定`
- `perf: パフォーマンス改善`

## コミット粒度
- 1コミット = 1つの論理的な変更
- テストと実装は同じコミットに含める
- 動く状態でコミットする（ビルドが壊れた状態でコミットしない）
```

### rules/common/testing.md

```markdown
# テスト規約

## テストフレームワーク
- ユニットテスト: Vitest
- E2Eテスト: Playwright
- コンポーネントテスト: Vitest + Testing Library

## テストファイル配置
- `__tests__/` ディレクトリにまとめる、または
- 対象ファイルと同階層に `.test.ts` / `.spec.ts`

## テスト命名
- `describe('[対象]', () => { ... })`
- `it('should [期待する動作] when [条件]', () => { ... })`

## テストの原則
- Arrange → Act → Assert パターン
- モックは最小限に
- テストデータはファクトリ関数で生成
- E2Eテストはユーザー視点で記述
```

### rules/common/security.md

```markdown
# セキュリティ規約

- ハードコードされたシークレット・APIキー禁止
- 環境変数は `.env.local`（開発）、Secret Manager（本番）
- ユーザー入力は必ずZodでバリデーション
- SQLインジェクション防止: Prismaのパラメータ化クエリのみ使用
- XSS防止: `dangerouslySetInnerHTML` 禁止（例外は明示的なレビュー後のみ）
- CSRF: Server Actionsは自動保護、Route Handlersは明示的に対策
- 認証: middleware.tsでルートレベルの保護
- 依存関係: `pnpm audit` でゼロ脆弱性を維持
```

### rules/common/performance.md

```markdown
# パフォーマンス規約

- Server Componentsをデフォルトとし、`use client`は必要な場合のみ
- 画像は`next/image`を使用
- 動的インポートで初期バンドルサイズを削減
- Prismaクエリは`select`で必要なフィールドのみ取得
- N+1クエリの防止: `include`より`select`で明示的にリレーション取得
- キャッシュ戦略を明示的に設定（`revalidate`, `unstable_cache`）
- Web Vitals目標: LCP < 2.5s, FID < 100ms, CLS < 0.1
```

### rules/nextjs/conventions.md

```markdown
# Next.js規約

## App Router
- `page.tsx`: ルートのUI
- `layout.tsx`: 共有レイアウト
- `loading.tsx`: ローディングUI
- `error.tsx`: エラーハンドリング
- `not-found.tsx`: 404ページ
- `route.ts`: APIルートハンドラ

## Server Components vs Client Components
- デフォルトはServer Components
- `use client`は以下の場合のみ:
  - `useState`, `useEffect`などのフックが必要
  - ブラウザAPIが必要
  - イベントハンドラが必要
- Client Componentsの範囲は最小限にする（葉ノードに押し込む）

## Route Handlers
- `src/app/api/[リソース名]/route.ts` に配置
- Zodで入力バリデーション
- エラーレスポンスは統一形式: `{ error: { code: string, message: string } }`
- 成功レスポンス: `{ data: T }`

## Server Actions
- `src/actions/[アクション名].ts` に配置
- `'use server'` ディレクティブ
- Zodで入力バリデーション
- `revalidatePath` / `revalidateTag` で適切にキャッシュ無効化

## メタデータ
- 各`page.tsx`で`generateMetadata`を定義
- OGP画像の設定
- `robots`と`sitemap`の設定
```

### rules/prisma/conventions.md

```markdown
# Prisma規約

## スキーマ
- モデル名: PascalCase単数形（`User`, `Post`）
- フィールド名: camelCase（`createdAt`, `userId`）
- リレーション名: 意味のある名前（`author`, `posts`）
- `@@map`でテーブル名をsnake_case化

## マイグレーション
- マイグレーションファーストで変更
- 生成されたクライアントを直接編集しない
- 破壊的変更は段階的に実行（新カラム追加 → データ移行 → 旧カラム削除）

## クエリ
- `select`で必要なフィールドのみ取得
- `include`は明示的に（デフォルトでリレーションを取得しない）
- `findMany`には必ず`take`（上限）を設定
- 複雑なクエリは`$queryRaw`ではなくPrisma Clientで表現

## インデックス
- 検索・フィルタに使うフィールドにインデックス
- 複合インデックスの順序に注意
- ユニーク制約の活用
```

### rules/terraform/conventions.md

```markdown
# Terraform規約

## ファイル構成
- `main.tf`: メインリソース定義
- `variables.tf`: 変数定義
- `outputs.tf`: 出力定義
- `providers.tf`: プロバイダ設定
- `backend.tf`: バックエンド設定

## モジュール化
- GCPサービスごとにモジュール分割
- `modules/[サービス名]/` に配置

## ステート管理
- リモートステート: GCSバケット
- ステートロック: 有効
- 環境ごとにワークスペース分離

## セキュリティ
- IAM最小権限の原則
- サービスアカウントの適切な管理
- 暗号化の有効化（Cloud KMS）
- VPCファイアウォールの最小公開

## ワークフロー
- `terraform plan` → レビュー → `terraform apply`
- 手動変更禁止（全てコードで管理）
```

---

## フック詳細仕様

### settings.json

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/block-unnecessary-files.js \"$TOOL_INPUT\""
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/require-tmux-for-servers.js \"$TOOL_INPUT\""
          },
          {
            "type": "command",
            "command": "node .claude/hooks/gate-git-push.js \"$TOOL_INPUT\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/detect-console-log.js \"$TOOL_INPUT\""
          }
        ]
      }
    ]
  }
}
```

### block-unnecessary-files.js

プロジェクトルートに不要な `.md`、`.txt` ファイルが作成されるのを防ぐ。
`docs/` 配下は許可する。

### detect-console-log.js

`.ts`、`.tsx` ファイルの編集後に `console.log` が含まれていたら警告を出す。
`console.error`、`console.warn` は許可。

### require-tmux-for-servers.js

`pnpm dev`、`pnpm start`、`next dev` などの長時間実行プロセスが tmux セッション内で実行されていない場合にブロックする。

### gate-git-push.js

`git push` コマンドを検出し、レビューが完了しているか確認を促す。

---

## MCP設定

このシステムは以下のMCPサーバーを前提とします。ユーザーが適宜設定してください：

1. **Context7 MCP**: フレームワーク公式ドキュメントの取得
2. **Web Search MCP**（以下のいずれか）:
   - Brave Search MCP: `@anthropic/brave-search-mcp`
   - Tavily MCP: `tavily-mcp`

---

## 実装手順

以下の順序でファイルを作成してください：

1. ディレクトリ構造の作成
2. ルールファイル（`rules/`）── これが全体の規約基盤
3. スキルファイル（`skills/`）── 方法論の定義
4. エージェントファイル（`agents/`）── 各フェーズの実行者
5. フックスクリプト（`hooks/`）── 自動品質ゲート
6. settings.json ── フック設定
7. コマンドファイル（`commands/`）── ユーザーインターフェース

各ファイルは上記の仕様を**そのまま**実装してください。仕様にない独自の判断で機能を追加したり省略したりしないでください。

## 重要な注意事項

1. **ファイル内容はこのプロンプトの仕様に忠実に**作成すること
2. 各マークダウンファイルの**YAMLフロントマター**は正確に記述すること
3. フックのJavaScriptは**実際に動作するコード**として実装すること
4. `docs/compound/` ディレクトリは `.gitkeep` で初期化すること（`openspec/` ディレクトリはプロジェクトで `/brainstorm` 実行時に自動作成される）
5. 全てのファイルを作成し終えたら、ファイルツリーを出力して確認させてください
