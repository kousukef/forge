# Forge 内部最適化（Phase 0a）タスクリスト

## テスト戦略

- ユニットテスト: なし（.md ファイルの変更が主体のため）
- 統合テスト: なし（.md ファイルの変更が主体のため）
- E2Eテスト: なし（コマンド定義・エージェント定義は Claude Code ランタイムで検証）
- 手動検証: 各 .md ファイルの構造・内容・リンク整合性を目視確認

## タスク

### Task 2: docs/domain/README.md の作成（推定: 3分）
- **対象ファイル**: `docs/domain/README.md`（新規）
- **やること**: ドメイン知識配置ガイドを記述する。内容: docs/domain/ の目的、配置すべきファイルの種類と各ファイルの説明（business-rules.md, domain-model.md, stakeholders.md, tech-constraints.md, runbooks/）、/forge-init で自動生成される旨、空ファイル禁止原則の説明
- **検証方法**: ファイル存在確認と内容の目視確認
- **関連要件**: REQ-004
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-004`
- **依存**: なし

### Task 3: docs/inbox/README.md の作成（推定: 2分）
- **対象ファイル**: `docs/inbox/README.md`（新規）
- **やること**: 未分類知識退避場所のガイドを記述する。内容: docs/inbox/ の目的、使い方（分類できない知識を一時退避）、/compound 実行時に自動スキャンされ docs/domain/ への移動が提案される旨
- **検証方法**: ファイル存在確認と内容の目視確認
- **関連要件**: REQ-005
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-005`
- **依存**: なし

### Task 4: compound learnings 防止策棚卸し（推定: 5分）
- **対象ファイル**: `docs/compound/2026-02-18-agent-teams-workflow-redesign.md`（既存）、`docs/compound/2026-02-18-add-command-arguments.md`（既存）、`docs/compound/2026-02-22-change-commit-timing.md`（既存）、`docs/compound/2026-02-24-add-domain-skills.md`（既存）
- **やること**: 4件の compound learnings の防止策セクションを走査し、未チェック（`- [ ]`）の項目を一覧化する。本変更で対応する項目を特定し、チェックボックスを更新する。対応しない項目はそのまま残す
- **検証方法**: `grep -r '\- \[ \]' docs/compound/` で未チェック項目を確認。本変更で対応するものが `- [x]` に更新されていることを確認
- **関連要件**: REQ-003
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-003`
- **依存**: なし

### Task 6: compound.md に Learning Router ドメイン分類テーブル追加（推定: 4分）
- **対象ファイル**: `commands/compound.md`（既存）
- **やること**: Learning Router セクションの分類テーブルの後に、ドメイン知識の分類テーブルを追加する。ルーティング先: ビジネスルール→business-rules.md、ドメインモデル→domain-model.md、ステークホルダー要件→stakeholders.md、技術的制約→tech-constraints.md、運用知識→runbooks/、分類不明→docs/inbox/。ルーティング手順に「ドメイン分類を技術分類の後に判定」を追加
- **検証方法**: compound.md の diff を確認。既存の分類テーブルが変更されていないことを確認。新規テーブルの形式が既存テーブルと統一されていることを確認
- **関連要件**: REQ-006, REQ-015
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-006`, `specs/forge-internal-optimization/delta-spec.md#REQ-015`
- **依存**: なし

### Task 7: compound.md に docs/inbox/ スキャンステップ追加（推定: 3分）
- **対象ファイル**: `commands/compound.md`（既存）
- **やること**: ワークフローのステップ4（Learning Router）とステップ5（一時ファイルクリーンアップ）の間に、docs/inbox/ 自動スキャンステップを挿入する。ステップ番号を 4.7 とする。**注意: 既存の compound.md にはステップ 4.5（Shift-Left フィードバック）が既にあるため、4.5 の後に 4.7 として配置すること**。内容: docs/inbox/ の存在チェック、README.md 以外のファイルスキャン、ドメイン分類テーブルに基づく移動先提案、ユーザー承認後の移動実行
- **検証方法**: compound.md の diff を確認。既存ステップの番号・内容が変更されていないことを確認
- **関連要件**: REQ-007, REQ-016
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-007`, `specs/forge-internal-optimization/delta-spec.md#REQ-016`
- **依存**: Task 6

### Task 8: brainstorm.md に docs/domain/ 参照ステップ追加（推定: 3分）
- **対象ファイル**: `commands/brainstorm.md`（既存）
- **やること**: ワークフローのステップ1（トピック確認）の後に、docs/domain/ 参照ステップを挿入する。ステップ番号を 1.5 とする。内容: `docs/domain/` の存在チェック、README.md 以外のファイル一覧取得、各ファイルの読み込み、ドメインコンテキストの把握。docs/domain/ が存在しないか README.md のみの場合はスキップ
- **検証方法**: brainstorm.md の diff を確認。既存ステップの番号・内容が変更されていないことを確認
- **関連要件**: REQ-008, REQ-017
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-008`, `specs/forge-internal-optimization/delta-spec.md#REQ-017`
- **依存**: なし

