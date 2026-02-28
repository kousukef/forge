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
    │   └── reviews/         # レビュー結果（/review で生成）コミット対象外、/compound 後に削除
    └── archive/            # /compound で完了分をアーカイブ
```

---

## Rules

常時読み込み: `rules/core-essentials.md`（エスカレーション・セキュリティ・Skill Orchestration・Context Isolation・Git・コード品質）

詳細ルールは `reference/` にオンデマンド配置。作業対象に応じて必要なファイルを読み込む:

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

## Agents・Skills・Hooks

エージェント定義は `agents/` を参照。スキル定義は `skills/`（プロジェクト固有）と `~/.claude/skills/`（グローバル）から自動検出される。スキルは**名前**で参照する（パスの指定は不要）。

フック定義は `hooks/` を参照。Write前後・Bash前にガードレールが自動適用される。

---

## Compound Learning

学びを記録し、種別に応じて適切なアーティファクトへの更新を自動ルーティングする。詳細は `/compound` コマンド定義を参照。

---
