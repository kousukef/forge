# Forge 内部最適化（Phase 0a）技術設計

## 概要

Obsidian Vault 統合の前段として、Forge 内部の未活用機能を最適化する。具体的には: (1) compound learnings 防止策の棚卸し、(2) docs/domain/ + docs/inbox/ によるドメイン知識配置場所の新設、(3) Learning Router のドメインルール分類拡張、(4) /brainstorm への docs/domain/ 参照追加、(5) /forge-init コマンドによるソクラテス式知識移転、(6) project-knowledge-writer エージェント定義。

> **除外**: memory/MEMORY.md の初期化は本変更から除外。memory/ は Claude Code のオンデマンドセッション間メモ機能であり、ワークフローで事前に構造化データを配置する用途ではない。プロジェクト基本情報は openspec/project.md（/forge-init で生成）および CLAUDE.md が担う。

## リサーチサマリー

### 公式ドキュメントからの知見

**Claude Code コマンド定義の仕様:**
- `.claude/commands/<name>.md` に YAML frontmatter + Markdown で定義
- `disable-model-invocation: true` でコマンドモードを有効化
- `argument-hint` でタブ補完ヒントを指定
- `$ARGUMENTS` で引数を参照

### Web検索からの知見

**AI コンテキスト管理のベストプラクティス:**
- [Codified Context 論文, 2026] 108,000行のC#システムで実証: ホットメモリ / ウォームメモリ / コールドメモリの3層が最も効果的。本変更では docs/domain/ = ウォーム（/brainstorm 時にオンデマンド参照）、openspec/specs/ = コールドとして機能
- [Anthropic "Effective Context Engineering"]: 「限られたコンテキストウィンドウに何を入れるかの設計」が最重要。docs/domain/ はまさにこの課題への解答
- CLAUDE.md が肥大化すると Claude は指示を無視し始める。「この行を削除したら Claude がミスするか?」テストが有効

**ドメイン知識管理の既知の落とし穴:**
- 空のテンプレートファイル大量生成は運用で放棄される（空ファイル禁止原則で対応済み）
- ドキュメントの更新が開発サイクルから分離すると陳腐化する（/compound でのルーティングで対応）
- 「書くだけ書いて誰も読まない」問題（/brainstorm での明示的参照で対応）

**ソクラテス式対話による知識抽出（実証済み）:**
- [SocraticAgent, 2025] Socratic Critic により +15.84% の精度向上。自己批判メカニズムの効果が学術的に実証
- [Forbes, 2025] ナレッジエリシテーション技術の復活。暗黙知の「トリックオブザトレード」言語化が鍵
- 一度に1質問、選択肢形式が回答率を上げる（既存 /brainstorm パターンと一致）
- 停止条件: 3サイクルで十分。新しい知識が出なくなったら停止

### コードベース分析（既存スペックとの関連含む）

**既存パターンとの整合性:**

| 対象 | 既存パターン | 本変更での踏襲 |
|---|---|---|
| コマンド定義 | `commands/brainstorm.md` (frontmatter + ワークフロー) | forge-init.md を同パターンで実装 |
| エージェント定義 | spec-writer (入力→分析→ドキュメント生成) | project-knowledge-writer を同パターンで実装 |
| Learning Router | `commands/compound.md` (分類テーブル + 閾値ルール) | ドメイン分類テーブルを追加する形で拡張 |
| 引数解析 | `$ARGUMENTS` + argument-hint パターン | forge-init で同パターンを踏襲 |

**影響範囲:**

| ファイル | 変更種別 | 影響 |
|---|---|---|
| `docs/domain/README.md` | 新規 | ドメイン知識配置ガイド |
| `docs/inbox/README.md` | 新規 | 未分類知識退避ガイド |
| `commands/compound.md` | 既存修正 | Learning Router 拡張 + inbox スキャン追加 |
| `commands/brainstorm.md` | 既存修正 | docs/domain/ 参照ステップ追加 |
| `commands/spec.md` | 既存修正 | リサーチフェーズに domain-analyzer を追加 |
| `agents/research/domain-analyzer.md` | 新規 | ドメイン知識分析エージェント定義 |
| `commands/forge-init.md` | 新規 | /forge-init コマンド定義 |
| `agents/research/project-knowledge-writer.md` | 新規 | エージェント定義（`agents/research/` に配置、既存パターン踏襲） |
| `CLAUDE.md`（プロジェクト + グローバル） | 既存修正 | Available Agents テーブル更新 |

