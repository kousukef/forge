# Forge Mobile

**モバイル開発全プラットフォーム対応の Claude Code 統合ワークフローシステム**

Forge Mobile は、設計から実装・レビュー・テスト・学習まで、モバイルアプリ開発のライフサイクル全体を
Claude Code のスラッシュコマンド・エージェント・スキル・フックで自動化するモノレポです。

```
forge_mobile/
├── Android/        # Android (Kotlin / Jetpack Compose)
├── iOS/            # iOS (Swift / SwiftUI)
├── Flutter/        # Flutter (Dart / BLoC / Riverpod)
└── ReactNative/    # React Native (TypeScript / Zustand)
```

---

## プラットフォーム概要

### Android

**技術スタック**: Kotlin / Jetpack Compose / MVVM + Clean Architecture / Coroutines & Flow / Dagger・Hilt / Room / Retrofit

| コマンド | 用途 |
|---------|------|
| `/brainstorm` | ソクラテス式対話で要件を深掘り |
| `/spec` | リサーチ → デルタスペック・設計・タスクリスト生成 |
| `/implement` | TDD 駆動の実装（RED → GREEN → REFACTOR） |
| `/review` | 7 専門レビュアー並列レビュー（kotlin-reviewer, compose-ui-reviewer, android-architecture-reviewer 等） |
| `/test` | `./gradlew testDebugUnitTest` / `./gradlew lint` / `./gradlew ktlintCheck` |
| `/compound` | 学びを記録 + スペックマージ + アーカイブ |
| `/ship` | 全パイプラインの完全自律実行 |

詳細: [Android/README.md](Android/README.md)

---

### iOS

**技術スタック**: Swift / SwiftUI / MVVM + Clean Architecture / Swift Concurrency (async/await, Actor) / Swinject / XCTest・XCUITest

| コマンド | 用途 |
|---------|------|
| `/brainstorm` | ソクラテス式対話で要件を深掘り |
| `/spec` | リサーチ → デルタスペック・設計・タスクリスト生成 |
| `/implement` | TDD 駆動の実装（RED → GREEN → REFACTOR） |
| `/review` | 5 専門レビュアー並列レビュー（swift-reviewer, swiftui-reviewer, ios-architecture-reviewer, ios-performance-reviewer, ios-test-reviewer） |
| `/test` | `swift test` / `xcodebuild test` / `swiftlint lint` |
| `/compound` | 学びを記録 + スペックマージ + アーカイブ |
| `/ship` | 全パイプラインの完全自律実行 |

**iOS 固有のレビュアー:**

| レビュアー | 検査対象 |
|-----------|---------|
| security-sentinel | Keychain・ATS・証明書ピニング・Secure Enclave |
| ios-architecture-reviewer | MVVM + Clean Architecture・`@StateObject`・UseCase/Repository |
| swiftui-reviewer | SwiftUI 状態管理（@Binding/@State/@EnvironmentObject）・副作用処理 |
| ios-performance-reviewer | retain cycle・メインスレッド処理・Actor isolation・Core Data 最適化 |
| swift-reviewer | Swift 慣用句・Sendable・@MainActor・SwiftLint 準拠 |
| ios-test-reviewer | XCTest カバレッジ・async テスト・XCUITest |

---

### Flutter

**技術スタック**: Dart / Flutter Widgets / Clean Architecture + BLoC・Riverpod / get_it / flutter_test・mocktail

| コマンド | 用途 |
|---------|------|
| `/brainstorm` | ソクラテス式対話で要件を深掘り |
| `/spec` | リサーチ → デルタスペック・設計・タスクリスト生成 |
| `/implement` | TDD 駆動の実装（RED → GREEN → REFACTOR） |
| `/review` | 5 専門レビュアー並列レビュー（dart-reviewer, bloc-riverpod-reviewer, flutter-architecture-reviewer, flutter-performance-reviewer, flutter-test-reviewer） |
| `/test` | `flutter test` / `dart analyze` / `dart format --output=none --set-exit-if-changed .` |
| `/compound` | 学びを記録 + スペックマージ + アーカイブ |
| `/ship` | 全パイプラインの完全自律実行 |

**Flutter 固有のレビュアー:**

| レビュアー | 検査対象 |
|-----------|---------|
| security-sentinel | flutter_secure_storage・ディープリンク検証・HTTPS 強制 |
| flutter-architecture-reviewer | Clean Architecture・BLoC/Cubit イベント設計・Widget ツリー分離 |
| bloc-riverpod-reviewer | BlocProvider/BlocBuilder の正しい使い方・Riverpod Provider 設計・副作用処理 |
| flutter-performance-reviewer | `const` Widget 活用・不要な setState 防止・ListView.builder 最適化 |
| dart-reviewer | Dart null safety・sealed class・extension・dart format 準拠 |
| flutter-test-reviewer | flutter_test カバレッジ・testWidgets・bloc_test・mocktail |

---

### React Native

**技術スタック**: TypeScript / React Native Components / Zustand・Redux Toolkit / TanStack Query / Jest・@testing-library/react-native

