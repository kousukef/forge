# update-knowledge-system トレーサビリティマトリクス

## Forward Traceability（要件 → 実装）

1行につき1つの対応関係を記載する（行複製方式）。

| US | User Story | DD | Design Decision | T | Task | TP | Test Point | impl | test |
|---|---|---|---|---|---|---|---|---|---|
| US-001 | 経験ログの一元蓄積 | DD-001 | NFD三層アーキテクチャ対応 | T-001 | ディレクトリ構造の作成 | TP-001 | REQ-001 HP: /compound初回実行でディレクトリ作成 | done | N/A |
| US-001 | 経験ログの一元蓄積 | DD-001 | NFD三層アーキテクチャ対応 | T-006 | /compound出力先変更 | TP-002 | REQ-001 HP: 複数プロジェクトのログが一箇所に蓄積 | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-006 | フォールバック設計 | T-006 | /compound出力先変更 | TP-003 | REQ-001 ERR: ディレクトリ不在時のフォールバック | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-002 | 蓄積と結晶化の二段階分離 | T-006 | /compound出力先変更 | TP-004 | REQ-002 HP: プロジェクト名付きファイル出力 | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-002 | 蓄積と結晶化の二段階分離 | T-006 | /compound出力先変更 | TP-005 | REQ-002 HP: フロントマター追加フィールド | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-006 | フォールバック設計 | T-006 | /compound出力先変更 | TP-006 | REQ-002 ERR: ディレクトリ不在フォールバック | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-002 | 蓄積と結晶化の二段階分離 | T-006 | /compound出力先変更 | TP-007 | REQ-003 HP: メトリクス蓄積先変更 | commands/compound.md | N/A |
| US-002 | ワークフロー外の学び自動記録 | DD-003 | Nurtureログの設計 | T-009 | Nurturing Protocol追加 | TP-008 | REQ-005 HP: CORRECTION検出時のログ追記 | - | - |
| US-002 | ワークフロー外の学び自動記録 | DD-003 | Nurtureログの設計 | T-009 | Nurturing Protocol追加 | TP-009 | REQ-005 HP: INSIGHT検出時のログ追記 | - | - |
| US-002 | ワークフロー外の学び自動記録 | DD-003 | Nurtureログの設計 | T-009 | Nurturing Protocol追加 | TP-010 | REQ-005 HP: グローバル対話でproject=global | - | - |
| US-002 | ワークフロー外の学び自動記録 | DD-006 | フォールバック設計 | T-009 | Nurturing Protocol追加 | TP-011 | REQ-005 ERR: ディレクトリ不在時スキップ | - | - |
| US-002 | ワークフロー外の学び自動記録 | DD-003 | Nurtureログの設計 | T-009 | Nurturing Protocol追加 | TP-012 | REQ-005 ERR: 記録対象外の判断 | - | - |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-013 | REQ-006 HP: Phase1データ収集サマリー表示 | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-014 | REQ-006 HP: Phase3承認後の昇格実行 | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-015 | REQ-006 HP: --scope tag:CORRECTIONフィルタ | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-016 | REQ-006 HP: --dry-runで変更なし | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-005 | pathsフロントマターによる自動ロード | T-010 | /crystallizeコマンド定義作成 | TP-017 | REQ-006 HP: プロジェクトレベルpaths付与 | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-005 | pathsフロントマターによる自動ロード | T-010 | /crystallizeコマンド定義作成 | TP-018 | REQ-006 HP: ユーザーレベルpaths付与 | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-019 | REQ-006 HP: crystallization-log記録 | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-006 | フォールバック設計 | T-010 | /crystallizeコマンド定義作成 | TP-020 | REQ-006 ERR: ディレクトリ不在時メッセージ | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-021 | REQ-006 ERR: 未結晶化0件時メッセージ | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-022 | REQ-006 ERR: 全パターン却下時スキップ | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-023 | REQ-014 HP: パターン候補フォーマット | done | N/A |
| US-004 | 仮説検証ループ | DD-004 | /crystallizeの5Phase設計 | T-011 | 仮説検証ループ仕様反映 | TP-024 | REQ-007 HP: confidence更新(承認) | commands/compound.md | N/A |
| US-004 | 仮説検証ループ | DD-004 | /crystallizeの5Phase設計 | T-011 | 仮説検証ループ仕様反映 | TP-025 | REQ-007 HP: confidence>=0.9でタグ削除 | commands/compound.md | N/A |
| US-004 | 仮説検証ループ | DD-004 | /crystallizeの5Phase設計 | T-011 | 仮説検証ループ仕様反映 | TP-026 | REQ-007 HP: confidence<=0.4で再検討 | commands/compound.md | N/A |
| US-004 | 仮説検証ループ | DD-004 | /crystallizeの5Phase設計 | T-011 | 仮説検証ループ仕様反映 | TP-027 | REQ-007 ERR: 不正タグフォーマット処理 | commands/compound.md | N/A |
| US-004 | 仮説検証ループ | DD-004 | /crystallizeの5Phase設計 | T-011 | 仮説検証ループ仕様反映 | TP-028 | REQ-007 BND: confidence 0.85→0.9 | commands/compound.md | N/A |
| US-004 | 仮説検証ループ | DD-004 | /crystallizeの5Phase設計 | T-011 | 仮説検証ループ仕様反映 | TP-029 | REQ-007 BND: confidence 0.55→0.4 | commands/compound.md | N/A |
| US-005 | 結晶化タイミング通知 | DD-002 | 蓄積と結晶化の二段階分離 | T-007 | /compound結晶化チェック追加 | TP-030 | REQ-004 HP: 閾値超過時の通知 | commands/compound.md | N/A |
| US-005 | 結晶化タイミング通知 | DD-002 | 蓄積と結晶化の二段階分離 | T-007 | /compound結晶化チェック追加 | TP-031 | REQ-004 HP: CORRECTION即座昇格提案 | commands/compound.md | N/A |
| US-005 | 結晶化タイミング通知 | DD-002 | 蓄積と結晶化の二段階分離 | T-007 | /compound結晶化チェック追加 | TP-032 | REQ-004 HP: 閾値未満で通知なし | commands/compound.md | N/A |
| US-005 | 結晶化タイミング通知 | DD-006 | フォールバック設計 | T-007 | /compound結晶化チェック追加 | TP-033 | REQ-004 ERR: ディレクトリ不在スキップ | commands/compound.md | N/A |
| US-005 | 結晶化タイミング通知 | DD-002 | 蓄積と結晶化の二段階分離 | T-007 | /compound結晶化チェック追加 | TP-034 | REQ-004 BND: 15件丁度で通知なし | commands/compound.md | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-002 | プロセス系ルール移行 | TP-035 | REQ-009 HP: pathsなし自動ロード | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-003 | ファイル種別ルール移行 | TP-036 | REQ-009 HP: paths付き自動ロード | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-004 | CLAUDE.md Rulesセクション更新 | TP-037 | REQ-009 HP: CLAUDE.md自動ロード説明 | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-002 | プロセス系ルール移行 | TP-038 | REQ-009 ERR: .claude/rules/不在時作成 | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-003 | ファイル種別ルール移行 | TP-039 | REQ-009 ERR: Forgeでpathsなし | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-004 | CLAUDE.md Rulesセクション更新 | TP-040 | REQ-011 HP: 手動テーブル→自動説明 | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-015 | core-essentials参照更新 | TP-041 | REQ-011 ERR: context-isolation参照更新 | done | N/A |
| US-007 | 既存データの移行手順 | DD-007 | マイグレーション戦略 | T-006 | /compound出力先変更 | TP-042 | REQ-013 HP: 手順に従った移行 | commands/compound.md | N/A |
| US-007 | 既存データの移行手順 | DD-007 | マイグレーション戦略 | T-006 | /compound出力先変更 | TP-043 | REQ-013 ERR: docs/compound/不在時 | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-001 | NFD三層アーキテクチャ対応 | T-008 | compound-learnings-researcher変更 | TP-044 | REQ-008 HP: 新検索対象スキャン | done | N/A |
| US-001 | 経験ログの一元蓄積 | DD-001 | NFD三層アーキテクチャ対応 | T-008 | compound-learnings-researcher変更 | TP-045 | REQ-008 HP: Nurtureログ検索対応 | done | N/A |
| US-001 | 経験ログの一元蓄積 | DD-006 | フォールバック設計 | T-008 | compound-learnings-researcher変更 | TP-046 | REQ-008 ERR: ディレクトリ不在フォールバック | done | N/A |
| US-001 | 経験ログの一元蓄積 | DD-001 | NFD三層アーキテクチャ対応 | T-005 | CLAUDE.md Experiential Learning更新 | TP-047 | REQ-010 HP: セクション置き換え | CLAUDE.md | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-012 | ship.mdパス参照更新 | TP-048 | REQ-012 HP: docs/compound/参照更新 | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-013 | spec.mdパス参照更新 | TP-049 | REQ-012 HP: 3箇所の参照更新 | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-014 | workflow-rules.mdパス参照更新 | TP-050 | REQ-012 HP: Compound Learning→更新 | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-016 | implement-orchestrator.md更新 | TP-051 | REQ-012 HP: reference/→.claude/rules/ | done | N/A |
| US-006 | reference/→.claude/rules/移行 | DD-005 | pathsフロントマターによる自動ロード | T-018 | remove-domain-content REQ-006更新 | TP-052 | REQ-015 HP: 拡張ガイダンス更新 | done | N/A |
| US-001 | 経験ログの一元蓄積 | DD-007 | マイグレーション戦略 | T-020 | 横断整合性チェック | TP-053 | REQ-012 ERR: 横断grep漏れ検出 | done (commands/review.md, agents/spec/spec-writer.md, README.md を修正) | N/A |
| US-001 | 経験ログの一元蓄積 | DD-002 | 蓄積と結晶化の二段階分離 | T-006 | /compound出力先変更 | TP-054 | REQ-002 BND: ファイル名のunsafe文字置換 | commands/compound.md | N/A |
| US-001 | 経験ログの一元蓄積 | DD-002 | 蓄積と結晶化の二段階分離 | T-006 | /compound出力先変更 | TP-055 | REQ-002 BND: topic 50文字超過時の切り詰め | commands/compound.md | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-056 | REQ-006 BND: --scope recent 30日境界inclusive | done | N/A |
| US-003 | /crystallizeでパターン昇格 | DD-004 | /crystallizeの5Phase設計 | T-010 | /crystallizeコマンド定義作成 | TP-057 | REQ-006 BND: --scope tag:CORRECTION 0件時メッセージ | done | N/A |
| US-002 | ワークフロー外の学び自動記録 | DD-003 | Nurtureログの設計 | T-009 | Nurturing Protocol追加 | TP-058 | REQ-005 BND: 複数学びの個別エントリ追記 | - | - |
| US-002 | ワークフロー外の学び自動記録 | DD-003 | Nurtureログの設計 | T-009 | Nurturing Protocol追加 | TP-059 | REQ-005 BND: 既存ファイルへの追記(上書きなし) | - | - |
| US-001 | 経験ログの一元蓄積 | DD-002 | 蓄積と結晶化の二段階分離 | T-006 | /compound出力先変更 | TP-060 | REQ-003 ERR: メトリクス書き込み失敗時の警告+続行 | commands/compound.md | N/A |
| US-007 | 既存データの移行手順 | DD-007 | マイグレーション戦略 | T-006 | /compound出力先変更 | TP-061 | REQ-013 ERR: pre-migration形式ファイルのcrystallized追加 | commands/compound.md | N/A |

