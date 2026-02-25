# add-domain-skills 技術設計

## 概要

Forge システムに14の Domain Skills を追加する。各スキルは `~/.claude/skills/<name>/SKILL.md` に配置され、オーケストレーターとエージェント定義から名前ベースで参照される。

## リサーチサマリー

### 公式ドキュメントからの知見

- **Next.js 15**: `params`/`searchParams` が Promise 化、`fetch()` のデフォルトキャッシュが `no-store` に変更
- **React 19**: `ref` が props として直接渡せる（`forwardRef` 不要）、`use()` API、`useActionState`、`useOptimistic`
- **Prisma 6.x**: `select` で必要フィールドのみ取得推奨、外部キーには明示的 `@@index` 必要
- **Terraform 1.9+**: `count` より `for_each` 推奨、変数には `validation` ブロック推奨
- **Vitest 3.x**: `vi.hoisted()` でESM環境のモック巻き上げ、`@testing-library/jest-dom/vitest` インポート必要
- **Playwright 1.50+**: Auto-waiting がデフォルト、`waitForTimeout` は非推奨
- **Tailwind CSS v4**: CSS ファーストの設定に移行（`@theme` ディレクティブ）

### Web検索からの知見

#### 外部リポジトリの調査結果

| リポジトリ | Stars | 取得内容 |
|---|---|---|
| vercel-labs/agent-skills (21K+) | React 57ルール/8カテゴリ、Composition 8ルール/4カテゴリ、Web Design Guidelines | ルール構造をそのまま参考にする。rules/ ディレクトリの Progressive Disclosure パターンを採用 |
| anthropics/skills (73K+) | webapp-testing の Reconnaissance-then-Action パターン | パターンをTypeScript/Playwright向けに記述。Python スクリプトは除外 |
| supabase/agent-skills (不明) | PostgreSQL 29ルール/8カテゴリ | 17+ ルールが Prisma API に翻訳可能。RLS 等 Supabase 固有は除外 |
| hashicorp/agent-skills (359) | Terraform Style Guide（約300行） | GCP リソース例に翻訳して適用。AWS 例は読み替え |
| nextlevelbuilder/ui-ux-pro-max (33K+) | 99 UXガイドライン、50+ スタイル、97カラーパレット | SKILL.md にルール記載 + MCP プラグインで検索機能を併用 |
| affaan-m/everything-claude-code (49K+) | api-design, database-migrations, security-review, e2e-testing | Forge スタック向けにフィルタリング・翻訳して取り込み |

#### 最新のベストプラクティス

- **description の品質**: 650回の実験で Directive 式 description → 起動率 97-100% と実証。`keywords` frontmatter は効果ゼロ。
- **Progressive Disclosure**: SKILL.md 本体は 500行以内。詳細は別ファイルに分離（vercel-labs, supabase 共通パターン）
- **YAML frontmatter**: `name`, `description` は必須。Domain Skills は `disable-model-invocation` を省略（Auto-Discovery 有効）、Methodology Skills は `disable-model-invocation: true` を維持（明示呼び出しのみ）。Hooks は一部構成で劣化あり。

#### 既知の落とし穴

- `web-design-guidelines` は外部URL依存（vercel-labs 実装）→ ローカルファイルに取り込む
- `ui-ux-pro-max` は Python 依存 → MCP プラグインとして導入、SKILL.md はルールのみ
- `webapp-testing` は Python スクリプト依存 → パターンの記述のみ、スクリプトは除外

### コードベース分析（既存スペックとの関連含む）

#### 既存スキルパターン

| 項目 | Domain Skills | Methodology Skills |
|---|---|---|
| frontmatter | `name` (kebab-case), `description` (英語トリガー条件形式) | `name` (kebab-case), `description` (英語), `disable-model-invocation: true` |
| Auto-Discovery | 有効（`disable-model-invocation` 省略） | 無効（明示呼び出しのみ） |
| description 形式 | "When [condition]. Provides [content]. MUST be invoked [timing]." | Directive 式（従来通り） |
| 本文言語 | 日本語（description のみ英語） | 同左 |
| 行数 | 500行以内（新規） | 32-159行（既存） |
| セクション構造 | 原則 → ルール/ガイドライン → アンチパターン → Applicability | 同左 |

#### 影響範囲

**新規作成（14ファイル + 1参照ファイル）:**
- `~/.claude/skills/{14スキル名}/SKILL.md` × 14
- `~/.claude/skills/webapp-testing/API_REFERENCE.md` × 1

**更新（4ファイル）:**
- `~/.claude/skills/forge-skill-orchestrator/SKILL.md` -- Domain Skills レジストリ削除・簡素化（Methodology テーブル + ドメイン検出テーブルのみ維持）
- `~/.claude/CLAUDE.md` -- Available Skills テーブル + ガイダンステーブル（推奨マッピング）
- `/Users/kosuke/forge/CLAUDE.md` -- 上記と同期
- `~/.claude/agents/orchestration/implement-orchestrator.md` -- ガイダンステーブル（推奨マッピング）

**変更不要:**
- レビューエージェントの skills frontmatter（動的注入方式のため）
- implementer の skills frontmatter（既に動的注入設計）
- 既存 Methodology Skills
- リファレンスファイル（`~/.claude/reference/`）-- スキルと共存

#### 既存スペックとの関連

- `command-args` スペック: "Skill Activation は CLAUDE.md に統一" 要件あり → コマンド定義にスキル参照を追加しない設計で矛盾なし
- `workflow-redesign` スペック: implement-orchestrator のスキル名決定テーブル（本変更でガイダンステーブルに改称）に言及 → 本変更で拡充

### 過去の学び

