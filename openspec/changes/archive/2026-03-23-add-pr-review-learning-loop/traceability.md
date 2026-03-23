# add-pr-review-learning-loop トレーサビリティマトリクス

## Forward Traceability（要件 → 実装）

| US | User Story | DD | Design Decision | T | Task | TP | Test Point | impl | test |
|---|---|---|---|---|---|---|---|---|---|
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-001 | frontmatter 更新 (`argument-hint` + `--no-learn`) | T-1 | frontmatter に `argument-hint` と `--no-learn` 追加 | TP-001 | REQ-006 Happy Path (argument-hint 定義) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-001 | frontmatter 更新 (`argument-hint` + `--no-learn`) | T-2 | Step 7 スキップ判定 + /review 区別 | TP-002 | REQ-006 Happy Path (スキップメッセージ) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-2 | Step 7 スキップ判定 + /review 区別 | TP-027 | REQ-001 Happy Path (/review Step 7 との区別明記) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-3 | 指摘分析・種別分類・学び抽出 | TP-003 | REQ-001 Happy Path (ワークフロー全体) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-3 | 指摘分析・種別分類・学び抽出 | TP-004 | REQ-002 Happy Path (7種別分類) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-3 | 指摘分析・種別分類・学び抽出 | TP-005 | REQ-001 Error (指摘ゼロ件スキップ) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-3 | 指摘分析・種別分類・学び抽出 | TP-006 | REQ-002 Error (分類困難時「その他」) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-3 | 指摘分析・種別分類・学び抽出 | TP-007 | REQ-001 Boundary (指摘1件) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-3 | 指摘分析・種別分類・学び抽出 | TP-008 | REQ-001 Boundary (指摘10件以上) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-003 | 学び記録の形式と記録先判断 | T-4 | 記録先動的判断と記録処理 | TP-009 | REQ-003 Happy Path (既存ディレクトリ使用) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-003 | 学び記録の形式と記録先判断 | T-4 | 記録先動的判断と記録処理 | TP-010 | REQ-003 Error (ディレクトリ不在時の作成提案) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-003 | 学び記録の形式と記録先判断 | T-4 | 記録先動的判断と記録処理 | TP-011 | REQ-001 Error (書き込みエラー非ブロッキング) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-003 | 学び記録の形式と記録先判断 | T-4 | 記録先動的判断と記録処理 | TP-012 | REQ-003 Boundary (候補複数時のユーザー確認) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-003 | 学び記録の形式と記録先判断 | T-4 | 記録先動的判断と記録処理 | TP-032 | REQ-003 Boundary (同名ファイル既存時の追記/新規確認) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-013 | REQ-004 Happy Path (既存更新 + 新規作成) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-014 | REQ-004 Happy Path (承認/拒否選択) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-015 | REQ-004 Error (agents/review/ 不在) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-016 | REQ-004 Error (全提案拒否) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-017 | REQ-004 Error (更新エラー時スキップ) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-018 | REQ-004 Boundary (提案1件) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-5 | レビュアー更新提案フロー追加 | TP-031 | REQ-004 Boundary (提案4件以上時の上限3件) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-005 | 新規レビュアーテンプレート | T-5 | レビュアー更新提案フロー追加 | TP-019 | REQ-005 Happy Path (既存パターン準拠) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-005 | 新規レビュアーテンプレート | T-5 | レビュアー更新提案フロー追加 | TP-020 | REQ-005 Error (既存レビュアー不在時の標準テンプレート) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-003 | `--no-learn` フラグで学習ループをスキップできる | DD-001 | frontmatter 更新 (`argument-hint` + `--no-learn`) | T-1 | frontmatter に `argument-hint` と `--no-learn` 追加 | TP-001 | REQ-006 Happy Path (argument-hint 定義) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-003 | `--no-learn` フラグで学習ループをスキップできる | DD-001 | frontmatter 更新 (`argument-hint` + `--no-learn`) | T-2 | Step 7 スキップ判定 + /review 区別 | TP-002 | REQ-006 Happy Path (スキップメッセージ) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-003 | `--no-learn` フラグで学習ループをスキップできる | DD-001 | frontmatter 更新 (`argument-hint` + `--no-learn`) | T-2 | Step 7 スキップ判定 + /review 区別 | TP-021 | REQ-006 Happy Path (フラグ未指定時は実行) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-003 | `--no-learn` フラグで学習ループをスキップできる | DD-001 | frontmatter 更新 (`argument-hint` + `--no-learn`) | T-2 | Step 7 スキップ判定 + /review 区別 | TP-022 | REQ-006 Error (不明フラグ無視) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-006 | コミット判断フロー | T-6 | コミット判断フロー追加 | TP-023 | REQ-007 Happy Path (選択肢提示) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-006 | コミット判断フロー | T-6 | コミット判断フロー追加 | TP-024 | REQ-007 Error (記録のみ完了時) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-006 | コミット判断フロー | T-6 | コミット判断フロー追加 | TP-025 | REQ-007 Error (変更なし時スキップ) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-006 | コミット判断フロー | T-6 | コミット判断フロー追加 | TP-033 | REQ-007 Error (git push 失敗時リカバリ) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-002 | Step 7 学習ループ | T-7 | Workflow Summary 更新 | TP-026 | REQ-001 Happy Path (Summary に Step 7 記載) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-001 | PRレビュー指摘の修正後に学びが自動的に抽出・記録される | DD-001 | frontmatter 更新 | T-8 | 横断整合性チェック | TP-028 | 全REQ 整合性 (argument-hint と Step 7 の一致) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-002 | レビュアー定義の更新がプロジェクト側に提案される | DD-004 | レビュアー更新提案フロー | T-8 | 横断整合性チェック | TP-029 | 全REQ 整合性 (レビュアーテンプレート形式) | `commands/handle-pr-review.md` | N/A (Markdown) |
| US-003 | `--no-learn` フラグで学習ループをスキップできる | DD-001 | frontmatter 更新 | T-8 | 横断整合性チェック | TP-030 | 全REQ 整合性 (/review Step 7 区別・既存 Step 不変) | `commands/handle-pr-review.md` | N/A (Markdown) |

