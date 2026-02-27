---
category: architecture
stack: general
severity: critical
date: 2026-02-18
tags: agent-teams, sub-agents, context-isolation, workflow, claude-code-constraints
---

# Agent Teams ワークフロー再設計: 3層アーキテクチャの破綻と2層への移行

## 何が起きたか

Forge ワークフローの `/implement` コマンドが3層アーキテクチャ（Main Agent → implement-orchestrator → implementer）で設計されていたが、Claude Code の制約「Sub Agent は Sub Agent を起動できない（ネスト不可）」により、implement-orchestrator が implementer を起動できず完全に機能しなかった。さらに、CLAUDE.md は2層構造を記載し、implement.md は3層構造を記載しており、ドキュメント間の矛盾が運用上の混乱を引き起こしていた。

## なぜ起きたか

1. **Claude Code の制約の見落とし**: Sub Agent のネスト不可制約を設計時に考慮しなかった。公式ドキュメントに「Subagents cannot spawn other subagents」と明記されているが、初期設計時にこれを確認していなかった。
2. **ドキュメントの分散管理**: CLAUDE.md、コマンド定義、エージェント定義が独立して進化し、相互の整合性チェックが行われていなかった。
3. **Agent Teams 機能の未活用**: TeamCreate/SendMessage による協調作業の仕組みが存在していたが、コマンドパイプラインで活用されておらず、エージェント間通信が成果物の質を改善できるフェーズ（/implement, /spec）でも Sub Agents のみを使用していた。

## どう解決したか

### 1. 2層アーキテクチャ + 動的モード選択に移行

```
Main Agent（オーケストレーション層）
  ├─ [Teams モード] TeamCreate → チーム
  │   teammate 間で SendMessage による直接通信
  │   完了後: TeamDelete でクリーンアップ
  └─ [Sub Agents モード] Task(subagent) × N
      並列可能なタスクは同時に Task 起動
```

### 2. コマンドごとの方式を明確化

| コマンド | 方式 | 理由 |
|---|---|---|
| /implement | Teams or Sub Agents（--teams/--agents で選択） | implementer 間の協調・spec-compliance-reviewer のフィードバックが質を改善 |
| /spec | Teams or Sub Agents（--teams/--agents で選択） | リサーチャー間の相互参照 + spec-writer による統合が質を改善 |
| /review | Task 並列のみ | 各レビューは独立作業、エージェント間通信不要 |

### 3. ドキュメント整合性の一括修正

- CLAUDE.md（プロジェクト + グローバル）に Context Isolation Policy セクションを追加
- implement-orchestrator を「メインスレッド専用（claude --agent で起動）」に位置づけ変更
- spec-writer エージェントを新規作成
- 全コマンドに argument-hint を追加し、change-name 引数の自動検出ロジックを統一

### 4. スキル注入方式の変更

Main Agent が SKILL.md を Read してプロンプトにインライン展開する方式を廃止し、スキル名のみを Sub Agent に渡して Claude Code が自動解決する方式に変更。これにより Main Agent のコンテキスト汚染を防止。

## 教訓

1. **プラットフォーム制約を最初に確認せよ**: 新しいアーキテクチャを設計する前に、利用するプラットフォーム（Claude Code）の制約事項を公式ドキュメントで必ず確認する。「できるはず」という仮定でアーキテクチャを構築しない。

2. **ドキュメントの整合性は自動検証せよ**: 複数ファイルに跨る設計情報は、手動管理では矛盾が必然的に発生する。Grep による矛盾検出（例: 「3層」「Task(implement-orchestrator)」の残存チェック）を検証ステップに組み込む。

3. **Teams vs Task の判断基準**: 「エージェント間通信が成果物の質を改善するか？」が唯一の判断基準。改善しないなら Task 並列の方がコスト効率が良い（Teams は通常の約7倍のトークンを消費）。

4. **Context Isolation は明示的なポリシーとして文書化せよ**: Main Agent が何をして良いか/何をしてはいけないかを明文化しないと、コンテキストウィンドウが実装コードで埋まり、大規模タスクで破綻する。

5. **スキル注入は名前ベースで**: Main Agent がスキルの内容を読み込んでインライン展開するのはコンテキスト汚染。スキル名だけを渡し、プラットフォームの自動解決に委ねる。

## 防止策

- [x] ルールの追加・更新が必要か → CLAUDE.md に Context Isolation Policy を追加済み
- [x] スキルの追加・更新が必要か → forge-skill-orchestrator のスキル名決定テーブルを更新済み
- [ ] フックの追加・更新が必要か → ドキュメント整合性チェックの自動フック（将来検討）