1. **プロジェクト/グローバル同期漏れ**（2回発生、中程度閾値）: CLAUDE.md の更新時にグローバルとプロジェクトの両方を確認する検証ステップを必須化
2. **YAGNI とセキュリティ防御策**: セキュリティ関連のチェック項目は YAGNI を適用しない
3. **概念変更の横断検索**: スキル名の変更（playwright-skill → webapp-testing 等）後に横断 Grep で残存チェック
4. **スキル注入は名前ベース**: Main Agent が SKILL.md を Read してインライン展開することを禁止

## 技術的アプローチ

### スキル作成方針

1. **外部リポジトリのルールはそのままコピーしない**: Forge スタック（App Router, Prisma, GCP, Vitest, Tailwind CSS）に特化した形に再構成
2. **既存リファレンスとの関係**: リファレンスは概要ドキュメント、スキルはエージェントに注入される行動規範。共存する設計で、スキルがリファレンスを置き換えない
3. **Progressive Disclosure**: SKILL.md は 500行以内。詳細は REFERENCE.md / API_REFERENCE.md に分離

### スキル注入フロー（Dual-Path）

Domain Skills は Auto-Discovery により Claude Code が description ベースで自動起動する。ただしサブエージェント委譲時は明示指定が必要なため、2つのパスが共存する。

**Path A: Auto-Discovery（直接利用時）**

```
ユーザーがタスクを依頼
  │
  └→ Claude Code が全スキルの description を参照
      └→ タスク内容と description のマッチングで Domain Skills を自動起動
```

- Domain Skills は `disable-model-invocation` を省略しているため、Claude Code の Probabilistic Retrieval により自動選択される
- description がトリガー条件形式（"When [condition]. Provides [content]. MUST be invoked [timing]."）で書かれていることが起動精度の鍵

**Path B: Sub-Agent Delegation（サブエージェント委譲時）**

```
forge-skill-orchestrator（ドメイン検出 → Methodology スキル解決）
  │
  ├→ implementer: CLAUDE.md のガイダンステーブル（推奨マッピング）参照で Domain Skills を明示指定
  └→ reviewer: /review コマンドが対象ファイルからドメイン判定し、プロンプトでスキル名を動的注入
```

- サブエージェントにはスキル名を明示的に渡す必要がある（Auto-Discovery はメインセッションのみ）
- ガイダンステーブルはあくまで推奨マッピングであり、テーブルに記載のないスキルも Auto-Discovery で起動可能

### 14スキルのソースマッピング

| Skill | 主要ソース | 補足ソース | 翻訳/フィルタ |
|---|---|---|---|
| `next-best-practices` | Next.js 15 公式 | Forge reference, vercel-labs | App Router のみ |
| `vercel-react-best-practices` | vercel-labs 57ルール | React 19 公式 | React 19 API 対応 |
| `vercel-composition-patterns` | vercel-labs 8パターン | React 公式 | React 19 API 対応 |
| `web-design-guidelines` | vercel-labs | WCAG 2.1 AA | ローカルファイル化 |
| `tailwind-best-practices` | Tailwind v4 公式 | shadcn/ui パターン | v4 CSS-first 対応 |
| `nextjs-api-patterns` | Next.js 15 公式 | affaan-m api-design | Route Handlers/Server Actions |
| `security-patterns` | OWASP Top 10 | affaan-m security-review | アプリ層のみ、Blockchain 除外 |
| `prisma-expert` | Prisma 6.x 公式 | supabase postgres, Forge reference | Prisma API に翻訳 |
| `database-migrations` | affaan-m | Prisma Migrate 公式 | Prisma セクション中心 |
| `webapp-testing` | anthropics/skills | Playwright 1.50+ 公式 | パターンのみ、Python 除外 |
| `vitest-testing-patterns` | Vitest 3.x 公式 | RTL 公式 | Jest → Vitest 翻訳 |
| `terraform-gcp-expert` | Forge reference | hashicorp/agent-skills | AWS → GCP 翻訳 |
| `architecture-patterns` | SOLID/DDD 文献 | coding-standards reference | 新規作成 |
| `ui-ux-pro-max` | nextlevelbuilder | MCP プラグイン | ルール + MCP 併用 |

## リスクと注意点

1. **同期漏れリスク**: CLAUDE.md のグローバル/プロジェクト同期を最終検証で必ず確認（過去2回の事例）
2. **オーケストレーターの名称変更**: `playwright-skill` → `webapp-testing` 等の置換後に横断 Grep で残存チェック
3. **コンテキストサイズ**: 14スキル全てが同時に注入されることはない（ドメイン判定で絞り込まれる）。ただし frontmatter の description は常時ロードされるため、14スキル分の description トークン増加（約1400 tokens）がある
4. **ui-ux-pro-max の Python 依存**: MCP プラグインのセットアップに Python 環境が必要。SKILL.md のみでも基本機能は動作する設計にする
5. **外部リポジトリのライセンス**: vercel-labs (MIT), anthropics (Apache 2.0), supabase (Apache 2.0), hashicorp (MPL 2.0) -- いずれもオープンソース。ルールの再構成・翻訳は許容されるが、そのままのコピーは避ける
6. **Auto-Discovery 起動不安定性**: GitHub Discussions #182117 で報告されているように、description の品質次第で起動率が変動する。対策: (a) description を3部構成トリガー条件形式で統一し起動率を最大化、(b) サブエージェント委譲時はガイダンステーブルで明示指定しフォールバック
7. **Description 品質が起動率に直結**: Auto-Discovery では description が唯一のトリガーとなるため、曖昧な description は起動されないリスクがある。condition にファイルパスパターン（`src/app/`, `prisma/` 等）と作業内容を必ず含める
