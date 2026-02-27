# change-commit-timing 技術設計

## 概要

Forge ワークフローのコミットタイミングをタスク単位の自動コミットからユーザーの明示的指示に変更する。`/compound` の学習ソースをコミットログから interpretations + reviews + proposal + design のファイルベースに移行する。

## リサーチサマリー

### 公式ドキュメントからの知見

- Git の公式ベストプラクティスでは「atomic commit（1コミット = 1つの論理的変更）」を推奨しているが、作業途中のコミットタイミングはワークフロー設計に委ねられている
- ユーザーが `git diff` で変更全体を確認してからコミットするフローは、Git のステージングエリア設計思想と合致する
- Claude Code 自体のシステムプロンプトにも「Only create commits when requested by the user」と明記されており、ユーザー制御のコミット戦略は Claude Code の設計思想に沿っている

### Web検索からの知見

- 業界トレンド: 2024-2025年にかけて AI ツールは「自動コミット」から「ユーザー制御コミット」へシフト
- Cursor はワーキングツリーに直接変更を適用し、コミットはユーザーが手動で実行する方式
- Aider は `--no-auto-commits` オプションを提供し、上級ユーザーに選好されている
- ADR (Architecture Decision Records) パターンで判断理由を記録する手法が一般化
- 注意点: 大量の未コミット変更はデータ損失リスクがあるが、通常の開発フローと同等のリスク

### コードベース分析

#### 現在のコミットフロー

1. implementer がタスク完了時に `git add [変更ファイル] && git commit` を実行
2. `/implement` の COMPLETION CRITERIA に「コミット済みであること」が含まれる
3. implement-orchestrator にも同様のコミット指示が含まれる
4. `/ship` の完了レポートに「コミット数: X」が含まれる

#### 影響を受けるファイル

| ファイル | 変更概要 | 影響度 |
|---|---|---|
| `~/.claude/agents/implementation/implementer.md` | コミット責務除去 + interpretations テンプレート拡充 | 高 |
| `~/.claude/commands/implement.md` | COMPLETION CRITERIA + 完了サマリー変更 | 高 |
| `~/.claude/commands/compound.md` | 学習ソース変更 + 自動削除追加 | 高 |
| `~/.claude/commands/review.md` | review-summary.md 出力ステップ追加 | 高 |
| `~/.claude/agents/review/review-aggregator.md` | 出力形式の明確化 | 中 |
| `~/.claude/agents/orchestration/implement-orchestrator.md` | コミット指示除去 | 中 |
| `~/.claude/commands/ship.md` | コミットなし対応 + 完了レポート変更 | 中 |
| `~/forge/CLAUDE.md` + `~/.claude/CLAUDE.md` | implementer 責務 + OpenSpec 構造更新 | 中 |
| `~/.claude/reference/workflow-rules.md` | コミットタイミング記述変更 | 低 |
| `~/.claude/agents/implementation/spec-compliance-reviewer.md` | interpretations 検証項目追加 | 低 |

#### 変更不要のファイル

- `~/.claude/rules/core-essentials.md`: コミット形式ルールは維持（タイミングが変わるだけ）
- `~/.claude/hooks/gate-git-push.js`: push フックは変更不要
- `~/.claude/reference/core-rules.md`: Pre-Commit Checklist は `/commit` 向けとして維持

#### 軽微な変更が必要なファイル（追加判明）

- `~/.claude/commands/commit.md`: 「0件ステージ時の自動 `git add`」動作で interpretations / reviews を除外するルールを追加

### 過去の学び

- `docs/compound/` には学びが未蓄積（`.gitkeep` のみ）。過去の教訓からの知見なし

## 技術的アプローチ

### 1. interpretations テンプレートの拡充

Spec Interpretation Log を2段階で記述する方式:

**Phase A（TDD 開始前 -- 既存）:**
- 対象要件の仕様解釈
- 実装判断（選択肢・採用・根拠）
- 必須チェック項目
- ギャップ検出

**Phase B（TDD 完了後 -- 新規追記）:**

```markdown
## 変更ファイル一覧

### 作成したファイル
- `path/to/new-file.ts`: [概要]

### 修正したファイル
- `path/to/existing-file.ts`: [変更内容の概要]

### 削除したファイル
- なし

## 実装の振り返り
- 仕様の曖昧性への対処: [曖昧だった箇所とどう解釈したか]
- 却下した代替案: [他の方法を選ばなかった理由]
- 想定外の発見: [実装中に見つかった注意点]
```

### 2. review-summary.md の生成フロー

```
/review コマンド（Main Agent）
  ├→ Task(各レビュアー) × N（並列）
  ├→ Task(review-aggregator)（統合）
  │   └→ 統合レポートを返却（文字列）
  └→ Main Agent が reviews/review-summary.md に Write
      └→ 修正実施後、修正内容を追記
```

review-aggregator 自体には Write ツールを追加しない。`/review` コマンドの Main Agent が統合レポートを受け取り、ファイルに書き出す。

### 3. /compound の学習フロー変更

```
/compound コマンド
  │
  ├→ 学習ソース読み込み:
  │   ├ proposal.md
  │   ├ design.md
  │   ├ interpretations/*.md（全ファイル）
  │   └ reviews/review-summary.md（存在する場合）
  │
  ├→ 学習抽出 + 分類 + ルーティング
  │
  └→ クリーンアップ:
      ├ interpretations/ ディレクトリ削除
      └ reviews/ ディレクトリ削除
```

### 4. コミット除外のルール適用箇所

implementer、implement コマンド、implement-orchestrator の全てから「コミット」の指示を除去する。`/commit` コマンド実行時に `interpretations/` と `reviews/` を `git add` 対象から除外するルールは、以下に記述する:

- implementer.md の行動規範に「interpretations / reviews は git add しない」を明記
- `/commit` コマンドは既存の動作で個別ファイル指定の `git add` を使用しているため、除外は自然に実現される

## リスクと注意点

1. **未コミット変更のデータ損失**: AI エージェントの中断時に変更が失われるリスクがあるが、通常の開発フローと同等。ユーザーが適宜コミットすることで対処
2. **`git diff` の肥大化**: 複数タスクの変更が蓄積すると diff が大きくなるが、interpretations の変更ファイル一覧で概要を把握可能。完了サマリーで `git diff --stat` を表示する
3. **interpretations の事後追記忘れ**: implementer の行動規範で Phase B（事後追記）を必須ステップとして明記し、COMPLETION CRITERIA に含めることで防止
