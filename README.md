<h1 align="center">Forge</h1>

<p align="center">
  <strong>設計から実装・レビュー・テストまで — Claude Code の開発ワークフローを自動化するプラグインシステム</strong>
</p>

<p align="center">
  <a href="#クイックスタート">クイックスタート</a> •
  <a href="#コマンド一覧">コマンド</a> •
  <a href="#仕組み">仕組み</a> •
  <a href="#カスタマイズ">カスタマイズ</a>
</p>

---

## Forge とは

Forge は [Claude Code](https://docs.anthropic.com/en/docs/claude-code) のプラグインシステムです。スラッシュコマンド・エージェント・スキル・フックを組み合わせて、**要件定義から実装・レビュー・テストまでの開発ライフサイクル全体**を自動化します。

```
/brainstorm → /spec → /implement → /review → /test → /compound
```

**主な特徴:**

- **ワンコマンド自動化** — `/ship` で設計から実装・レビュー・テストまで一気通貫
- **マルチエージェント並列処理** — 4つのリサーチャー、7つのレビュアーが同時に動く
- **TDD 駆動** — テストファーストで実装し、仕様準拠を自動検証
- **コンテキスト保護** — Main Agent はオーケストレーションに専念し、実装は Sub Agent に委譲
- **複利ドキュメント** — 開発から得た学びを蓄積し、次の開発にフィードバック

---

## クイックスタート

### 前提条件

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- 以下の MCP サーバーが設定済み：
  - **Context7 MCP** — フレームワーク公式ドキュメント取得用
  - **Web Search MCP**（[Brave Search MCP](https://github.com/anthropics/brave-search-mcp) または [Tavily MCP](https://github.com/tavily-ai/tavily-mcp)）— Web 検索用

### 3 ステップで導入

```bash
# 1. クローン
git clone https://github.com/kousukef/forge.git
cd forge

# 2. インストール（シンボリックリンク方式）
bash install.sh

# 3. 任意のプロジェクトで Claude Code を起動して使う
cd ~/my-project
claude
> /ship ユーザー認証機能を追加したい
```

`install.sh` は `~/.claude/` 配下にシンボリックリンクを作成します。`git pull` で更新が自動反映されます。

<details>
<summary><b>インストールの詳細</b></summary>

#### オプション

```bash
bash install.sh -y   # 確認プロンプトをスキップ（CI向け）
```

#### 何が行われるか

`~/.claude/` 配下の各ディレクトリに、Forge の個別ファイルへのシンボリックリンクを作成します。ユーザー独自のコマンドやスキルとの共存が可能です。

```
~/.claude/
├── commands/
│   ├── brainstorm.md → forge/commands/brainstorm.md   # Forge のコマンド
│   ├── spec.md → forge/commands/spec.md
│   └── my-command.md                                   # ユーザー独自（共存可能）
├── agents/     → forge/agents/ の各ファイルへリンク
├── skills/     → forge/skills/ の各ディレクトリへリンク
├── rules/      → forge/rules/ の各ファイルへリンク
├── reference/  → forge/reference/ の各ファイルへリンク
├── hooks/      → forge/hooks/ の各ファイルへリンク
├── docs/       → forge/docs/ の各ディレクトリへリンク
└── settings.json  （初回のみコピー。既存ファイルは上書きしない）
```

#### インストール確認

```bash
ls -la ~/.claude/skills/
# 各スキルが forge/ へのシンボリックリンクになっていれば OK
```

#### 手動インストール（コピー方式）

シンボリックリンクを使わない場合は手動でコピーできます（`git pull` による自動更新は不可）：

```bash
mkdir -p ~/.claude
cp -r commands/ ~/.claude/commands/
cp -r agents/ ~/.claude/agents/
cp -r skills/ ~/.claude/skills/
cp -r rules/ ~/.claude/rules/
cp -r reference/ ~/.claude/reference/
cp -r hooks/ ~/.claude/hooks/
cp -r docs/ ~/.claude/docs/
cp settings.json ~/.claude/settings.json
```

#### アンインストール

```bash
bash uninstall.sh
```

Forge が作成したシンボリックリンクのみ削除します。ユーザー独自の資産や Claude Code のランタイムファイルには触れません。

</details>

---

## コマンド一覧

任意のプロジェクトで Claude Code を起動し、スラッシュコマンドで実行します。

### 開発ワークフロー

| コマンド | 概要 | 出力 |
|---------|------|------|
| `/brainstorm` | ソクラテス式対話で要件を深掘り | `proposal.md` |
| `/spec` | リサーチ → 仕様書・タスクリスト生成 → 仕様検証 | `design.md` `tasks.md` `delta-spec.md` |
| `/implement` | TDD 駆動の実装（Sub Agent に委譲） | 実装コード + テスト |
| `/review` | 7 専門レビュアーによる並列コードレビュー | レビューレポート |
| `/test` | テスト・型チェック・lint・ビルド検証の一括実行 | 実行結果レポート |
| `/compound` | 学びの文書化 + スペックマージ + アーカイブ | `docs/compound/` |
| **`/ship`** | **上記を全て連鎖実行する完全自律パイプライン** | — |

### ユーティリティ

| コマンド | 概要 |
|---------|------|
| `/commit` | 変更を分析して Conventional Commits 形式でコミット |
| `/handle-pr-review <PR番号>` | PR レビューコメントの分析・修正・返信を一括処理 |
| `/skill-format <skill-name>` | ドメインスキルの Phase-Aware ファイル分割 |

---

## 仕組み

### 全体フロー

```
  ユーザー: /ship （または個別コマンド）
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│  /brainstorm                                                 │
│  ソクラテス式対話で要件を深掘り → proposal.md                     │
│                                              [ユーザー承認]     │
├──────────────────────────────────────────────────────────────┤
│  /spec                                                       │
│                                                              │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ ┌────────┐  │
│  │ stack-docs  │ │web-researcher│ │ codebase- │ │compound│  │
│  │ researcher  │ │              │ │ analyzer  │ │learnings│ │
│  └──────┬──────┘ └──────┬───────┘ └─────┬─────┘ └───┬────┘  │
│         └───────────────┴───────────────┴────────────┘       │
│                         ▼                                    │
│              spec-writer → spec-validator                    │
│              design.md / tasks.md / delta-spec.md            │
│                                              [ユーザー承認]     │
├──────────────────────────────────────────────────────────────┤
│  /implement                              ┌──── 以降は自律実行  │
│  Main Agent（オーケストレーション専任）          │                │
│    └─ implementer × N（TDD: RED→GREEN→REFACTOR）             │
├──────────────────────────────────────────────────────────────┤
│  /review                                                     │
│  複数の専門レビュアーが並列でコードを検査                           │
├──────────────────────────────────────────────────────────────┤
│  /test                                                       │
│  テスト → 型チェック → lint → ビルド検証                          │
│  （失敗時は最大3回リトライ）                                      │
├──────────────────────────────────────────────────────────────┤
│  /compound                                                   │
│  学びを記録 + スペックマージ + アーカイブ                          │
└──────────────────────────────────────────────────────────────┘
```

> `/brainstorm` と `/spec` の後にユーザー承認が必要です。`/implement` 以降は自律的に実行されます。

### マルチエージェント構成

Forge は 4 種類のエージェントグループで構成されています。

#### リサーチエージェント（`/spec` Phase 1 で並列起動）

| エージェント | 役割 | 情報源 |
|-------------|------|--------|
| stack-docs-researcher | 公式ドキュメントのベストプラクティス取得 | Context7 MCP |
| web-researcher | 最新記事・落とし穴・参考実装の調査 | Web Search MCP |
| codebase-analyzer | 既存コードのパターン・影響範囲分析 | プロジェクトファイル |
| compound-learnings-researcher | 過去の学びから関連教訓を抽出 | `docs/compound/` |

#### スペックエージェント（`/spec` Phase 2-3）

| エージェント | 役割 |
|-------------|------|
| spec-writer | リサーチ結果を統合し design.md / tasks.md / delta-spec を生成 |
| spec-validator | STRIDE + Google 4 観点で仕様を敵対的に検証 |

#### 実装エージェント（`/implement` で起動）

| エージェント | 役割 |
|-------------|------|
| implementer | TDD 駆動の実装（RED → GREEN → REFACTOR） |
| spec-compliance-reviewer | 仕様書との照合・逸脱検出 |
| build-error-resolver | ビルドエラーの最小差分修正 |

#### レビューエージェント（`/review` で並列起動）

セキュリティ・パフォーマンス・アーキテクチャ・型安全性・API 契約など、複数の専門観点からコードを並列に検査します。同梱のレビュアーは `agents/review/` で定義されており、プロジェクトに合わせて追加・削除できます。

### Context Isolation（コンテキスト分離）

Main Agent のコンテキストウィンドウを保護するため、2 層アーキテクチャを採用しています。

```
Main Agent（オーケストレーション専任）
  │
  │  仕様書・タスクリストを読み込み、作業を分配
  │  ※ 実装ファイルの Read / Write / Edit は禁止
  │
  ├─ [Teams モード] --teams
  │   teammate 間で直接通信。フィードバックが必要な場面向け
  │
  └─ [Sub Agents モード] --agents（デフォルト）
      独立した並列実行。各タスクが独立して完了できる場面向け
```

### スキルシステム

スキルはエージェントの行動規範を定義する知識ファイルです。**1% ルール** — 1% でも適用される可能性があれば呼び出します。

**方法論スキル**（開発手法を規定）:

| スキル | 概要 |
|--------|------|
| test-driven-development | TDD の厳格ルール。テスト前のコードは書き直し |
| systematic-debugging | 再現→原因特定→修正→防御の 4 フェーズ |
| verification-before-completion | テスト実行結果を貼り付けて完了を証明 |
| iterative-retrieval | Glob → Grep → Read で段階的にコンテキスト取得 |
| strategic-compact | コンテキスト 80% 超過時の手動コンパクション |

**ドメインスキル**（技術領域の知識）:

フレームワーク・ORM・IaC・セキュリティなど、技術領域ごとのベストプラクティスを定義します。同梱のスキルは `skills/` で確認できます。独自のドメインスキルを追加することも可能です。

ドメインスキルはフェーズに応じて異なる粒度の知識を提供する **Phase-Aware 3 ファイル構成** です。

```
skills/<skill-name>/
├── SKILL.md           # フル知識（~500行）— /implement, /review で使用
├── design.md          # 設計指針（~120行）— /spec で使用
└── constraints.md     # 制約のみ（~30行）— /brainstorm で使用
```

フェーズごとに必要最小限の知識だけをロードし、コンテキストウィンドウを節約します。

### フック（自動ガードレール）

コード品質を自動的に守る仕組みです。

| フック | 動作 |
|--------|------|
| block-unnecessary-files | プロジェクトルートへの不要ファイル作成をブロック |
| detect-console-log | デバッグ用ログの消し忘れを警告 |
| require-tmux-for-servers | 長時間プロセスを tmux 外で実行するのをブロック |
| gate-git-push | `git push` 時にレビュー完了を確認。`--force` はブロック |

同梱のフックは `hooks/` で定義されています。プロジェクトに合わせてカスタマイズできます。

### OpenSpec 統合

Forge は [OpenSpec](https://github.com/openspec) の仕様管理手法を採用しています。仕様は Delta 記法 + Given/When/Then シナリオで記述され、「生きたドキュメント」として維持されます。

```
openspec/
├── project.md              # プロジェクトコンテキスト
├── specs/                  # 累積スペック（マージ済みの正式仕様）
└── changes/                # 変更単位の作業ディレクトリ
    ├── <change-name>/      # アクティブな変更
    │   ├── proposal.md     # /brainstorm で生成
    │   ├── design.md       # /spec で生成
    │   ├── tasks.md        # /spec で生成
    │   └── specs/          # デルタスペック
    └── archive/            # /compound で完了分をアーカイブ
```

---

## カスタマイズ

### ユーザー独自のコマンド・スキルを追加

`~/.claude/` 配下にファイルを追加するだけです。Forge のシンボリックリンクと共存できます。

```bash
# カスタムコマンドの追加
cat > ~/.claude/commands/my-command.md << 'EOF'
あなたは...
EOF

# カスタムスキルの追加
mkdir -p ~/.claude/skills/my-skill
cat > ~/.claude/skills/my-skill/SKILL.md << 'EOF'
# My Skill
...
EOF
```

### ルールのカスタマイズ

ルールは 2 層構造です。

- **`rules/`** — 常時読み込みされる基本ルール（エスカレーション・セキュリティ・Git 規約）
- **`reference/`** — オンデマンドで参照される詳細ルール（言語規約・テスト・フレームワーク固有）

`reference/` 配下にプロジェクト固有のルールファイルを追加できます。

### settings.json

初回インストール時にコピーされます。既存の設定がある場合は上書きしません。設定を更新する場合は `settings.template.json` をテンプレートとして参照してください。

---

## リポジトリ構成

```
forge/
├── install.sh / uninstall.sh     # インストーラー
├── CLAUDE.md                      # プロジェクト CLAUDE.md テンプレート
├── USER-CLAUDE.md                 # ユーザー CLAUDE.md テンプレート
├── settings.json                  # Claude Code 設定
│
├── commands/                      # スラッシュコマンド定義
│   ├── brainstorm.md
│   ├── spec.md
│   ├── implement.md
│   ├── review.md
│   ├── test.md
│   ├── compound.md
│   ├── ship.md
│   ├── commit.md
│   ├── handle-pr-review.md
│   └── skill-format.md
│
├── agents/                        # エージェント定義
│   ├── research/                  #   リサーチ（4種）
│   ├── spec/                      #   スペック（2種）
│   ├── orchestration/             #   オーケストレーション（1種）
│   ├── implementation/            #   実装（3種）
│   └── review/                    #   レビュー（7種）
│
├── skills/                        # スキル定義
│   ├── forge-skill-orchestrator/  #   方法論スキル（SKILL.md のみ）
│   ├── test-driven-development/
│   ├── <domain-skill>/            #   ドメインスキル（3ファイル構成）
│   │   ├── SKILL.md
│   │   ├── design.md
│   │   └── constraints.md
│   └── ...
│
├── rules/                         # 常時読み込みルール
├── reference/                     # オンデマンド参照ルール
├── hooks/                         # フック（自動ガードレール）
├── docs/                          # 複利ドキュメント
└── openspec/                      # OpenSpec 仕様管理
```

---

## ライセンス

MIT
