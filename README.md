# Forge

**コードを鍛え上げる場所** -- Claude Code プラグイン統合開発ワークフローシステム

Forge は、設計から実装・レビュー・テスト・学習までの開発ライフサイクル全体を、Claude Code のスラッシュコマンド・エージェント・スキル・フックで自動化する統合システムです。

---

## 対象技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド & バックエンド | Next.js（App Router） |
| ORM | Prisma |
| IaC | Terraform |
| クラウド | Google Cloud Platform（GCP） |
| 言語 | TypeScript |
| テスト | Vitest + Playwright |
| パッケージマネージャ | pnpm |

---

## インストール

### 前提条件

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- 以下の MCP サーバーが設定済み：
  - **Context7 MCP** -- フレームワーク公式ドキュメント取得用
  - **Web Search MCP**（Brave Search MCP または Tavily MCP）-- Web 検索用

### セットアップ

このリポジトリの内容を `~/.claude/` にコピーして使用します。

```bash
# リポジトリをクローン
git clone https://github.com/your-username/forge.git
cd forge

# ~/.claude/ にコピー（既存の設定がある場合はバックアップを推奨）
cp -r commands/ ~/.claude/commands/
cp -r agents/ ~/.claude/agents/
cp -r skills/ ~/.claude/skills/
cp -r rules/ ~/.claude/rules/
cp -r hooks/ ~/.claude/hooks/
cp -r docs/ ~/.claude/docs/
cp settings.json ~/.claude/settings.json
```

または、ワンライナーで一括コピー：

```bash
# ~/.claude/ が存在しない場合は作成
mkdir -p ~/.claude

# 全ファイルをコピー（README と .git を除く）
rsync -av --exclude='README.md' --exclude='.git' --exclude='forge-system-prompt.md' ./ ~/.claude/
```

> **注意**: 既に `~/.claude/settings.json` が存在する場合は、手動でマージしてください。上書きすると既存のフック設定が消えます。

### コピー先の確認

セットアップ後、以下の構造になっていれば正しくインストールされています：

```
~/.claude/
├── commands/           # スラッシュコマンド（7 個）
├── agents/
│   ├── research/       # リサーチエージェント（4 個）
│   ├── implementation/ # 実装エージェント（3 個）
│   └── review/         # レビューエージェント（7 個）
├── skills/             # スキル定義（5 個）
├── rules/
│   ├── common/         # 共通ルール（5 個）
│   ├── nextjs/         # Next.js 規約
│   ├── prisma/         # Prisma 規約
│   └── terraform/      # Terraform 規約
├── hooks/              # 自動品質ゲート（4 個）
├── docs/
│   └── compound/       # 複利ドキュメント
└── settings.json       # フック設定
```

### アンインストール

```bash
# Forge のファイルを削除（他の Claude Code 設定は残ります）
rm -rf ~/.claude/commands ~/.claude/agents ~/.claude/skills \
       ~/.claude/rules ~/.claude/hooks ~/.claude/docs
# settings.json は手動で Forge のフック設定を削除してください
```

---

## 使い方

任意のプロジェクトディレクトリで Claude Code を起動し、スラッシュコマンドを実行します：

```bash
# 新機能を設計から実装まで一気通貫で
/ship

# または、フェーズごとに段階的に
/brainstorm    # 要件を深掘り
/spec          # 仕様書を作成
/implement     # TDD で実装
/review        # コードレビュー
/test          # テスト実行・検証
/compound      # 学びを文書化
```

---

## コマンド一覧

### `/brainstorm` -- 要件の深掘り

ソクラテス式対話で機能の要件を深掘りします。

- **一度に 1 つだけ**質問（選択肢形式を優先）
- **YAGNI 原則**を徹底 -- 「それは本当に今必要か？」
- コードの話は一切しない。設計だけに集中
- 出力: `openspec/changes/<change-name>/proposal.md`

### `/spec` -- デルタスペック・技術設計・タスクリストの作成

4 つのリサーチエージェントを**並列起動**し、情報を収集してから仕様を作成します。Delta 記法（ADDED/MODIFIED/REMOVED）と Given/When/Then シナリオで要件を記述します。

```
┌─────────────────────┐
│      /spec 実行      │
└──────────┬──────────┘
           │ Phase 1: 並列リサーチ
    ┌──────┼──────┬──────────────┐
    ▼      ▼      ▼              ▼
 stack-  web-  codebase-  compound-
 docs   researcher analyzer  learnings
    │      │      │              │
    └──────┴──────┴──────────────┘
           │ Phase 2: 仕様統合（3ファイル出力）
           ▼
   openspec/changes/<change-name>/
   ├── specs/<feature>/delta-spec.md
   ├── design.md
   └── tasks.md
           │ Phase 3: 承認待ち
           ▼
   ユーザーが承認 → 実装へ
```

