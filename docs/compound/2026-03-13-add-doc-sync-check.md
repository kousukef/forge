---
category: pattern
stack: general
severity: important
date: 2026-03-13
tags: doc-sync, v-model, review, implement, setup, workflow
artifact-targets: commands, agents, spec-template
---

# ドキュメント同期チェックの導入パターン

## 何が起きたか

ドキュメント同期漏れが過去5回の開発セッション（2026-02-18, 2026-02-22, 2026-02-24, 2026-03-04, 2026-03-08）で繰り返し発生していた。今回、V-Model の左辺（/implement Step 5.5）と右辺（/review L0 + doc-sync-reviewer）の両方にドキュメント同期チェックを導入し、/setup でルール設定の対話的ステップを追加した。

## なぜ起きたか

1. ドキュメント更新が手動・暗黙的な責務であり、ワークフローに組み込まれていなかった
2. 実装完了後の検証ステップにドキュメント整合性チェックが含まれていなかった
3. プロジェクトごとのドキュメント構成が異なり、汎用的なチェックルールが存在しなかった

## どう解決したか

1. **CLAUDE.md ベースのルール定義**: 自然言語で `## Document Sync Rules` セクションに記述。LLM が解釈する方式
2. **2段階チェック構造**: L0（機械的な更新有無フラグ）+ doc-sync-reviewer（セマンティックな整合性・品質チェック）
3. **/implement の自動更新**: implementer に doc-sync タスクとして委譲し、コミットに含める
4. **/setup の対話的設定**: ディレクトリ自動検出 + マッピング設定で具体的なルールを生成

## 教訓

1. **既存パターン準拠が仕様精度を高める**: review-aggregator.md パターンを踏襲して doc-sync-reviewer を作成した結果、interpretation での曖昧性がゼロだった
2. **過去の学びの統合が設計品質を向上させる**: design.md の「過去の学び」セクションが横断整合性テーブル、横断チェックタスク等の設計判断を効果的にガイドした
3. **形式統一テーブルは設計段階で作るべき**: スキップログ形式（implement: `doc-sync:` vs review: `L0 (doc-sync):`）の不統一がレビューで初めて検出された。delta-spec に「用語・形式統一テーブル」を先制的に含めることで回避可能
4. **ドキュメント同期漏れは5回蓄積した繰り返しパターン**: 今回の自動化で根本対策を実施

## 防止策と更新提案

### ルール更新
- [ ] 該当なし（今回の変更自体がルール層の改善）

### スキル更新
- [ ] 該当なし

### フック更新
- [ ] 該当なし

### エージェント定義更新
- [x] agents/review/doc-sync-reviewer.md を新規追加済み

### コマンドフロー更新
- [x] commands/implement.md に Step 5.5 追加済み
- [x] commands/review.md に L0 チェック追加済み
- [x] commands/setup.md にステップ6.5 追加済み

### 仕様テンプレート更新
- [ ] delta-spec テンプレートに「用語・形式統一テーブル」セクション追加を検討（設計段階で形式不統一を防止）
