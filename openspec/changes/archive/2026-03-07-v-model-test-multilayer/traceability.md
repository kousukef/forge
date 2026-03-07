# v-model-test-multilayer トレーサビリティマトリクス

## Forward Traceability（要件 → 実装）

1行につき1つの対応関係を記載する（行複製方式）。1つの US に複数の T/TP が対応する場合は US を複数行に展開する。

| US | User Story | DD | Design Decision | T | Task | TP | Test Point | impl | test |
|---|---|---|---|---|---|---|---|---|---|
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-001 | テストレベル3層構造の定義 | T-001 | spec.md design.md テンプレートに受入テスト計画追加 | TP-001 | REQ-001 HP: 受入テスト計画が各USのGWT+レベル指定で生成される | commands/spec.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-001 | spec.md design.md テンプレートに受入テスト計画追加 | TP-002 | REQ-001 HP: 受入テスト計画の位置が技術的アプローチとリスクの間 | commands/spec.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-004 | spec-writer.md design.md テンプレートに受入テスト計画追加 | TP-003 | REQ-001 Err: US形式でない場合の自動付番 | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-004 | spec-writer.md design.md テンプレートに受入テスト計画追加 | TP-004 | REQ-001 Err: proposal.md不在時のフォールバック | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-004 | spec-writer.md design.md テンプレートに受入テスト計画追加 | TP-005 | REQ-001 Bnd: US1件のみの場合 | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-006 | spec-validator.md に受入テスト計画検証項目追加 | TP-037 | REQ-009 HP: 検証項目リストに11番追加 | agents/spec/spec-validator.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-006 | spec-validator.md に受入テスト計画検証項目追加 | TP-038 | REQ-009 HP: 見出しが11の検証項目 | agents/spec/spec-validator.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-006 | spec-validator.md に受入テスト計画検証項目追加 | TP-039 | REQ-009 HP: 全USカバー時のレポート記載 | agents/spec/spec-validator.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-006 | spec-validator.md に受入テスト計画検証項目追加 | TP-040 | REQ-009 Err: 受入テスト計画セクション不在 | agents/spec/spec-validator.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-006 | spec-validator.md に受入テスト計画検証項目追加 | TP-041 | REQ-009 Err: US-002シナリオ不在 | agents/spec/spec-validator.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-004 | spec-writer.md design.md テンプレートに受入テスト計画追加 | TP-032 | REQ-007 HP: Step4に生成ロジック記載 | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-004 | spec-writer.md design.md テンプレートに受入テスト計画追加 | TP-033 | REQ-007 HP: テンプレートに受入テスト計画セクション | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-003 | design.md への受入テスト計画セクション追加 | T-004 | spec-writer.md design.md テンプレートに受入テスト計画追加 | TP-034 | REQ-007 Err: US不在時のフォールバック | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-005 | テンプレート同期更新 | T-001 | spec.md design.md テンプレートに受入テスト計画追加 | TP-042 | REQ-010 HP: design.mdテンプレートに受入テスト計画 | commands/spec.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-005 | テンプレート同期更新 | T-002 | spec.md tasks.md テスト戦略テンプレートを多層化 | TP-043 | REQ-010 HP: tasks.mdテスト戦略L1/L2/L3 | commands/spec.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-005 | テンプレート同期更新 | T-010 | 横断残存チェック | TP-044 | REQ-010 Err: テンプレート位置の不整合なし | - | - |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-005 | テンプレート同期更新 | T-005 | spec-writer.md tasks.md テスト戦略テンプレートを多層化 | TP-035 | REQ-008 HP: L1/L2/L3の3層構造定義 | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-005 | テンプレート同期更新 | T-005 | spec-writer.md tasks.md テスト戦略テンプレートを多層化 | TP-036 | REQ-008 Err: L2対象なし記載 | agents/spec/spec-writer.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-003 | spec.md Phase3 検証項目数を更新 | TP-047 | REQ-012 HP: 見出し11の検証項目(validator) | commands/spec.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-003 | spec.md Phase3 検証項目数を更新 | TP-048 | REQ-012 HP: spec.md Phase3の記述 | commands/spec.md | grep検証済 |
| US-001 | /spec 実行後に受入テスト計画が design.md に含まれる | DD-004 | spec-validator 検証項目の追加 | T-006 | spec-validator.md に受入テスト計画検証項目追加 | TP-049 | REQ-012 Err: 見出しとリスト件数の不整合防止 | agents/spec/spec-validator.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-001 | テストレベル3層構造の定義 | T-007 | test.md 多層テストワークフロー実装 | TP-006 | REQ-002 HP: L1→L2→L3の順に実行 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-007 | REQ-002 HP: L1合格→L2実行 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-008 | REQ-002 HP: L1,L2合格→L3実行 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-009 | REQ-002 Err: L1失敗→L2スキップ | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-010 | REQ-002 Err: L2失敗→L3スキップ | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-011 | REQ-002 Err: --level L4無効値エラー | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-012 | REQ-002 Bnd: --level L1指定 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-013 | REQ-002 Bnd: --level L2指定 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-014 | REQ-002 Bnd: --level L3指定 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-045 | REQ-011 HP: Step1-6の構造 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-046 | REQ-011 Err: 修正後の影響レベル再実行 | commands/test.md | grep検証済 |
| US-002 | /test が L1→L2→L3 の多層構造で実行される | DD-002 | /test コマンドの多層ワークフロー | T-009 | CLAUDE.md の /test 説明更新 | TP-006 | REQ-002 HP: L1→L2→L3の順に実行（CLAUDE.md反映） | CLAUDE.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-001 | テストレベル3層構造の定義 | T-007 | test.md 多層テストワークフロー実装 | TP-015 | REQ-003 HP: L1のみ実行、L2/L3スキップ | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-001 | テストレベル3層構造の定義 | T-007 | test.md 多層テストワークフロー実装 | TP-016 | REQ-003 HP: L1+L2実行、L3スキップ | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-001 | テストレベル3層構造の定義 | T-007 | test.md 多層テストワークフロー実装 | TP-017 | REQ-003 Err: --level L3指定だが受入テスト計画なし | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-018 | REQ-004 HP: L1 Exit Criteria達成 | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-019 | REQ-004 HP: L2 Exit Criteria達成 | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-020 | REQ-004 HP: L3 Exit Criteria達成 | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-021 | REQ-004 Err: L1失敗時のFAIL判定 | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-022 | REQ-004 Err: L2失敗時のFAIL判定 | commands/test.md | grep検証済 |
| US-003 | 各テストレベルの実行基準と合格基準が定義されている | DD-002 | /test コマンドの多層ワークフロー | T-007 | test.md 多層テストワークフロー実装 | TP-023 | REQ-004 Err: L3失敗時のFAIL判定 | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-024 | REQ-005 HP: 全レベルPASSのレポート出力 | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-025 | REQ-005 HP: US別集計テーブル | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-026 | REQ-005 Err: L2スキップ時のレポート | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-027 | REQ-005 Err: US-001の1シナリオ失敗 | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-028 | REQ-006 HP: US→TPマッピングによる集計 | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-029 | REQ-006 HP: 複数USの独立集計 | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-030 | REQ-006 Err: traceability.md不在時のフォールバック | commands/test.md | grep検証済 |
| US-004 | 受入テスト結果が US 単位で集計される | DD-002 | /test コマンドの多層ワークフロー | T-008 | test.md 結果レポート形式を多層化 | TP-031 | REQ-006 Err: TP未割当USの警告 | commands/test.md | grep検証済 |

