# Forge Android

**Android 開発に特化した Claude Code 統合ワークフローシステム**

Forge Android は、設計から実装・レビュー・テスト・学習まで、Android アプリ開発のライフサイクル全体を
Claude Code のスラッシュコマンド・エージェント・スキル・フックで自動化する統合システムです。

---

## 対象技術スタック

| レイヤー | 技術 |
|---------|------|
| 言語 | Kotlin |
| UI | Jetpack Compose |
| アーキテクチャ | MVVM + Clean Architecture |
| 非同期処理 | Kotlin Coroutines & Flow |
| DI | Dagger / Hilt |
| ローカル DB | Room |
| HTTP クライアント | Retrofit / OkHttp |
| ナビゲーション | Navigation Component + SafeArgs |
| テスト | JUnit4/5・MockK・Espresso・Compose UI Test |
| ビルドツール | Gradle |
| Lint | ktlint・AndroidLint |

---

## インストール

### 前提条件

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- 以下の MCP サーバーが設定済み：
  - **Context7 MCP** -- フレームワーク公式ドキュメント取得用
  - **Web Search MCP**（Brave Search MCP または Tavily MCP）-- Web 検索用

### セットアップ

このリポジトリの内容を `~/.claude/` にコピーして使用します。

```bash
# リポジトリをクローン
git clone https://github.com/your-username/forge_android.git
cd forge_android

# ~/.claude/ にコピー（既存の設定がある場合はバックアップを推奨）
cp -r commands/   ~/.claude/commands/
cp -r agents/     ~/.claude/agents/
cp -r skills/     ~/.claude/skills/
cp -r rules/      ~/.claude/rules/
cp -r reference/  ~/.claude/reference/
cp -r hooks/      ~/.claude/hooks/
cp -r docs/       ~/.claude/docs/
cp settings.json  ~/.claude/settings.json
```

または、ワンライナーで一括コピー：

```bash
# ~/.claude/ が存在しない場合は作成
mkdir -p ~/.claude

# 全ファイルをコピー（README と .git を除く）
rsync -av --exclude='README.md' --exclude='.git' --exclude='forge-system-prompt.md' ./ ~/.claude/
```

> **注意**: 既に `~/.claude/settings.json` が存在する場合は、手動でマージしてください。上書きすると既存のフック設定が消えます。`settings.template.json` をテンプレートとして参照できます。

### コピー先の確認

セットアップ後、以下の構造になっていれば正しくインストールされています：

```
~/.claude/
├── commands/           # スラッシュコマンド（9 個）
├── agents/
│   ├── research/       # リサーチエージェント（4 個）
│   ├── spec/           # スペックエージェント（2 個）
│   ├── orchestration/  # オーケストレーションエージェント（1 個）
│   ├── implementation/ # 実装エージェント（3 個）
│   └── review/         # レビューエージェント（7 個）
├── skills/             # スキル定義（17 個）
├── rules/
│   └── core-essentials.md  # 常時読み込みルール
├── reference/          # オンデマンド参照ルール
│   ├── common/         # 共通規約
│   ├── android/        # Android 規約
│   ├── jetpack-compose/# Jetpack Compose 規約
│   ├── room/           # Room 規約
│   └── retrofit/       # Retrofit 規約
├── hooks/              # 自動品質ゲート
├── docs/
│   └── compound/       # 複利ドキュメント
└── settings.json       # フック・パーミッション設定
```

### アンインストール

```bash
# Forge Android のファイルを削除（他の Claude Code 設定は残ります）
rm -rf ~/.claude/commands ~/.claude/agents ~/.claude/skills \
       ~/.claude/rules ~/.claude/reference ~/.claude/hooks ~/.claude/docs
# settings.json は手動で Forge のフック設定を削除してください
```

---

## 使い方

### ケース 1: 新規 Android プロジェクトを作成する

Android Studio で新規プロジェクトを作成した直後から使用する場合のワークフローです。

#### 1. プロジェクト初期化

Android Studio で新規プロジェクト（Jetpack Compose テンプレート推奨）を作成後、
プロジェクトコンテキストを記述します。

```bash
mkdir -p openspec/specs
```

