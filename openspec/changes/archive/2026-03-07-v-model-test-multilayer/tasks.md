# V-Model テスト多層化 タスクリスト

## テスト戦略

### L1: Unit テスト
- ユニットテスト: 各対象ファイルの構造検証（セクション存在、テンプレート形式準拠）を grep/diff で実施
- 静的解析: Markdown リンクの整合性を手動確認
- ビルド検証: N/A（Markdown ファイルの変更のためビルド対象なし）

### L2: Integration テスト
- 結合テスト: commands/spec.md と agents/spec/spec-writer.md のテンプレート整合性を diff で検証
- E2E テスト: L2 対象なし（ワークフロー定義ファイルの変更のため）

### L3: Acceptance テスト
- 受入テスト: 各 US に対応する構造的プロパティの検証（design.md 受入テスト計画セクション存在、/test 多層 Step 構造、Entry/Exit Criteria 定義、US 別集計テーブル定義）

## タスク

### Task 1: commands/spec.md の design.md テンプレートに受入テスト計画セクション追加（推定: 3分）
- **対象ファイル**: `commands/spec.md`（既存）
- **やること**: 設計ドキュメント形式テンプレート（L246-274 相当）の「技術的アプローチ」と「リスクと注意点」の間に「受入テスト計画」セクションを追加する。テンプレート内容:
  ```
  ## 受入テスト計画
  ### US-XXX: [ユーザーストーリー概要]
  - **テストレベル**: L1/L2/L3
  - **GIVEN** [前提条件] **WHEN** [検証操作] **THEN** [期待される結果]
  ```
- **検証方法**: `grep -n "受入テスト計画" commands/spec.md` でセクション存在を確認。`grep -n "技術的アプローチ\|受入テスト計画\|リスクと注意点" commands/spec.md` で順序を確認
- **関連要件**: REQ-001, REQ-010
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-001`, `specs/test-multilayer/delta-spec.md#REQ-010`
- **依存**: なし

### Task 2: commands/spec.md の tasks.md テスト戦略テンプレートを多層化（推定: 3分）
- **対象ファイル**: `commands/spec.md`（既存）
- **やること**: タスクリスト形式テンプレート（L280-297 相当）の「テスト戦略」セクションを L1/L2/L3 の3層構造に変更する。変更前:
  ```
  ## テスト戦略
  - ユニットテスト: [対象と方針]
  - 統合テスト: [対象と方針]
  - E2Eテスト: [対象と方針]
  ```
  変更後:
  ```
  ## テスト戦略
  ### L1: Unit テスト
  - ユニットテスト: [対象と方針]
  - 静的解析: [対象と方針]
  - ビルド検証: [対象と方針]

  ### L2: Integration テスト
  - 結合テスト: [対象と方針]（該当しない場合: 「L2 対象なし」）
  - E2E テスト: [対象と方針]（該当しない場合: 「L2 対象なし」）

  ### L3: Acceptance テスト
  - 受入テスト: [検証対象の US と方針]（該当しない場合: 「L3 対象なし」）
  ```
- **検証方法**: `grep -n "L1\|L2\|L3" commands/spec.md` でテスト戦略セクションの多層構造を確認
- **関連要件**: REQ-008, REQ-010
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-008`, `specs/test-multilayer/delta-spec.md#REQ-010`
- **依存**: なし

### Task 3: commands/spec.md の Phase 3 検証項目数を更新（推定: 2分）
- **対象ファイル**: `commands/spec.md`（既存）
- **やること**: Phase 3 の spec-validator 検証項目記述を「10 の検証項目」から「11 の検証項目」に更新する。受入テスト計画の網羅性チェックを項目リストに追加する
- **検証方法**: `grep -n "11 の検証項目\|受入テスト計画" commands/spec.md` で更新を確認。`grep -c "10 の検証項目" commands/spec.md` が 0 を返すことを確認（残存なし）
- **関連要件**: REQ-009, REQ-012
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-012`
- **依存**: なし

### Task 4: agents/spec/spec-writer.md の design.md テンプレートに受入テスト計画追加（推定: 4分）
- **対象ファイル**: `agents/spec/spec-writer.md`（既存）
- **やること**:
  1. design.md 出力形式テンプレートの「技術的アプローチ」と「リスクと注意点」の間に「受入テスト計画」セクションテンプレートを追加
  2. Step 4 の生成ロジックに受入テスト計画の生成手順を追加（proposal.md の US を読み込み、各 US に GIVEN/WHEN/THEN + テストレベル指定のシナリオを生成する）
  3. proposal.md にユーザーストーリーが存在しない場合のフォールバック記述を追加
- **検証方法**: `grep -n "受入テスト計画" agents/spec/spec-writer.md` でテンプレートと生成ロジックの存在を確認
- **関連要件**: REQ-001, REQ-007
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-001`, `specs/test-multilayer/delta-spec.md#REQ-007`
- **依存**: なし