**関連する既存スペックの要件:**
- `specs/workflow-redesign/spec.md`: spec-writer のパターン（project-knowledge-writer が踏襲）
- `specs/command-args/spec.md`: argument-hint パターン（forge-init が踏襲）
- `specs/commit-workflow/spec.md`: /compound の学習ソース定義（Learning Router 拡張に影響）

### 過去の学び

**4件の compound learnings から抽出された教訓:**

1. **同期漏れが3回言及（3 Strikes）**: `2026-02-18-agent-teams-workflow-redesign.md`、`2026-02-22-change-commit-timing.md`、`2026-02-18-add-command-arguments.md` の3件で「プロジェクト/グローバル同期漏れ」が繰り返し報告。手動同期は確実に漏れるため、運用上の注意が必要

2. **ドキュメント整合性チェックの自動化が未実施**: `2026-02-18-agent-teams-workflow-redesign.md` で「ドキュメント整合性チェックの自動フック（将来検討）」が未実施のまま。→ 今回のスコープ外（記録のみ）

3. **概念変更の横断検索**: `2026-02-22-change-commit-timing.md` で「概念変更は横断 Grep で検証」が提案されたが、spec-compliance-reviewer への組み込みは未実施。→ 今回のスコープ外だが、棚卸し結果として記録

4. **description 3部構成形式**: `2026-02-24-add-domain-skills.md` で確立されたスキルの description 形式。project-knowledge-writer の description も同形式で記述する

**未実施の防止策一覧（棚卸し結果）:**

| 出典 | 防止策 | 状態 | 本変更での対応 |
|---|---|---|---|
| 2026-02-18 agent-teams | ドキュメント整合性チェック自動フック | 未実施 | スコープ外（記録のみ） |
| 2026-02-18 command-args | 同期確認を検証ステップに明示追加 | 未実施 | スコープ外（記録のみ） |
| 2026-02-22 commit-timing | /implement 完了ステップに同期確認 | 未実施 | スコープ外（記録のみ） |
| 2026-02-22 commit-timing | spec-validator に YAGNI セキュリティチェック | 未実施 | スコープ外（記録のみ） |
| 2026-02-22 commit-timing | spec-compliance-reviewer に横断 Grep 検証 | 未実施 | スコープ外（記録のみ） |
| 2026-02-24 domain-skills | description 3部構成形式チェックテンプレート | 未実施 | スコープ外（記録のみ） |
| 2026-02-24 domain-skills | spec-writer にスタック適合性マトリクス | 未実施 | スコープ外（記録のみ） |
| 2026-02-24 domain-skills | spec-validator に MCP セキュリティチェック | 未実施 | スコープ外（記録のみ） |
| 2026-02-24 domain-skills | security-sentinel に MCP チェック項目 | 未実施 | スコープ外（記録のみ） |

## 技術的アプローチ

### 1. docs/domain/ + docs/inbox/

**空ファイル禁止原則を徹底**: README.md のみ初期配置。実際の知識ファイルは /forge-init 実行時に情報が収集された領域のみ生成する。

**docs/domain/ の構造:**
```
docs/domain/
  README.md          -- 配置ガイド（初期配置）
  business-rules.md  -- /forge-init または /compound で生成
  domain-model.md    -- /forge-init または /compound で生成
  stakeholders.md    -- /forge-init または /compound で生成
  tech-constraints.md -- /forge-init または /compound で生成
  runbooks/          -- /forge-init または /compound で生成
```

### 2. Learning Router ドメイン分類拡張

既存の compound.md の Learning Router セクションに、ドメイン分類テーブルを追加する。既存の技術的分類テーブルはそのまま維持し、ドメイン分類テーブルを「追加」する形で拡張する。

**ルーティング優先順位**:
1. 技術的分類テーブル（既存）に該当 → 既存ルーティング
2. ドメイン分類テーブル（新規）に該当 → docs/domain/ 配下にルーティング
3. どちらにも該当しない → docs/inbox/ にルーティング

### 3. /forge-init コマンド

**設計判断**: 5フェーズ構成は単一コマンドとしては大きいが、以下の理由で単一コマンドとして実装する:
- ユーザー体験: 「/forge-init」一発で完結する方が直感的
- フェーズ間の情報受け渡し: Phase 1 の自動分析結果が Phase 3-4 の質問生成に影響
- proposal.md の「5フェーズ構成は単一コマンドとしては大きい」という Open Question への回答: フェーズごとの段階的完成を実現するため、各フェーズの完了時にユーザーに進捗を表示し、「次のフェーズに進みますか？」の確認を挟む

