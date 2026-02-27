# Agent Teams ワークフロー再設計 タスクリスト

## テスト戦略

この変更はマークダウンファイル（コマンド定義、エージェント定義、CLAUDE.md）の編集のみ。コードの実装は含まれないため、テストは以下の検証方法で代替する:

- 構造検証: 各ファイルの YAML frontmatter が正しいか
- 整合性検証: ドキュメント間の相互参照が矛盾しないか
- Grep による矛盾検出: 3層アーキテクチャへの言及が残っていないか

## タスク

### Task 1: spec-writer エージェント定義の作成

- **対象ファイル**: `agents/spec/spec-writer.md`（新規）
- **やること**:
  - spec-writer エージェント定義を作成
  - frontmatter: name, description, tools, skills, model を設定
  - 役割: リサーチ結果を統合し design.md / tasks.md / delta-spec を生成
  - SendMessage でリサーチャーに追加調査を依頼するフローを記載
  - 完了時にサマリーを Main Agent に送信する手順を記載
  - エスカレーションルール（仕様の曖昧性、セキュリティ判断等）を記載
- **検証方法**: frontmatter の YAML が正しいこと。tools に Write, Edit を含むこと。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#spec-writer エージェント定義`

### Task 2: /implement コマンド定義の書き換え（依存: なし）

- **対象ファイル**: `commands/implement.md`（既存）
- **やること**:
  - 3層アーキテクチャの記述を削除
  - 2層アーキテクチャ + モード選択（Teams / Sub Agents）の設計に書き換え
  - Step 1: 準備（git worktree + openspec 読み込み）
  - Step 2: タスク分析（依存関係、独立タスク判定）
  - Step 3: モード選択（AskUserQuestion で Teams or Sub Agents を提示）
  - Step 4a: Teams モードのワークフロー（TeamCreate, タスク割り当て, 監視, TeamDelete）
  - Step 4b: Sub Agents モードのワークフロー（Task(implementer) 並列/順次）
  - Step 5: 検証（npm test, tsc --noEmit, git log）
  - Step 6: 完了報告
  - Main Agent 禁止事項の更新（implement-orchestrator への言及削除）
  - エスカレーションフローの追加
- **検証方法**: implement-orchestrator への言及がないこと。3層アーキテクチャへの言及がないこと。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#/implement コマンドの実行方式`

### Task 3: /spec コマンド定義の更新（依存: Task 1）

- **対象ファイル**: `commands/spec.md`（既存、存在しない場合は確認）
- **やること**:
  - Phase 1 のリサーチフェーズにモード選択を追加
  - Teams モード: TeamCreate でリサーチ＆スペックチーム（4リサーチャー + spec-writer）
  - Sub Agents モード: 4つの Task(researcher) 並列 + Main Agent が統合
  - spec-writer の役割・フローの記載
  - Phase 1.5 のリサーチ検証をチーム内で実施（Teams モード時）
  - エスカレーションフローの追加
- **検証方法**: spec-writer への言及があること。モード選択のフローが記載されていること。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#/spec リサーチ＆スペックチーム`

### Task 4: /review コマンド定義の確認（依存: なし）

- **対象ファイル**: `commands/review.md`（既存、存在しない場合は確認）
- **やること**:
  - Task 並列実行の設計が記載されていることを確認
  - Agent Teams は使用しないことを明記
  - 変更不要の場合はスキップ
- **検証方法**: Agent Teams への言及がないこと。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#/review は Task 並列`

### Task 5: implement-orchestrator エージェント定義の更新（依存: なし）

- **対象ファイル**: `agents/orchestration/implement-orchestrator.md`（既存）
- **やること**:
  - 「メインスレッド専用」であることをより強調
  - /implement コマンドからは使用されないことを明記
  - `claude --agent implement-orchestrator` での起動方法のみ記載
- **検証方法**: 「メインスレッド専用」が明記されていること。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#implement-orchestrator の位置づけ`

### Task 6: プロジェクト CLAUDE.md の更新（依存: Task 1, 2, 3）

- **対象ファイル**: `/Users/mac83008148/forge/CLAUDE.md`（既存）
- **やること**:
  - **Context Isolation Policy セクション**: 2層アーキテクチャの図を更新。Teams/SubAgents モード選択を反映。エスカレーションフローを追加。
  - **Available Agents セクション**: spec-writer エージェントを追加。implement-orchestrator の「メインスレッド専用」を明記。
  - **新セクション追加**: Teams vs Task 切り替え基準（エージェント間通信の価値 + タスク独立性 + ユーザー選択）
  - 3層アーキテクチャへの全ての言及を2層に修正
  - implement-orchestrator に関する矛盾記載の解消
- **検証方法**: 「3層」「implement-orchestrator を Sub Agent として起動」への言及がないこと。spec-writer が Available Agents に記載されていること。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#CLAUDE.md の整合性`

### Task 7: グローバル CLAUDE.md の更新（依存: Task 6）

- **対象ファイル**: `~/.claude/CLAUDE.md`（既存）
- **やること**:
  - プロジェクト CLAUDE.md と同じ更新をグローバル版にも反映
  - Context Isolation Policy、Available Agents、Teams vs Task 基準
  - 3層アーキテクチャへの言及を削除
- **検証方法**: プロジェクト CLAUDE.md と内容が整合していること。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#CLAUDE.md の整合性`

### Task 8: 整合性の最終検証（依存: Task 2, 3, 4, 5, 6, 7）

- **対象ファイル**: 全変更ファイル
- **やること**:
  - Grep で「implement-orchestrator」「3層」「Task(implement-orchestrator)」の残存を確認
  - 各ファイル間の相互参照の整合性を検証
  - spec-writer エージェントが CLAUDE.md と commands/ の両方で言及されていることを確認
  - Teams vs Task 切り替え基準が一貫していることを確認
- **検証方法**: 矛盾する記載がゼロであること。
- **関連スペック**: `specs/workflow-redesign/delta-spec.md#CLAUDE.md の整合性`
