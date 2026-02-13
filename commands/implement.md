---
description: "仕様書のタスクリストに基づきTDD駆動で実装する。タスクごとにサブエージェントをディスパッチし、デュアルレビューで品質を担保する"
---

# /implement コマンド

## 目的

仕様書のタスクリストに基づいてTDD駆動でコードを実装する。

## Skill Activation

1. `forge-skill-orchestrator` スキルを呼び出し、実装フェーズに適用される全 Skill を確認する
2. 必須スキル:
   - `test-driven-development` -- TDD メソドロジー
   - `verification-before-completion` -- 完了前検証
3. サブエージェント起動時、各エージェントの `skills` frontmatter に記載された Skill の SKILL.md を読み込み、タスクプロンプトに含める
4. 対象ファイルのドメインに応じてドメイン Skill も呼び出す（例: .tsx → `nextjs-frontend`）

## ワークフロー

### Step 1: 準備

1. gitワークツリーを作成（`git worktree add`）してブランチを分離
2. `openspec/changes/<change-name>/` から以下の3ファイルを読み込む：
   - `tasks.md`（タスクリスト）
   - `specs/`（デルタスペック）
   - `design.md`（技術設計）
3. タスクリストを解析し、実行順序を決定

### Step 2: タスク実行ループ（各タスクごとに繰り返し）

各タスクに対して以下の3つのサブエージェントを**順次**起動する：

**事前エスカレーションチェック**: 各タスクのディスパッチ前に、タスク内容を確認する。以下に該当する場合は `AskUserQuestion` でユーザーに確認してからサブエージェントを起動する：
- タスクがセキュリティ関連（認証・認可・暗号化・PII処理）の実装を含む
- タスクがDBスキーマ変更（Prismaマイグレーション）を含む
- タスクがアーキテクチャ変更（新レイヤー追加、API契約変更）を含む

**A. implementerサブエージェント**:
- タスクテキスト + プロジェクトコンテキスト + デルタスペックの Given/When/Then を受け取る
- **TDD厳守**：必ずテストを先に書く（RED → GREEN → REFACTOR）
  - RED: Given/When/Then シナリオから失敗するテストを書く
  - GREEN: テストを通す最小限のコードを書く
  - REFACTOR: コードを整理する
- テストの前にコードを書いた場合、**そのコードを削除してやり直す**
- `iterative-retrieval`スキルを使用して、必要なコンテキストを段階的に取得
- ビルドエラーが発生した場合は `build-error-resolver` エージェントに委譲

**B. spec-compliance-reviewerサブエージェント**:
- implementerの成果物をデルタスペックと照合
- ADDED/MODIFIED/REMOVED 各要件タイプ別に確認
- Given/When/Then シナリオとテストの対応を検証
- 実装の逸脱がある場合はimplementerに差し戻し
- **仕様自体に問題がある場合**（曖昧性、矛盾、情報不足）は implementer への差し戻しではなく `AskUserQuestion` でユーザーにエスカレーション

**C. code-quality-reviewerサブエージェント**:
- コード品質をチェック（型安全性、エラーハンドリング、パフォーマンス）
- 軽微な問題はそのまま通す（P3）
- 重大な問題（P1/P2）はimplementerに差し戻し

### Step 3: タスク間チェックポイント

- 3タスクごとに全テストを実行して回帰がないか確認
- ビルドが通るか確認（`pnpm build`）
- 失敗した場合はそのタスクの修正を優先

### Step 4: 完了

- 全タスク完了後、全テスト実行
- gitコミット（コンベンショナルコミット形式）
- 実装サマリーを出力

## 実装サマリー形式

```markdown
# 実装完了サマリー

## 完了タスク
- [x] Task 1: [タスク名]
- [x] Task 2: [タスク名]
...

## 変更ファイル
- `src/app/xxx/page.tsx`（新規）
- `src/lib/xxx.ts`（変更）
...

## テスト結果
[テスト実行結果を貼付]

## 注意事項
[あれば記載]
```
