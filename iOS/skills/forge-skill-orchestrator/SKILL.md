---
name: forge-skill-orchestrator
description: "Use at the START of every task, before writing any code, running tests, debugging, reviewing, or designing. This skill determines which methodology and domain skills must be invoked. MUST be invoked before any implementation, debugging, review, testing, or specification work begins."
---

# Forge Skill Orchestrator（iOS版）

## 1% ルール

**1% でも適用される可能性があれば、そのスキルを呼び出せ。**

スキルの呼び出しコストは低い。呼び出さなかったことによる品質低下コストは高い。
迷ったら呼び出す。迷わなくても呼び出す。

## フェーズ検出テーブル

現在のコマンド名または作業内容からフェーズを判定する:

| コマンド / 作業内容 | フェーズ |
|---|---|
| `/brainstorm` | design |
| `/spec` | spec |
| `/implement` | implementation |
| `/review` | review |
| `/test` | test |
| `/compound` | documentation |
| `/ship` | all（フェーズ遷移あり） |
| バグ修正・エラー対応 | debug |
| コード変更・新機能追加 | implementation |
| コードレビュー依頼 | review |
| テスト実行・修正 | test |
| 設計・要件整理 | design / spec |

## ドメイン検出テーブル

対象ファイルのパスパターンからドメインを判定する:

| ファイルパスパターン | ドメイン |
|---|---|
| `**/presentation/**/*.swift`, `**/*View.swift`, `**/*ViewController.swift` | ios-ui |
| `**/domain/**/*.swift`, `**/*UseCase.swift` | ios-domain |
| `**/data/**/*.swift`, `**/*Repository*.swift`, `**/*DataSource.swift` | ios-data |
| `**/*+CoreData.swift`, `**/*.xcdatamodeld`, `**/*SwiftData*.swift` | ios-coredata |
| `**/*API.swift`, `**/*Service.swift`, `**/network/**/*.swift` | ios-network |
| `**/di/**/*.swift`, `**/*Container.swift`, `**/*Assembly.swift` | ios-di |
| `**/*Tests.swift`, `**/*UITests.swift`, `**/Tests/**/*.swift` | ios-testing |
| `**/*.swift` (上記以外) | ios-swift |
| 複数ドメインにまたがる場合 | 該当する全ドメインの Union |

## Methodology Skills レジストリ（universal -- 全ドメイン共通）

| Skill 名 | 適用フェーズ | トリガー条件 |
|---|---|---|
| `test-driven-development` | implementation, debug | コードを書く前。新機能実装、バグ修正、リファクタリング時 |
| `systematic-debugging` | debug, implementation, test | バグ、テスト失敗、ビルドエラー、予期しない動作の発生時 |
| `verification-before-completion` | ALL（完了境界） | タスク完了宣言の直前。「完了」と言う前に必ず |
| `iterative-retrieval` | ALL | サブエージェントとして起動された時。コードベース探索の開始時 |
| `strategic-compact` | ALL | コンテキストウィンドウ 80% 超過時。フェーズ切り替え時。大量出力処理後 |
| `dispatching-parallel-agents` | debug, implementation | 3つ以上の独立した失敗・タスクが存在し、並列調査が可能な時 |

> **Domain Skills について**: Domain Skills は Auto-Discovery 方式に移行済み。
> プロジェクト固有スキル（`<project>/.claude/skills/`）およびグローバルスキル（`~/.claude/skills/`）に
> 配置されたドメインスキルは Claude Code が自動検出するため、ここにレジストリとして列挙する必要はない。

## サブエージェント向け指示

サブエージェントには**スキル名**を渡す。Claude Code がスキル名から自動的にスキル内容を解決・読み込みする。

プロンプト記載テンプレート:
```
REQUIRED SKILLS:
- test-driven-development
- iterative-retrieval
- verification-before-completion
- [ドメイン固有スキル名: swift-best-practices, swiftui-patterns 等]
```

## 決定フローチャート

```
START
  │
  ├─ 1. フェーズ判定
  │     └─ コマンド名 or 作業内容 → フェーズ検出テーブル → phases[]
  │
  ├─ 2. ドメイン判定
  │     └─ 対象ファイルパス → ドメイン検出テーブル → domains[]
  │
  ├─ 3. スキル照合
  │     ├─ Methodology Skills: phases[] でレジストリ照合 → matched_methodology[]
  │     └─ Domain Skills: domains[] から Auto-Discovery（Claude Code が自動検出） → matched_domain[]
  │
  ├─ 4. Union
  │     └─ skills_to_invoke = matched_methodology ∪ matched_domain
  │
  ├─ 5. 1% ルール適用
  │     └─ 「本当に除外してよいか？」を各 Skill について確認
  │
  └─ 6. 呼び出し
        ├─ メインセッション: `Skill` ツールで各スキルを名前で呼び出す
        └─ サブエージェント: プロンプトにスキル名を記載（Claude Code が自動解決）
```

## ガイダンステーブル（iOS推奨マッピング）

| ドメイン判定 | 適用スキル名 |
|---|---|
| `.swift` 全般 | `test-driven-development`, `verification-before-completion`, `iterative-retrieval`, `swift-best-practices` |
| UI 層（`*View.swift`, `presentation/`） | 上記 + `swiftui-patterns`, `ios-mvvm-clean-architecture` |
| Domain 層（`*UseCase.swift`, `domain/`） | 上記 + `ios-mvvm-clean-architecture`, `swift-concurrency` |
| Data 層（`*Repository*.swift`, `data/`） | 上記 + `ios-mvvm-clean-architecture` |
| CoreData/SwiftData（`*+CoreData.swift`, `@Model`） | 基本 + `coredata-swiftdata` |
| ネットワーク（`*API.swift`, `network/`） | 基本 + `ios-networking` |
| DI（`*Container.swift`, `di/`） | 基本 + `ios-dependency-injection` |
| テスト（`*Tests.swift`, `*UITests.swift`） | `ios-testing`, `test-driven-development` |
| セキュリティ関連 | `security-patterns` |
| アーキテクチャ設計 | `architecture-patterns`, `ios-mvvm-clean-architecture` |
| デバッグ / エラー修正 | `systematic-debugging`, `iterative-retrieval` |

## 使用例

### 例 1: `/implement` で SwiftUI 画面実装時

1. フェーズ: `implementation`
2. ドメイン: `Sources/Presentation/User/UserProfileView.swift` → `ios-ui`
3. Methodology Skills: `test-driven-development`, `verification-before-completion`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `swiftui-patterns`, `ios-mvvm-clean-architecture`, `swift-best-practices`
5. → 5つの Skill を呼び出し

### 例 2: CoreData マイグレーションを含むデバッグ時

1. フェーズ: `debug`
2. ドメイン: `Sources/Data/CoreData/UserEntity+CoreData.swift` → `ios-coredata`
3. Methodology Skills: `systematic-debugging`, `test-driven-development`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `coredata-swiftdata` 等
5. → 4つの Skill を呼び出し
