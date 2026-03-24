# CLAUDE.md -- Forge User Configuration

> **Setup**: このファイルを `~/.claude/CLAUDE.md` にコピーし、必要に応じてカスタマイズしてください。
> プロジェクト固有の設定は各プロジェクトの `CLAUDE.md` に記述します。

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

詳細ルールは `.claude/rules/` に配置し、Claude Code の自動ロード機能で読み込む:

| Rule File | 内容 | ロード条件 |
|---|---|---|
| `.claude/rules/core-rules.md` | フェーズ管理・検証ゲート | 毎セッション自動ロード（`paths` なし） |
| `.claude/rules/workflow-rules.md` | セッション管理 | 毎セッション自動ロード（`paths` なし） |
| `.claude/rules/context-isolation.md` | Context Isolation 詳細 | 毎セッション自動ロード（`paths` なし） |
| `.claude/rules/coding-standards.md` | コーディング規約 | 毎セッション自動ロード（`paths` なし） |
| `.claude/rules/testing.md` | テスト作成・TDD | 毎セッション自動ロード（`paths` なし） |

> **Note**: ソースコードのあるプロジェクトでは `paths` フロントマターを追加して対象ファイル操作時のみロードするよう調整できる（例: `paths: ["src/**/*.{ts,tsx}"]`）。

`reference/` ディレクトリは長文リファレンスや補足資料の配置先として引き続き利用可能。

---

## Available Agents

エージェント定義は `~/.claude/agents/` を参照。

| カテゴリ | Agents |
|---|---|
| リサーチ | stack-docs-researcher, web-researcher, codebase-analyzer, compound-learnings-researcher |
| スペック | spec-writer, spec-validator(opus) |
| オーケストレーション | implement-orchestrator（`claude --agent` メインスレッド専用） |
| 実装 | implementer, spec-compliance-reviewer(opus), build-error-resolver |
| レビュー(opus) | review-aggregator + `agents/review/` 配下のカスタムレビュアー |

---

## Available Skills

グローバル: `~/.claude/skills/` / プロジェクト固有: `<project>/.claude/skills/`（優先）。スキルは**名前**で参照する。

| カテゴリ | Skills |
|---|---|
| 方法論 | test-driven-development, systematic-debugging, verification-before-completion, iterative-retrieval, strategic-compact |
| 設計 | skill-creator |

> **拡張方法**:
> - ドメインスキルは `/setup` コマンドで検索・インストール、または `<project>/.claude/skills/` に手動追加
> - レビューエージェントは `agents/review/` に追加で自動認識
> - ルールは `.claude/rules/` に追加（`paths` フロントマターで適用条件を制御可能）
> - 補足資料・長文リファレンスは `reference/` に追加

---

## Hook 自動ガードレール

フック定義は `~/.claude/hooks/` を参照。

| Hook | Action |
|---|---|
| block-unnecessary-files | ルートへの .md/.txt 作成ブロック（docs/, openspec/ は許可） |
| detect-console-log | ソースファイル内のデバッグログを警告 |
| require-tmux-for-servers | 長時間プロセスの tmux 強制 |
| gate-git-push | force push ブロック、push 時チェックリスト |

---

## Experiential Learning

全プロジェクト・全対話の経験ログを `~/.claude/docs/experiential/` に一元蓄積し、結晶化プロセスを通じて rules/skills/hooks に昇格させる。

| コマンド | 役割 |
|---|---|
| `/compound` | 変更単位の学び抽出 + 結晶化チェック（閾値通知） |
| `/crystallize` | プロジェクト横断パターン抽出 + rules/skills/hooks への昇格 |

---

## Nurturing Protocol

### 経験ログの自動蓄積

全ての対話で、以下の条件に該当するやり取りを検出し `~/.claude/docs/experiential/logs/YYYY-MM-DD-nurture.md` にタグ付きログとして追記する。

| 優先度 | 条件 | タグ |
|---|---|---|
| 最高 | ユーザーが提案を修正・却下し理由を説明（例: 「そうではなく、Xすべき。なぜなら Y だから」） | `[CORRECTION]` |
| 高 | 対話中に再利用可能な原則が言語化された | `[INSIGHT]` |
| 中 | 設計・実装の判断とその理由が議論された | `[DECISION]` |
| 中 | 複数場面で繰り返し観察されるパターンが認識された | `[PATTERN]` |
| 中 | エラーが発生し根本原因が特定された | `[ERROR]` |
| 低 | プロジェクト固有の環境・制約情報が共有された | `[CONTEXT]` |

**記録対象外**: 単純なファイル操作指示、フォーマット修正、知識移転を伴わない検索のみの対話、既に記録済みの繰り返し（例: 「ありがとう」等の挨拶）

### 記録方法

1. 記録対象を検出したら当日の nurture ログファイルに追記（ファイル・ディレクトリ不在時は作成）
2. 各エントリに `project` フィールドでカレントプロジェクト名を記録
3. ログ記録は静かに実行する（ユーザーへの通知は不要）
4. ログ記録がセッションの主目的を妨げてはならない（自然な区切りで書く）

---
