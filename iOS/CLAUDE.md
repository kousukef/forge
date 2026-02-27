# CLAUDE.md -- Forge 統合開発ワークフローシステム（iOS版）

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
| `reference/swift-rules.md` | Swift実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/ios/conventions.md` | iOS全般・AppDelegate/SceneDelegate・Xcode作業時 |
| `reference/swiftui/conventions.md` | SwiftUI UI実装時 |
| `reference/coredata/conventions.md` | CoreData/SwiftDataスキーマ・マイグレーション時 |
| `reference/network/conventions.md` | URLSession/Alamofire APIレイヤー実装時 |

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
| build-error-resolver     | Swift/Xcodeビルドエラー・SwiftLint・xcodebuildエラーの最小差分修正                           |

### レビューエージェント（`agents/review/`）-- 全て model: opus

| Agent                     | Purpose                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| security-sentinel         | iOS セキュリティ・Keychain・ATS・SSL証明書・Deeplinkバリデーション         |
| ios-performance-reviewer  | メモリリーク・メインスレッドI/O・過剰な再描画・バッテリー消費              |
| ios-architecture-reviewer | MVVM + Clean Architecture 準拠・レイヤー分離・依存方向                     |
| swift-reviewer            | Swift 慣用句・Swift Concurrency・Null Safety・SwiftLint 準拠               |
| swiftui-reviewer          | SwiftUI パターン・状態ホイスティング・副作用処理・アクセシビリティ         |
| ios-test-reviewer         | XCTest/Quick/Nimble カバレッジ・テスト品質・DI設計                        |
| review-aggregator         | レビュー結果統合・重複排除・矛盾解決・カバレッジマトリクス生成             |

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

| Skill                         | Purpose                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| swift-best-practices          | Swift 慣用句・Optional・拡張・プロトコル・Result型・値型と参照型                     |
| ios-mvvm-clean-architecture   | MVVM + Clean Architecture・UI/Domain/Data 層分離・依存方向・UseCase/Repository パターン |
| swiftui-patterns              | SwiftUI・状態ホイスティング・副作用（task/onAppear等）・パフォーマンス最適化          |
| swift-concurrency             | async/await・Actor・Task・MainActor・構造化並行性・Combine連携                        |
| ios-dependency-injection      | 手動DI・Swinject・モジュール定義・スコープ管理・テスト用モック注入                    |
| ios-testing                   | XCTest・Quick/Nimble・XCUITest・TDD サイクル                                          |
| ios-networking                | URLSession・Alamofire・Interceptor・エラーハンドリング・Result ラッパー               |
| coredata-swiftdata            | CoreData Entity/NSManagedObject・SwiftData Model・マイグレーション戦略・クエリ最適化  |
| security-patterns             | iOS セキュリティ・Keychain・証明書ピニング・ATS設定・難読化                           |
| architecture-patterns         | SOLID・DDD・ADR・モジュール境界・レイヤードアーキテクチャ                             |

> プロジェクトの `.claude/skills/` に配置されたスキルも Claude Code が自動検出し、上記と同様に利用可能になる。

---

## Hook 自動ガードレール

以下のフックが自動的に品質を守る。フック定義は `~/.claude/hooks/` を参照:

| Hook                     | Trigger | Action                                                                                        |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| block-unnecessary-files  | Write前 | プロジェクトルートへの `.md`/`.txt` 作成をブロック（`docs/`, `openspec/` 配下は許可）         |
| detect-print             | Write後 | `.swift` 内の `print(` を警告（デバッグ用print文の本番混入を防止）                            |
| require-tmux-for-builds  | Bash前  | `xcodebuild archive` 等の長時間ビルドを tmux 外で実行するのをブロック                         |
| gate-git-push            | Bash前  | `git push --force` をブロック、通常 push 時にチェックリスト表示                               |

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
| `.swift` 全般 | `test-driven-development`, `verification-before-completion`, `iterative-retrieval`, `swift-best-practices` |
| UI 層（`presentation/`, `ui/`, `View.swift`, `@main`） | 上記 + `swiftui-patterns`, `ios-mvvm-clean-architecture` |
| Domain 層（`domain/`, `usecase/`, `UseCase.swift`） | 上記 + `ios-mvvm-clean-architecture`, `swift-concurrency` |
| Data 層（`data/`, `repository/`, `datasource/`） | 上記 + `ios-mvvm-clean-architecture` |
| CoreData/SwiftData（`*+CoreData.swift`, `*.xcdatamodeld`, `@Model`） | 基本 + `coredata-swiftdata` |
| ネットワーク（`*API.swift`, `*Service.swift`, `network/`） | 基本 + `ios-networking` |
| DI（`*Container.swift`, `*Assembly.swift`, `di/`） | 基本 + `ios-dependency-injection` |
| テスト（`*Tests.swift`, `*UITests.swift`） | `ios-testing`, `test-driven-development` |
| セキュリティ関連 | `security-patterns` |
| アーキテクチャ設計 | `architecture-patterns`, `ios-mvvm-clean-architecture` |
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
- 検証コマンド実行（`swift test`, `swiftlint lint`, `git diff --stat`）
- 検証失敗時: `Task(build-error-resolver)` に委譲（最大3回リトライ）
- スペック準拠確認: `Task(spec-compliance-reviewer)` に委譲
- `git diff --stat` で変更概要確認・ユーザーに報告

### Main Agent が行わないこと（厳守）

| 禁止操作 | 理由 | 代替手段 |
|---|---|---|
| Write / Edit で実装ファイルを編集 | コンテキスト汚染 | Task(implementer) / teammate に委譲 |
| 実装ファイル（`.swift`）の Read | コンテキスト膨張 | Explore Agent / implementer に委譲 |
| SKILL.md の Read | コンテキスト汚染 | スキル名のみ決定、Claude Code が自動解決 |
| `git diff`（ファイル内容表示） | 大量 diff でコンテキスト圧迫 | `git diff --stat` のみ許可 |

---

## Escalation Rules

`~/.claude/rules/core-essentials.md` に統合済み。エスカレーションポリシー（必須/状況依存/自律判断OK）を参照。

---

## Personal Preferences

### Code Style

- Swift + SwiftLint 準拠（インデント4スペース、命名規則：クラス PascalCase、変数/関数 camelCase）
- 既存のコード規約・パターンを踏襲
- コードやコメントにエモジを入れない
- 略語禁止（`vc` → `viewController`, `repo` → `repository`）
- force unwrap（`!`）禁止。`guard let` / `if let` / `??` を使用

### Git

- コミット形式: `<type>(<scope>): <日本語の説明>`
- PR説明は日本語
- 小さく焦点を絞ったコミット
- コミット前に `git diff` でレビュー

### Quality

- テスト前にコードを書かない（TDD: RED → GREEN → REFACTOR）
- テストをスキップ・無効化して通過させない
- TODO/モック/スタブを本実装に残さない
- `swiftlint lint` と `swift test` をコミット前に実行

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
