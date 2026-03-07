# add-traceability 提案書

## 意図（Intent）

Forge の現行ワークフローでは、要件（ユーザーストーリー）→ 設計決定 → タスク → テスト観点の対応関係が暗黙的で、仕様と実装の乖離を検出する仕組みがない。トレーサビリティマトリクスを導入することで、各フェーズの成果物間の双方向追跡を可能にし、欠落や乖離を早期に発見できるようにする。

本変更は親 Issue #18（V-Model ワークフロー強化）の Phase 1 であり、Phase 2（テスト多層化）・Phase 3（W-Model レビュー）の基盤となる。

## スコープ（Scope）

### ユーザーストーリー

- US-001: 開発者として、/spec 実行後に traceability.md が自動生成されてほしい。なぜなら、要件→設計→タスク→テスト観点の追跡を手動で管理したくないから。
- US-002: 開発者として、spec-validator がトレーサビリティの網羅性を警告してほしい。なぜなら、テスト観点の欠落を /spec 段階で気づきたいから。
- US-003: 開発者として、/implement のタスク完了毎に traceability.md が実装・テストファイルパスで更新されてほしい。なぜなら、コードとスペックの紐づけをリアルタイムで確認したいから。
- US-004: 開発者として、/compound でトレーサビリティが累積スペックに反映されてほしい。なぜなら、過去の変更も含めた全体の追跡性を維持したいから。

### 対象領域

- spec-writer エージェント: traceability.md 生成ロジックの追加
- spec-validator エージェント: トレーサビリティ網羅性の検証ロジック追加（警告レベル）
- implementer エージェント: タスク完了時の traceability.md 更新ロジック追加
- /compound コマンド: トレーサビリティのアーカイブ・累積スペック反映ロジック追加
- OpenSpec スキーマ: traceability.md のフォーマット定義

### トレーサビリティの設計方針

- **ID 体系**: ユーザーストーリーは US-001 形式の自動連番
- **配置**: `openspec/changes/<change-name>/traceability.md`（design.md / tasks.md と同階層）
- **生成タイミング**: /spec で spec-writer が生成
- **更新タイミング**: /implement でタスク完了毎に implementer が更新
- **検証**: spec-validator が警告レベルで網羅性チェック（ブロッキングではない）
- **アーカイブ**: /compound で累積スペックに反映し、変更ディレクトリはアーカイブ

### マッピング構造（概要）

```
US-001 → DD-001（設計決定） → T-001（タスク） → TP-001（テスト観点）
                                                  → impl: src/path/to/file.ts
                                                  → test: tests/path/to/file.test.ts
```

## スコープ外（Out of Scope）

- /review でのトレーサビリティ参照・カバレッジ確認: Phase 2 以降で対応 -- YAGNI
- /test でのテスト観点完了マーク: Phase 2 以降で対応 -- YAGNI
- proposal.md への US-ID 自動付与（/brainstorm 変更）: /spec の生成時に付与すれば十分 -- YAGNI
- トレーサビリティの可視化（グラフ・ダッシュボード）: Markdown テーブルで十分 -- YAGNI
- 検証レベルの設定切替（警告↔エラー）: 導入初期は警告固定で十分 -- YAGNI

## 未解決の疑問点（Open Questions）

- 累積スペックへの反映形式: 既存の spec.md にセクション追加するか、別ファイル（traceability.md）として累積するか
- 設計決定（DD-xxx）の粒度: design.md のどの単位を1つの設計決定とするか（セクション？箇条書き項目？）