**エージェント起動方式**: /forge-init のコマンド定義内で、Phase 1 は codebase-analyzer を Sub Agent として起動、Phase 5 は project-knowledge-writer を Sub Agent として起動する。Phase 2-4 は Main Agent が直接対話を実施する（ソクラテス式対話は Main Agent の責務）。

### 4. domain-analyzer エージェントと /spec 統合

`/spec` のリサーチフェーズに5番目のリサーチャーとして domain-analyzer を追加する。

**根拠**: `/brainstorm` は要件レベルの議論であり、proposal.md には要件を裏付けるドメイン知識のみが含まれる。しかし `/spec` で正確な Error Scenarios（ビジネスルール違反時）、Boundary Scenarios（ドメインモデル制約値）、NFR（技術的制約・SLA）を定義するには、ドメイン知識の専門的な分析が必要。discussion-report で「/spec での Vault 参照は不採用」とされたのは外部ナレッジベース（Obsidian）の話であり、プロジェクト内部の docs/domain/ 参照は異なる判断。

**設計判断: codebase-analyzer との責務分離**:
- codebase-analyzer: コード構造・パターン・依存関係・影響範囲（ソースコードが入力）
- domain-analyzer: ドメイン制約・ビジネスルール・境界値条件（docs/domain/ が入力）
- 同一エージェントに両方の責務を持たせると、分析の焦点がぼやけるため分離する

**実装方式**:
- Sub Agents モード: 既存4リサーチャーと並列で domain-analyzer を起動（計5並列）
- Teams モード: 6 teammate 構成（既存5 + domain-analyzer）
- domain-analyzer の出力: Error Scenarios 候補、Boundary Scenarios 候補、NFR 候補の3カテゴリ
- docs/domain/ が存在しない場合は「/forge-init の実行を推奨」と報告してスキップ

### 5. project-knowledge-writer エージェント定義

既存の spec-writer のパターン（入力→分析→ドキュメント生成）を踏襲する。

**入力**: Phase 1-4 の収集データ（構造化テキスト）
**出力**: `openspec/project.md`, `docs/domain/` 配下のファイル群
**カバレッジマトリクス**: K1-K15 の各領域の情報有無を追跡し、最終レポートに含める

**エージェント定義の frontmatter**（公式ドキュメント調査結果に基づく）:
```yaml
---
name: project-knowledge-writer
description: "When /forge-init generates domain knowledge documents. Provides structured docs/domain/ file generation from collected knowledge data (Phase 1-4). MUST be invoked during /forge-init Phase 5 document generation."
tools: [Read, Write, Edit, Glob, Grep]
permissionMode: bypassPermissions
skills: [iterative-retrieval, verification-before-completion]
---
```
- `tools`: Write/Edit を含む（ドキュメント生成が主務）
- `description`: 3部構成トリガー条件形式（When/Provides/MUST）に従う
- `skills`: 段階的取得と完了前検証を指定

## リスクと注意点

### 1. /forge-init の実行時間

**リスク**: 5フェーズの対話型コマンドは長時間のセッションになる可能性
**対応**: 各フェーズ完了時に進捗表示と「次に進むか」の確認を挟む。Phase 4（深掘り）はオプションで、ユーザーが即座にスキップ可能

### 2. docs/domain/ の陳腐化

**リスク**: 一度生成されたドメイン知識が更新されず、古い情報が残る
**対応**: /compound の Learning Router でドメイン知識を継続的に更新するルーティングを追加。ただし、明示的な陳腐化検出メカニズムは Phase 0a では導入しない（YAGNI）

### 3. compound.md の複雑化

**リスク**: Learning Router にドメイン分類テーブル + inbox スキャンステップを追加することで、compound.md が複雑になる
**対応**: 追加は既存の分類テーブル・ステップの「後に」配置し、既存ロジックを変更しない。拡張のみ

### 4. グローバル/プロジェクト同期の構造的問題（codebase-analyzer 発見事項）

**リスク**: 現在 Forge コマンドはプロジェクト側（`forge/commands/`）にのみ配置。グローバル側（`~/.claude/commands/`）には `code-review.md` と `figma-review.md` のみ存在し、Forge コマンドは存在しない。CLAUDE.md では両方の同期を前提としているが実態はプロジェクト側のみの運用
**対応**: CLAUDE.md の更新時は手動で両方のファイルを同一内容に更新する。プロジェクト側のみに存在するファイルは同期対象外とする（意図的にプロジェクト側のみの運用が選択されている可能性があるため）
