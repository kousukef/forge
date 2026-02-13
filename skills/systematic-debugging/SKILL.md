---
name: systematic-debugging
description: "Use when encountering bugs, test failures, build errors, or unexpected behavior. Provides 4-phase process: Reproduce, Root-cause, Fix, Defend. MUST be invoked instead of making random code changes when something fails."
disable-model-invocation: true
---

# 体系的デバッグスキル

## 原則

「体系的アプローチ: 修正に15〜30分。ランダムな修正: 2〜3時間の試行錯誤。」

ランダムにコードを変えてみるのは**デバッグではない**。

## 4フェーズプロセス

### Phase 1: 再現
- バグを確実に再現できる手順を確立
- 最小再現ケースを作成
- 再現テストを書く

### Phase 2: 原因特定
- 仮説を立てる（最大3つ）
- 各仮説を検証する実験を設計
- ログ、ブレークポイント、テストで仮説を検証
- 根本原因を1つに絞る

### Phase 3: 修正
- 根本原因に対する最小限の修正を作成
- 修正が根本原因を解消することを確認
- 副作用がないことを確認

### Phase 4: 防御
- 回帰テストを追加
- 同種のバグを防ぐガードを検討
- compound docに記録

## Applicability

- **フェーズ**: debug, implementation, test
- **ドメイン**: universal（全技術ドメインに適用）
