---
description: "PRレビューコメントを分析し、修正・コミット・プッシュ・スレッド返信を行う"
disable-model-invocation: true
allowed-tools: Bash(gh *), Bash(git *), Grep, Read, Edit, Write, Glob
arguments:
  - name: pr
    description: PR number to handle review comments for
    required: true
---

# Handle PR Review Comments

PRに対するレビューコメントを確認し、必要な修正を行い、コミット・プッシュ・返信を行います。

PR Number: #$ARGUMENTS

## Step 1: Get PR Review Comments

まず、PRのレビューコメントを取得します。

```bash
gh pr view $ARGUMENTS --comments --json reviews,reviewThreads
```

## Step 2: Analyze Review Comments

各レビューコメントを確認し、対応が必要なものを特定します。

**判断基準:**

- バグ修正の指摘 → 対応必須
- コードスタイル/品質の指摘 → 基本的に対応
- 提案/オプション的な指摘 → 妥当性を判断して対応
- 質問のみのコメント → 返信のみで対応

## Step 3: Implement Fixes

対応が必要なコメントについて、一つずつ修正を実装します。

**重要なルール:**

- 各修正は関連するファイルと内容に基づいて行う
- 修正の根拠となるレビューコメントを把握しておく

## Step 4: Create Descriptive Commits

**CRITICAL: コミットメッセージのルール**

❌ 禁止: 「レビューコメントの対応」のような曖昧なメッセージ
✅ 必須: 具体的に何を変更したかを記述

**コミットメッセージ例:**

- `fix: null チェックを追加して型安全性を向上`
- `refactor: 冗長な条件分岐を簡潔に修正`
- `style: 変数名をより明確な名前に変更`
- `perf: 不要な再レンダリングを防止するためメモ化を追加`

各レビューコメントへの対応は、内容に応じて個別のコミットにするか、関連するものをまとめてコミットします。

## Step 5: Push All Commits

すべてのコミットが完了したら、プッシュします。

```bash
git push
```

## Step 6: Reply to Review Comment Threads

**CRITICAL: 返信のルール**

❌ 禁止: PRのルートコメントとして追加
✅ 必須: 各レビューコメントのスレッドに直接返信

**返信方法:**

```bash
# スレッドへの返信（conversation ID または review comment ID を使用）
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -f body="返信内容"
```

**返信内容の例:**

- 修正した場合: `修正しました。[該当コミットハッシュ] で対応しています。`
- 対応しない場合: `[理由を説明] のため、今回は対応を見送りました。ご意見ありがとうございます。`
- 質問への回答: 質問に対する適切な説明

## Workflow Summary

1. `gh pr view` でレビューコメントを取得
2. 各コメントを分析し、対応方針を決定
3. 必要な修正を実装
4. **具体的な説明を含むコミットメッセージ**でコミット
5. `git push` でプッシュ
6. 各レビュースレッドに**直接返信**（ルートコメントではなく）

## Notes

- レビューコメントが `gh api` で取得できない場合は `gh pr view --json` を使用
- pending状態のreviewがある場合は、そのreview threadのcomment IDを正確に特定する
- 返信時は必ずスレッドのコンテキストを維持する
