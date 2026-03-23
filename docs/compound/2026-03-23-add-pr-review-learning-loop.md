---
category: pattern
stack: general
severity: important
date: 2026-03-23
tags: compound-learning, handle-pr-review, learning-loop, markdown-only, design-quality
artifact-targets: spec-template, commands, agents, rules
---

# PRレビュー学習ループ追加で実証された複利効果と新種別 review-gap の発見

## 何が起きたか

`/handle-pr-review` コマンドに Step 7「学習ループ」を追加する変更を実施した。変更対象は `commands/handle-pr-review.md` の1ファイルのみ（186行追加）。全8タスクでギャップ検出ゼロ、レビュー P1/P2 ゼロという結果を達成した。

## なぜ起きたか

過去8回の compound learning で蓄積された教訓（横断整合性テーブル、横断チェックタスク、既存パターン準拠、argument-hint 必須、過去の学びの設計段階反映）を design.md に体系的に反映した。特に:
- 9件の過去の教訓を design.md に明示的に列挙
- `/review` Step 7 との責務区別テーブルを設計段階で作成
- `arguments` 形式の一貫性分析を事前実施

## どう解決したか

問題が発生しなかったため「解決」は不要だった。唯一の新発見は review-gap（README.md のコマンド概要更新が Document Sync Rules の明示的対象外）。

## 教訓

1. **1ファイル変更でも仕様品質が高ければ全タスクで曖昧性ゼロを達成できる**: 概念間整合性（責務区別テーブル、引数形式分析）の事前設計が鍵
2. **過去の学びを design.md に列挙することで複利効果が発現する**: 9件の教訓が implementer の解釈不要な仕様を生成
3. **Markdown-only 変更はレビュアー起動の最適化が効く**: リスクレベル LOW → doc-sync-reviewer のみ起動でコスト回避
4. **類似概念の差分テーブルは混同防止に有効**: `/review` Step 7 vs `/handle-pr-review` Step 7 の4軸差分テーブル
5. **閾値なし設計（常時記録+ユーザー承認）がリサーチで裏付けられた**: Forge の設計方針に合致
6. **README.md のコマンド概要更新は Document Sync Rules の対象外だが実質的に必要**: 新種別 review-gap として記録

## 防止策と更新提案

### ルール更新
- [ ] Document Sync Rules に「commands/ 配下の変更でコマンドの機能範囲が拡大した場合、README.md のコマンド概要更新を検討する」を追加検討（review-gap 初出のため記録のみ）

### スキル更新
- 更新なし

### フック更新
- 更新なし

### エージェント定義更新
- 更新なし

### コマンドフロー更新
- 更新なし

### 仕様テンプレート更新
- 更新なし
