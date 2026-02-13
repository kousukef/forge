---
name: verification-before-completion
description: "Use when completing any task or about to declare work done. Requires proof-based verification with actual test execution results pasted as evidence. MUST be invoked before declaring ANY task complete. Never skip."
disable-model-invocation: true
---

# 完了前検証スキル

## 原則

「動いていると思う」は証明ではない。
**実際のテスト実行結果を貼り付けて**完了を証明すること。

## 完了チェックリスト

- [ ] 全てのユニットテストがパスしている（実行結果を貼付）
- [ ] 型チェックがパスしている（`tsc --noEmit`の結果を貼付）
- [ ] ビルドが成功している（`npm run build`の結果を貼付）
- [ ] 新しい警告が出ていない
- [ ] 仕様書の検証方法が全て確認できている

## 禁止事項

- テストを実行せずに「テストは通るはずです」と言うこと
- エラーを無視して「完了」と宣言すること
- 一部のテストをスキップすること

## Applicability

- **フェーズ**: ALL（全フェーズの完了境界で適用）
- **ドメイン**: universal（全技術ドメインに適用）
