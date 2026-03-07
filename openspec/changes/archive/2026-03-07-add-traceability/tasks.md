# add-traceability タスクリスト

## テスト戦略

- ユニットテスト: 対象外（エージェント定義・コマンド定義は Markdown ファイルであり、プログラムコードではない）
- 統合テスト: 対象外（同上）
- E2Eテスト: 手動シナリオベース検証。各タスク完了後に検証チェックリストに基づいて確認する
- 構造検証: ファイルの存在確認、フォーマットの形式確認、既存パターンとの整合性確認を `grep`/`cat` コマンドで実施

## タスク

### Task 1: spec-writer エージェント定義に traceability.md 生成ロジックを追加（推定: 5分）

- **対象ファイル**: `agents/spec/spec-writer.md`（既存）
- **やること**:
  1. 「出力」セクションの3ファイルリストに `4. traceability.md` を追加
  2. 「ワークフロー」の Step 4 に traceability.md 生成サブステップを追加。生成順序は delta-spec.md → design.md → tasks.md → traceability.md
  3. traceability.md のフォーマット定義（Forward Traceability テーブル、Backward Traceability テーブル、Coverage Summary テーブル）を記述
  4. ID 抽出ルール（US-xxx, DD-xxx, T-xxx, TP-xxx）を記述
  5. Step 4 の検証チェックリストに「traceability.md の全 US に対応する T と TP が割り当てられていること」を追加
- **検証方法**: `grep -c "traceability" agents/spec/spec-writer.md` で traceability 関連の記述が存在することを確認。`grep "Forward Traceability\|Backward Traceability\|Coverage Summary\|US-xxx\|DD-xxx\|T-xxx\|TP-xxx" agents/spec/spec-writer.md` でフォーマット定義と ID 体系の記述を確認
- **関連要件**: REQ-001, REQ-002, REQ-003, REQ-007
- **関連スペック**: `specs/traceability/delta-spec.md#traceability.md の自動生成`, `specs/traceability/delta-spec.md#traceability.md のフォーマット定義`, `specs/traceability/delta-spec.md#ID 体系と自動連番`, `specs/traceability/delta-spec.md#spec-writer エージェント定義の出力追加`
- **依存**: なし

### Task 2: spec-validator エージェント定義にトレーサビリティ検証項目を追加（推定: 4分）

- **対象ファイル**: `agents/spec/spec-validator.md`（既存）
- **やること**:
  1. 「入力」セクションのファイルリストに `traceability.md` を追加
  2. 「9つの検証項目」を「10の検証項目」に変更し、「10. トレーサビリティ網羅性チェック（警告レベル）」を追加
  3. 検証ポイントを記述: 全 US に対応する T/TP が割り当てられているか、Coverage Summary の数値が正確か
  4. 「出力形式: Spec Validation Report」のカバレッジサマリーにトレーサビリティの項目を追加
  5. 検証項目の記述で「警告レベル」「非ブロッキング」であることを明記
- **検証方法**: `grep -c "トレーサビリティ" agents/spec/spec-validator.md` でトレーサビリティ関連の記述が存在することを確認。`grep "警告\|非ブロッキング\|traceability" agents/spec/spec-validator.md` で警告レベルの記述を確認。`grep -c "10.*検証項目\|10\." agents/spec/spec-validator.md` で検証項目数の更新を確認
- **関連要件**: REQ-004, REQ-008
- **関連スペック**: `specs/traceability/delta-spec.md#spec-validator によるトレーサビリティ網羅性チェック`, `specs/traceability/delta-spec.md#spec-validator エージェント定義のチェック項目追加`
- **依存**: なし

### Task 3: implementer エージェント定義に traceability.md 更新ステップを追加（推定: 4分）

- **対象ファイル**: `agents/implementation/implementer.md`（既存）
- **やること**:
  1. 「行動規範」セクションの手順8（タスク完了確認）の後に traceability.md 更新ステップを追加: 「9. タスク完了後、`openspec/changes/<name>/traceability.md` が存在する場合、Backward Traceability テーブルに実装ファイルパスを追記し、Forward Traceability テーブルの impl/test 列を更新する。traceability.md が存在しない場合はスキップする」
  2. 「COMPLETION CRITERIA」に traceability.md 更新の項目を追加: 「traceability.md の Backward Traceability テーブルに実装ファイルパスを追記済みである（traceability.md が存在する場合のみ）」
  3. traceability.md 更新は best-effort であり、更新失敗時もタスク完了をブロックしない旨を明記
