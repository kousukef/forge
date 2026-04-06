# update-knowledge-system 提案書

## 意図（Intent）

Forge の学びの記録システムには2つの課題がある:

1. **ワークフロー外の学び消失**: `/brainstorm` → `/compound` のパイプライン外で行われる壁打ち・修正指示・設計議論から生じる暗黙知が記録されず消失している
2. **プロジェクト横断パターンの検出不能**: 経験ログがプロジェクト単位（`docs/compound/`）に分散しており、複数プロジェクトにまたがる共通パターンを発見できない

NFD（Nurture-First Development）論文の知見を Forge に統合し、全対話からの経験蓄積 → 結晶化 → rules/skills/hooks への昇格という知識成長サイクルを構築する。併せて、`reference/` の手動読み込み指示を `.claude/rules/` の `paths` フロントマターによる自動ロードに移行する。

## スコープ（Scope）

### ユーザーストーリー

1. ユーザーとして、全プロジェクトの経験ログを一箇所（`~/.claude/docs/experiential/logs/`）に蓄積したい。なぜなら、プロジェクト横断のパターンを発見できるようにしたいから。
   - 検証観点: `/compound` 実行後に指定ディレクトリにログファイルが生成されるか（実プロジェクトで手動検証）

2. ユーザーとして、Forge ワークフロー外の対話でも学びを自動記録したい。なぜなら、壁打ちや修正指示で生じる暗黙知が消失しているから。
   - 検証観点: ワークフロー外の対話で経験ログが記録されるか（実プロジェクトで手動検証）

3. ユーザーとして、`/crystallize` でパターン抽出 → 人間レビュー → rules/skills/hooks に昇格させたい。なぜなら、学びが実際のコード品質改善に自動的に反映されるようにしたいから。
   - 検証観点: `/crystallize` 実行でパターン候補が提示され、承認後に対象ファイルに反映されるか（実プロジェクトで手動検証）

4. ユーザーとして、結晶化された知識に仮説検証ループを適用したい。なぜなら、知識品質を継続的に向上させたいから。
   - 検証観点: 結晶化された知識の confidence スコアが経験に基づいて更新されるか（実プロジェクトで手動検証）

5. ユーザーとして、`/compound` 実行時に未結晶化ログの件数を確認し、結晶化タイミングを通知してほしい。なぜなら、結晶化の適切なタイミングを逃したくないから。
   - 検証観点: `/compound` 実行時に未結晶化件数の通知が表示されるか（実プロジェクトで手動検証）

6. ユーザーとして、`reference/` のルールを `.claude/rules/` に移行して自動ロードさせたい。なぜなら、手動読み込み指示の見落としを排除したいから。
   - 検証観点: `paths` 付きルールが対象ファイル操作時のみロードされるか（実プロジェクトで手動検証）

7. ユーザーとして、既存の `docs/compound/` データの移行手順を知りたい。なぜなら、一元化後に既存の学びも活用したいから。
   - 検証観点: 手順に従って既存データが正しく移行できるか（ユーザーが実行判断）

### 対象領域

- `/compound` コマンド定義（出力先変更 + 結晶化チェック追加）
- compound-learnings-researcher エージェント（検索対象変更）
- USER-CLAUDE.md（Nurturing Protocol 追加）
- CLAUDE.md（Compound Learning → Experiential Learning 更新）
- `/crystallize` コマンド定義（新規）
- `reference/` → `.claude/rules/` 移行
- マイグレーション手順ドキュメント

## スコープ外（Out of Scope）

- **自動結晶化（エージェント主導）**: NFD 論文自身が「半手動が現実的」と認めている。人間レビュー必須を維持 -- YAGNI
- **別立ての知識ストア（Obsidian Vault 等）**: rules/skills/hooks に集約する方が維持コストが低く、自動参照が確実 -- YAGNI
- **Temporal Decay（時間減衰）**: `crystallized: true/false` フラグで十分。古い経験もパターン抽出の母集団として価値がある -- YAGNI
- **既存データの自動マイグレーション**: 手順提供のみ。実行はユーザー判断
- **ワークフローコマンドの変更**: `/brainstorm`, `/spec`, `/implement`, `/review`, `/test`, `/ship` は変更しない
- **既存スキル・エージェント定義の構造変更**: 結晶化の出力先として使われるが、構造自体は変えない

## 技術的考慮事項（Technical Considerations）

- 経験ログの配置先 `~/.claude/docs/experiential/` は Claude Code のメモリシステム（`~/.claude/projects/*/memory/`）とは別目的。メモリは Claude の自動機能、経験ログは結晶化の原料
- NFD の三層認知アーキテクチャとの対応: Constitutional Layer = CLAUDE.md + rules（paths なし）/ Skill Layer = skills + rules（paths 付き）/ Experiential Layer = experiential/logs/
- 6タグ分類体系（`[CORRECTION]`, `[INSIGHT]`, `[DECISION]`, `[PATTERN]`, `[ERROR]`, `[CONTEXT]`）は NFD 論文の6カテゴリに基づく。初日から全タグを導入
- `/crystallize` の昇格先は既存の Learning Router と同一（rules/skills/hooks/agents/commands）
- `paths` フロントマターはプロジェクトレベルではディレクトリ glob、ユーザーレベルでは拡張子・ファイル名 glob のみ使用

## 未解決の疑問点（Open Questions）

- `reference/` → `.claude/rules/` の移行対象ファイルの最終決定（`/spec` で `reference/` の全体構成を確認して確定）
- Nurture ログの記録タイミングの詳細設計（リアルタイムが理想、セッション終了時のバッチでも品質が同等なら許容）
- `/crystallize` の `--scope` フィルタの詳細仕様（`/spec` で設計）
- 仮説検証ループの confidence 更新ロジックの詳細（`/spec` で設計）
- マイグレーション戦略の Phase 分割の最終確定（提案書の6章を基に `/spec` で詳細化）
