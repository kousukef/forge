# CLAUDE.md -- Forge 統合開発ワークフローシステム

## Core Philosophy

1. **Explore-First**: 変更前に必ず既存コードを読んで理解する。推測でコードを書かない
2. **Plan Before Execute**: 3ステップ以上の作業はタスクリストを作成してから実行する
3. **Minimal Change**: 依頼された変更のみ実施。過剰な改善・リファクタ・コメント追加をしない
4. **Action-Aware**: 現在のフェーズに合った作業を行う（実装中に仕様変更しない等）
5. **Skill-First**: 適用可能なスキルを積極的に活用する（1% でも関連があれば呼び出す）
6. **Context Isolation**: Main Agent はオーケストレーション専任。コード実装は全て Sub Agent / Agent Team に委譲する

---

## Forge ワークフロー

```
/brainstorm → /spec → [spec-validate] → [承認] → /implement → /review → /test → /compound
```

- `/ship` は上記を連鎖実行する完全自律パイプライン
- `/brainstorm` と `/spec`（spec-validate 含む）の後はユーザー承認必須
- `/implement` 以降は自律実行（テスト失敗時は最大3回リトライ）

### OpenSpec 構造

```
openspec/
├── project.md              # プロジェクトコンテキスト
├── specs/                  # 累積スペック（マージ済みの正式仕様）
└── changes/                # 変更単位の作業ディレクトリ
    ├── <change-name>/      # アクティブな変更
    │   ├── proposal.md     # /brainstorm で生成
    │   ├── design.md       # /spec で生成
    │   ├── tasks.md        # /spec で生成
    │   ├── specs/          # デルタスペック（/spec で生成）
    │   ├── interpretations/ # 仕様解釈ログ（/implement で生成）コミット対象外、/compound 後に削除
    │   └── reviews/         # レビュー結果（/review で生成）コミット対象外、/compound 後に削除
    └── archive/            # /compound で完了分をアーカイブ
```

---

## Rules

常時読み込み: `rules/core-essentials.md`（エスカレーション・セキュリティ・Skill 1%ルール・Context Isolation・Git・コード品質）

詳細ルールは `reference/` にオンデマンド配置。作業対象に応じて必要なファイルを読み込む:

| Reference File | タイミング |
|---|---|
| `reference/typescript-rules.md` | TypeScript実装・型設計 |
| `reference/coding-standards.md` | コーディング規約確認 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート |
| `reference/workflow-rules.md` | セッション管理 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約 |
| `reference/common/testing.md` | テスト作成・TDD |
| `reference/common/performance.md` | パフォーマンス最適化 |
| `reference/nextjs/conventions.md` | Next.js App Router |
| `reference/prisma/conventions.md` | Prisma |
| `reference/terraform/conventions.md` | Terraform |

---

## Available Agents

エージェント定義は `~/.claude/agents/` を参照。

| カテゴリ | Agents |
|---|---|
| リサーチ | stack-docs-researcher, web-researcher, codebase-analyzer, compound-learnings-researcher |
| スペック | spec-writer, spec-validator(opus) |
| オーケストレーション | implement-orchestrator（`claude --agent` メインスレッド専用） |
| 実装 | implementer, spec-compliance-reviewer(opus), build-error-resolver |
| レビュー(opus) | security-sentinel, performance-oracle, architecture-strategist, prisma-guardian, terraform-reviewer, type-safety-reviewer, api-contract-reviewer, review-aggregator |

---

## Available Skills

グローバル: `~/.claude/skills/` / プロジェクト固有: `<project>/.claude/skills/`（優先）。スキルは**名前**で参照する。

| カテゴリ | Skills |
|---|---|
| 方法論 | test-driven-development, systematic-debugging, verification-before-completion, iterative-retrieval, strategic-compact |
| フロントエンド | next-best-practices, vercel-react-best-practices, vercel-composition-patterns, tailwind-best-practices, web-design-guidelines, ui-ux-pro-max-skill |
| API/セキュリティ | nextjs-api-patterns, security-patterns |
| データ | prisma-expert, database-migrations |
| テスト | vitest-testing-patterns, webapp-testing |
| インフラ | terraform-gcp-expert |
| 設計 | architecture-patterns |

---

## Hook 自動ガードレール

フック定義は `~/.claude/hooks/` を参照。

| Hook | Action |
|---|---|
| block-unnecessary-files | ルートへの .md/.txt 作成ブロック（docs/, openspec/ は許可） |
| detect-console-log | .ts/.tsx 内の console.log を警告 |
| require-tmux-for-servers | 長時間プロセスの tmux 強制 |
| gate-git-push | force push ブロック、push 時チェックリスト |

---

## Compound Learning

学びを種別に応じて適切なアーティファクトに自動ルーティング。詳細は `/compound` コマンド定義を参照。

---