- **検証方法**: `grep -c "traceability" agents/implementation/implementer.md` で traceability 関連の記述が存在することを確認。`grep "Backward Traceability\|Forward Traceability\|best-effort\|ブロックしない" agents/implementation/implementer.md` で更新ロジックと非ブロッキングの記述を確認
- **関連要件**: REQ-005, REQ-009
- **関連スペック**: `specs/traceability/delta-spec.md#implementer によるトレーサビリティ更新`, `specs/traceability/delta-spec.md#implementer エージェント定義の完了条件追加`
- **依存**: なし

### Task 4: /compound コマンド定義にトレーサビリティマージを追加（推定: 3分）

- **対象ファイル**: `commands/compound.md`（既存）
- **やること**:
  1. スペックマージ（ステップ6）に traceability.md のマージサブステップを追加: 「`openspec/changes/<change-name>/traceability.md` が存在する場合、`openspec/specs/<feature>/traceability.md` にマージする。既存ファイルがある場合は Forward/Backward Traceability テーブルに行を追記する。ファイルがない場合は新規作成する。traceability.md が存在しない場合はスキップする」
  2. マージ時の ID 衝突回避ルールを記述: 「累積トレーサビリティに同名の US-xxx が存在する場合、新しい変更の ID を連番継続する形でリナンバリングする」
- **検証方法**: `grep -c "traceability" commands/compound.md` で traceability 関連の記述が存在することを確認。`grep "traceability.md.*マージ\|リナンバリング\|スキップ" commands/compound.md` でマージロジックの記述を確認
- **関連要件**: REQ-006, REQ-010
- **関連スペック**: `specs/traceability/delta-spec.md#/compound でのトレーサビリティアーカイブと累積反映`, `specs/traceability/delta-spec.md#/compound コマンドのマージステップ追加`
- **依存**: なし

### Task 5: /spec コマンド定義の出力ファイルリストを更新（推定: 2分）

- **対象ファイル**: `commands/spec.md`（既存）
- **やること**:
  1. Phase 2 の出力ファイルリスト（3ファイル）に `4. traceability.md` を追加
  2. Phase 5（ユーザー確認）の提示内容に traceability.md を追加
  3. Teams モードの spec-writer 説明に traceability.md 生成を含める
- **検証方法**: `grep -c "traceability" commands/spec.md` で traceability 関連の記述が存在することを確認。`grep "traceability.md" commands/spec.md` で出力リストとユーザー確認の両方に記載されていることを確認
- **関連要件**: REQ-011
- **関連スペック**: `specs/traceability/delta-spec.md#/spec コマンドの出力ファイルリスト更新`
- **依存**: なし

### Task 6: CLAUDE.md の OpenSpec 構造を更新（推定: 2分）

- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**:
  1. OpenSpec 構造のディレクトリツリーに `traceability.md` を追加（`design.md` / `tasks.md` と同階層）
  2. コメントとして「# /spec で生成、/implement で更新」を付記
- **検証方法**: `grep "traceability" CLAUDE.md` で traceability の記載を確認。OpenSpec 構造のツリー表示に traceability.md が含まれていることを目視確認
- **関連要件**: REQ-012
- **関連スペック**: `specs/traceability/delta-spec.md#OpenSpec 構造の更新`
- **依存**: なし

### Task 7: 最終検証（推定: 5分）

- **対象ファイル**: 全対象ファイル
- **やること**: 以下の検証チェックリストを全て実行する:
  1. `agents/spec/spec-writer.md` に traceability.md の生成ロジック、フォーマット定義、ID 抽出ルールが記述されている
  2. `agents/spec/spec-validator.md` に「10. トレーサビリティ網羅性チェック（警告レベル）」が追加されている
  3. `agents/implementation/implementer.md` の COMPLETION CRITERIA に traceability.md 更新が追加されている
  4. `commands/compound.md` のスペックマージに traceability.md マージが追加されている
  5. `commands/spec.md` の Phase 2 出力リストに traceability.md が追加されている
  6. `CLAUDE.md` の OpenSpec 構造に traceability.md が追加されている
  7. 全ファイルで traceability.md のフォーマット記述（Forward/Backward Traceability テーブル、Coverage Summary）が一貫している
  8. 全ファイルで ID 体系（US-xxx, DD-xxx, T-xxx, TP-xxx）の記述が一貫している
  9. 全ファイルで「警告レベル」「非ブロッキング」「best-effort」の記述が一貫している
  10. implementer の traceability.md 更新が既存の COMPLETION CRITERIA を変更していないこと
- **検証方法**: 上記チェックリストを `grep` と `cat` コマンドで一つずつ確認する
- **関連要件**: REQ-001 - REQ-012（全要件）
- **関連スペック**: `specs/traceability/delta-spec.md`（全体）
- **依存**: Task 1, Task 2, Task 3, Task 4, Task 5, Task 6
