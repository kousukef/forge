---
name: strategic-compact
description: "Use when context window exceeds 80%, switching between major tasks, transitioning development phases, or after processing large outputs. Provides strategic compaction timing to prevent losing critical context."
disable-model-invocation: true
---

# 戦略的コンパクションスキル

## 原則

コンテキストウィンドウが80%を超えたら、論理的な境界でコンパクションを実行する。
自動コンパクションに任せず、手動で最適なタイミングを選ぶ。

## コンパクションのタイミング

- タスクの完了時（次のタスクに移る前）
- フェーズの切り替え時（リサーチ → 実装 → レビュー）
- 大量のテスト出力の後

## 保持すべきコンテキスト

- 現在のタスクの仕様
- 直前のタスクの結果（回帰防止）
- プロジェクト構造の概要
- 未解決の問題

## 廃棄してよいコンテキスト

- 完了したタスクの詳細な実装過程
- 読み込んだがもう参照しないファイル内容
- 解決済みのエラーログ

## Applicability

- **フェーズ**: ALL（全フェーズで適用）
- **ドメイン**: universal（全技術ドメインに適用）
