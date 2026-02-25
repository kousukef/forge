---
name: iterative-retrieval
description: "Use when starting work as a subagent, exploring unfamiliar code, or gathering codebase information. Provides Glob-Grep-Read incremental context-fetching strategy. MUST be invoked by all subagents before diving into work."
disable-model-invocation: true
---

# 段階的コンテキスト取得スキル

## 原則

サブエージェントはコンテキストが限られている。
必要な情報を一度に全て取得しようとせず、段階的に取得する。

## 手順

1. まず、タスクに必要なファイルのリストを推定
2. `Glob`で候補ファイルを検索
3. `Grep`でキーワードを含むファイルを絞り込み
4. `Read`で必要なファイルだけを読み込み
5. 不足があれば追加で検索

## アンチパターン

- プロジェクト全体を一度に読み込む
- 関係ないファイルまで読む
- ファイルの存在を確認せずにパスを推測する

## Applicability

- **フェーズ**: ALL（全フェーズで適用）
- **ドメイン**: universal（全技術ドメインに適用）
