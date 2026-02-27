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

### OpenSpec Structure

```
openspec/
├── project.md              # プロジェクトコンテキスト
├── specs/                  # 累積スペック（マージ済みの正式仕様）
└── changes/                # 変更単位の作業ディレクトリ
    ├── <change-name>/      # アクティブな変更
    │   ├── proposal.md     # /brainstorm で生成
    │   ├── design.md       # /spec で生成
    │   ├── tasks.md        # /spec で生成
    │   ├── specs/          # デルタスペック（/spec で生成）
    │   ├── interpretations/ # 仕様解釈ログ（/implement で生成）コミット対象外、/compound 後に削除
    │   │   └── <task>.md   # 各タスクの Spec Interpretation Log
    │   └── reviews/         # レビュー結果（/review で生成）コミット対象外、/compound 後に削除
    │       └── review-summary.md
    └── archive/            # /compound で完了分をアーカイブ
```

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

### Pipeline Flow

```
/brainstorm → /spec → /implement → /review → /test → /compound
```

### Pipeline Rules

| Stage | Input | Output | Approval |
|-------|-------|--------|----------|
| /brainstorm | ユーザーの要望 | proposal.md | ユーザー承認必須 |
| /spec | proposal.md | design.md, tasks.md, delta-specs | ユーザー承認必須 |
| /implement | tasks.md, delta-specs | 実装コード + テスト | 自律実行 |
| /review | 実装コード | レビュー結果 | 自律実行 |
| /test | 実装コード | テスト実行証明 | 自律実行 |
| /compound | 全成果物 | 学び記録 + スペックマージ | 自律実行 |

### /ship (完全自律パイプライン)

上記を連鎖実行。ただし:
- /brainstorm と /spec の後はユーザー承認必須
- /implement 以降は自律実行（テスト失敗時は最大3回リトライ）

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

### Creating Escalation

```
1. 不明点や判断が必要な場面を特定

2. AskUserQuestion で確認
   - 背景情報を提供
   - 選択肢を提示
   - 推奨案を明記

3. ブロッキングの場合は回答を待つ
4. 非ブロッキングの場合は他の作業を継続
```

### Teams 内エスカレーション

```
Team Member（疑問発見）
  | SendMessage（選択肢を含めて送信）
  v
Main Agent（チームリーダー）
  | AskUserQuestion（選択肢をそのまま提示）
  v
ユーザー（回答）
  |
  v
Main Agent
  | SendMessage（回答をそのまま返信）
  v
Team Member（作業再開）
```

---

## Collaboration Workflow

### Context Isolation (2層アーキテクチャ)

```
Main Agent（オーケストレーション層）
  ├─ [Teams モード] エージェント間通信による協調
  └─ [Sub Agents モード] 並列独立実行
```

### Handoff Pattern

```
1. コミット作成
2. 進捗を記録
3. 保留事項を明記
4. 次のステップを記載
```

---

## Compound Learning

### 記録タイミング

- 防げたはずの失敗が起きた時
- 100ドル超の推定コストの失敗

### 記録先

- `docs/compound/YYYY-MM-DD-<topic>.md`

### エスカレーション

- コストが100ドル超なら、rules/reference/skills/hooks の更新を提案
- ユーザー承認後に適用

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