```markdown
<!-- openspec/project.md の例 -->
# プロジェクト概要

## アプリ名
MyApp

## 目的
○○ユーザーが△△できるようにする Android アプリ

## 技術制約
- minSdk: 26
- targetSdk: 35
- DI: Hilt
- DB: Room
```

#### 2. Claude Code を起動する

```bash
cd /path/to/your/android/project
claude
```

#### 3. 機能開発フロー

```
/brainstorm → /spec → [承認] → /implement → /review → /test → /compound
```

各フェーズを段階的に実行する場合:

```bash
/brainstorm    # 要件を深掘り（ソクラテス式対話で仕様をクリアにする）
/spec          # 仕様書・設計・タスクリストを生成（ユーザー承認が必要）
/implement     # TDD で実装（RED→GREEN→REFACTOR）
/review        # 7 専門レビュアーによる並列コードレビュー
/test          # テスト実行・Lint・ビルド検証・カバレッジ確認
/compound      # 学びを記録してスペックにマージ
```

または、ワンコマンドで全パイプラインを実行:

```bash
/ship ログイン機能を追加したい
```

### ケース 2: 既存の Android プロジェクトに導入する

開発中の Android プロジェクトに後から導入する場合のワークフローです。

#### 1. インストール後、既存コードベースを把握させる

```bash
cd /path/to/existing/android/project
claude
```

```
このプロジェクトのアーキテクチャとディレクトリ構造を分析して、
openspec/project.md にプロジェクトコンテキストをまとめて。
```

#### 2. OpenSpec ディレクトリの初期化

```bash
mkdir -p openspec/specs openspec/changes
```

#### 3. 以降は新規プロジェクトと同じコマンドパイプラインで開発

既存コードへの**デグレ（副作用）防止**が自動的に考慮されます。

---

## コマンド一覧

### `/brainstorm` -- 要件の深掘り

ソクラテス式対話で機能の要件を深掘りします。

- **一度に 1 つだけ**質問（選択肢形式を優先）
- **YAGNI 原則**を徹底 -- 「それは本当に今必要か？」
- コードの話は一切しない。設計だけに集中
- 出力: `openspec/changes/<change-name>/proposal.md`

### `/spec` -- デルタスペック・技術設計・タスクリストの作成

リサーチエージェント群と spec-writer を起動し、情報を収集してから仕様を作成します。Teams モードと Sub Agents モードを選択可能。

```
/spec <change-name>              # デフォルト（Sub Agents モード）
/spec <change-name> --teams      # Teams モード（エージェント間通信あり）
/spec <change-name> --agents     # Sub Agents モード（並列独立実行）
```

```
┌─────────────────────┐
│      /spec 実行      │
└──────────┬──────────┘
           │ Phase 1: リサーチ（4 エージェント並列）
    ┌──────┼──────┬──────────────┐
    ▼      ▼      ▼              ▼
 stack-  web-  codebase-  compound-
 docs   researcher analyzer  learnings
    │      │      │              │
    └──────┴──────┴──────────────┘
           │ Phase 2: 仕様統合（spec-writer）
           ▼
   openspec/changes/<change-name>/
   ├── specs/<feature>/delta-spec.md
   ├── design.md
   └── tasks.md
           │ Phase 3: 承認待ち
           ▼
   ユーザーが承認 → 実装へ
```

- Delta 記法（ADDED/MODIFIED/REMOVED）と Given/When/Then シナリオで要件を記述
- 1 タスク = 2〜5 分で完了できるサイズ
- 各タスクにファイルパス・検証方法を明記
- テストタスクを実装タスクの**前**に配置（TDD）
- 各タスクにデルタスペック要件へのリンクを含む

### `/implement` -- TDD 駆動の実装

仕様書のタスクリストに基づき、2 層アーキテクチャで実装します。Main Agent がオーケストレーション専任、実装は全て Sub Agent / Teams に委譲します。

```
/implement <change-name>              # デフォルト（Sub Agents モード）
/implement <change-name> --teams      # Teams モード
/implement <change-name> --agents     # Sub Agents モード
```

