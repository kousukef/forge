# enhance-learning-feedback-loop 提案書

## 意図（Intent）

Forge の Experiential Learning システムには即時フィードバックループが欠落している。`/compound` → `/crystallize` → rules/skills 昇格のパスは手動で遅く、「今日の実装で踏んだ落とし穴を来週の実装者が知らない」問題が解決されていない。

OpenSpace の「実行前スキル注入」と「実行後の自動分類」の知見を、既存の Experiential Learning システムに統合し、implementer レベルでの即時的な学習フィードバックループを構築する。

## スコープ（Scope）

### ユーザーストーリー

1. ユーザーとして、implementer が実装後に学びを FIX/DERIVED/CAPTURED/NONE で構造化分類し、即座に experiential logs に書き込んでほしい。なぜなら、`/compound` を待たずに学びを蓄積したいから。
   - 検証観点: implementer の Phase B 完了後に `~/.claude/docs/experiential/logs/` にシグナルエントリが追記されているか

2. ユーザーとして、implementer が実装開始前に過去のシグナル（特に FIX/CORRECTION）を参照してほしい。なぜなら、過去に躓いた箇所を知らずに同じ落とし穴を踏むことを防ぎたいから。
   - 検証観点: implementer の Spec Interpretation Log に「参照したシグナル」セクションが記載されるか（該当シグナルがない場合は「該当なし」）

3. ユーザーとして、`/crystallize` が同一スキルへの FIX シグナル蓄積を検出して優先的に昇格対象としてほしい。なぜなら、繰り返し躓く箇所のルール化を加速したいから。
   - 検証観点: `/crystallize` のパターン抽出結果で FIX 集積度の高いスキルが上位に表示されるか

### 対象領域

- `agents/implementation/implementer.md`（Phase B シグナル分類 + pre-flight ステップ追加）
- `commands/crystallize.md`（Phase 2 に FIX 集積度による優先度付け追加）
- シグナルエントリのフォーマット定義（既存 experiential logs 内の新 type）

## スコープ外（Out of Scope）

- **signals/ ディレクトリの新設**: experiential/logs/ に統合する。管理対象を増やさない -- YAGNI
- **JSONL フォーマットの導入**: Forge のマークダウン統一を維持する -- YAGNI
- **reviewer の CAPTURED 記録追加**: Review Learning Loop が review-gap を記録済み。有益パターンは `/compound` の Learning Router が抽出済み -- YAGNI
- **compound とシグナルの連携変更**: シグナルと複利ドキュメントは独立。重複は異なる視点からの記録として許容。`/crystallize` が両方を参照する -- YAGNI

## 技術的考慮事項（Technical Considerations）

- FIX/DERIVED/CAPTURED は既存の 6 タグ（CORRECTION, PATTERN, INSIGHT 等）と自然にマッピングされる。新分類体系ではなく `related_skill` フィールドの追加で「どのスキルへのフィードバックか」を表現する
- implementer はサブエージェントのため compound-learnings-researcher を起動できない（ネスト不可の制約）。pre-flight は implementer 自身の Grep で完結させる
- シグナルエントリは `type: signal` として既存の compound/nurture と並列に配置。`/crystallize` の Phase 1 データ収集は既に全 `.md` を Glob しているため、追加の収集ロジック不要

## 未解決の疑問点（Open Questions）

- シグナルエントリの軽量フォーマットの詳細（フロントマターの最小フィールドセット）は `/spec` で設計
- pre-flight の Grep パターン（related_skill vs 技術スタック名 vs フリーテキスト）の詳細は `/spec` で設計
- `/crystallize` Phase 2 での FIX 集積度の閾値（何件から「優先」とするか）は `/spec` で設計
