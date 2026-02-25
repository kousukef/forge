# CLAUDE.md -- Forge 統合開発ワークフローシステム

## Core Philosophy

1. **Explore-First**: 変更前に必ず既存コードを読んで理解する。推測でコードを書かない
2. **Plan Before Execute**: 3ステップ以上の作業はタスクリストを作成してから実行する
3. **Minimal Change**: 依頼された変更のみ実施。過剰な改善・リファクタ・コメント追加をしない
4. **Action-Aware**: 現在のフェーズに合った作業を行う（実装中に仕様変更しない等）
5. **Skill-First**: 作業開始前に `forge-skill-orchestrator` で適用スキルを判定し、呼び出す
6. **Context Isolation**: Main Agent はオーケストレーション専任。コード実装・スキル内容の読み込みは全て Sub Agent / Agent Team に委譲し、自身のコンテキストウィンドウを保護する

---

## Forge ワークフロー

### コマンドパイプライン

```
/brainstorm → /spec → [spec-validate] → [ユーザー承認] → /implement(interpret-first) → /review(spec-aware) → /test → /compound(learning-router)
     │            │         │                                    │                           │                    │         │
  proposal.md  delta-spec  敵対的検証                     Interpretation Log +          仕様コンテキスト注入   全テスト   学び分類+
              design.md   + 修正ループ                    TDD実装 RED→GREEN             動的レビュアー選択    実行証明  ルーティング+
              tasks.md                                    →REFACTOR                     カバレッジマトリクス             スペックマージ
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
    │   │   └── <task>.md   # 各タスクの Spec Interpretation Log
    │   └── reviews/         # レビュー結果（/review で生成）コミット対象外、/compound 後に削除
    │       └── review-summary.md
    └── archive/            # /compound で完了分をアーカイブ
```

---

## Rules

常時読み込み: `~/.claude/rules/core-essentials.md`（エスカレーション・セキュリティ・Git形式）

詳細ルールは `~/.claude/reference/` にオンデマンド配置。作業対象に応じて必要なファイルを読み込む:

| Reference File | 読み込むタイミング |
|---|---|
| `reference/typescript-rules.md` | TypeScript実装・型設計時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/nextjs/conventions.md` | Next.js App Router作業時 |
| `reference/prisma/conventions.md` | Prismaスキーマ・クエリ作業時 |
| `reference/terraform/conventions.md` | Terraform IaC作業時 |

---

## Available Agents

エージェント定義は `~/.claude/agents/` を参照:

### リサーチエージェント（`agents/research/`）

| Agent                         | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| stack-docs-researcher         | Context7 MCP経由で公式ドキュメントのベストプラクティスを取得 |
| web-researcher                | Web Search MCPで最新記事・落とし穴・参考実装を調査           |
| codebase-analyzer             | 既存コードのパターン・影響範囲・OpenSpecスペックを分析       |
| compound-learnings-researcher | `docs/compound/` から過去の学び・教訓を抽出                  |

### スペックエージェント（`agents/spec/`）

| Agent          | Purpose                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| spec-writer    | リサーチ結果を統合し design.md / tasks.md / delta-spec を生成。/spec のリサーチ＆スペックチーム内で使用 |
| spec-validator | 敵対的仕様検証。エラーパス・境界値・非機能要件の網羅性チェック（model: opus）                 |

### オーケストレーションエージェント（`agents/orchestration/`）

| Agent                    | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| implement-orchestrator   | 実装オーケストレーション専任（Write/Edit禁止）。`claude --agent` でメインスレッドとして起動する場合にのみ使用。`/implement` コマンドからは使用しない |

### 実装エージェント（`agents/implementation/`）

| Agent                    | Purpose                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| implementer              | Interpretation-First + TDD駆動実装（Spec Interpretation Log出力 → RED→GREEN→REFACTOR）       |
| spec-compliance-reviewer | 事前検証（Interpretation Log照合）+ 事後検証（実装結果照合）の2段階チェック（model: opus）    |
| build-error-resolver     | TypeScriptビルドエラーの最小差分修正                                                         |

### レビューエージェント（`agents/review/`）-- 全て model: opus

| Agent                   | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| security-sentinel       | OWASP Top 10、シークレット検出、認証・認可、Terraformセキュリティ |
| performance-oracle      | N+1クエリ、バンドルサイズ、再レンダリング、キャッシュ戦略         |
| architecture-strategist | コンポーネント境界、責務分離、App Router規約準拠                  |
| prisma-guardian         | マイグレーション安全性、クエリ最適化、インデックスカバレッジ      |
| terraform-reviewer      | IaCベストプラクティス、GCPリソース設定、ステート管理              |
| type-safety-reviewer    | strict mode準拠、any排除、Zodスキーマ検証                         |
| api-contract-reviewer   | Route Handlers/Server Actions入出力型整合性、エラーレスポンス統一 |
| review-aggregator       | レビュー結果統合・重複排除・矛盾解決・カバレッジマトリクス生成   |

---

## Skill Discovery

スキルは以下の2箇所から自動検出され、Claude Code がセッション開始時に利用可能スキルとして認識する:

| 優先度 | 配置場所 | 説明 |
|---|---|---|
| 1（高） | `<project-root>/.claude/skills/` | プロジェクト固有スキル |
| 2（低） | `~/.claude/skills/` | グローバルスキル |

- 同名スキルが両方に存在する場合、プロジェクト側が優先（Override）
- スキルは**名前**で参照する（パスの指定は不要。Claude Code が自動解決する）
- プロジェクト固有スキルは `<project-root>/.claude/skills/<name>/SKILL.md` に配置するだけで自動検出される

---

## Available Skills

グローバルスキル定義は `~/.claude/skills/` を参照。プロジェクト固有スキルは各プロジェクトの `.claude/skills/` を参照:

### Methodology Skills

| Skill                          | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| forge-skill-orchestrator       | 作業開始時のスキル判定・ルーティング（1%ルール適用）        |
| test-driven-development        | TDD絶対ルール（RED→GREEN→REFACTOR、違反は削除やり直し）     |
| systematic-debugging           | 4フェーズデバッグ（再現→原因特定→修正→防御）                |
| verification-before-completion | 完了の証明（実行結果貼付必須、「通るはず」禁止）            |
| iterative-retrieval            | 段階的コンテキスト取得（Glob→Grep→Read）                    |
| strategic-compact              | コンテキストウィンドウ管理（80%超過時の手動コンパクション） |

### Domain Skills

| Skill                          | Purpose                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| next-best-practices            | Next.js 15 App Router ベストプラクティス（ルーティング・SC/CC・データ取得・メタデータ） |
| vercel-react-best-practices    | React 57ルール/8カテゴリ（パフォーマンス・状態管理・React 19 API）                   |
| vercel-composition-patterns    | React コンポーネント合成パターン（Compound Components・Container/Presentational）     |
| web-design-guidelines          | アクセシビリティ・レスポンシブ・Core Web Vitals・UXパターン                          |
| tailwind-best-practices        | Tailwind CSS v4 + shadcn/ui + Headless UI 統合パターン                               |
| nextjs-api-patterns            | Route Handlers / Server Actions / Middleware 実装パターン                            |
| security-patterns              | OWASP Top 10・XSS/CSRF防止・Zod バリデーション・シークレット管理                     |
| prisma-expert                  | Prisma スキーマ設計・クエリ最適化・N+1防止・インデックス戦略                         |
| database-migrations            | Zero-downtime Expand-Contract マイグレーション・Prisma Migrate                       |
| webapp-testing                 | Playwright E2E テスト（Reconnaissance-then-Action・POM・Auto-waiting）               |
| vitest-testing-patterns        | Vitest 3.x + React Testing Library（RTLクエリ優先順位・vi.mock/vi.hoisted）          |
| terraform-gcp-expert           | Terraform + GCP リソース設計（Cloud Run/SQL/Storage・IAM・モジュール化）              |
| architecture-patterns          | SOLID・DDD・ADR・モジュール境界・レイヤードアーキテクチャ                            |
| ui-ux-pro-max                  | カラーパレット・フォントペアリング・UXガイドライン・デザインシステム                 |

> プロジェクトの `.claude/skills/` に配置されたスキルも Claude Code が自動検出し、上記と同様に利用可能になる。

---

## Hook 自動ガードレール

以下のフックが自動的に品質を守る。フック定義は `~/.claude/hooks/` を参照:

| Hook                     | Trigger | Action                                                                                |
| ------------------------ | ------- | ------------------------------------------------------------------------------------- |
| block-unnecessary-files  | Write前 | プロジェクトルートへの `.md`/`.txt` 作成をブロック（`docs/`, `openspec/` 配下は許可） |
| detect-console-log       | Write後 | `.ts`/`.tsx` 内の `console.log` を警告（`console.error`/`console.warn` は許可）       |
| require-tmux-for-servers | Bash前  | `npm run dev` 等の長時間プロセスを tmux 外で実行するのをブロック                         |
| gate-git-push            | Bash前  | `git push --force` をブロック、通常 push 時にチェックリスト表示                       |

---

## Skill Orchestration（1% ルール）

**1% でも適用される可能性があれば、そのスキルを呼び出せ。**

作業開始前に必ず以下を実行:

1. フェーズ判定（コマンド名 or 作業内容 → フェーズ）
2. ドメイン判定（対象ファイルパス → ドメイン）
3. レジストリ照合 → 適用スキルを特定
4. 1% ルール適用 → 除外してよいか再確認

### サブエージェントへのスキル注入

サブエージェントには**スキル名**を渡す。Claude Code がスキル名から自動的に解決・読み込みを行う。

1. タスクのドメインに応じて適用スキルの**名前一覧**を決定する
2. Sub Agent のプロンプトにスキル名を記載する
3. Claude Code が自動的にスキルを解決・注入する

**禁止**: Main Agent が SKILL.md の内容を Read してプロンプトにインライン展開すること

#### ガイダンステーブル（推奨マッピング）

Domain Skills は Auto-Discovery により自動起動されるが、サブエージェント委譲時は以下の推奨マッピングを参照してスキル名を明示指定する。テーブルに記載のないスキルも Auto-Discovery で起動可能。

| ドメイン判定 | 適用スキル名 |
|---|---|
| `.ts` / `.tsx` 全般 | `test-driven-development`, `verification-before-completion`, `iterative-retrieval` |
| Next.js（`src/app/`） | 上記 + `next-best-practices`, `vercel-react-best-practices` |
| React コンポーネント設計 | 上記 + `vercel-composition-patterns` |
| Prisma（`prisma/`, `server/`） | 基本 + `prisma-expert` |
| DB マイグレーション（`prisma/migrations/`） | 基本 + `database-migrations` |
| Terraform（`terraform/`） | 基本 + `terraform-gcp-expert` |
| E2E テスト（`e2e/`, `*.spec.ts`） | `webapp-testing` |
| ユニットテスト（`*.test.ts`, `*.test.tsx`） | `vitest-testing-patterns`, `test-driven-development` |
| フロントエンド UI | 基本 + `web-design-guidelines`, `tailwind-best-practices` |
| API（`src/app/api/`, `src/actions/`） | 基本 + `nextjs-api-patterns` |
| セキュリティ関連 | `security-patterns` |
| アーキテクチャ設計 | `architecture-patterns` |
| デバッグ / エラー修正 | `systematic-debugging`, `iterative-retrieval` |

---

## Context Isolation Policy

Main Agent のコンテキストウィンドウを保護し、大規模実装でも破綻しないようにする2層分離ルール。

### 2層アーキテクチャ + 動的モード選択

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

### Teams vs Task 切り替え基準

| 条件 | 方式 | 理由 |
|---|---|---|
| エージェント間の情報共有・フィードバックが成果を改善する | Teams | SendMessage による協調で質が上がる |
| 各エージェントが独立して作業でき、やりとりが不要 | Task 並列 | Teams のオーバーヘッドなしに並列実行できる |
| 単発の委譲タスク | Task | 協調の必要なし |

**具体的な適用:**
- `/implement`: 独立タスクが2+で異なるファイルセットの場合に Teams を推奨。`--teams`/`--agents` 引数で指定（デフォルト: `agents`）
- `/spec`: リサーチャー間の相互参照 + spec-writer によるチーム内統合に Teams を推奨。`--teams`/`--agents` 引数で指定（デフォルト: `agents`）
- `/review`: 各レビューは独立作業のため Task 並列（Teams 不使用）

### Main Agent の責務（/implement 実行時）

- 仕様書・設計書・タスクリスト（`.md` ファイル）の読み込み
- タスク分析・依存関係に基づくバッチ構成
- モード選択（`--teams`/`--agents` 引数に基づく分岐）
- Teams モード: TeamCreate でチーム作成・タスク割り当て・監視・TeamDelete
- Sub Agents モード: `Task(implementer)` を直接起動（並列 or 順次）
- 検証コマンド実行（`npm test`, `tsc --noEmit`, `git diff --stat`）
- 検証失敗時: `Task(build-error-resolver)` に委譲（最大3回リトライ）
- スペック準拠確認: `Task(spec-compliance-reviewer)` に委譲
- `git diff --stat` で変更概要確認・ユーザーに報告

### Main Agent が行わないこと（厳守）

| 禁止操作 | 理由 | 代替手段 |
|---|---|---|
| Write / Edit で実装ファイルを編集 | コンテキスト汚染 | Task(implementer) / teammate に委譲 |
| 実装ファイル（`.ts`, `.tsx`）の Read | コンテキスト膨張 | Explore Agent / implementer に委譲 |
| SKILL.md の Read | コンテキスト汚染 | スキル名のみ決定、Claude Code が自動解決 |
| `git diff`（ファイル内容表示） | 大量 diff でコンテキスト圧迫 | `git diff --stat` のみ許可 |

### エスカレーションフロー（Teams 内 → ユーザー）

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

### implement-orchestrator（メインスレッド専用）

`claude --agent implement-orchestrator` で起動した場合のみ有効。**`/implement` コマンドからは使用しない。**

```
implement-orchestrator（メインスレッドとして起動）
  ├→ Task(implementer) × N
  ├→ Task(build-error-resolver)
  └→ Task(spec-compliance-reviewer)