```
Main Agent（チームリーダー / オーケストレーション専任）
  │ tasks.md + design.md を読み込み
  │ タスク分析・依存関係構築
  │
  ├─ [Teams モード] TeamCreate → 実装チーム
  │   ├─ implementer teammates × N（TDD: RED → GREEN → REFACTOR）
  │   ├─ spec-compliance-reviewer（逸脱検出 → implementer に直接フィードバック）
  │   └─ build-error-resolver（ビルドエラー時に投入）
  │
  └─ [Sub Agents モード] Task(implementer) × N
      ├─ 並列可能なタスクは同時に Task 起動
      ├─ 検証失敗時: Task(build-error-resolver) で修正
      └─ スペック準拠: Task(spec-compliance-reviewer) で確認
```

**Context Isolation Policy**: Main Agent は実装ファイルの Read / Write / Edit を行わない。全ての実装作業をエージェントに委譲することで、コンテキストウィンドウを保護します。

### `/review` -- 7 専門レビュアーによる並列レビュー

7 つの専門レビューエージェントが**同時に**コードを検査します。

| レビュアー | 検査対象 |
|-----------|---------|
| security-sentinel | Android セキュリティ・シークレット検出・認証・認可・ProGuard |
| android-performance-reviewer | メモリリーク・ANR・バッテリー消費・過剰な再コンポジション |
| android-architecture-reviewer | MVVM + Clean Architecture 準拠・レイヤー分離・依存方向 |
| kotlin-reviewer | Kotlin 慣用句・Coroutines/Flow・Null Safety・ktlint 準拠 |
| compose-ui-reviewer | Compose パターン・状態ホイスティング・副作用処理・アクセシビリティ |
| android-test-reviewer | JUnit/Espresso/Compose UI Test カバレッジ・テスト品質 |
| review-aggregator | 重複排除・矛盾解決・カバレッジマトリクス生成 |

発見事項は P1（修正必須）/ P2（修正推奨）/ P3（軽微）に分類されます。

### `/test` -- テスト実行と完了検証

以下を順番に実行し、**実際の実行結果を貼り付けて**完了を証明します。

1. ユニットテスト: `./gradlew testDebugUnitTest`
2. Lint: `./gradlew lint`
3. ktlint: `./gradlew ktlintCheck`
4. ビルド検証: `./gradlew assembleDebug`
5. インストルメンテーションテスト: `./gradlew connectedDebugAndroidTest`（実機/エミュレータ接続時）
6. カバレッジ: 80% 以上を目標

失敗がある場合は根本原因を分析し、修正→再テストを繰り返します。

### `/compound` -- 学びの文書化 + スペックマージ

開発セッションから得た学びを `docs/compound/` に記録し、将来の開発にフィードバックします。さらに、デルタスペックを累積スペックにマージしてアーカイブします。

- うまくいったパターン / 失敗と修正 / 予想外の落とし穴
- **100 ドルルール**: 防げたはずの失敗が起きたら、ルール・スキル・フックの更新を提案
- **スペックマージ**: `openspec/changes/<change-name>/specs/` → `openspec/specs/` にマージ
- **変更アーカイブ**: `openspec/changes/<change-name>/` → `openspec/changes/archive/` に移動

### `/commit` -- Conventional Commits でコミット

ステージされた変更（なければ全変更を自動ステージ）から Conventional Commits 形式のメッセージを生成してコミットします。

- 事前に `./gradlew lint` と `./gradlew ktlintCheck` を自動実行
- `git diff` で変更内容を分析し、適切なコミットメッセージを生成

### `/handle-pr-review` -- PR レビューコメント対応

PR のレビューコメントを分析し、必要な修正・コミット・プッシュ・スレッド返信を一括処理します。

```
/handle-pr-review <PR番号>
```

### `/ship` -- 完全自律モード

全コマンドを連鎖実行する完全自律パイプラインです。

```
/brainstorm ──→ ユーザー承認
     │           openspec/changes/<change-name>/proposal.md
/spec ─────→ ユーザー承認
     │           openspec/changes/<change-name>/{specs/,design.md,tasks.md}
     ▼ 以降は自律実行
/implement → /review → 自動修正 → /test → /compound
                                    │        │
                              失敗時:      スペックマージ +
                              最大3回      アーカイブ
                              リトライ
```

