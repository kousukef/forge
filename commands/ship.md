---
description: "設計から実装、レビュー、テスト、学びの文書化までを連鎖実行する完全自律モード"
disable-model-invocation: true
argument-hint: "<change-name>"
---

# /ship コマンド

## 目的

`/brainstorm` → `/spec` → `/implement` → `/review` → `/test` → `/compound` を連鎖実行する完全自律モード。

## ワークフロー

### Phase 1: 設計（ユーザー承認必要）

1. `/brainstorm` を実行
   - ソクラテス式対話で要件を深掘り
   - 提案書を `openspec/changes/<change-name>/proposal.md` に出力
   - **→ ユーザーの承認を待つ**

### Phase 2: 仕様作成（ユーザー承認必要）

2. `/spec` を実行
   - リサーチエージェントを並列起動
   - `openspec/changes/<change-name>/` 配下に3ファイルを作成：
     - `specs/<feature>/delta-spec.md`（デルタスペック）
     - `design.md`（技術設計）
     - `tasks.md`（タスクリスト）
   - **→ ユーザーの承認を待つ**

### Phase 3: 自律実行

3. `/implement` を実行
   - TDD駆動でタスクを順次実装
   - デュアルレビューで品質担保

4. `/review` を実行
   - 7つの専門レビュアーで並列レビュー
   - P1/P2の発見事項を**自動修正**

5. `/test` を実行
   - 全テストスイートを実行
   - テスト失敗があれば修正→再テスト（**最大3回リトライ**）

6. `/compound` を実行
   - 開発から得た学びを文書化
   - デルタスペックを `openspec/specs/` にマージ
   - 変更を `openspec/changes/archive/` にアーカイブ

### Phase 4: 完了報告

最終サマリーを出力：

```markdown
# Ship完了レポート

## 設計
- 提案書: `openspec/changes/<change-name>/proposal.md`

## 仕様
- デルタスペック: `openspec/changes/<change-name>/specs/`
- 技術設計: `openspec/changes/<change-name>/design.md`
- タスクリスト: `openspec/changes/<change-name>/tasks.md`
- タスク数: X

## 実装
- 完了タスク: X/X
- 変更ファイル数: X
- 追加行数: +XXX
- 削除行数: -XXX

## レビュー結果
- P1: X件（全て修正済み）
- P2: X件（X件修正済み）
- P3: X件

## テスト結果
- ユニットテスト: OK
- 型チェック: OK
- ビルド: OK
- E2Eテスト: OK
- カバレッジ: XX%

## 学び
- 複利ドキュメント: `docs/compound/YYYY-MM-DD-<topic>.md`

## スペックマージ
- マージ先: `openspec/specs/`
- アーカイブ先: `openspec/changes/archive/YYYY-MM-DD-<change-name>/`

## ブランチ
- `feature/<branch-name>`
- コミット数: X
```

## 重要なルール

- **brainstormとspecの後には必ずユーザーの承認を取る**
- それ以降は自律的に動く
- テスト失敗のリトライは**最大3回**まで。3回失敗したらユーザーに報告して判断を仰ぐ
- P1のレビュー指摘は自動修正する。修正後に再レビューは行わない（無限ループ防止）
