# pre-push-verification トレーサビリティマトリクス

## Forward Traceability（要件 → 実装）

| US | User Story | DD | Design Decision | T | Task | TP | Test Point | impl | test |
|---|---|---|---|---|---|---|---|---|---|
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得（project.md → CLAUDE.md → 動的検出） | T-002 | 検証ステップの挿入と番号繰り下げ | TP-001 | REQ-001 Happy: project.md から取得 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-002 | REQ-001 Happy: CLAUDE.md フォールバック | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-003 | REQ-001 Error: 検出不可時の中断 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-004 | REQ-001 Error: command not found | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-005 | REQ-001 Boundary: 両方定義時の優先順位 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-006 | REQ-001 Boundary: 部分定義時のスキップ | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-002 | ステップ挿入と番号体系 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-007 | REQ-002 Happy: 検証成功後にコミットへ進む | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-002 | ステップ挿入と番号体系 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-008 | REQ-002 Happy: format auto-fix | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-002 | ステップ挿入と番号体系 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-009 | REQ-002 Error: lint 失敗時の自動修正フロー | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-010 | REQ-003 Happy: auto-fix 成功 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-011 | REQ-003 Happy: test 失敗の原因推論・修正 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-012 | REQ-003 Error: 3回リトライ後の中断 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-013 | REQ-003 Error: 修正で新エラー発生 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-014 | REQ-003 Boundary: auto-fix はリトライカウント外 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-015 | REQ-003 Boundary: リトライ回数は全体共有 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-004 | allowed-tools 拡張 | T-001 | allowed-tools の拡張 | TP-016 | REQ-004 Happy: Bash で検証コマンド実行可能 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-004 | allowed-tools 拡張 | T-001 | allowed-tools の拡張 | TP-017 | REQ-004 Error: 権限不足時のエラー | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-005 | gate-git-push との責務分離 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-018 | REQ-005 Happy: 補完的動作 | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-005 | gate-git-push との責務分離 | T-003 | 横断整合性チェック | TP-019 | REQ-005 Error: 検証失敗後の手動 push | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-020 | REQ-001 Boundary: 動的検出のキーワードマッチ | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-001 | 検証コマンドの取得 | T-002 | 検証ステップの挿入と番号繰り下げ | TP-021 | REQ-001 Boundary: 空文字値のフォールバック | handle-pr-review.md | Grep検証 |
| US-001 | 検証なしで push されない | DD-003 | 自動修正フロー | T-002 | 検証ステップの挿入と番号繰り下げ | TP-022 | REQ-003 Boundary: 部分 auto-fix 後の手動修正 | handle-pr-review.md | Grep検証 |

## Backward Traceability（実装 → 要件）

| impl/test | T | TP | DD | US |
|---|---|---|---|---|
| `commands/handle-pr-review.md` (frontmatter) | T-001 | TP-016, TP-017 | DD-004 | US-001 |
| `commands/handle-pr-review.md` (Step 4, Step 5-8, Workflow Summary) | T-002 | TP-001〜TP-015, TP-018, TP-020〜TP-022 | DD-001, DD-002, DD-003, DD-005 | US-001 |
| `commands/handle-pr-review.md` (全体検証) | T-003 | TP-019 | DD-005 | US-001 |

## Coverage Summary

| カテゴリ | 総数 | カバー済み | 未カバー |
|---|---|---|---|
| User Stories | 1 | 1 | 0 |
| Design Decisions | 5 | 5 | 0 |
| Tasks | 3 | 3 | 0 |
| Test Points | 22 | 22 | 0 |
