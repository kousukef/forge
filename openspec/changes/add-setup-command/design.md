# add-setup-command 技術設計

## 概要

Forge を技術スタック非依存のワークフローシステムとして汎用化するため、プロジェクトごとのドメインスキル設定を対話的に支援する `/setup` コマンドを新規作成する。`/setup` はスラッシュコマンド（`commands/setup.md`）であり、Claude Code が Markdown の指示に従って対話的に実行する。プログラムコードではなく、宣言的なコマンド定義が主体である。

## リサーチサマリー

### 公式ドキュメントからの知見

- **スキル配置の2層構造**: プロジェクト固有は `<project>/.claude/skills/<name>/SKILL.md`（優先）、グローバルは `~/.claude/skills/<name>/SKILL.md`（フォールバック）。Auto-Discovery は description フィールドが唯一のトリガー
- **SKILL.md フォーマット**: frontmatter に `name` と `description`（トリガー条件形式）を含む。`disable-model-invocation: true` はコマンド専用であり、スキルには付けない
- **CLAUDE.md の加算方式**: 全レベルがマージされる（上書きではない）。読み込み順は `~/.claude/CLAUDE.md` → `<project>/CLAUDE.md` → サブディレクトリ
- **settings.json の3層**: `settings.local.json`（優先） → `settings.json`（プロジェクト共有） → `~/.claude/settings.json`（グローバル）

### Web検索からの知見

- **skills.sh API**: `GET /api/search?q={query}&limit=N` で JSON レスポンス。レート制限は公式 SLA 不明のためフォールバック戦略が必要。`npx skills add {owner}/{repo} --skill {name}` でインストール
- **GitHub API レート制限**: 未認証 60req/h（Search 10req/min）、認証済み 5,000req/h（Search 30req/min）。`gh api` コマンドは settings.json で許可済み
- **主要スキルリポジトリ**: awesome-claude-skills（864個、39K stars）、everything-claude-code（56個、56K stars）
- **技術スタック自動検出**: package.json dependencies, tsconfig.json, prisma/schema.prisma, *.tf, go.mod, requirements.txt/pyproject.toml, Cargo.toml, pom.xml/build.gradle 等のファイルパターンで検出。バージョン検出も重要（Next.js 14 vs 15 等の破壊的変更）
- **skill-creator**: Anthropic 公式（`anthropics/skills/skill-creator`）。5段階プロセス: 意図把握 → スキル作成 → テスト → 評価・改善 → 説明最適化
- **GitHub リポジトリ別の SKILL.md 配置パス**:
  - awesome-claude-skills: `{skill-name}/SKILL.md` またはルート直下のサブディレクトリ
  - everything-claude-code: `skills/{skill-name}/SKILL.md`
  - 個別リポジトリ: ルート直下の `SKILL.md` または `.claude/skills/{name}/SKILL.md`

### コードベース分析（既存スペックとの関連含む）

- **コマンド定義パターン**: frontmatter 必須（`description`, `disable-model-invocation: true`, `argument-hint`）。本文構造は `# /<command> コマンド` → `REQUIRED SKILLS:` → `## 目的` → `## ワークフロー`。対話型コマンドは brainstorm パターンに近い
- **install.sh**: `FORGE_DIRS=(commands agents skills rules reference hooks docs)` で個別要素をシンボリックリンク。skill-creator は `skills/skill-creator/` に同梱すれば既存ロジックで自動リンクされる（install.sh 変更不要）
- **skills-lock.json**: 外部スキルのソース（GitHub URL）とハッシュを管理。skill-creator 追加時にエントリ追加が必要。`/setup` でインストールしたスキルも skills-lock.json にソース URL + SHA-256 ハッシュを記録する
- **find-skills スキル**: skills.sh API のみを使用（`searchSkillsAPI()`）。/setup は find-skills を内部利用しつつ GitHub API 検索を並行実行する設計
- **既存スペックとの関連**:
  - domain-skills/spec.md REQ-005: Available Skills テーブル更新 → setup.md で skill-creator を追加
  - command-args/spec.md: argument-hint パターンに従う必要あり
  - skill-handling/delta-spec.md: Phase-Aware 構造との統合

