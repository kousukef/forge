# CLAUDE.md -- Forge User Configuration

> **Setup**: このファイルを `~/.claude/CLAUDE.md` にコピーし、[Personal Preferences](#personal-preferences) を自分用にカスタマイズしてください。
> プロジェクト固有の設定は各プロジェクトの `CLAUDE.md` に記述します。

## Core Philosophy

1. **Explore-First**: 変更前に必ず既存コードを読んで理解する。推測でコードを書かない
2. **Plan Before Execute**: 3ステップ以上の作業はタスクリストを作成してから実行する
3. **Minimal Change**: 依頼された変更のみ実施。過剰な改善・リファクタ・コメント追加をしない
4. **Action-Aware**: 現在のフェーズに合った作業を行う（実装中に仕様変更しない等）
5. **Skill-First**: 作業開始前に `forge-skill-orchestrator` で適用スキルを判定し、呼び出す
6. **Context Isolation**: Main Agent はオーケストレーション専任。コード実装は全て Sub Agent / Agent Team に委譲する

---

## Forge ワークフロー

```
/brainstorm → /spec → [spec-validate] → [承認] → /implement → /review → /test → /compound
```

- `/ship` は上記を連鎖実行する完全自律パイプライン
- `/brainstorm` と `/spec`（spec-validate 含む）の後はユーザー承認必須
- `/implement` 以降は自律実行（テスト失敗時は最大3回リトライ）
- OpenSpec 構造は各プロジェクトの `openspec/` を参照

---

## Rules

常時読み込み: `rules/core-essentials.md`（エスカレーション・セキュリティ・Git形式）

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
| 方法論 | forge-skill-orchestrator, test-driven-development, systematic-debugging, verification-before-completion, iterative-retrieval, strategic-compact |
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

## Skill Orchestration（1% ルール）

**1% でも適用される可能性があれば、そのスキルを呼び出せ。**

作業開始前に `forge-skill-orchestrator` でフェーズ判定 → ドメイン判定 → スキル特定を行う。サブエージェントにはスキル**名**を渡す（Claude Code が自動解決）。Main Agent が SKILL.md を Read してインライン展開することは禁止。

---

## Context Isolation Policy

Main Agent はオーケストレーション専任。以下を厳守:

| 禁止操作 | 代替手段 |
|---|---|
| Write/Edit で実装ファイル編集 | Task(implementer) に委譲 |
| 実装ファイル（.ts/.tsx）の Read | Explore Agent / implementer に委譲 |
| SKILL.md の Read | スキル名のみ決定、Claude Code が自動解決 |
| `git diff`（内容表示） | `git diff --stat` のみ許可 |

詳細（2層アーキテクチャ、Teams/Task切り替え基準、implementer責務）: `reference/context-isolation.md`

---

## Escalation

`rules/core-essentials.md` のエスカレーションポリシーに従う（必須/状況依存/自律判断OK）。

---

## Compound Learning

学びを種別に応じて適切なアーティファクトに自動ルーティング。詳細は `/compound` コマンド定義を参照。

---

## Personal Preferences

<!-- ===== ここから下をユーザーごとにカスタマイズ ===== -->

### Code Style

- TypeScript strict mode 準拠
- 既存のコード規約・パターンを踏襲
- コードやコメントにエモジを入れない

### Git

- コミット形式: `<type>(<scope>): <日本語の説明>`
- PR説明は日本語
- 小さく焦点を絞ったコミット
- コミット前に `git diff` でレビュー

### Quality

- TDD: RED → GREEN → REFACTOR
- テストをスキップ・無効化して通過させない
- TODO/モック/スタブを本実装に残さない
- `npx tsc --noEmit` をコミット前に実行

---

## Learned: Tools & Runtime

（セッション中に学んだツール・ランタイム関連の知見をここに追記）

## Learned: Patterns

（セッション中に学んだコードパターン・設計知見をここに追記）

## Learned: Pitfalls

（セッション中に学んだ落とし穴・回避策をここに追記）
