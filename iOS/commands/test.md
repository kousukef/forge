---
description: "テストスイートを実行し、カバレッジと結果を検証する。修正が機能することを証明するまで完了としない"
disable-model-invocation: true
---

# /test コマンド

## 目的

テストスイートを実行し、結果を検証する。修正が機能することを証明するまで完了としない。

## ワークフロー

### Step 1: テスト実行

以下を順番に実行する：

1. **ユニットテスト実行**:
   - SPM プロジェクト: `swift test`
   - Xcode プロジェクト: `xcodebuild test -scheme [Scheme] -destination 'platform=iOS Simulator,name=iPhone 16'`
2. **Lint チェック**: `swiftlint lint`
3. **ビルド検証**: `swift build` または `xcodebuild build -scheme [Scheme]`
4. **UIテスト実行**（該当する場合）: `xcodebuild test -scheme [Scheme] -testPlan UITests -destination 'platform=iOS Simulator,name=iPhone 16'`
5. **カバレッジ確認**: 80%以上を目標

### Step 2: 結果分析

- 全てパスした場合: 結果レポートを出力
- 失敗がある場合: 根本原因を分析

### Step 3: 失敗時の修正

1. 失敗したテストの根本原因を分析
2. 修正を提案
3. 修正を適用
4. **再度全テストを実行して回帰がないことを確認**
5. 全てパスするまで繰り返し

## verification-before-completion

- テストが全てパスするまで「完了」と宣言しない
- 失敗したテストがある場合、根本原因を分析して修正を提案
- 修正後に再度全テストを実行して回帰がないことを確認
- 「テストがパスしました」ではなく、**テスト実行結果を実際に貼り付けて**証明する

## 結果レポート形式

```markdown
# テスト結果レポート

## サマリー
- ユニットテスト: ✅ XX passed / ❌ XX failed
- SwiftLint: ✅ / ❌
- ビルド: ✅ / ❌
- UIテスト: ✅ XX passed / ❌ XX failed
- カバレッジ: XX%

## 実行結果

### ユニットテスト
[実行結果を貼付]

### SwiftLint
[実行結果を貼付]

### ビルド
[実行結果を貼付]

### UIテスト
[実行結果を貼付]

## 失敗分析（該当する場合）
### [テスト名]
- **原因**: [根本原因]
- **修正**: [修正内容]
```

## 禁止事項

- テストを実行せずに「テストは通るはずです」と言うこと
- エラーを無視して「完了」と宣言すること
- 一部のテストをスキップすること
- テストを無効化して通過させること（`XCTSkip` の安易な使用）
- `// swiftlint:disable` でLintエラーを隠すこと