```

**注意**: `Task(implement-orchestrator)` でサブエージェントとして起動した場合、Task ツールは利用できない（Claude Code の制約）。このため `/implement` コマンドでは使用しない。

### implementer の責務

- エージェント定義の `skills` frontmatter + プロンプト指定のスキルに従う（Claude Code が自動読み込み）
- デルタスペック・design.md を自分で Read
- コードベースを iterative-retrieval で探索
- **Spec Interpretation Log を出力**（TDD 開始前に必須。`openspec/changes/<name>/interpretations/<task>.md` に書き出し）
- TDD 実装（RED → GREEN → REFACTOR）
- テスト実行・型チェック
- Spec Interpretation Log の Phase B（変更ファイル一覧 + 振り返り）を追記

---

## Escalation Rules

`~/.claude/rules/core-essentials.md` に統合済み。エスカレーションポリシー（必須/状況依存/自律判断OK）を参照。

---

## Personal Preferences

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

- テスト前にコードを書かない（TDD: RED → GREEN → REFACTOR）
- テストをスキップ・無効化して通過させない
- TODO/モック/スタブを本実装に残さない
- `npx tsc --noEmit` をコミット前に実行

---

## Compound Learning（Learning Router）

学びを記録し、種別に応じて適切なアーティファクトへの更新を自動ルーティングする。

### 閾値ルール（3段階）

| 閾値 | アクション |
|---|---|
| **重大**（100ドル超相当） | ルール / スキル / フック / エージェント定義 / コマンド / 仕様テンプレートの更新を強く提案 |
| **中程度**（繰り返し発生） | 同一種別の学びが2回以上蓄積した場合、更新を提案 |
| **軽微**（初回発生） | `docs/compound/` に記録のみ。次回発生時に中程度に昇格 |

### Learning Router 分類テーブル

| 学びの種別 | 更新対象アーティファクト |
|---|---|
| コーディングパターン | `rules/` or `reference/` |
| 仕様作成時の見落とし | spec-writer テンプレート / spec-validator チェックリスト |
| 実装時の解釈誤り | implementer の必須チェック項目 |
| レビュー見落とし | レビュアーのチェックリスト |
| ワークフロー改善 | コマンド定義 (`commands/`) |
| ビルドエラー | build-error-resolver / フック |
| エスカレーション判断の誤り | エスカレーション条件 |

詳細は `/compound` コマンド定義を参照。

---

## Learned: Tools & Runtime

（セッション中に学んだツール・ランタイム関連の知見をここに追記）

## Learned: Patterns

（セッション中に学んだコードパターン・設計知見をここに追記）

## Learned: Pitfalls

（セッション中に学んだ落とし穴・回避策をここに追記）
