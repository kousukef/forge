# add-domain-skills タスクリスト

## テスト戦略

- ユニットテスト: 該当なし（SKILL.md はマークダウンファイルであり、テストコード対象外）
- 統合テスト: 該当なし
- 検証: 最終検証スクリプト（ステップ8相当）で全項目の自動チェックを実施

## 作業の前提

- 外部リポジトリは clone してローカルで内容を確認する
- clone 不可の場合は Web 検索で代替する
- 全スキルの SKILL.md は `~/.claude/skills/<name>/SKILL.md` に配置する

## タスク

### Task 1: 外部リポジトリの clone と確認（推定: 3分）
- **対象ファイル**: `/tmp/vercel-agent-skills/`, `/tmp/supabase-agent-skills/`, `/tmp/anthropics-skills/`, `/tmp/hashicorp-agent-skills/`, `/tmp/ui-ux-pro-max-skill/`, `/tmp/everything-claude-code/`
- **やること**:
  1. `git clone --depth 1 https://github.com/vercel-labs/agent-skills /tmp/vercel-agent-skills`
  2. `git clone --depth 1 https://github.com/supabase/agent-skills /tmp/supabase-agent-skills`
  3. `git clone --depth 1 https://github.com/anthropics/skills /tmp/anthropics-skills`
  4. `git clone --depth 1 https://github.com/hashicorp/agent-skills /tmp/hashicorp-agent-skills`
  5. `git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/ui-ux-pro-max-skill`
  6. `git clone --depth 1 https://github.com/affaan-m/everything-claude-code /tmp/everything-claude-code`
  7. 各リポジトリの主要ファイルを確認
