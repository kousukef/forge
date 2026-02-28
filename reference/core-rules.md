# Forge Core Rules

Forge ワークフローシステムの中核ルール。すべてのプロジェクトで適用される基本ルール。

---

## Rule Priority System

- **CRITICAL**: セキュリティ、データ安全性、本番影響 - 絶対に妥協しない
- **IMPORTANT**: 品質、保守性、専門性 - 強く推奨
- **RECOMMENDED**: 最適化、スタイル、ベストプラクティス - 実用的な時に適用

---

## Phase Discipline

**Priority**: CRITICAL **Triggers**: すべての開発作業

### Forge Workflow

```
/brainstorm → /spec → /implement → /review → /test → /compound
```

### Phase Rules

- **現在のフェーズに適した作業のみ実行**
  - /spec フェーズで実装を始めない
  - /brainstorm フェーズでコードを書かない
  - /implement フェーズで仕様を変更しない

- **フェーズ遷移前に検証必須**
  - テスト通過・型チェック通過を確認
  - すべてのチェックが通過してから遷移

---

## Escalation Rules

**Priority**: CRITICAL **Triggers**: 判断が必要な場面

エスカレーションポリシーの正式定義は `rules/core-essentials.md` を参照。以下は補足的な判断基準:

### Confidence-Based Decision

| Score | Action |
|-------|--------|
| 0.9-1.0 | 自律判断で進行 |
| 0.7-0.9 | ログ記録して進行 |
| 0.5-0.7 | 影響大なら要エスカレーション |
| < 0.5 | 必ずエスカレーション |

---

## Verification Gates

**Priority**: IMPORTANT **Triggers**: コード変更、フェーズ遷移

### Verification Levels

| Level | Checks | Use When |
|-------|--------|----------|
| Quick | Lint | 小さな変更 |
| Standard | Lint + TypeCheck | 通常の変更 |
| Full | Lint + TypeCheck + Tests + Coverage | フェーズ遷移前 |

### Before Commit

```bash
# 最低限の検証
npx tsc --noEmit

# 推奨
npm test
```

### Before Phase Advance

```bash
# 必須
npm test && npx tsc --noEmit
```

---

## Git Workflow

**Priority**: CRITICAL **Triggers**: バージョン管理操作

Git コミット形式とブランチルールは `rules/core-essentials.md` を参照。

### Pre-Commit Checklist

1. [ ] 型チェック通過 (`npx tsc --noEmit`)
2. [ ] テスト通過 (`npm test`)
3. [ ] 変更内容を確認 (`git diff`)
4. [ ] 不要なファイルを除外
5. [ ] 適切なコミットメッセージ

---

## Error Handling

**Priority**: IMPORTANT **Triggers**: エラー発生時

### Investigation First

- 根本原因を調査してから対処
- テストをスキップして通過させない
- 検証をバイパスしない

### Recovery Pattern

```
1. エラー内容を確認
2. 根本原因を特定
3. 修正を実施
4. 検証を通過
5. Compound Learning に記録（再発防止）
```

---

## Tool Optimization

**Priority**: RECOMMENDED **Triggers**: 複数ツール操作

### Tool Priority

1. **Native Tools** - ファイル操作、検索（Read, Edit, Write, Glob, Grep）
2. **MCP Tools** - Context7 ドキュメント取得、Web 検索
3. **Bash** - システム操作（最小限）

### Parallel Execution

- 独立した操作は並列実行
- 依存関係がある場合のみ順次実行

---

## Quick Decision Tree

```
作業開始
  ↓
現在のフェーズに適している？
  NO → フェーズを進めるか作業を調整
  YES ↓

セキュリティ/データ/アーキテクチャに関係？
  YES → エスカレーション
  NO ↓

信頼度 >= 0.7？
  NO → エスカレーション
  YES ↓

可逆的な変更？
  NO → エスカレーション
  YES → 進行
```

---

_Forge Rules: フェーズ規律 x エスカレーション判断 x 検証ゲート_