### 過去の学び

- **argument-hint パターン**: 新規コマンドに必須。`/setup` に argument-hint を含める
- **同期漏れ再発**: プロジェクト/グローバル両方のスキル存在チェックが必要
- **YAGNI とセキュリティ**: YAGNI はセキュリティ防御策には適用しない。外部スキルインストール前に SKILL.md 内容を要約表示しユーザー確認
- **description 3部構成**: skill-creator 連携時に推奨テンプレートとして提供
- **setup.md はサマリーのみ**: SKILL.md のインライン展開禁止（コンテキスト保護）
- **Progressive Disclosure**: setup.md はスキル名+簡易説明のみ、詳細は各 SKILL.md に委ねる
- **リポジトリごとの構造差異**: GitHub ソースごとにアダプター設計が必要

## 技術的アプローチ

### 1. コマンド定義（commands/setup.md）

brainstorm.md パターンに準じた対話型コマンドとして定義する。frontmatter は以下:

```yaml
---
description: "プロジェクトの技術スタックを検出し、対話的にスキルをインストール・設定する"
disable-model-invocation: true
argument-hint: "[keyword]"
---
```

`[keyword]` は省略可能。指定時は技術スタック自動検出をスキップし、指定されたキーワードで直接スキル検索（REQ-002）に進む。

### 2. 8ステップのワークフロー

1. 技術スタック自動検出（ファイルパターンベース、モノレポはルート + 1階層下まで検出）
2. 既存スキルスキャン（プロジェクト + グローバル）
3. スキル検索（find-skills + GitHub API 並行）
4. 対話的選択（ソース別グループ表示 + インストール先選択）
5. インストール（npx skills add or git clone + コピー）
6. 追加キーワード検索（ループ）
7. スキル作成提案（skill-creator 連携）
8. 設定ファイル生成（setup.md + CLAUDE.md）

### 3. スキル検索アーキテクチャ

Open/Closed 原則に基づき、検索ソースを独立したステップとして記述する。各ソースの結果をマージ・重複排除し、ソース別グループとしてランキング付きで提示:

| ソース | 検索方法 | ランキング指標 | 表示順 |
|---|---|---|---|
| skills.sh | `npx skills find [query]` | install 数降順 | 上位グループ |
| awesome-claude-skills | `gh api` で README パース | star 数降順 | 下位グループ |
| everything-claude-code | `gh api` で contents/skills | star 数降順 | 下位グループ |
| GitHub トピック検索 | `gh api search/repositories` | star 数降順 | 下位グループ |

表示形式: skills.sh グループを上位に表示（install 数降順）、GitHub グループを下位に表示（star 数降順）。各グループは最大10件まで表示する。

フォールバック戦略:
- skills.sh 障害時（npx 未インストール含む）は GitHub API のみで続行
- GitHub API 障害時は skills.sh のみで続行
- npx 未インストール時は warn レベルの案内を表示し、GitHub API 検索のみ実行
- gh 未認証時は未認証レート制限（10req/min）で動作し、認証案内を表示

### 4. GitHub リポジトリ別の SKILL.md 取得パス

検索ソースによって SKILL.md の格納パスが異なるため、ソースごとの取得パスをコマンド定義内に明記する:

| ソース | SKILL.md 取得パス |
|---|---|
| awesome-claude-skills | `{skill-name}/SKILL.md` またはルート直下のサブディレクトリ |
| everything-claude-code | `skills/{skill-name}/SKILL.md` |
| 個別リポジトリ | ルート直下の `SKILL.md` または `.claude/skills/{name}/SKILL.md` |

### 5. セキュリティ検証

Dependency Inversion 原則に基づき、外部スキルのインストールは「信頼の検証」を挟む:
- インストール前に SKILL.md の内容を要約表示
- ソース URL、star 数（または install 数）、最終更新日を明示表示
- ユーザーが明示的に承認してからインストール実行
- Premature Abstraction を避け、現時点ではシンプルな承認フローのみ実装

### 6. skill-creator の同梱