- **検証方法**: `ls /tmp/{vercel-agent-skills,supabase-agent-skills,anthropics-skills,hashicorp-agent-skills,ui-ux-pro-max-skill,everything-claude-code}` が成功する
- **関連要件**: REQ-001, REQ-002, REQ-008
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-001`
- **依存**: なし

### Task 2: 既存スキルの frontmatter パターン確認（推定: 2分）
- **対象ファイル**: `~/.claude/skills/*/SKILL.md`（既存6スキル）
- **やること**: 既存スキルの frontmatter（name, description, disable-model-invocation）と本文構造パターンを確認し、新規スキルのテンプレートとする。Domain Skills と Methodology Skills の frontmatter パターンの違いを把握する:
  - **Domain Skills（新規14スキル）**: `name`, `description`（トリガー条件形式）のみ。`disable-model-invocation` は省略（Auto-Discovery 有効）
  - **Methodology Skills（既存6スキル）**: `name`, `description`, `disable-model-invocation: true`（明示呼び出しのみ）
- **検証方法**: パターンが把握でき、テンプレートが決定される
- **関連要件**: REQ-001, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-001`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: なし

### Task 3: next-best-practices SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/next-best-practices/SKILL.md`（新規）
- **やること**: Next.js 15 App Router のベストプラクティスを記載。ソース: Next.js 15 公式ドキュメント + vercel-labs + Forge reference。App Router 規約、Server/Client Components、データフェッチング（選択指針レベル）、メタデータ API、画像/フォント最適化、エラーハンドリング
- **検証方法**: `wc -l` で 500行以内、frontmatter に `disable-model-invocation: true` が**存在しない**こと、description が3部構成（"When [condition]. Provides [content]. MUST be invoked [timing]."）であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 4: vercel-react-best-practices SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/vercel-react-best-practices/SKILL.md`（新規）
- **やること**: React 57ルール/8カテゴリを記載。ソース: vercel-labs/agent-skills + React 19 公式。コンポーネント設計、状態管理、パフォーマンス最適化、Hooks、型安全性、テスタビリティ、アクセシビリティ、エラーハンドリング。React 19 の新 API（ref as prop, use(), useActionState）に対応
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 5: vercel-composition-patterns SKILL.md 作成（推定: 4分）
- **対象ファイル**: `~/.claude/skills/vercel-composition-patterns/SKILL.md`（新規）
- **やること**: コンポーネント合成パターンを記載。ソース: vercel-labs/agent-skills + React 公式。Container/Presentational、Compound Components、children Composition、Context Provider、明示的バリアント、React 19 API 対応
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 6: web-design-guidelines SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/web-design-guidelines/SKILL.md`（新規）
- **やること**: アクセシビリティ・レスポンシブ・UXパターンを記載。ソース: vercel-labs/agent-skills（ローカルファイル化）+ WCAG 2.1 AA。アクセシビリティ、レスポンシブ、Core Web Vitals、UXパターン、フォーム設計、ナビゲーション、カラーシステム
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること、外部URL依存がないこと
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 7: tailwind-best-practices SKILL.md 作成（推定: 4分）
- **対象ファイル**: `~/.claude/skills/tailwind-best-practices/SKILL.md`（新規）
- **やること**: Tailwind CSS + ヘッドレスUI統合パターンを記載。ソース: Tailwind v4 公式 + shadcn/ui パターン。ユーティリティファースト、cn() パターン、レスポンシブ、ダークモード、Radix UI / Headless UI 統合、カスタムテーマ
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 2

### Task 8: nextjs-api-patterns SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/nextjs-api-patterns/SKILL.md`（新規）
- **やること**: Route Handlers / Server Actions / Middleware の実装パターン詳細を記載。ソース: Next.js 15 公式 + affaan-m api-design。Zod バリデーション、エラーレスポンス統一、型安全なクライアント-サーバー通信、認証ミドルウェア
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 9: security-patterns SKILL.md 作成（推定: 4分）
- **対象ファイル**: `~/.claude/skills/security-patterns/SKILL.md`（新規）
- **やること**: アプリケーション層セキュリティパターンを記載。ソース: OWASP Top 10 + affaan-m security-review。XSS 防止、CSRF 保護、Zod バリデーション、認証・認可、ファイルアップロード検証、CORS。Blockchain/Solana セクションは除外。セキュリティ防御策に YAGNI を適用しない
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 10: prisma-expert SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/prisma-expert/SKILL.md`（新規）
- **やること**: Prisma ベストプラクティスを記載。ソース: Prisma 6.x 公式 + supabase/agent-skills（Prisma API に翻訳）+ Forge reference。スキーマ設計、クエリ最適化（select/include, N+1防止）、インデックス戦略、トランザクション、Prisma Client シングルトン
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること、生SQL パターンが含まれないこと
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 11: database-migrations SKILL.md 作成（推定: 4分）
- **対象ファイル**: `~/.claude/skills/database-migrations/SKILL.md`（新規）
- **やること**: zero-downtime マイグレーションパターンを記載。ソース: affaan-m database-migrations + Prisma Migrate 公式。Expand-Contract パターン、データ損失リスク検出、段階的マイグレーション、ロールバック戦略。Prisma セクション中心
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 12: webapp-testing SKILL.md + API_REFERENCE.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/webapp-testing/SKILL.md`（新規）, `~/.claude/skills/webapp-testing/API_REFERENCE.md`（新規）
- **やること**: Playwright E2E テストパターンを記載。ソース: anthropics/skills + Playwright 1.50+ 公式。Reconnaissance-then-Action、Auto-waiting、Page Object Model、ネットワークインターセプト、認証状態保存。Python スクリプトは除外し、TypeScript/Playwright パターンのみ。API_REFERENCE.md に Playwright API 詳細リファレンスを分離
- **検証方法**: `wc -l` で SKILL.md 500行以内、API_REFERENCE.md が存在、SKILL.md から API_REFERENCE.md への参照がある、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-003, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-003`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 13: vitest-testing-patterns SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/vitest-testing-patterns/SKILL.md`（新規）
- **やること**: Vitest + React Testing Library テストパターンを記載。ソース: Vitest 3.x 公式 + RTL 公式。RTL クエリ優先順位、モック戦略（vi.mock/vi.fn/vi.spyOn/vi.hoisted）、テストファクトリ、userEvent、カバレッジ設定。Jest パターンは除外し Vitest 固有機能を使用
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること、Jest パターンが含まれないこと
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 2

### Task 14: terraform-gcp-expert SKILL.md 作成（推定: 5分）
- **対象ファイル**: `~/.claude/skills/terraform-gcp-expert/SKILL.md`（新規）
- **やること**: Terraform + GCP リソース設計を記載。ソース: Forge reference + hashicorp/agent-skills。GCP リソース（Cloud Run, Cloud SQL, Cloud Storage, VPC）、モジュール化、ステート管理、IAM 最小権限、命名規約、環境分離、Secret Manager。AWS 例を GCP に翻訳
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること、AWS リソース名が含まれないこと
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 15: architecture-patterns SKILL.md 作成（推定: 4分）
- **対象ファイル**: `~/.claude/skills/architecture-patterns/SKILL.md`（新規）
- **やること**: 汎用ソフトウェアアーキテクチャパターンを記載。ソース: SOLID/DDD 文献 + coding-standards reference。SOLID 原則、DDD 基本概念、ADR パターン、モジュール境界、依存関係ルール、レイヤードアーキテクチャ。既存 coding-standards.md との差別化: スキルはより実践的なパターンとコード例を含む
- **検証方法**: `wc -l` で 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること
- **関連要件**: REQ-001, REQ-002, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-008`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 2

### Task 16: ui-ux-pro-max-skill SKILL.md 作成 + MCP 設定（推定: 5分）
- **対象ファイル**: `~/.claude/skills/ui-ux-pro-max-skill/SKILL.md`（新規）, MCP 設定ファイル
- **やること**: デザインシステム原則・UXガイドラインを SKILL.md に記載 + MCP プラグインのインストール。ソース: nextlevelbuilder/ui-ux-pro-max-skill。カラーパレット選定指針、フォントペアリング、UX ガイドライン、MCP 検索コマンドの使用方法。MCP なしでも動作する設計
- **検証方法**: `wc -l` で SKILL.md 500行以内、`disable-model-invocation: true` が**存在しない**こと、description が3部構成であること、MCP プラグインのインストール確認
- **関連要件**: REQ-001, REQ-002, REQ-007, REQ-008, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-007`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 1, Task 2

### Task 17: forge-skill-orchestrator 簡素化（Domain Skills レジストリ削除）（推定: 3分）
- **対象ファイル**: `~/.claude/skills/forge-skill-orchestrator/SKILL.md`（既存）
- **やること**:
  1. Domain Skills レジストリテーブルを**削除**（Auto-Discovery により不要）
  2. Methodology Skills テーブルは維持（`disable-model-invocation: true` のため明示呼び出しが必要）
  3. ドメイン検出テーブル（ファイルパス → ドメイン名のマッピング）は維持
  4. フローチャートの Step 3 を簡素化（Domain Skills レジストリ参照を削除）
  5. 旧名（playwright-skill, typescript-backend, terraform-infrastructure）がある場合は削除
- **検証方法**: Domain Skills レジストリテーブルが削除されていること、Methodology テーブルとドメイン検出テーブルが維持されていること
- **関連要件**: REQ-004
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-004`
- **依存**: Task 3-16

### Task 18: CLAUDE.md 更新（グローバル + プロジェクト）（推定: 4分）
- **対象ファイル**: `~/.claude/CLAUDE.md`（既存）, `/Users/kosuke/forge/CLAUDE.md`（既存）
- **やること**:
  1. Available Skills テーブルに14 Domain Skills を追加
  2. 「スキル名決定テーブル」を「ガイダンステーブル（推奨マッピング）」に名称変更
  3. ガイダンステーブルに導入文を追加: 「Domain Skills は Auto-Discovery により自動起動されるが、サブエージェント委譲時は以下の推奨マッピングを参照してスキル名を明示指定する。テーブルに記載のないスキルも Auto-Discovery で起動可能。」
  4. テーブルの全ドメインマッピングを拡充
  5. グローバルとプロジェクトの両ファイルを同期
- **検証方法**: `diff ~/.claude/CLAUDE.md /Users/kosuke/forge/CLAUDE.md` で差異がないこと、14スキル全てが Available Skills に記載、テーブル名が「ガイダンステーブル」に統一
- **関連要件**: REQ-005
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-005`
- **依存**: Task 3-16

### Task 19: implement-orchestrator ガイダンステーブル（推奨マッピング）更新（推定: 3分）
- **対象ファイル**: `~/.claude/agents/orchestration/implement-orchestrator.md`（既存）
- **やること**:
  1. 「スキル名決定テーブル」を「ガイダンステーブル（推奨マッピング）」に名称変更
  2. 導入文を追加: 「Domain Skills は Auto-Discovery により自動起動されるが、サブエージェント委譲時は以下の推奨マッピングを参照してスキル名を明示指定する。テーブルに記載のないスキルも Auto-Discovery で起動可能。」
  3. テーブルを以下のマッピングに拡充:
    - `.ts` / `.tsx` 全般 → 既存 Methodology Skills
    - Next.js（`src/app/`） → + `next-best-practices`, `vercel-react-best-practices`
    - Prisma（`prisma/`, `server/`） → + `prisma-expert`
    - Terraform（`terraform/`） → + `terraform-gcp-expert`
    - E2E テスト（`e2e/`） → + `webapp-testing`
    - フロントエンド UI → + `web-design-guidelines`, `tailwind-best-practices`
    - API（`src/app/api/`, `src/actions/`） → + `nextjs-api-patterns`
    - セキュリティ関連 → + `security-patterns`
    - DB マイグレーション → + `database-migrations`
- **検証方法**: テーブルに全ドメインのマッピングが含まれる、テーブル名が「ガイダンステーブル」に統一
- **関連要件**: REQ-006
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-006`
- **依存**: Task 3-16

### Task 20: 旧名称の横断 Grep 確認（推定: 2分）
- **対象ファイル**: `~/.claude/` 配下全体
- **やること**: 旧スキル名（`playwright-skill`, `typescript-backend`, `terraform-infrastructure`）が残存していないことを横断 Grep で確認。`frontend-design` の参照も確認し、必要に応じて新スキル名に更新
- **検証方法**: `grep -r "playwright-skill\|typescript-backend\|terraform-infrastructure" ~/.claude/` が 0 件
- **関連要件**: REQ-004, REQ-005, REQ-006
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-004`
- **依存**: Task 17, Task 18, Task 19

### Task 21: 最終検証スクリプト実行（推定: 3分）
- **対象ファイル**: 全新規・更新ファイル
- **やること**: 以下を全て検証:
  1. 14 SKILL.md ファイルの存在確認
  2. webapp-testing/API_REFERENCE.md の存在確認
  3. Domain Skills の frontmatter に `disable-model-invocation: true` が**存在しない**こと（Methodology Skills は `true` を維持）
  4. 全 SKILL.md の行数（500行以内）
  5. Domain Skills レジストリが削除済みであること、Methodology テーブル + ドメイン検出テーブルが維持されていること
  6. 全スキルの CLAUDE.md 記載確認
  7. グローバル/プロジェクト CLAUDE.md の同期確認
  8. 旧名称の残存確認（0件であること）
  9. Available Skills テーブルとガイダンステーブル（推奨マッピング）の整合性（全スキルが両方に含まれる）
  10. Domain Skills の description が3部構成形式（"When [condition]. Provides [content]. MUST be invoked [timing]."）に準拠していること
  11. `/tmp/` 配下の clone ディレクトリを削除
- **検証方法**: 全項目が合格する
- **関連要件**: REQ-009, REQ-010
- **関連スペック**: `specs/domain-skills/delta-spec.md#REQ-009`, `specs/domain-skills/delta-spec.md#REQ-010`
- **依存**: Task 17, Task 18, Task 19, Task 20

## タスク依存関係グラフ

```
Task 1 (clone repos) ─┐
Task 2 (frontmatter)  ─┤
                       ├→ Task 3-16 (14 SKILL.md 作成 -- 並列可能)
                       │
Task 3-16 完了 ────────┤→ Task 17 (orchestrator 更新)
                       ├→ Task 18 (CLAUDE.md 更新)
                       ├→ Task 19 (implement-orchestrator 更新)
                       │
Task 17-19 完了 ───────┤→ Task 20 (旧名称 Grep)
                       │
Task 20 完了 ──────────┤→ Task 21 (最終検証)
```

**並列実行可能なタスク:**
- Task 1 と Task 2 は並列可能
- Task 3-16（14スキル作成）は全て並列可能
- Task 17, 18, 19 は並列可能
