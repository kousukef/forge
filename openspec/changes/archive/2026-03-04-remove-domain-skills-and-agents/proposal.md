# remove-domain-skills-and-agents 提案書

## 意図（Intent）

Forge をOSS公開するにあたり、特定技術スタック（Next.js, Prisma, Terraform等）に依存するドメイン固有スキル・エージェントを除去し、汎用的なワークフローシステムとして提供する。ユーザーが自身のプロジェクトに合わせてドメインスキル・レビューエージェントを追加できる拡張ポイントを整備する。

## スコープ（Scope）

### ユーザーストーリー

- OSSユーザーとして、Forgeを自分のプロジェクトにインストールした際に不要なドメインスキルが含まれていない状態で使いたい。なぜなら、自分のスタック（例: Rails, Go）に無関係なスキルがあると混乱するから。
- OSSユーザーとして、自分のプロジェクトに合ったレビューエージェントを `agents/review/` に追加するだけで `/review` コマンドに自動認識させたい。なぜなら、コマンド定義を直接編集するのは敷居が高いから。
- OSSユーザーとして、カスタムスキル・エージェントの追加方法をREADMEで確認したい。なぜなら、拡張方法が明確でないと活用できないから。

### 対象領域

- `skills/` ディレクトリ: ドメイン固有スキル13個の削除
- `agents/` ディレクトリ: ドメイン固有レビューエージェント7個の削除、review-aggregator の `agents/review/` への移動
- `/review` コマンド定義: ハードコードされたレビュアー参照を `agents/review/*` からの動的検出に変更
- `CLAUDE.md`（プロジェクト・グローバル両方）: Available Skills / Agents テーブルの更新、拡張案内の追加
- `README.md`: カスタマイズセクションの追加
- `openspec/specs/domain-skills/`: アーカイブへ移動

### 削除対象の詳細

**スキル（13個）:**
- next-best-practices, nextjs-api-patterns, vercel-react-best-practices, vercel-composition-patterns
- tailwind-best-practices, ui-ux-pro-max
- prisma-expert, database-migrations
- security-patterns
- terraform-gcp-expert
- vitest-testing-patterns, webapp-testing
- architecture-patterns

**エージェント（7個）:**
- security-sentinel, performance-oracle, architecture-strategist
- prisma-guardian, terraform-reviewer
- type-safety-reviewer, api-contract-reviewer

### 残すもの

**スキル（10個）:**
- forge-skill-orchestrator, skill-phase-formatter, skill-creator
- test-driven-development, systematic-debugging, verification-before-completion
- iterative-retrieval, strategic-compact
- story-quality-gate, proposal-readiness-check

**エージェント（12個）:**
- リサーチ: stack-docs-researcher, web-researcher, codebase-analyzer, compound-learnings-researcher
- スペック: spec-writer, spec-validator
- オーケストレーション: implement-orchestrator
- 実装: implementer, build-error-resolver, spec-compliance-reviewer
- レビュー: review-aggregator（`agents/review/` に移動）

## スコープ外（Out of Scope）

- スキルのプラグインシステム / マーケットプレイス構築: YAGNI。ディレクトリにファイルを置く方式で十分
- ドメインスキルの別リポジトリへの移行・公開: 今回はForgeリポからの除去のみ。再利用は将来の判断
- `/review` 以外のコマンドの動的エージェント検出対応: 今回はレビューのみ
- `~/.claude/` 配下のグローバル設定のクリーンアップ: リポジトリ内のみ対象

## 未解決の疑問点（Open Questions）

- `/review` コマンドでの動的検出時、`agents/review/` 内のエージェント定義ファイルからどの情報を読み取ってレビュアー選択に使うか（ファイル名のみ？メタデータ？）— これは `/spec` フェーズで設計する