| コマンド | 用途 |
|---------|------|
| `/brainstorm` | ソクラテス式対話で要件を深掘り |
| `/spec` | リサーチ → デルタスペック・設計・タスクリスト生成 |
| `/implement` | TDD 駆動の実装（RED → GREEN → REFACTOR） |
| `/review` | 5 専門レビュアー並列レビュー（typescript-reviewer, react-native-ui-reviewer, rn-architecture-reviewer, rn-performance-reviewer, rn-test-reviewer） |
| `/test` | `npx jest` / `npx tsc --noEmit` / `npx eslint . --ext .ts,.tsx` |
| `/compound` | 学びを記録 + スペックマージ + アーカイブ |
| `/ship` | 全パイプラインの完全自律実行 |

**React Native 固有のレビュアー:**

| レビュアー | 検査対象 |
|-----------|---------|
| security-sentinel | react-native-keychain・SSL ピニング・WebView XSS・Bridge セキュリティ |
| rn-architecture-reviewer | Feature-based 構成・Zustand/Redux Store 設計・TanStack Query クエリ設計 |
| react-native-ui-reviewer | StyleSheet・アクセシビリティ（accessibilityLabel）・Platform.OS 分岐 |
| rn-performance-reviewer | useMemo/useCallback/React.memo の適切な使用・FlatList 最適化・Hermes 活用 |
| typescript-reviewer | TypeScript strict 準拠・any 型排除・型ガード・共通型定義 |
| rn-test-reviewer | Jest カバレッジ・@testing-library/react-native・renderHook・Detox E2E |

---

## 共通ワークフロー

全プラットフォームで同じコマンドパイプラインを使用します。

```
/brainstorm → /spec → [ユーザー承認] → /implement → /review → /test → /compound
```

または一発実行:

```
/ship <機能の説明>
```

### OpenSpec 構造

全プラットフォームで共通のディレクトリ構造で仕様を管理します。

```
<platform>/openspec/
├── project.md              # プロジェクトコンテキスト
├── specs/                  # 累積スペック（マージ済み）
└── changes/
    ├── <change-name>/      # アクティブな変更
    │   ├── proposal.md     # /brainstorm で生成
    │   ├── design.md       # /spec で生成
    │   ├── tasks.md        # /spec で生成
    │   └── specs/          # デルタスペック
    └── archive/            # 完了した変更
```

---

## セットアップ

### 前提条件

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- 以下の MCP サーバーが設定済み:
  - **Context7 MCP** -- フレームワーク公式ドキュメント取得用
  - **Web Search MCP**（Brave Search MCP または Tavily MCP）-- Web 検索用

### 使用するプラットフォームのインストール

使用したいプラットフォームのディレクトリの内容を `~/.claude/` にコピーします。

```bash
# 例: iOS Forge をインストールする場合
cd forge_mobile/iOS
rsync -av --exclude='.git' --exclude='openspec' ./ ~/.claude/

# 例: Flutter Forge をインストールする場合
cd forge_mobile/Flutter
rsync -av --exclude='.git' --exclude='openspec' ./ ~/.claude/

# 例: React Native Forge をインストールする場合
cd forge_mobile/ReactNative
rsync -av --exclude='.git' --exclude='openspec' ./ ~/.claude/

# 例: Android Forge をインストールする場合（既存）
cd forge_mobile/Android
rsync -av --exclude='.git' --exclude='openspec' ./ ~/.claude/
```

> **注意**: 既に `~/.claude/settings.json` が存在する場合は、手動でマージしてください。
> 各プラットフォームディレクトリの `settings.template.json` を参照してください。

---

## 共通コンポーネント（全プラットフォーム共通）

各プラットフォームに以下の共通エージェントが含まれています:

### リサーチエージェント（`agents/research/`）

| エージェント | 役割 |
|-------------|------|
| stack-docs-researcher | Context7 MCP 経由で公式ドキュメントのベストプラクティスを取得 |
| web-researcher | Web Search MCP で最新記事・落とし穴・参考実装を調査 |
| codebase-analyzer | 既存コードのパターン・影響範囲・OpenSpec スペックを分析 |
| compound-learnings-researcher | `docs/compound/` から過去の学び・教訓を抽出 |

### スペックエージェント（`agents/spec/`）

| エージェント | 役割 |
|-------------|------|
| spec-writer | リサーチ結果を統合し design.md / tasks.md / delta-spec を生成 |
| spec-validator | 敵対的仕様検証（エラーパス・境界値・非機能要件の網羅性チェック） |

### Context Isolation Policy

全プラットフォーム共通の 2 層アーキテクチャで、Main Agent のコンテキストウィンドウを保護します。

```
Main Agent（オーケストレーション専任）
  │ .md ファイルの読み込みのみ
  │
  ├─ [Teams モード] TeamCreate → implementer × N + reviewers
  │
  └─ [Sub Agents モード] Task(implementer) × N（並列実行）
```

**Main Agent の禁止事項**: 実装ファイルの Read / Write / Edit、SKILL.md の Read

---

## ライセンス

MIT
