---
name: skill-phase-formatter
description: "Use when splitting a domain Skill into Phase-Aware File Structure (SKILL.md / design.md / constraints.md). Defines the splitting criteria, procedures, sync procedures, and validation rules. Invoked by /skill-format command or manually when restructuring domain Skills."
disable-model-invocation: true
---

# Skill Phase Formatter

ドメイン Skill を Phase-Aware File Structure に分割・同期するための方法論。

## SSOT 原則

- SKILL.md がマスター（Single Source of Truth）
- design.md / constraints.md は SKILL.md の**部分集合**
- 派生ファイルにのみ存在する知識は**禁止**
- 新しい知識はまず SKILL.md に追加し、必要に応じて派生ファイルに反映

## 分割基準

### constraints.md に含めるもの

- 技術的にできないこと（ランタイム制約、API 制限、互換性制約）
- 数値的な上限・下限
- 前提条件
- 禁止事項（理由なし、事実のみ）
- 目安: 20-30行以内

### design.md に含めるもの

- パターン選択の判断基準
- トレードオフの説明
- 非機能要件の考慮事項
- アンチパターンとその理由
- 目安: 80-120行以内

### design.md に含めないもの

- 具体的なコード例（コードブロック）
- ステップバイステップの実装手順
- API リファレンス的な詳細

### ヘッダー規約

- constraints.md: `# <skill-name>: 技術的制約`
- design.md: `# <skill-name>: 設計ガイダンス`

## 分割手順

1. 対象 Skill の SKILL.md を全文読み込む
2. 技術的制約に該当する記述を抽出 → constraints.md として整形
3. 設計指針・パターン選択基準に該当する記述を抽出 → design.md として整形
4. 抽出した内容が SKILL.md の部分集合であることを確認
5. 行数制限を確認（constraints.md ≤ 30行、design.md ≤ 120行）
6. design.md にコードブロックが含まれていないことを確認

## 同期手順

SKILL.md が更新された場合、派生ファイルを同期する:

1. SKILL.md の変更差分を確認
2. 変更が制約に影響するか判定 → 影響あれば constraints.md を更新
3. 変更が設計指針に影響するか判定 → 影響あれば design.md を更新
4. 更新後の派生ファイルが SKILL.md の部分集合であることを再確認
5. 行数制限を再確認
6. design.md / constraints.md が存在しない Skill は同期対象外（新規生成は行わない）

## 検証項目

分割後に以下を全て確認する:

- [ ] constraints.md が30行以内である
- [ ] design.md が120行以内である
- [ ] design.md にコードブロック（` ``` `）が含まれていない
- [ ] constraints.md の全内容が SKILL.md に存在する（部分集合）
- [ ] design.md の全内容が SKILL.md に存在する（部分集合）
- [ ] constraints.md のヘッダーが `# <skill-name>: 技術的制約` である
- [ ] design.md のヘッダーが `# <skill-name>: 設計ガイダンス` である

## 分割対象の判定

以下に該当する Skill は分割**対象外**:

- 方法論 Skill（フェーズ固有の知識差がない）
- ユーティリティ Skill
- 50行以下の軽量 Skill
- テスト専用 Skill
- UI/デザイン専用 Skill（実装寄りの知識が主体）

## Applicability

- **フェーズ**: documentation, design, spec（Skill のメンテナンス時）
- **ドメイン**: universal（全ドメイン Skill に適用）