## Backward Traceability（実装 → 要件）

| impl/test | T | TP | DD | US |
|---|---|---|---|---|
| `~/.claude/docs/experiential/{logs,patterns,metrics}/`, `.claude/rules/` | T-001 | TP-001 | DD-001 | US-001 |
| `.claude/rules/core-rules.md`, `.claude/rules/workflow-rules.md`, `.claude/rules/context-isolation.md` | T-002 | TP-035, TP-038 | DD-005 | US-006 |
| `.claude/rules/coding-standards.md`, `.claude/rules/testing.md` | T-003 | TP-036, TP-039 | DD-005 | US-006 |
| `CLAUDE.md` | T-004 | TP-037, TP-040 | DD-005 | US-006 |
| `CLAUDE.md` | T-005 | TP-047 | DD-001 | US-001 |
| `commands/compound.md` | T-006 | TP-002〜TP-007, TP-042, TP-043, TP-054, TP-055, TP-060, TP-061 | DD-002, DD-006, DD-007 | US-001, US-007 |
| `commands/compound.md` | T-007 | TP-030〜TP-034 | DD-002, DD-006 | US-005 |
| `agents/research/compound-learnings-researcher.md` | T-008 | TP-044〜TP-046 | DD-001, DD-006 | US-001 |
| (implementer が更新) | T-009 | TP-008〜TP-012, TP-058, TP-059 | DD-003, DD-006 | US-002 |
| `commands/crystallize.md` | T-010 | TP-013〜TP-023, TP-056, TP-057 | DD-004, DD-005, DD-006 | US-003 |
| `commands/compound.md` | T-011 | TP-024〜TP-029 | DD-004 | US-004 |
| `commands/ship.md` | T-012 | TP-048 | DD-005 | US-006 |
| `commands/spec.md` | T-013 | TP-049 | DD-005 | US-006 |
| `reference/workflow-rules.md` | T-014 | TP-050 | DD-005 | US-006 |
| `rules/core-essentials.md` | T-015 | TP-041 | DD-005 | US-006 |
| `agents/orchestration/implement-orchestrator.md` | T-016 | TP-051 | DD-005 | US-006 |
| `~/.claude/CLAUDE.md`（変更なし -- 整合性確認済み） | T-017 | TP-008〜TP-012, TP-047 | DD-003, DD-001 | US-002, US-001 |
| `openspec/specs/remove-domain-content/spec.md` | T-018 | TP-052 | DD-005 | US-006 |
| `CLAUDE.md`（同期確認済み -- 変更不要） | T-019 | TP-047, TP-040, TP-048〜TP-051 | DD-001, DD-005 | US-001, US-006 |
| `commands/review.md`, `agents/spec/spec-writer.md`, `README.md`（横断grepで検出・修正） | T-020 | TP-053 | DD-007 | US-001 |

## Coverage Summary

| カテゴリ | 総数 | カバー済み | 未カバー |
|---|---|---|---|
| User Stories | 7 | 7 | 0 |
| Design Decisions | 7 | 7 | 0 |
| Tasks | 20 | 20 | 0 |
| Test Points | 61 | 61 | 0 |