## Backward Traceability（実装 → 要件）

| impl | test | T | TP | DD | US |
|---|---|---|---|---|---|
| `commands/handle-pr-review.md` (frontmatter 更新: argument-hint + arguments) | - | T-1 | TP-001 | DD-001 | US-001, US-003 |
| `commands/handle-pr-review.md` (Step 7 スキップ判定 + /review 区別) | - | T-2 | TP-002, TP-021, TP-022, TP-027 | DD-001, DD-002 | US-001, US-003 |
| `commands/handle-pr-review.md` (指摘分析・分類・抽出) | - | T-3 | TP-003, TP-004, TP-005, TP-006, TP-007, TP-008 | DD-002 | US-001 |
| `commands/handle-pr-review.md` (記録先判断・記録処理) | - | T-4 | TP-009, TP-010, TP-011, TP-012, TP-032 | DD-003 | US-001 |
| `commands/handle-pr-review.md` (レビュアー更新提案) | - | T-5 | TP-013, TP-014, TP-015, TP-016, TP-017, TP-018, TP-019, TP-020, TP-031 | DD-004, DD-005 | US-002 |
| `commands/handle-pr-review.md` (コミット判断) | - | T-6 | TP-023, TP-024, TP-025, TP-033 | DD-006 | US-001 |
| `commands/handle-pr-review.md` (Workflow Summary) | - | T-7 | TP-026 | DD-002 | US-001 |
| `commands/handle-pr-review.md` (横断整合性チェック) | - | T-8 | TP-028, TP-029, TP-030 | DD-001, DD-004 | US-001, US-002, US-003 |

## Coverage Summary

| カテゴリ | 総数 | カバー済み | 未カバー |
|---|---|---|---|
| User Stories (US) | 3 | 3 | 0 |
| Design Decisions (DD) | 6 | 6 | 0 |
| Tasks (T) | 8 | 8 | 0 |
| Test Points (TP) | 33 | 33 | 0 |
