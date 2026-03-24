---
category: pattern
stack: general
severity: important
date: 2026-03-24
tags: handle-pr-review, pre-push-verification, ci-failure-prevention, workflow-automation
artifact-targets: commands
---

# /handle-pr-review にコミット前検証ステップを追加

## 何が起きたか

`/handle-pr-review` コマンドでレビュー指摘を修正後、lint/format/test を実行せずに push して CI が失敗するケースが繰り返し発生していた。通常の Forge ワークフロー（brainstorm -> spec -> implement -> review -> test）では品質チェックが各フェーズで走るが、`/handle-pr-review` はこのフローの外で動作するため、検証ステップが欠落していた。

## なぜ起きたか

`/handle-pr-review` はメインワークフローの外で動作するユーティリティコマンドであり、設計時に push 前検証が組み込まれていなかった。検証は実行者の注意力に依存しており、構造的な保証がなかった。

## どう解決したか

`commands/handle-pr-review.md` に新 Step 4（Pre-commit Verification）を挿入した:
- 検証コマンドの情報源: project.md -> CLAUDE.md -> 動的検出の3段フォールバック
- 実行順序: format -> lint -> type-check -> test（速い順に失敗）
- 自動修正フロー: auto-fix -> 原因推論 -> 修正試行（最大3回リトライ）
- gate-git-push フックとの責務分離を注記

変更は1ファイル（+85/-26）で完結し、spec-validator で全11項目 PASS、レビュー指摘0件を達成した。

## 教訓

1. **メインワークフロー外のコマンドに検証漏れが起きやすい**: `/handle-pr-review` のようなユーティリティコマンドは、メインフロー（brainstorm -> ... -> test）の品質ゲートを通過しないため、独自の検証ステップが必要。新しいユーティリティコマンドを追加する際は push/commit 前の検証ステップを設計時に検討すべき
2. **spec-validator は小さな変更でも価値がある**: 1ファイルの Markdown 変更でも、spec-validator が REQ-004 の NFR 矛盾（汎用 Bash 許可 vs 任意コマンド実行禁止）を検出した。修正ループ1往復で解消
3. **既存パターンの踏襲が効率的**: `/review` Step 0、`/implement` Step 5 の検証パターンを参考にすることで、一貫性のある設計ができた
4. **gate-git-push との責務分離テーブル**: 類似概念の差分テーブル（2026-03-23 の教訓）を適用し、コマンド内検証とフックの責務境界を明確化した

## 防止策と更新提案

### コマンドフロー更新
- [x] `commands/handle-pr-review.md` に Pre-commit Verification ステップを追加済み

### ルール更新
- [ ] 新しいユーティリティコマンド（メインワークフロー外）を追加する際は、push/commit 前の検証ステップを必須検討事項とする規約を `reference/` に追加を検討