### Task 5: agents/spec/spec-writer.md の tasks.md テスト戦略テンプレートを多層化（推定: 3分）
- **対象ファイル**: `agents/spec/spec-writer.md`（既存）
- **やること**: tasks.md 出力形式テンプレートの「テスト戦略」セクションを L1/L2/L3 の3層構造に変更（Task 2 と同一のテンプレート内容）
- **検証方法**: `grep -n "L1\|L2\|L3" agents/spec/spec-writer.md` でテスト戦略セクションの多層構造を確認
- **関連要件**: REQ-008
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-008`
- **依存**: なし

### Task 6: agents/spec/spec-validator.md に受入テスト計画検証項目追加（推定: 4分）
- **対象ファイル**: `agents/spec/spec-validator.md`（既存）
- **やること**:
  1. 見出し「10 の検証項目」を「11 の検証項目」に変更
  2. 検証項目リストに「11. 受入テスト計画の網羅性チェック」を追加。検証内容: design.md に「受入テスト計画」セクションが存在するか、全 US に検証シナリオが定義されているか、GIVEN/WHEN/THEN 形式が使用されているか、テストレベル指定が付与されているか
  3. Spec Validation Report のカバレッジサマリーに「受入テスト計画」の行を追加
- **検証方法**: `grep -n "11 の検証項目\|受入テスト計画" agents/spec/spec-validator.md` で更新を確認。`grep -c "10 の検証項目" agents/spec/spec-validator.md` が 0 を返すことを確認
- **関連要件**: REQ-009, REQ-012
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-009`, `specs/test-multilayer/delta-spec.md#REQ-012`
- **依存**: なし

### Task 7: commands/test.md の多層テストワークフロー実装（推定: 5分）
- **対象ファイル**: `commands/test.md`（既存）
- **やること**:
  1. 現行の Step 1〜3 を Step 1〜6 の多層構造に再構成:
     - Step 1: テーラリング判定（テスト資産検出、実行レベル決定、--level 引数対応）
     - Step 2: L1 実行（ユニットテスト + 静的解析 + ビルド + カバレッジ）
     - Step 3: L2 実行（結合テスト + E2E。Entry Criteria: L1 PASS）
     - Step 4: L3 実行（受入テスト計画の検証 + US 別集計。Entry Criteria: L2 PASS）
     - Step 5: 結果分析
     - Step 6: 失敗時修正（修正後は影響レベルから再実行）
  2. テーラリングルールの記述（L1 必須、L2/L3 条件付きスキップ）
  3. Entry/Exit Criteria テーブルの追加
  4. `--level` 引数の記述追加
- **検証方法**: `grep -n "Step 1\|Step 2\|Step 3\|Step 4\|Step 5\|Step 6" commands/test.md` で6ステップ構造を確認。`grep -n "Entry Criteria\|Exit Criteria\|テーラリング" commands/test.md` で基準定義を確認
- **関連要件**: REQ-002, REQ-003, REQ-004, REQ-011
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-002`, `specs/test-multilayer/delta-spec.md#REQ-003`, `specs/test-multilayer/delta-spec.md#REQ-004`, `specs/test-multilayer/delta-spec.md#REQ-011`
- **依存**: なし

### Task 8: commands/test.md の結果レポート形式を多層化（推定: 4分）
- **対象ファイル**: `commands/test.md`（既存）
- **やること**:
  1. 現行の結果レポート形式テンプレートを REQ-005 で定義された多層形式に置換
  2. サマリーにレベル別結果（PASS/FAIL/SKIPPED）を追加
  3. L1/L2/L3 のレベル別セクションを追加
  4. L3 セクションに US 別受入テスト結果テーブルを追加
  5. 失敗分析セクションにレベル情報を追加
  6. US 別集計で traceability.md の US → TP マッピングを使用する手順を記述
- **検証方法**: `grep -n "L1\|L2\|L3\|US 別" commands/test.md` でレベル別セクションと US 別集計の存在を確認
- **関連要件**: REQ-005, REQ-006
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-005`, `specs/test-multilayer/delta-spec.md#REQ-006`
- **依存**: Task 7（ワークフローが確定した後にレポート形式を定義）

### Task 9: CLAUDE.md の /test 説明更新（推定: 2分）
- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**: Forge ワークフローセクションの `/test` に関する記述がある場合、多層テスト構造への言及を確認・必要に応じて更新。「`/test` は L1（単体）→ L2（結合）→ L3（受入）の多層構造で実行」のニュアンスを追加
- **検証方法**: `grep -n "test" CLAUDE.md` で /test 関連の記述を確認し、多層構造の記述が整合していることを確認
- **関連要件**: REQ-002
- **関連スペック**: `specs/test-multilayer/delta-spec.md#REQ-002`
- **依存**: Task 7

### Task 10: 横断残存チェック（推定: 3分）
- **対象ファイル**: 全対象ファイル（`commands/spec.md`, `commands/test.md`, `agents/spec/spec-writer.md`, `agents/spec/spec-validator.md`, `CLAUDE.md`）
- **やること**:
  1. ファイル間整合性テーブル（delta-spec.md 末尾）の全項目を横断チェック:
     - design.md テンプレートの「受入テスト計画」セクション位置が commands/spec.md と agents/spec/spec-writer.md で一致するか
     - tasks.md テスト戦略テンプレートの L1/L2/L3 構造が commands/spec.md と agents/spec/spec-writer.md で一致するか
     - spec-validator 検証項目数が agents/spec/spec-validator.md と commands/spec.md で両方「11」になっているか
  2. 「10 の検証項目」の残存がないか全ファイルで確認: `grep -rn "10 の検証項目" commands/ agents/`
  3. 用語の一貫性チェック: L1/L2/L3、Unit/Integration/Acceptance の用語が全ファイルで統一されているか
- **検証方法**: 上記の grep コマンドを実行し、不整合がゼロであることを確認
- **関連要件**: REQ-009, REQ-010, REQ-012
- **関連スペック**: `specs/test-multilayer/delta-spec.md#ファイル間整合性テーブル`
- **依存**: Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9
