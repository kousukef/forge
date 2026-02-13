---
name: test-driven-development
description: "Use when writing new code, fixing bugs, or refactoring during implementation. Enforces strict RED-GREEN-REFACTOR TDD cycle. MUST be invoked before writing any production code. Applies universally across all technology domains."
disable-model-invocation: true
---

# TDD（テスト駆動開発）スキル

## 絶対ルール

テストの前にプロダクションコードを書くことは**禁止**。
テスト前に書かれたコードは**削除してやり直す**。例外なし。

## サイクル

1. **RED**: 失敗するテストを書く
   - テストが失敗することを確認（`npx vitest run [テストファイル]`）
   - テストが正しい理由で失敗していることを確認

2. **GREEN**: テストを通す最小限のコードを書く
   - テストをパスさせることだけを考える
   - 美しさやパフォーマンスは後
   - ハードコードでもOK

3. **REFACTOR**: コードを改善する
   - テストが通ったまま改善
   - 重複の排除
   - 命名の改善
   - パフォーマンスの改善

## カバレッジ目標

- 全体: 80%以上
- 新規コード: 90%以上
- ユーティリティ関数: 100%

## このスキルが適用されるとき

- 新しい機能の実装時
- バグ修正時（まず失敗するテストで再現してから修正）
- リファクタリング時（既存テストが通ることを確認してから変更）

## Applicability

- **フェーズ**: implementation, debug
- **ドメイン**: universal（全技術ドメインに適用）