- 1 タスク = 2〜5 分で完了できるサイズ
- 各タスクにファイルパス・検証方法を明記
- テストタスクを実装タスクの**前**に配置（TDD）
- 各タスクにデルタスペック要件へのリンクを含む
- テストケースは Given/When/Then シナリオから導出

### `/implement` -- TDD 駆動の実装

仕様書のタスクリストに基づき、タスクごとに 3 つのサブエージェントを順次起動します。

```
タスクごとのループ:

  ┌─────────────┐
  │ implementer │  TDD: RED → GREEN → REFACTOR
  └──────┬──────┘
         ▼
  ┌──────────────────────┐
  │ spec-compliance-     │  仕様との照合
  │ reviewer             │  逸脱 → 差し戻し
  └──────┬───────────────┘
         ▼
  ┌──────────────────────┐
  │ code-quality-        │  品質チェック
  │ reviewer             │  P1/P2 → 差し戻し
  └──────┬───────────────┘
         ▼
    次のタスクへ（3 タスクごとに全テスト実行）
```

### `/review` -- 7 専門レビュアーによる並列レビュー

7 つの専門レビューエージェントが**同時に**コードを検査します。

| レビュアー | 検査対象 |
|-----------|---------|
| security-sentinel | OWASP Top 10、シークレット、認証・認可 |
| performance-oracle | N+1 クエリ、バンドルサイズ、再レンダリング |
| architecture-strategist | コンポーネント設計、責務分離、App Router 規約 |
| prisma-guardian | マイグレーション安全性、クエリ最適化、インデックス |
| terraform-reviewer | IaC ベストプラクティス、GCP 設定、セキュリティ |
| type-safety-reviewer | strict モード、any 排除、Zod バリデーション |
| api-contract-reviewer | API 入出力型、エラーレスポンス統一 |

発見事項は P1（修正必須）/ P2（修正推奨）/ P3（軽微）に分類されます。

### `/test` -- テスト実行と完了検証

以下を順番に実行し、**実際の実行結果を貼り付けて**完了を証明します。

1. ユニットテスト: `pnpm vitest run`
2. 型チェック: `pnpm tsc --noEmit`
3. リント: `pnpm eslint .`
4. ビルド検証: `pnpm build`
5. E2E テスト: `pnpm playwright test`
6. カバレッジ: 80% 以上を目標

失敗がある場合は根本原因を分析し、修正→再テストを繰り返します。

### `/compound` -- 学びの文書化 + スペックマージ

開発セッションから得た学びを `docs/compound/` に記録し、将来の開発にフィードバックします。さらに、デルタスペックを累積スペックにマージしてアーカイブします。

- うまくいったパターン / 失敗と修正 / 予想外の落とし穴
- **100 ドルルール**: 防げたはずの失敗が起きたら、ルール・スキル・フックの更新を提案
- **スペックマージ**: `openspec/changes/<change-name>/specs/` → `openspec/specs/` にマージ
- **変更アーカイブ**: `openspec/changes/<change-name>/` → `openspec/changes/archive/` に移動

### `/ship` -- 完全自律モード

全コマンドを連鎖実行する完全自律パイプラインです。

```
/brainstorm ──→ ユーザー承認
     │           openspec/changes/<change-name>/proposal.md
/spec ─────→ ユーザー承認
     │           openspec/changes/<change-name>/{specs/,design.md,tasks.md}
     ▼ 以降は自律実行
/implement → /review → 自動修正 → /test → /compound
                                    │        │
                              失敗時:      スペックマージ +
                              最大3回      アーカイブ
                              リトライ
```

---

## エージェント構成

### リサーチエージェント（`agents/research/`）

`/spec` の Phase 1 で並列起動され、情報を収集します。

| エージェント | 役割 | 情報源 |
|-------------|------|--------|
| stack-docs-researcher | 公式ドキュメントのベストプラクティス取得 | Context7 MCP |
| web-researcher | 最新記事・落とし穴・参考実装の調査 | Web Search MCP |
| codebase-analyzer | 既存コードのパターン・影響範囲分析 | プロジェクトファイル |
| compound-learnings-researcher | 過去の学びから関連教訓を抽出 | `docs/compound/` |

### 実装エージェント（`agents/implementation/`）

`/implement` でタスクごとに起動されます。

| エージェント | 役割 | モデル |
|-------------|------|--------|
| implementer | TDD 駆動の実装（RED → GREEN → REFACTOR） | sonnet |
| spec-compliance-reviewer | 仕様書との照合・逸脱検出 | opus |
| build-error-resolver | ビルドエラーの最小差分修正 | sonnet |

### レビューエージェント（`agents/review/`）

