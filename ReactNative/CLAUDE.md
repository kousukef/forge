# CLAUDE.md -- Forge 統合開発ワークフローシステム（React Native版）

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
| `reference/typescript-rules.md` | TypeScript実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/react-native/conventions.md` | React Native全般・コンポーネント・スタイリング作業時 |
| `reference/react-navigation/conventions.md` | React Navigation実装・画面遷移・ディープリンク作業時 |
| `reference/async-storage/conventions.md` | AsyncStorage・データ永続化作業時 |
| `reference/api/conventions.md` | TanStack Query・APIレイヤー実装時 |

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
| build-error-resolver     | TypeScript・ESLint・Metro バンドルエラーの最小差分修正                                        |

### レビューエージェント（`agents/review/`）-- 全て model: opus

| Agent                  | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| security-sentinel      | React Native セキュリティ・AsyncStorage機密情報・HTTP通信・Deep Link入力検証 |
| typescript-reviewer    | TypeScript strictモード準拠・any型排除・asキャスト・Zodバリデーション欠如   |
| rn-architecture-reviewer | Clean Architecture準拠・Custom Hooks・Repository/Service層分離              |
| rn-ui-reviewer         | FlatList keyExtractor・useCallback/useMemo・アクセシビリティ・StyleSheet    |
| rn-performance-reviewer | メモリリーク・不要な再レンダリング・インタラクション最適化                  |
| rn-test-reviewer       | Jest/React Native Testing Library カバレッジ・テスト品質                   |
| review-aggregator      | レビュー結果統合・重複排除・矛盾解決・カバレッジマトリクス生成             |

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

| Skill                    | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| typescript-best-practices | TypeScript 慣用句・Null Safety・型推論・ジェネリクス・Utility Types・strict mode     |
| rn-clean-architecture     | Clean Architecture・UI/Domain/Data 層分離・Custom Hooks・Repository/Service パターン  |
| rn-ui-patterns            | React Native UIコンポーネント・StyleSheet・FlatList・アクセシビリティ                 |
| react-query-patterns      | TanStack Query・useQuery/useMutation・キャッシュ戦略・楽観的更新                      |
| rn-testing                | Jest・@testing-library/react-native・モック・TDD サイクル                             |
| rn-state-management       | Zustand/Redux Toolkit・Context API・状態設計・非同期状態                              |
| rn-navigation             | React Navigation・スタック/タブ/ドロワー・ディープリンク・型安全なルーティング        |
| rn-performance            | React.memo・useCallback/useMemo・FlatList最適化・Hermes・Reanimated                   |
| security-patterns         | React Native セキュリティ・AsyncStorage暗号化・証明書ピニング・SecureStore            |
| architecture-patterns     | SOLID・DDD・ADR・モジュール境界・レイヤードアーキテクチャ                             |

> プロジェクトの `.claude/skills/` に配置されたスキルも Claude Code が自動検出し、上記と同様に利用可能になる。

---

## Hook 自動ガードレール

以下のフックが自動的に品質を守る。フック定義は `~/.claude/hooks/` を参照:

| Hook                     | Trigger | Action                                                                                        |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| block-unnecessary-files  | Write前 | プロジェクトルートへの `.md`/`.txt` 作成をブロック（`docs/`, `openspec/` 配下は許可）         |
| detect-console-log       | Write後 | `.ts`/`.tsx` 内の `console.log`/`console.debug` を警告（テストファイル除外）                  |
| require-tmux-for-builds  | Bash前  | `npx react-native run-android` 等の長時間ビルドを tmux 外で実行するのをブロック               |
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

Domain Skills は Auto-Discovery により自動起動されるが、サブエージェント委譲時は以下の推奨マッピングを参照してスキル名を明示指定する。

| ドメイン判定 | 適用スキル名 |
|---|---|
| `.ts`/`.tsx` 全般 | `test-driven-development`, `verification-before-completion`, `iterative-retrieval`, `typescript-best-practices` |
| UI 層（`components/`, `screens/`, `*.tsx`） | 上記 + `rn-ui-patterns`, `rn-clean-architecture` |
| Domain 層（`domain/`, `usecases/`, `hooks/`） | 上記 + `rn-clean-architecture` |
| Data 層（`data/`, `repositories/`, `services/`） | 上記 + `rn-clean-architecture`, `react-query-patterns` |
| 状態管理（`store/`, `*Store.ts`, `*Slice.ts`） | 基本 + `rn-state-management` |
| Navigation（`navigation/`, `*Navigator.tsx`） | 基本 + `rn-navigation` |
| テスト（`*.test.ts`, `*.test.tsx`, `__tests__/`） | `rn-testing`, `test-driven-development` |
| セキュリティ関連 | `security-patterns` |
| アーキテクチャ設計 | `architecture-patterns`, `rn-clean-architecture` |
| デバッグ / エラー修正 | `systematic-debugging`, `iterative-retrieval` |
| パフォーマンス最適化 | `rn-performance` |

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

### Main Agent の責務（/implement 実行時）

- 仕様書・設計書・タスクリスト（`.md` ファイル）の読み込み
- タスク分析・依存関係に基づくバッチ構成
- モード選択（`--teams`/`--agents` 引数に基づく分岐）
- Teams モード: TeamCreate でチーム作成・タスク割り当て・監視・TeamDelete
- Sub Agents モード: `Task(implementer)` を直接起動（並列 or 順次）
- 検証コマンド実行（`npx jest`, `npx tsc --noEmit`, `npx eslint src`, `git diff --stat`）
- 検証失敗時: `Task(build-error-resolver)` に委譲（最大3回リトライ）
- スペック準拠確認: `Task(spec-compliance-reviewer)` に委譲
- `git diff --stat` で変更概要確認・ユーザーに報告

### Main Agent が行わないこと（厳守）

| 禁止操作 | 理由 | 代替手段 |
|---|---|---|
| Write / Edit で実装ファイルを編集 | コンテキスト汚染 | Task(implementer) / teammate に委譲 |
| 実装ファイル（`.ts`/`.tsx`）の Read | コンテキスト膨張 | Explore Agent / implementer に委譲 |
| SKILL.md の Read | コンテキスト汚染 | スキル名のみ決定、Claude Code が自動解決 |
| `git diff`（ファイル内容表示） | 大量 diff でコンテキスト圧迫 | `git diff --stat` のみ許可 |

---

## Escalation Rules

`~/.claude/rules/core-essentials.md` に統合済み。エスカレーションポリシー（必須/状況依存/自律判断OK）を参照。

---

## Personal Preferences

### Code Style

- TypeScript + ESLint + Prettier 準拠（インデント2スペース、命名規則：コンポーネント PascalCase、変数/関数 camelCase）
- 既存のコード規約・パターンを踏襲
- コードやコメントにエモジを入れない
- 略語禁止（`ctx` → `context`, `repo` → `repository`）
- `any` 型禁止（`unknown` を使い型ガードで絞る）
- `as` キャスト最小化（型推論を活用する）

### Git

- コミット形式: `<type>(<scope>): <日本語の説明>`
- PR説明は日本語
- 小さく焦点を絞ったコミット
- コミット前に `git diff` でレビュー

### Quality

- テスト前にコードを書かない（TDD: RED → GREEN → REFACTOR）
- テストをスキップ・無効化して通過させない
- TODO/モック/スタブを本実装に残さない
- `npx tsc --noEmit` と `npx jest` と `npx eslint src` をコミット前に実行

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