Forge リポの `skills/skill-creator/` ディレクトリに skill-creator の SKILL.md を配置する。install.sh の既存ロジック（`FORGE_DIRS` に `skills` が含まれている）により、自動的に `~/.claude/skills/skill-creator/` にシンボリックリンクが作成される。skills-lock.json にもエントリを追加する。

### 7. 設定ファイル生成

- **`<project>/.claude/setup.md`**: インストールしたスキル/エージェントのガイダンステーブル（マネージドファイル、再実行時は再生成）
- **`<project>/CLAUDE.md`**: 存在しない場合は構造化テンプレートを生成:

```markdown
# <project-name>

## プロジェクト概要
<!-- プロジェクトの説明を記載 -->

## 技術スタック
<!-- /setup で検出された技術スタック -->

## Available Skills
See: .claude/setup.md

## Available Agents
<!-- 使用するエージェントを記載 -->
```

既存の場合は setup.md への参照のみ追記（重複チェック付き）。

### 8. 冪等性の設計

Single Responsibility 原則に基づき、冪等性の責務を明確化:
- 既存スキルの検出: プロジェクト + グローバルの両方をスキャン
- 差分検出: 未インストールの推奨スキルのみ提案
- setup.md: 全件再生成（マネージドファイル）
- CLAUDE.md: setup.md 参照の存在チェック後、なければ追記

### 9. skills-lock.json との統合

`/setup` でインストールしたスキルも skills-lock.json にエントリを追記する。既存の skills-lock.json 管理ロジックとの整合性を保つため、以下の形式で記録する:

```json
{
  "skills": {
    "<skill-name>": {
      "source": "<github-url or skills.sh-url>",
      "sourceType": "github",
      "computedHash": "<SHA-256>"
    }
  }
}
```

### 10. モノレポ対応

技術スタック自動検出の検索範囲はルート直下 + 1階層下（`packages/*/`、`apps/*/` 等）とする。1階層下のファイルも検出対象とし、検出された全技術スタックを統合表示する。2階層以上のネストは検索しない。

## リスクと注意点

### skills.sh API の安定性
公式 SLA が不明。レート制限やサービス停止時のフォールバック戦略（GitHub API のみで続行）が必要。コマンド定義にフォールバック手順を明記する。

### npx 未インストール時の graceful degradation
skills.sh 検索は `npx skills find` に依存する。npx がインストールされていない環境では warn レベルの案内を表示し、GitHub API 検索のみで続行する。エラーとして処理を中断しない。

### GitHub API レート制限
未認証では 60req/h と厳しい。`gh` コマンド（認証済み）を使用することで 5,000req/h に拡大。settings.json で `gh api` は許可済み。未認証時は10req/min の制限下で動作し、認証案内を表示する。

### 外部スキルの品質・安全性
外部リポジトリのスキルは品質が保証されない。SKILL.md の要約表示とユーザー確認で最低限の安全性を確保する。要約表示時にはソース URL、star 数、最終更新日を明示し、ユーザーの信頼性判断を支援する。自動的な悪意検出は現時点では YAGNI だが、セキュリティ表示は省略しない（YAGNI はセキュリティ防御策に適用しない）。

### リポジトリごとのディレクトリ構造差異
awesome-claude-skills と everything-claude-code ではスキルの格納パスが異なる。コマンド定義内でソースごとのパース方法を記述する必要がある。取得パスのマッピングを設計セクションに明記済み。

### CLAUDE.md テンプレート生成の既存内容との衝突
既存の CLAUDE.md がある場合、テンプレート全体の上書きは危険。setup.md への参照追記のみに限定し、既存内容を破壊しない設計とする。新規作成時は構造化テンプレートを使用し、プロジェクト概要・技術スタック・Available Skills・Available Agents のセクションを持つ。

### スキル作成提案の閾値
「検索結果が0件、または全ての結果が skills.sh install 数 1,000 未満かつ GitHub star 数 100 未満」をスキル作成提案のトリガーとする。この閾値は skills.sh と GitHub のエコシステム成長に応じて将来的に調整が必要となる可能性がある。