`/review` で 7 つ全てが並列起動されます。全て `model: opus`（読み取り専用）。

---

## スキル

エージェントの行動規範を定義する方法論です。

| スキル | 概要 |
|--------|------|
| test-driven-development | TDD の絶対ルール。テスト前のコードは削除してやり直し |
| systematic-debugging | 再現→原因特定→修正→防御の 4 フェーズデバッグ |
| verification-before-completion | テスト実行結果を貼り付けて完了を証明 |
| iterative-retrieval | Glob → Grep → Read で段階的にコンテキスト取得 |
| strategic-compact | コンテキストウィンドウ 80% 超過時の手動コンパクション |

---

## ルール

コーディング規約と技術スタック固有の規約を定義します。

### 共通ルール（`rules/common/`）

| ルール | 内容 |
|--------|------|
| coding-style | ファイルサイズ（200-400 行推奨）、命名規約、インポート順序 |
| git-workflow | ブランチ戦略、Conventional Commits、コミット粒度 |
| testing | Vitest / Playwright / Testing Library の使い方 |
| security | シークレット管理、入力バリデーション（Zod）、XSS/CSRF 対策 |
| performance | Server Components 優先、N+1 防止、Web Vitals 目標 |

### 技術スタック固有ルール

| ルール | 内容 |
|--------|------|
| nextjs/conventions | App Router ファイル構成、Server/Client Components 使い分け、Route Handlers / Server Actions 設計 |
| prisma/conventions | スキーマ命名、マイグレーション戦略、クエリ最適化、インデックス設計 |
| terraform/conventions | ファイル構成、モジュール化、ステート管理、IAM 最小権限 |

---

## フック

コード品質を自動的に守るガードレールです。

| フック | タイミング | 動作 |
|--------|-----------|------|
| block-unnecessary-files | Write 前 | プロジェクトルートへの不要な .md/.txt 作成をブロック（`docs/`、`openspec/` 配下は許可） |
| detect-console-log | Write 後 | .ts/.tsx ファイル内の `console.log` を警告（`console.error`/`console.warn` は許可） |
| require-tmux-for-servers | Bash 前 | `pnpm dev` 等の長時間プロセスを tmux 外で実行するのをブロック |
| gate-git-push | Bash 前 | `git push` 時にレビュー完了を確認。`--force` はブロック |

---

## エスカレーション

エージェントが曖昧な判断や高影響の意思決定に遭遇した際に、自動処理せずユーザーに確認を求めるフレームワークです。

### 3 段階のエスカレーションレベル

| レベル | 説明 | 例 |
|--------|------|----|
| 必須エスカレーション | 必ずユーザーに確認 | セキュリティ設計、DB スキーマ変更、破壊的 API 変更 |
| 状況依存エスカレーション | 判断困難な場合に確認 | 仕様の曖昧性、リサーチ結果の矛盾、レビュアー間の矛盾 |
| 自律判断 OK | 確認不要 | フォーマット修正、明らかなバグ修正、P3 対応 |

### エスカレーションが発生するフェーズ

| フェーズ | トリガー |
|----------|---------|
| `/spec` Phase 1.5 | リサーチ結果の矛盾、複数のアーキテクチャ選択肢 |
| `/implement` Step 2 | セキュリティ・DB・アーキテクチャ関連タスク、仕様の曖昧性 |
| `/review` 結果検証 | レビュアー間の矛盾、アーキテクチャ変更を伴う P1 指摘 |

詳細は `rules/common/escalation.md` を参照。

---

## リポジトリ構造

本リポジトリの構造です。使用時は `~/.claude/` にコピーしてください。

```
forge/
├── README.md
├── commands/                    # → ~/.claude/commands/
│   ├── brainstorm.md
│   ├── spec.md
│   ├── implement.md
│   ├── review.md
│   ├── test.md
│   ├── compound.md
│   └── ship.md
│
├── agents/                      # → ~/.claude/agents/
│   ├── research/
│   │   ├── stack-docs-researcher.md
│   │   ├── codebase-analyzer.md
│   │   ├── web-researcher.md
│   │   └── compound-learnings-researcher.md
│   ├── implementation/
│   │   ├── implementer.md
│   │   ├── spec-compliance-reviewer.md
│   │   └── build-error-resolver.md
│   └── review/
│       ├── security-sentinel.md
│       ├── performance-oracle.md
│       ├── architecture-strategist.md
│       ├── prisma-guardian.md
│       ├── terraform-reviewer.md
│       ├── type-safety-reviewer.md
│       └── api-contract-reviewer.md
│
├── skills/                      # → ~/.claude/skills/
│   ├── test-driven-development/SKILL.md
│   ├── systematic-debugging/SKILL.md
│   ├── verification-before-completion/SKILL.md
│   ├── iterative-retrieval/SKILL.md
│   └── strategic-compact/SKILL.md
│
├── rules/                       # → ~/.claude/rules/
│   ├── common/
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── testing.md
│   │   ├── security.md
│   │   └── performance.md
│   ├── nextjs/conventions.md
│   ├── prisma/conventions.md
│   └── terraform/conventions.md
│
├── hooks/                       # → ~/.claude/hooks/
│   ├── block-unnecessary-files.js
│   ├── detect-console-log.js
│   ├── require-tmux-for-servers.js
│   └── gate-git-push.js
│
├── docs/                        # → ~/.claude/docs/
│   └── compound/                # 複利ドキュメント
│
└── settings.json                # → ~/.claude/settings.json
```

