# add-doc-sync-check トレーサビリティマトリクス

## Forward Traceability（要件 → 実装）

| US | User Story | DD | Design Decision | T | Task | TP | Test Point | impl | test |
|---|---|---|---|---|---|---|---|---|---|
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-001 | REQ-001 Happy Path (ルール読み取り・照合) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-002 | REQ-001 Happy Path (implementer 起動) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-003 | REQ-001 Error (ルール未定義スキップ) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-004 | REQ-001 Error (マッチなしスキップ) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-005 | REQ-001 Error (更新失敗時非ブロッキング) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-026 | REQ-001 Boundary (単一ファイル変更) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-027 | REQ-001 Boundary (複数ルールマッチ) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-1 | /implement のドキュメント同期 | T-3 | implement.md に Step 5.5 追加 | TP-028 | REQ-001 Error (部分更新失敗) | `commands/implement.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-2 | implementer の doc-sync 対応 | T-4 | implementer.md に doc-sync 対応追加 | TP-006 | REQ-002 Happy Path (処理手順) | `agents/implementation/implementer.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-2 | implementer の doc-sync 対応 | T-4 | implementer.md に doc-sync 対応追加 | TP-007 | REQ-002 Happy Path (TDD 不要) | `agents/implementation/implementer.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-2 | implementer の doc-sync 対応 | T-4 | implementer.md に doc-sync 対応追加 | TP-008 | REQ-002 Error (ドキュメント不存在) | `agents/implementation/implementer.md` | - |
| US-001 | /implement でドキュメント更新漏れを自動検出・更新 | DD-2 | implementer の doc-sync 対応 | T-4 | implementer.md に doc-sync 対応追加 | TP-029 | REQ-002 Boundary (単一ファイル) | `agents/implementation/implementer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-3 | /review の L0 チェック | T-2 | review.md に L0 追加 | TP-009 | REQ-003 Happy Path (ルール読み取り・照合) | `commands/review.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-3 | /review の L0 チェック | T-2 | review.md に L0 追加 | TP-010 | REQ-003 Happy Path (PASS) | `commands/review.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-3 | /review の L0 チェック | T-2 | review.md に L0 追加 | TP-011 | REQ-003 Happy Path (WARNING) | `commands/review.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-3 | /review の L0 チェック | T-2 | review.md に L0 追加 | TP-012 | REQ-003 Error (ルール未定義スキップ) | `commands/review.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-3 | /review の L0 チェック | T-2 | review.md に L0 追加 | TP-030 | REQ-003 Error (WARNING レビュアー精査解消) | `commands/review.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-013 | REQ-004 Happy Path (frontmatter) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-014 | REQ-004 Happy Path (検証処理) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-015 | REQ-004 Happy Path (出力形式) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-016 | REQ-004 Error (ルール未定義) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-031 | REQ-004 Boundary (L0 PASS 時スキップ) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-017 | REQ-005 Happy Path (3段階チェック) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-018 | REQ-005 Error (無関係な変更) | `agents/review/doc-sync-reviewer.md` | - |
| US-002 | /review でドキュメント同期をレビュー | DD-4 | doc-sync-reviewer エージェント | T-1 | doc-sync-reviewer.md 新規作成 | TP-032 | REQ-005 Error (低確信度報告) | `agents/review/doc-sync-reviewer.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-019 | REQ-006 Happy Path (全フロー) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-020 | REQ-006 Happy Path (CLAUDE.md 追記) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-021 | REQ-006 Error (検出失敗フォールバック) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-022 | REQ-006 Error (既存セクション確認) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-023 | REQ-007 Happy Path (検出パターン) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-033 | REQ-007 Boundary (単一ディレクトリ) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-024 | REQ-008 Happy Path (ルール形式) | `commands/setup.md` | - |
| US-003 | /setup でドキュメント同期ルールを対話的に設定 | DD-5 | /setup のドキュメント同期ルール設定 | T-5 | setup.md にステップ6.5 追加 | TP-025 | REQ-008 Error (冪等性) | `commands/setup.md` | - |

## Backward Traceability（実装 → 要件）

| impl | test | T | TP | DD | US |
|---|---|---|---|---|---|
| `agents/review/doc-sync-reviewer.md` (新規作成) | - | T-1 | TP-013, TP-014, TP-015, TP-016, TP-017, TP-018, TP-031, TP-032 | DD-4 | US-002 |
| `commands/review.md` (Step 0 に L0 追加 + REVIEW CONTEXT 更新) | - | T-2 | TP-009, TP-010, TP-011, TP-012, TP-030 | DD-3 | US-002 |
| `commands/implement.md` (Step 5.5 追加) | - | T-3 | TP-001, TP-002, TP-003, TP-004, TP-005, TP-026, TP-027, TP-028 | DD-1 | US-001 |
| `agents/implementation/implementer.md` (doc-sync タスク対応追加) | - | T-4 | TP-006, TP-007, TP-008, TP-029 | DD-2 | US-001 |
| `commands/setup.md` (ステップ6.5 追加) | - | T-5 | TP-019, TP-020, TP-021, TP-022, TP-023, TP-024, TP-025, TP-033 | DD-5 | US-003 |

## Coverage Summary

| カテゴリ | 総数 | カバー済み | 未カバー |
|---|---|---|---|
| User Stories (US) | 3 | 3 | 0 |
| Design Decisions (DD) | 5 | 5 | 0 |
| Tasks (T) | 6 | 5 | 1 (T-6 横断チェック = 全US対応) |
| Test Points (TP) | 33 | 33 | 0 |
