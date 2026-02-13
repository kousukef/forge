---
description: "開発から得た学びを文書化し、スペックマージとアーカイブを行い、将来の開発にフィードバックする"
---

# /compound コマンド

## 目的

今回の開発から得た学びを文書化し、デルタスペックを累積スペックにマージし、将来の開発にフィードバックする。

## Skill Activation

`forge-skill-orchestrator` スキルを呼び出し、文書化フェーズに適用される Skill を確認する。

## ワークフロー

1. 今回の開発セッションを振り返り、以下を抽出：
   - うまくいったパターン
   - 失敗して修正したこと
   - 予想外の落とし穴
   - 発見したベストプラクティス
   - 改善できるプロセス

2. `docs/compound/YYYY-MM-DD-<topic>.md` に出力

3. **100ドルルール**を適用：防げたはずの失敗が起きた場合、ルール・スキル・フックの更新を提案する

4. **スペックマージ**: `openspec/changes/<change-name>/specs/` → `openspec/specs/` にマージ
   - ADDED: `openspec/specs/<feature>/spec.md` に追記（なければ新規作成）
   - MODIFIED: 同名要件を置換
   - REMOVED: 該当要件を削除
   - マージ後は ADDED/MODIFIED/REMOVED 接頭辞を除去し累積形式にする

5. **変更アーカイブ**: `openspec/changes/<change-name>/` → `openspec/changes/archive/YYYY-MM-DD-<change-name>/` に移動

## 複利ドキュメント形式

```markdown
---
category: [bug-fix | performance | architecture | security | testing | devops | pattern]
stack: [nextjs | prisma | terraform | gcp | typescript | general]
severity: [critical | important | minor]
date: YYYY-MM-DD
tags: [関連タグをカンマ区切り]
---

# [学びのタイトル]

## 何が起きたか
[状況の説明]

## なぜ起きたか
[根本原因]

## どう解決したか
[解決策]

## 教訓
[将来に向けた教訓。次回同じ状況に遭遇した場合にどうすべきか]

## 防止策
[再発防止のための具体的なアクション]
- [ ] ルールの追加・更新が必要か
- [ ] スキルの追加・更新が必要か
- [ ] フックの追加・更新が必要か
```

## 累積スペック形式

マージ後の `openspec/specs/<feature>/spec.md` は以下の形式になる：

```markdown
# [feature] スペック

## Requirements

### Requirement: [要件名]
[RFC 2119 準拠の記述]

#### Scenario: [シナリオ名]
- **GIVEN** [前提条件]
- **WHEN** [アクション]
- **THEN** [期待結果]
```

## マージルール

- **ADDED** → 累積スペックの末尾に追加
- **MODIFIED** → 同名要件を置換
- **REMOVED** → 該当セクションを削除
- マージ結果をユーザーに提示して確認を得る

## 100ドルルール

防げたはずの失敗（推定コスト100ドル以上）が発生した場合：

1. 失敗の根本原因を特定
2. 以下のいずれかの更新を提案：
   - **ルールの更新**: `.claude/rules/` 配下のルールファイル
   - **スキルの更新**: `.claude/skills/` 配下のスキルファイル
   - **フックの追加**: `.claude/hooks/` 配下のフックスクリプト
3. ユーザーの承認を得て更新を実施