---

## 開発フロー図

```
  ユーザー
    │
    │ /ship（または個別コマンド）
    ▼
┌──────────┐
│brainstorm│ ソクラテス式対話 → 提案書
└────┬─────┘
     │ ユーザー承認
     ▼
┌──────────┐   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   spec   │──▶│stack-docs    │  │web-researcher│  │codebase-     │
│          │──▶│researcher    │  │              │  │analyzer      │
│          │──▶│              │  │              │  │              │
│          │──▶│compound-     │  │              │  │              │
│          │   │learnings     │  │              │  │              │
└────┬─────┘   └──────────────┘  └──────────────┘  └──────────────┘
     │ ユーザー承認               （4 エージェント並列）
     ▼
┌──────────┐   タスクごとに:
│implement │──▶ implementer → spec-compliance → code-quality
└────┬─────┘   （3 タスクごとに回帰テスト）
     ▼
┌──────────┐   7 レビュアー並列:
│  review  │──▶ security / performance / architecture / prisma
└────┬─────┘   terraform / type-safety / api-contract
     │ P1/P2 自動修正
     ▼
┌──────────┐
│   test   │ vitest → tsc → eslint → build → playwright
└────┬─────┘ （失敗時: 最大 3 回リトライ）
     ▼
┌──────────┐
│ compound │ 学びを記録 + スペックマージ + アーカイブ
└──────────┘
```

---

## MCP サーバー設定

このシステムは以下の MCP サーバーを前提とします。

### Context7 MCP（必須）

フレームワーク公式ドキュメントの取得に使用します。`/spec` の `stack-docs-researcher` エージェントが利用します。

### Web Search MCP（必須、以下のいずれか）

Web 検索に使用します。`/spec` の `web-researcher` エージェントが利用します。

- **Brave Search MCP**: `@anthropic/brave-search-mcp`
- **Tavily MCP**: `tavily-mcp`

---

## OpenSpec 統合

Forge は [OpenSpec](https://github.com/openspec) の累積仕様・Delta 記法・Given/When/Then シナリオを採用し、仕様を「生きたドキュメント」として維持します。

### `openspec/` ディレクトリ構成

```
openspec/
├── project.md              # プロジェクトコンテキスト（brainstorm時に自動生成）
├── specs/                  # 累積スペック（マージ済みの正式仕様）
│   └── <feature>/
│       └── spec.md
└── changes/                # 変更単位の作業ディレクトリ
    ├── <change-name>/      # アクティブな変更
    │   ├── proposal.md     # 提案書（/brainstorm で生成）
    │   ├── design.md       # 技術設計（/spec で生成）
    │   ├── tasks.md        # タスクリスト（/spec で生成）
    │   └── specs/          # デルタスペック（/spec で生成）
    │       └── <feature>/
    │           └── delta-spec.md
    └── archive/            # 完了した変更のアーカイブ
        └── YYYY-MM-DD-<change-name>/
```

### Forge コマンドと OpenSpec 構造のマッピング

| コマンド | OpenSpec 操作 |
|---------|--------------|
| `/brainstorm` | `openspec/changes/<change-name>/proposal.md` を生成 |
| `/spec` | `openspec/changes/<change-name>/` 配下に `specs/`, `design.md`, `tasks.md` を生成 |
| `/implement` | `openspec/changes/<change-name>/` から仕様を読み込んで実装 |
| `/compound` | デルタスペックを `openspec/specs/` にマージし、変更をアーカイブ |

### `openspec` CLI との互換性

OpenSpec の標準ディレクトリ構成をそのまま採用しているため、`openspec` CLI との互換性があります。

### 移行ガイド

| 旧パス | 新パス |
|--------|--------|
| `docs/designs/YYYY-MM-DD-<topic>.md` | `openspec/changes/<name>/proposal.md` |
| `docs/specs/YYYY-MM-DD-<topic>.md` | `openspec/changes/<name>/` (3ファイル) |
| `docs/compound/` | `docs/compound/`（変更なし） |

---

## ライセンス

MIT