## Backward Traceability（実装 → 要件）

| impl/test | T | TP | DD | US |
|---|---|---|---|---|
| commands/spec.md (受入テスト計画テンプレート追加) | T-001 | TP-001, TP-002, TP-042 | DD-003, DD-005 | US-001 |
| commands/spec.md (テスト戦略テンプレート多層化) | T-002 | TP-043 | DD-005 | US-001 |
| commands/spec.md (Phase 3 検証項目数 10→11) | T-003 | TP-047, TP-048 | DD-004 | US-001 |
| agents/spec/spec-writer.md (受入テスト計画テンプレート + 生成ロジック) | T-004 | TP-001, TP-002, TP-003, TP-004, TP-005, TP-032, TP-033, TP-034 | DD-003 | US-001 |
| agents/spec/spec-writer.md (tasks.md テスト戦略 L1/L2/L3) | T-005 | TP-035, TP-036 | DD-005 | US-001 |
| agents/spec/spec-validator.md (検証項目11追加 + 見出し更新) | T-006 | TP-037, TP-038, TP-039, TP-040, TP-041, TP-049 | DD-004 | US-001 |
| commands/test.md (多層テストワークフロー Step 1-6) | T-007 | TP-006, TP-007, TP-008, TP-009, TP-010, TP-011, TP-012, TP-013, TP-014, TP-015, TP-016, TP-017, TP-018, TP-019, TP-020, TP-021, TP-022, TP-023, TP-045, TP-046 | DD-001, DD-002 | US-002, US-003 |
| commands/test.md (結果レポート形式 多層化 + US 別集計) | T-008 | TP-024, TP-025, TP-026, TP-027, TP-028, TP-029, TP-030, TP-031 | DD-002 | US-004 |
| CLAUDE.md (/test 多層構造の記述追加) | T-009 | TP-006 | DD-002 | US-002 |

## Coverage Summary

| カテゴリ | 総数 | カバー済み | 未カバー |
|---|---|---|---|
| User Stories | 4 | 4 | 0 |
| Design Decisions | 5 | 5 | 0 |
| Tasks | 10 | 10 | 0 |
| Test Points | 49 | 49 | 0 |