---

## エージェント構成

### リサーチエージェント（`agents/research/`）

`/spec` の Phase 1 で並列起動され、情報を収集します。

| エージェント | 役割 | 情報源 |
|-------------|------|--------|
| stack-docs-researcher | 公式ドキュメントのベストプラクティス取得 | Context7 MCP |
| web-researcher | 最新記事・落とし穴・参考実装の調査 | Web Search MCP |
| codebase-analyzer | 既存コードのパターン・影響範囲分析 | プロジェクトファイル |
| compound-learnings-researcher | 過去の学びから関連教訓を抽出 | `docs/compound/` |

### スペックエージェント（`agents/spec/`）

`/spec` の Phase 2 でリサーチ結果を統合し、仕様書を生成します。

| エージェント | 役割 | モデル |
|-------------|------|--------|
| spec-writer | リサーチ結果を統合し design.md / tasks.md / delta-spec を生成 | sonnet |
| spec-validator | 敵対的仕様検証。エラーパス・境界値・非機能要件の網羅性チェック | opus |

### オーケストレーションエージェント（`agents/orchestration/`）

`claude --agent implement-orchestrator` でメインスレッドとして起動する場合にのみ使用します。`/implement` コマンドからは使用しません。

| エージェント | 役割 | モデル |
|-------------|------|--------|
| implement-orchestrator | 実装オーケストレーション専任（Write/Edit 禁止） | sonnet |

### 実装エージェント（`agents/implementation/`）

`/implement` でタスクごとに起動されます。

| エージェント | 役割 | モデル |
|-------------|------|--------|
| implementer | TDD 駆動の実装（RED → GREEN → REFACTOR） | sonnet |
| spec-compliance-reviewer | 仕様書との照合・逸脱検出 | opus |
| build-error-resolver | Gradle ビルドエラー・ktlint・AndroidLint の最小差分修正 | sonnet |

### レビューエージェント（`agents/review/`）

`/review` で 7 つ全てが並列起動されます。全て `model: opus`（読み取り専用）。

---

## Context Isolation Policy

Main Agent のコンテキストウィンドウを保護し、大規模実装でも破綻しないようにする 2 層分離ルールです。

### 2 層アーキテクチャ + 動的モード選択

```
Main Agent（オーケストレーション層 / チームリーダー）
  │
  ├─ [Teams モード] --teams フラグ
  │   TeamCreate → teammate 間で SendMessage による直接通信
  │   エージェント間の情報共有・フィードバックが成果を改善する場面で使用
  │
  └─ [Sub Agents モード] --agents フラグ（デフォルト）
      Task(subagent) × N → 独立した並列実行
      各エージェントが独立して作業でき、やりとりが不要な場面で使用
```

### Main Agent の責務と制限

| 許可 | 禁止 |
|------|------|
| `.md` ファイル（仕様書・設計書）の Read | 実装ファイル（`.kt`）の Read |
| `git diff --stat` の実行 | `git diff`（全内容表示） |
| タスク分析・依存関係構築 | Write / Edit で実装ファイルを編集 |
| Sub Agent / Team の起動・管理 | SKILL.md の Read（名前のみ渡す） |
| 検証コマンド実行（`./gradlew test`, `./gradlew lint`） | 型エラー・lint エラーの直接修正 |

---

## スキル

エージェントの行動規範を定義する方法論です。**1% ルール**: 1% でも適用される可能性があれば、そのスキルを呼び出します。

### Methodology Skills（全プロジェクト共通）

| スキル | 概要 |
|--------|------|
| forge-skill-orchestrator | 作業開始時のスキル判定・ルーティング（1% ルール適用） |
| test-driven-development | TDD の絶対ルール。テスト前のコードは削除してやり直し |
| systematic-debugging | 再現→原因特定→修正→防御の 4 フェーズデバッグ |
| verification-before-completion | テスト実行結果を貼り付けて完了を証明 |
| iterative-retrieval | Glob → Grep → Read で段階的にコンテキスト取得 |
| strategic-compact | コンテキストウィンドウ 80% 超過時の手動コンパクション |

