# Forge 内部最適化（Phase 0a）提案書

## 意図（Intent）

Obsidian Vault 統合を検討する中で、19エージェント・4ラウンドの多角的議論により「Forge 既存機能の未活用部分を先に最適化すべき」という結論に至った。具体的には、memory/ が未使用、同期漏れが繰り返し課題として言及（compound learnings 4件中3件）、プロジェクト固有ドメイン知識の明示的な配置場所が不在、AI への体系的な知識移転手段がない、という4つの課題がある。

これらの課題を解決し、Forge 内部の知識管理基盤を強化することで、将来的な Obsidian 統合の判断材料（Phase 0b 効果測定）を得る土台を整える。

## スコープ（Scope）

### ユーザーストーリー

1. 開発者として、セッション開始時に memory/ からプロジェクト基本情報を参照したい。なぜなら、毎回コンテキストを再構築する時間を短縮したいから。

2. 開発者として、プロジェクト/グローバル間の設定差分を自動検出したい。なぜなら、同期漏れが compound learnings で繰り返し報告されており、手動では見落とすから。

3. 開発者として、過去の compound learnings で提案された防止策の実施状況を棚卸ししたい。なぜなら、学びから得た改善が未実施のまま放置されているから。

4. 開発者として、プロジェクト固有ドメイン知識の明示的な配置場所（docs/domain/）がほしい。なぜなら、ビジネスルール・ドメインモデル・技術的制約等の知識が散在しており、AI が /brainstorm 時に参照できないから。

5. 開発者として、未分類知識の一時退避場所（docs/inbox/）がほしい。なぜなら、「まだ分類できない知識」の行き場がなく、記録自体が行われないから。

6. 開発者として、/compound 実行時にドメインルール（ビジネスルール、規制等）も自動分類してほしい。なぜなら、現行は技術的学び（gotcha, ADR, metrics）のルーティングのみで、ドメイン知識が分類対象外になっているから。

7. 開発者として、/brainstorm 時に docs/domain/ の情報も参照してほしい。なぜなら、ドメイン知識に基づいた高品質な提案を生成したいから。

8. 開発者として、既存プロジェクトに Forge を導入する際にソクラテス式対話で AI にドメイン知識を移転したい（/forge-init）。なぜなら、AI が実装する以上、人間が知っているだけでは不十分であり、docs/domain/ が空のままでは AI は活用できないから。

### 対象領域

- `memory/MEMORY.md` -- セッション間メモリの初期化
- `.claude/hooks/` -- 同期チェックフックの追加
- `docs/compound/` -- 既存 learnings の防止策棚卸し
- `docs/domain/` -- 新規ディレクトリ（ビジネスルール、ドメインモデル、ステークホルダー要件、技術的制約、運用知識の配置場所）
- `docs/inbox/` -- 新規ディレクトリ（未分類知識の一時退避）
- `.claude/commands/compound.md` -- Learning Router のドメインルール分類追加
- `.claude/commands/brainstorm.md` -- docs/domain/ 参照ステップ追加
- `.claude/commands/forge-init.md` -- 新規コマンド（ソクラテス式質問による AI への知識移転）
- `.claude/agents/` -- project-knowledge-writer エージェント定義（/forge-init 用）

## スコープ外（Out of Scope）

- **Obsidian インストール・Vault 構造作成**: Phase 0b の効果測定結果に基づいて判断（YAGNI）
- **MCP 接続設定**: Phase 2 の PoC で技術的実現可能性を検証してから着手（YAGNI）
- **/vault-search コマンド**: MCP 接続が前提のため Phase 2 で実装（YAGNI）
- **/compound の Vault 還元パイプライン**: Phase 3 で実装（YAGNI）
- **/compound --close（プロジェクト完了モード）**: Phase 3 で設計・実装（YAGNI）
- **openspec/project.md の自動生成**: /forge-init の Phase 1（自動分析）で生成されるため、ここでは作成しない
- **/spec, /review, /implement への Vault 参照追加**: ディスカッションレポートで不採用と結論済み

## 技術的考慮事項（Technical Considerations）

- **同期チェックフック**: プロジェクトレベル（`.claude/hooks/`）とグローバルレベル（`~/.claude/hooks/`）の設定ファイル間の diff 検出が対象。hooks は既存のフック定義パターンに従う
- **Learning Router 拡張**: 既存の compound コマンド内の分類ロジックを拡張する形で実装。新しいルーティング先（docs/domain/ 配下の各ファイル）を追加
- **/forge-init の codebase-analyzer 再利用**: 既存の codebase-analyzer Agent を Phase 1（自動分析）で活用。新規エージェント（project-knowledge-writer）は Phase 5（ドキュメント生成）用に作成
- **空ファイル禁止原則**: docs/domain/ 配下には README.md（配置ガイド）のみ初期配置。実際のドメイン知識ファイルは /forge-init 実行時に情報が収集された領域のみ生成する

## 未解決の疑問点（Open Questions）

- **docs/compound/ 棚卸しの完了基準**: 防止策の「実施済み」をどう検証するか。compound learnings の内容を実際に読まないと範囲が確定しない（ストーリー品質 Warn: Testable/Small）
- **/forge-init の粒度**: 5フェーズ構成（自動分析→ソース提供→コア質問→深掘り→ドキュメント生成）は単一コマンドとしては大きい。実装時にフェーズごとの段階的な完成を検討する必要がある（ストーリー品質 Warn: Small）
- **同期チェックフックの対象範囲**: プロジェクト/グローバル間の diff 検出の具体的な対象ファイル・パスパターンは /spec で詳細化する
- **Phase 0b への移行判断**: Phase 0a 完了後、効果測定期間（2週間）の運用ルール（「案件横断知識が欲しかった場面」の記録方法等）は Phase 0a 完了時に策定する
