# add-command-arguments 提案書

## 意図（Intent）

Forge ワークフローコマンドの使い勝手を改善し、冗長な記述を削除する。具体的には:
1. 各コマンドの「Skill Activation」セクションを削除（CLAUDE.md と冗長）
2. argument-hint によるコマンド引数の補完サポート
3. --teams/--agents フラグによるモード選択（AskUserQuestion を置換）
4. change-name のオプショナル引数化（省略時は自動検出）

## スコープ（Scope）

### ユーザーストーリー
- ユーザーとして、`/spec add-oauth-login --teams` のように1行でモードと対象を指定したい。なぜなら毎回 AskUserQuestion で聞かれるのは冗長だから。
- ユーザーとして、`/implement` だけで自動的にアクティブな変更を検出してほしい。なぜなら変更名を毎回入力するのは面倒だから。

### 対象領域
- commands/spec.md, implement.md, review.md, compound.md, brainstorm.md, test.md, ship.md
- CLAUDE.md（モード選択の記述更新）

## スコープ外（Out of Scope）
- コマンドのワークフロー本体の変更: YAGNI -- 今回は引数とメタデータのみ
- 新コマンドの追加: YAGNI

## 未解決の疑問点（Open Questions）
- なし（分析済み）