### Android Domain Skills

| スキル | 概要 |
|--------|------|
| kotlin-best-practices | Kotlin 慣用句・Null Safety・拡張関数・sealed class |
| android-mvvm-clean-architecture | MVVM + Clean Architecture・UseCase/Repository パターン |
| jetpack-compose-patterns | Compose UI・状態ホイスティング・副作用処理 |
| android-coroutines-flow | Coroutines・StateFlow/SharedFlow・ViewModel Scope |
| android-di-hilt | Dagger/Hilt・モジュール定義・テスト用モック注入 |
| android-testing | JUnit・MockK・Espresso・Compose UI Test |
| android-navigation | Navigation Component・SafeArgs・バックスタック管理 |
| room-database | Room DAO/Entity・マイグレーション戦略 |
| retrofit-api-patterns | Retrofit/OkHttp・Interceptor・Result ラッパー |
| security-patterns | EncryptedSharedPreferences・証明書ピニング・ProGuard |
| architecture-patterns | SOLID・DDD・ADR・モジュール境界 |

### スキル注入メカニズム

Sub Agent にはスキル**名**のみを渡します。Claude Code がスキル名からパスを自動解決し、読み込みます。

- プロジェクト固有: `<project>/.claude/skills/`（優先度 1）
- グローバル: `~/.claude/skills/`（優先度 2）

---

## ルール

### 常時読み込み: `rules/core-essentials.md`

エスカレーションポリシー・セキュリティ必須事項・Git コミット形式の最小限ルールを常時適用します。

### オンデマンド参照: `reference/`

作業対象に応じて必要なファイルを読み込みます。