### Task 9: project-knowledge-writer エージェント定義の作成（推定: 4分）
- **対象ファイル**: `agents/research/project-knowledge-writer.md`（新規、`agents/research/` に配置 -- 既存パターン踏襲）
- **やること**: /forge-init の Phase 5 で使用するエージェント定義を作成する。既存の spec-writer パターンを踏襲。frontmatter に name, description（3部構成形式）を含む。本文に: 役割（収集データからドキュメント生成）、入力（Phase 1-4 の収集データ）、出力（openspec/project.md, docs/domain/ 配下のファイル群）、空ファイル禁止原則、カバレッジマトリクス（K1-K15）の管理手順
- **検証方法**: エージェント定義ファイルの存在確認。description が3部構成形式であることを確認。spec-writer と同等の構造であることを確認
- **関連要件**: REQ-010
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-010`
- **依存**: なし

### Task 10: forge-init.md コマンド定義の作成（推定: 5分）
- **対象ファイル**: `commands/forge-init.md`（新規）
- **やること**: /forge-init コマンド定義を作成する。frontmatter: description, disable-model-invocation: true, argument-hint（なし or 省略可能な引数）。本文: 5フェーズのワークフロー詳細（Phase 1: codebase-analyzer 起動、Phase 2: ソース提供受付、Phase 3: コア5質問定義、Phase 4: 深掘り質問ロジック、Phase 5: project-knowledge-writer 起動）。各フェーズの完了時に進捗表示と確認。/brainstorm との競合回避（openspec/project.md が既存なら生成スキップ）
- **検証方法**: コマンド定義ファイルの存在確認。frontmatter の形式が既存コマンド（brainstorm.md 等）と統一されていることを確認。5フェーズの記述漏れがないことを確認
- **関連要件**: REQ-009, REQ-011
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-009`, `specs/forge-internal-optimization/delta-spec.md#REQ-011`
- **依存**: Task 9

### Task 11: CLAUDE.md の更新（推定: 4分）
- **対象ファイル**: `CLAUDE.md`（既存、プロジェクト）、`~/.claude/CLAUDE.md`（既存、グローバル）
- **やること**: (1) Available Agents テーブルに project-knowledge-writer（実装カテゴリ）と domain-analyzer（リサーチカテゴリ）を追加。(2) Available Commands に /forge-init を追加（該当セクションがある場合）。(3) プロジェクト CLAUDE.md とグローバル CLAUDE.md の両方を同一内容に更新
- **検証方法**: `diff CLAUDE.md ~/.claude/CLAUDE.md` で差異がないことを確認（該当セクション）。新しいエントリが正しい位置に追加されていることを確認
- **関連要件**: REQ-012
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-012`
- **依存**: Task 9, Task 10

### Task 12.5: domain-analyzer エージェント定義の作成（推定: 4分）
- **対象ファイル**: `agents/research/domain-analyzer.md`（新規、`agents/research/` に配置 -- 既存パターン踏襲）
- **やること**: /spec のリサーチフェーズで使用するドメイン知識分析エージェントを定義する。既存のリサーチエージェント（codebase-analyzer 等）のパターンを踏襲。frontmatter に name, description（3部構成形式）, tools（Read, Glob, Grep のみ、読み取り専用）を含む。本文に: 役割（docs/domain/ + docs/inbox/ のドメイン知識を分析し、delta-spec のシナリオ候補を抽出）、入力（docs/domain/ 配下のファイル、proposal.md の変更概要）、出力（Error Scenarios 候補、Boundary Scenarios 候補、NFR 候補の3カテゴリに構造化した分析結果）、docs/domain/ が存在しない場合のスキップ条件
- **検証方法**: エージェント定義ファイルの存在確認。description が3部構成形式であることを確認。tools が読み取り専用であることを確認
- **関連要件**: REQ-018
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-018`
- **依存**: なし

### Task 12.7: spec.md コマンド定義に domain-analyzer を追加（推定: 3分）
- **対象ファイル**: `commands/spec.md`（既存）
- **やること**: /spec コマンドのリサーチフェーズの記述に domain-analyzer を追加する。具体的には: (1) Sub Agents モードのリサーチャーリストに5番目として domain-analyzer を追加。(2) Teams モードの teammate リストに domain-analyzer を追加（6 teammate 構成に変更）。(3) spec-writer の統合フェーズで domain-analyzer の結果を含める記述を追加。(4) domain-analyzer が結果を返さない場合のフォールバック条件を明記
- **検証方法**: spec.md の diff を確認。既存のリサーチャー記述が変更されていないことを確認。Sub Agents モードと Teams モードの両方に追加されていることを確認
- **関連要件**: REQ-019, REQ-020
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md#REQ-019`, `specs/forge-internal-optimization/delta-spec.md#REQ-020`
- **依存**: Task 12.5

### Task 13: 最終検証 -- 全ファイルの整合性確認（推定: 3分）
- **対象ファイル**: 全変更ファイル
- **やること**: (1) 全新規ファイルの存在確認（docs/domain/README.md, docs/inbox/README.md, commands/forge-init.md, agents/research/project-knowledge-writer.md, agents/research/domain-analyzer.md）。(2) 全修正ファイルの差分確認（commands/compound.md, commands/brainstorm.md, commands/spec.md, CLAUDE.md x2）。(3) プロジェクト/グローバル CLAUDE.md の同期確認。(4) delta-spec.md の各 REQ-XXX が tasks.md の関連要件に参照されていることを確認。(5) `npx tsc --noEmit` が通ることを確認（.ts/.tsx の変更がないため PASS 想定）
- **検証方法**: 上記の確認項目を1つずつ実行し、全項目 PASS であることを確認
- **関連要件**: 全 REQ
- **関連スペック**: `specs/forge-internal-optimization/delta-spec.md`
- **依存**: Task 2, Task 3, Task 4, Task 6, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12.5, Task 12.7
