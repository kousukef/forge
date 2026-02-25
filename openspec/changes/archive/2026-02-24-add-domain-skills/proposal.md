# add-domain-skills 提案書

## 意図（Intent）

Forge システムに **Domain Skills**（技術ドメイン固有のベストプラクティス集）を追加する。現在の Forge には Methodology Skills（TDD、デバッグ、検証等）が6つ存在するが、Domain Skills が未作成のため、サブエージェントが技術ドメイン固有の知識なしに実装・レビューを行っている。14の Domain Skills を新規作成し、技術スタック（Next.js App Router + Prisma + Terraform + GCP + TypeScript + Vitest + Playwright + Tailwind CSS）に特化したベストプラクティスをサブエージェントに注入可能にする。

## スコープ（Scope）

### ユーザーストーリー

- 開発者として、Next.js App Router の規約に沿った実装をサブエージェントに自動で行わせたい。なぜなら、毎回規約を手動で伝えるのは非効率だから。
- 開発者として、レビューエージェントがドメイン固有のベストプラクティスに基づいてレビューを行ってほしい。なぜなら、汎用的なレビューでは見落としが発生するから。
- 開発者として、UI/UX 設計時にデザインシステムの推薦を自動で受けたい。なぜなら、プロダクトに最適なカラーパレット・フォント・レイアウトの選定に時間がかかるから。

### 対象領域

#### 1. フロントエンド系 Domain Skills（5つ）

| Skill | スコープ | ソース |
|---|---|---|
| `next-best-practices` | App Router 規約・ファイル規約・データフェッチ・メタデータ API（選択指針レベル） | vercel-labs/agent-skills + Forge 既存 reference |
| `vercel-react-best-practices` | React 57ルール / 8カテゴリ（設計・状態管理・パフォーマンス・Hooks・型安全性・テスタビリティ・アクセシビリティ・エラーハンドリング） | vercel-labs/agent-skills |
| `vercel-composition-patterns` | コンポーネント合成パターン（Container/Presentational、Compound Components、Render Props、Provider、Slot） | vercel-labs/agent-skills |
| `web-design-guidelines` | アクセシビリティ（WCAG 2.1 AA）・レスポンシブ・Core Web Vitals・UX パターン・フォーム・ナビゲーション・カラーシステム | vercel-labs/agent-skills |
| `tailwind-best-practices` | Tailwind CSS ユーティリティ設計 + Radix UI / Headless UI 等ヘッドレスコンポーネント統合パターン | 新規作成 |

#### 2. API/バックエンド系 Domain Skills（2つ）

| Skill | スコープ | ソース |
|---|---|---|
| `nextjs-api-patterns` | Route Handlers / Server Actions / Middleware の**実装パターン詳細**（Zod バリデーション、エラーレスポンス統一、型安全なクライアント-サーバー通信、認証ミドルウェア） | 新規作成（affaan-m/everything-claude-code の api-design 参考） |
| `security-patterns` | アプリケーション層セキュリティ（XSS、CSRF、Zod バリデーション、認証・認可パターン、ファイルアップロード検証、CORS 設定） | affaan-m/everything-claude-code + 新規 |

#### 3. データベース系 Domain Skills（2つ）

| Skill | スコープ | ソース |
|---|---|---|
| `prisma-expert` | スキーマ設計（命名規約、リレーション）・クエリ最適化（select/include、N+1防止）・インデックス戦略・トランザクション・Prisma Client ベストプラクティス | supabase/agent-skills（Prisma API に翻訳）+ Forge 既存 reference |
| `database-migrations` | zero-downtime マイグレーション・expand-contract パターン・データ損失リスク検出・段階的マイグレーション・ロールバック戦略 | affaan-m/everything-claude-code |

#### 4. テスト系 Domain Skills（2つ）

| Skill | スコープ | ソース |
|---|---|---|
| `webapp-testing` | Playwright E2E テスト（Reconnaissance-then-Action パターン・Page Object Model・Auto-waiting・ネットワークインターセプト・認証状態保存・CI/CD 実行）+ API_REFERENCE.md による Progressive Disclosure | anthropics/skills（公式） |
| `vitest-testing-patterns` | Vitest + React Testing Library ユニット/統合テスト（モック戦略・クエリ優先順位・テストファクトリ・カバレッジ設定・スナップショット・ワークスペース） | 新規作成 |

#### 5. インフラ系 Domain Skills（1つ）

| Skill | スコープ | ソース |
|---|---|---|
| `terraform-gcp-expert` | GCP リソース設計（Cloud Run, Cloud SQL, Cloud Storage, VPC）・モジュール化・ステート管理・IAM 最小権限・命名規約・環境分離・コスト最適化・Secret Manager・デプロイパイプライン | Forge 既存 reference + HashiCorp/agent-skills 参考 |

#### 6. 設計系 Domain Skills（1つ）

| Skill | スコープ | ソース |
|---|---|---|
| `architecture-patterns` | 汎用ソフトウェアアーキテクチャ（SOLID、DDD、ADR、依存関係ルール、モジュール境界、レイヤードアーキテクチャ、イベント駆動パターン） | 新規作成 |

#### 7. デザインシステム（1つ -- SKILL.md + MCP プラグイン）

| Skill | スコープ | ソース |
|---|---|---|
| `ui-ux-pro-max-skill` | デザインシステム自動推薦（50+ スタイル、97 カラーパレット、57 フォントペアリング、99 UX ガイドライン）。SKILL.md にルール記載 + MCP プラグインでデザインシステム検索 | nextlevelbuilder/ui-ux-pro-max-skill |

#### 8. 関連ファイル更新

- `forge-skill-orchestrator` の Domain Skills レジストリ削除・簡素化（Methodology テーブル + ドメイン検出テーブルのみ維持）
- `CLAUDE.md`（グローバル + プロジェクト）の Available Skills テーブルを更新、スキル名決定テーブルをガイダンステーブル（推奨マッピング）に変更
- 関連エージェントの `skills` frontmatter に新スキルを追加
- implement-orchestrator のガイダンステーブル（推奨マッピング）を更新
- Domain Skills の Auto-Discovery 有効化（`disable-model-invocation` 削除 + description をトリガー条件形式に統一）

## スコープ外（Out of Scope）

- Methodology Skills の変更・追加: 既存の6スキルはそのまま維持 -- YAGNI
- `keywords` frontmatter の使用: 650回の実験で効果ゼロと実証済み -- 不使用
- Hooks（フック）の使用: 一部構成で -30pp 劣化のケースあり -- 不使用
- AWS / Azure 固有のルール: Forge のスタックは GCP のみ -- YAGNI
- Pages Router のルール: App Router のみ使用 -- YAGNI
- Jest のパターン: Vitest を使用 -- YAGNI
- 生 SQL / Drizzle / TypeORM のパターン: Prisma のみ使用 -- YAGNI
- MCP プラグインの新規開発: ui-ux-pro-max-skill は既存プラグインを導入するのみ -- YAGNI

## 未解決の疑問点（Open Questions）

- なし（対話で解消済み）