| 参照ファイル | 読み込むタイミング |
|-------------|-------------------|
| `reference/kotlin-rules.md` | Kotlin 実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD 実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/android/conventions.md` | Android 全般・Activity/Fragment・Gradle 作業時 |
| `reference/jetpack-compose/conventions.md` | Jetpack Compose UI 実装時 |
| `reference/room/conventions.md` | Room DB スキーマ・DAO・マイグレーション時 |
| `reference/retrofit/conventions.md` | Retrofit/OkHttp API レイヤー実装時 |

---

## フック

コード品質を自動的に守るガードレールです。

### 品質ゲート

| フック | タイミング | 動作 |
|--------|-----------|------|
| block-unnecessary-files | Write 前 | プロジェクトルートへの不要な .md/.txt 作成をブロック（`docs/`、`openspec/` 配下は許可） |
| detect-debug-logging | Write 後 | `.kt` ファイル内の `Log.v`/`Log.d` を警告（`Log.e`/`Log.w`/`Log.i` は許可） |
| require-tmux-for-builds | Bash 前 | `./gradlew assembleRelease` 等の長時間ビルドを tmux 外で実行するのをブロック |
| gate-git-push | Bash 前 | `git push` 時にチェックリスト表示。`--force` はブロック |

### セッション管理

| フック | タイミング | 動作 |
|--------|-----------|------|
| session-start | セッション開始時 | セッション統計の表示、コンテキスト読み込み |
| session-end | セッション終了時 | チェックポイント保存、学びの同期 |
| pre-compact | コンパクション前 | コンテキスト圧縮前の重要情報保護 |

### 自動化

| フック | タイミング | 動作 |
|--------|-----------|------|
| detect-corrections | 監視 | Claude の自己修正パターンを検出 |
| task-completed | タスク完了時 | タスク完了後の自動処理 |

---

## エスカレーション

エージェントが曖昧な判断や高影響の意思決定に遭遇した際に、自動処理せずユーザーに確認を求めるフレームワークです。

### 3 段階のエスカレーションレベル

| レベル | 説明 | 例 |
|--------|------|----|
| 必須エスカレーション | 必ずユーザーに確認 | セキュリティ設計、DB スキーマ変更、破壊的 API 変更 |
| 状況依存エスカレーション | 判断困難な場合に確認 | 仕様の曖昧性、リサーチ結果の矛盾、レビュアー間の矛盾 |
| 自律判断 OK | 確認不要 | フォーマット修正、明らかなバグ修正、P3 対応 |

### エスカレーションが発生するフェーズ

| フェーズ | トリガー |
|----------|---------|
| `/spec` Phase 1.5 | リサーチ結果の矛盾、複数のアーキテクチャ選択肢 |
| `/implement` Step 2 | セキュリティ・DB・アーキテクチャ関連タスク、仕様の曖昧性 |
| `/review` 結果検証 | レビュアー間の矛盾、アーキテクチャ変更を伴う P1 指摘 |

詳細は `rules/core-essentials.md` を参照。

---

## リポジトリ構造

本リポジトリの構造です。使用時は `~/.claude/` にコピーしてください。

```
forge_android/
├── README.md
├── CLAUDE.md                        # ワークフローシステム定義
├── forge-system-prompt.md           # システムプロンプトテンプレート
├── settings.json                    # → ~/.claude/settings.json
├── settings.template.json           # 設定テンプレート
│
├── commands/                        # → ~/.claude/commands/
│   ├── brainstorm.md
│   ├── spec.md
│   ├── implement.md
│   ├── review.md
│   ├── test.md
│   ├── compound.md
│   ├── ship.md
│   ├── commit.md
│   └── handle-pr-review.md
│
├── agents/                          # → ~/.claude/agents/
│   ├── research/
│   │   ├── stack-docs-researcher.md
│   │   ├── codebase-analyzer.md
│   │   ├── web-researcher.md
│   │   └── compound-learnings-researcher.md
│   ├── spec/
│   │   ├── spec-writer.md
│   │   └── spec-validator.md
│   ├── orchestration/
│   │   └── implement-orchestrator.md
│   ├── implementation/
│   │   ├── implementer.md
│   │   ├── spec-compliance-reviewer.md
│   │   └── build-error-resolver.md
│   └── review/
│       ├── security-sentinel.md
│       ├── android-performance-reviewer.md
│       ├── android-architecture-reviewer.md
│       ├── kotlin-reviewer.md
│       ├── compose-ui-reviewer.md
│       ├── android-test-reviewer.md
│       └── review-aggregator.md
│
├── skills/                          # → ~/.claude/skills/
│   ├── forge-skill-orchestrator/SKILL.md
│   ├── test-driven-development/SKILL.md
│   ├── systematic-debugging/SKILL.md
│   ├── verification-before-completion/SKILL.md
│   ├── iterative-retrieval/SKILL.md
│   ├── strategic-compact/SKILL.md
│   ├── kotlin-best-practices/SKILL.md
│   ├── android-mvvm-clean-architecture/SKILL.md
│   ├── jetpack-compose-patterns/SKILL.md
│   ├── android-coroutines-flow/SKILL.md
│   ├── android-di-hilt/SKILL.md
│   ├── android-testing/SKILL.md
│   ├── android-navigation/SKILL.md
│   ├── room-database/SKILL.md
│   ├── retrofit-api-patterns/SKILL.md
│   ├── security-patterns/SKILL.md
│   └── architecture-patterns/SKILL.md
│
├── rules/                           # → ~/.claude/rules/
│   └── core-essentials.md           # 常時読み込み
│
├── reference/                       # → ~/.claude/reference/
│   ├── kotlin-rules.md
│   ├── coding-standards.md
│   ├── core-rules.md
│   ├── workflow-rules.md
│   ├── common/
│   │   ├── coding-style.md
│   │   ├── testing.md
│   │   └── performance.md
│   ├── android/conventions.md
│   ├── jetpack-compose/conventions.md
│   ├── room/conventions.md
│   └── retrofit/conventions.md
│
├── hooks/                           # → ~/.claude/hooks/
│   ├── block-unnecessary-files.js
│   ├── detect-debug-logging.js
│   ├── require-tmux-for-builds.js
│   ├── gate-git-push.js
│   ├── session-start.js
│   ├── session-end.js
│   ├── pre-compact.js
│   ├── detect-corrections.js
│   ├── task-completed.js
│   └── package.json
│
├── docs/                            # → ~/.claude/docs/
│   ├── compound/                    # 複利ドキュメント
│   ├── designs/
│   └── specs/
│
└── openspec/                        # OpenSpec 仕様管理
    ├── specs/                       # 累積スペック（マージ済み）
    └── changes/                     # 変更単位の作業ディレクトリ
        └── archive/                 # 完了した変更のアーカイブ
