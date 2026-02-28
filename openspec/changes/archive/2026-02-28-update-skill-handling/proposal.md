# update-skill-handling 提案書

## 意図（Intent）

Forge システムの Skill 管理を Phase-Aware File Structure に進化させる。現在、全フェーズ（`/brainstorm`, `/spec`, `/implement`, `/review`）で SKILL.md 全文（~500行/Skill）がコンテキストに注入されるが、brainstorm では制約事実のみ、spec では設計指針のみが必要であり、不要な知識がコンテキストを圧迫している。ドメイン Skill をフェーズ別ファイル（SKILL.md / design.md / constraints.md）に物理分割し、フェーズに応じた粒度の知識のみを提供することで、コンテキスト効率を最大80%改善する。さらに、spec-validator の検証観点拡張（STRIDE、Google 4観点、Last Responsible Moment）、review の L1/L2 自動チェック・リスクベース深度調整、compound のフィードバックループ強化（Three Strikes Rule、Shift-Left 分類、メトリクス蓄積）を統合的に実施する。

## スコープ（Scope）

### ユーザーストーリー

- 開発者として、`/spec` フェーズで Skill の設計指針だけを注入してほしい。なぜなら、実装コード例やチェックリストは spec 段階では不要で、コンテキストを圧迫するから。
- 開発者として、`/brainstorm` フェーズで技術的制約のみを最小限参照してほしい。なぜなら、実現不可能な要件を確定段階で排除したいが、設計パターンの詳細で自由な発想を妨げたくないから。
- 開発者として、Skill の分割・同期を標準化されたコマンドで実行したい。なぜなら、手動分割では品質がばらつき、SSOT（Single Source of Truth）の原則が崩れるから。
- 開発者として、`/spec` で生成された仕様にセキュリティ設計の妥当性チェック（STRIDE）が含まれてほしい。なぜなら、セキュリティ設計の欠陥は後段フェーズで発見するとコストが高いから。
- 開発者として、`/review` で型チェック・Lint の自動チェックが先に実行されてほしい。なぜなら、LLM レビュアーが検出済みの単純な問題を再指摘するのは非効率だから。
- 開発者として、`/review` で変更のリスクレベルに応じてレビュアー構成を動的に調整してほしい。なぜなら、CSS のみの変更に全レビュアーを起動するのはコスト過多だから。
- 開発者として、`/compound` で繰り返し発生する問題が自動的にプロセス改善提案につながってほしい。なぜなら、同じ問題を何度も手動で対処するのは非効率だから。

### 対象領域

#### Phase 1: 基盤整備 + Skill 分割

| # | 内容 | 変更対象 |
|---|---|---|
| 1 | `skill-phase-formatter` Skill 新規作成 | `~/.claude/skills/skill-phase-formatter/SKILL.md`（新規） |
| 2 | `/skill-format` コマンド新規作成 | `~/.claude/commands/skill-format.md`（新規） |
| 3 | 主要ドメイン Skill 9個のファイル分割実行 | 各 Skill ディレクトリに `design.md` + `constraints.md`（新規 x18） |
| 4 | `forge-skill-orchestrator` にファイルサフィックス判定追加 | `~/.claude/skills/forge-skill-orchestrator/SKILL.md`（変更） |

#### Phase 2: フェーズ別 Skill 注入

| # | 内容 | 変更対象 |
|---|---|---|
| 5 | spec-writer にドメイン Skill 注入 | `~/.claude/agents/spec/spec-writer.md`（変更） |
| 6 | `/spec` コマンドにドメイン判定ロジック追加 | `~/.claude/commands/spec.md`（変更） |
| 7 | spec-validator に STRIDE + Google 4観点追加 | `~/.claude/agents/spec/spec-validator.md`（変更） |
| 8 | `/review` に L1/L2 自動チェック追加 | `~/.claude/commands/review.md`（変更） |
| 9 | Review Agent 6個にドメイン Skill 宣言追加 | 各 Review Agent 定義（変更 x6） |

#### Phase 3: フィードバックループ + 検証強化

| # | 内容 | 変更対象 |
|---|---|---|
| 10 | spec-validator に Last Responsible Moment チェック追加 | `~/.claude/agents/spec/spec-validator.md`（変更） |
| 11 | `/compound` に派生ファイル同期ロジック追加 | `~/.claude/commands/compound.md`（変更） |
| 12 | `/review` にリスクベース深度調整追加 | `~/.claude/commands/review.md`（変更） |
| 13 | `/compound` に Three Strikes Rule + Shift-Left 分類追加 | `~/.claude/commands/compound.md`（変更） |
| 14 | `/compound` にレビューメトリクス蓄積追加 | `~/.claude/commands/compound.md`（変更） |
| 15 | `/brainstorm` に constraints.md 参照追加 | `~/.claude/commands/brainstorm.md`（変更） |

## スコープ外（Out of Scope）

- **`/implement` の変更**: 既存のドメイン Skill 注入メカニズムを維持。SKILL.md 全体読み込みのまま -- YAGNI
- **`/ship` の変更**: 各コマンドの変更が自動的に反映される -- YAGNI
- **方法論 Skill のファイル分割**: フェーズ固有の知識差がない -- YAGNI
- **ユーティリティ Skill のファイル分割**: フェーズ横断で同一内容を使用 -- YAGNI
- **50行以下の軽量 Skill のファイル分割**: 分割効果が限定的 -- YAGNI
- **Skill Dependency Graph**: Over-engineering
- **Conditional Skill Loading**: ファイル分割で代替済み
- **implement-orchestrator の変更**: 将来の改善対象
- **build-error-resolver の変更**: 将来の改善対象
- **type-safety-reviewer への Skill 追加**: 横断的関心事で特定ドメイン Skill に依存しない
- **review-aggregator の変更**: 入力フォーマットの変更なし

## 未解決の疑問点（Open Questions）

- なし（v3 提案書での検討で解消済み）
