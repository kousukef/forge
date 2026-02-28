# Forge Workflow Rules

Forge ワークフローのルール。セッション管理、タスク管理、コラボレーション。

---

## Session Lifecycle

### Session Start

```
1. 作業ディレクトリを確認
2. CLAUDE.md を確認
3. OpenSpec の状態を確認（openspec/ ディレクトリ）
4. 直近のコミットログを確認
```

### During Session

```
1. Forge パイプラインに沿った作業
   - /brainstorm: アイデア出し・提案書作成
   - /spec: 仕様書・設計書・タスクリスト作成
   - /implement: TDD駆動実装
   - /review: 7並列レビュー
   - /test: テスト実行・証明
   - /compound: 学び記録・スペックマージ

2. コミットはユーザーの明示的な指示で行う
   - 自律的にコミットしない
   - 1コミット = 1つの論理的変更

3. Compound Learning
   - 防げたはずの失敗 → docs/compound/ に記録
```

### Session End

```
1. 未コミットの変更を確認
2. テストが通過していることを確認
3. 必要に応じてコミット
```

---

## Task Management

OpenSpec 構造は CLAUDE.md を参照。

### Task Workflow

```
1. タスク作成（/spec で tasks.md に生成）
   - 明確な目標を定義
   - 完了条件を明記
   - 依存関係を特定

2. タスク実行（/implement で TDD 実装）
   - RED → GREEN → REFACTOR
   - 小さな単位で進行
   - テスト通過を確認（コミットはユーザー指示で行う）

3. タスク完了
   - 全テスト通過
   - 型チェック通過
   - デルタスペックとの照合
```

---

## Forge Pipeline

パイプラインの全体像は CLAUDE.md を参照。各ステージの承認ルール:

| Stage | Approval |
|-------|----------|
| /brainstorm, /spec | ユーザー承認必須 |
| /implement, /review, /test, /compound | 自律実行 |

---

## Verification Workflow

### Before Code Changes

```bash
# 変更前の状態を確認
git status
git diff
```

### After Code Changes

```bash
# テスト実行
npm test

# 型チェック
npx tsc --noEmit
```

### Before Commit

```bash
# テスト + 型チェック
npm test && npx tsc --noEmit

# 変更内容を確認
git diff

# コミット
git add <files>
git commit -m "type(scope): description"
```

---

## Escalation Workflow

エスカレーションポリシーは `rules/core-essentials.md` を参照。Teams 内エスカレーションフローは `reference/context-isolation.md` を参照。

基本フロー:
1. 不明点や判断が必要な場面を特定
2. AskUserQuestion で確認（背景情報・選択肢・推奨案を提示）
3. ブロッキングなら回答を待つ、非ブロッキングなら他の作業を継続

---

## Collaboration Workflow

Context Isolation（2層アーキテクチャ）の詳細は `reference/context-isolation.md` を参照。

### Handoff Pattern

```
1. コミット作成
2. 進捗を記録
3. 保留事項を明記
4. 次のステップを記載
```

---

## Compound Learning

詳細は `/compound` コマンド定義を参照。記録先: `docs/compound/YYYY-MM-DD-<topic>.md`

---

## Best Practices

### Do

- フェーズに沿った作業を行う
- TDD を厳守する（RED → GREEN → REFACTOR）
- コミットはユーザーの明示的な指示で行う
- 不明点はエスカレーションする
- コミット前に検証（テスト + 型チェック）を通過させる
- Compound Learning で学びを記録

### Don't

- フェーズをスキップする
- テスト前にコードを書く
- 検証なしでコミットする
- エスカレーションを無視する
- TODO/モック/スタブを本実装に残す

---

_Forge Workflow Rules: パイプライン規律 x TDD x Compound Learning_