```

---

## 開発フロー図

```
  ユーザー
    │
    │ /ship（または個別コマンド）
    ▼
┌──────────┐
│brainstorm│ ソクラテス式対話 → 提案書
└────┬─────┘
     │ ユーザー承認
     ▼
┌──────────┐   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   spec   │──▶│stack-docs    │  │web-researcher│  │codebase-     │
│          │──▶│researcher    │  │              │  │analyzer      │
│          │──▶│              │  │              │  │              │
│          │──▶│compound-     │  │              │  │              │
│          │   │learnings     │  │              │  │              │
│          │   └──────────────┘  └──────────────┘  └──────────────┘
│          │          ↓ リサーチ結果統合
│          │   ┌──────────────┐
│          │──▶│ spec-writer  │→ design.md / tasks.md / delta-spec
└────┬─────┘   └──────────────┘
     │ ユーザー承認
     ▼
┌──────────┐   Teams モード / Sub Agents モード:
│implement │──▶ implementer × N → spec-compliance → build-error
└────┬─────┘   （Context Isolation: Main Agent は実装に触れない）
     ▼
┌──────────┐   7 レビュアー並列:
│  review  │──▶ security-sentinel / android-performance-reviewer
└────┬─────┘   android-architecture-reviewer / kotlin-reviewer
     │         compose-ui-reviewer / android-test-reviewer
     │ P1/P2 自動修正
     ▼
┌──────────┐
│   test   │ gradlew test → gradlew lint → gradlew ktlintCheck → gradlew assembleDebug
└────┬─────┘ （失敗時: 最大 3 回リトライ）
     ▼
┌──────────┐
│ compound │ 学びを記録 + スペックマージ + アーカイブ
└──────────┘
```

---

## MCP サーバー設定

このシステムは以下の MCP サーバーを前提とします。

### Context7 MCP（必須）

フレームワーク公式ドキュメントの取得に使用します。`/spec` の `stack-docs-researcher` エージェントが利用します。

### Web Search MCP（必須、以下のいずれか）

Web 検索に使用します。`/spec` の `web-researcher` エージェントが利用します。

- **Brave Search MCP**: `@anthropic/brave-search-mcp`
- **Tavily MCP**: `tavily-mcp`

---

## OpenSpec 統合

Forge Android は OpenSpec の累積仕様・Delta 記法・Given/When/Then シナリオを採用し、仕様を「生きたドキュメント」として維持します。

### `openspec/` ディレクトリ構成

```
openspec/
├── project.md              # プロジェクトコンテキスト（brainstorm 時に自動生成）
├── specs/                  # 累積スペック（マージ済みの正式仕様）
│   └── <feature>/
│       └── spec.md
└── changes/                # 変更単位の作業ディレクトリ
    ├── <change-name>/      # アクティブな変更
    │   ├── proposal.md     # 提案書（/brainstorm で生成）
    │   ├── design.md       # 技術設計（/spec で生成）
    │   ├── tasks.md        # タスクリスト（/spec で生成）
    │   └── specs/          # デルタスペック（/spec で生成）
    │       └── <feature>/
    │           └── delta-spec.md
    └── archive/            # 完了した変更のアーカイブ
        └── YYYY-MM-DD-<change-name>/
```

### Forge Android コマンドと OpenSpec 構造のマッピング

| コマンド | OpenSpec 操作 |
|---------|--------------|
| `/brainstorm` | `openspec/changes/<change-name>/proposal.md` を生成 |
| `/spec` | `openspec/changes/<change-name>/` 配下に `specs/`, `design.md`, `tasks.md` を生成 |
| `/implement` | `openspec/changes/<change-name>/` から仕様を読み込んで実装 |
| `/compound` | デルタスペックを `openspec/specs/` にマージし、変更をアーカイブ |

---

## ライセンス

MIT
