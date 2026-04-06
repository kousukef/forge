# enhance-learning-feedback-loop 技術設計

## 概要

implementer エージェントに即時的な学習フィードバックループを構築する。(1) 実装後のシグナル分類と experiential logs への即時書き込み、(2) 実装前の過去シグナル参照、(3) `/crystallize` での FIX 集積度による優先度付け。既存の Experiential Learning システムに統合し、新規ストレージやフォーマットを導入しない。

## リサーチサマリー

### 公式ドキュメントからの知見

1. **implementer のツール権限**: `tools: [Read, Write, Edit, Bash, Glob, Grep]` + `permissionMode: bypassPermissions` により、`~/.claude/docs/experiential/logs/` への Read/Write/Grep が制約なく可能
2. **サンドボックス制限**: `denyRead` は `~/.aws/credentials` と `~/.ssh/id_*` のみ。`~/.claude/docs/` はネイティブツールから完全アクセス可能
3. **`/crystallize` Phase 1**: 全 `.md` を Glob で取得するため、`type: signal` エントリは収集ロジック変更なしで自動的に取得される
4. **ルール自動ロード**: `.claude/rules/` の `description` フロントマター必須、`paths` はオプション。結晶化で生成されるルールもこの形式に従う

### Web検索からの知見

1. **OpenSpace の FIX/DERIVED/CAPTURED**: GitHub HKUDS/OpenSpace (v0.1.0, 3,998 stars) で実装済み。FIX = 既存スキルの修正、DERIVED = 既存の特化版、CAPTURED = 新発見のパターン。Forge の既存 6 タグ（CORRECTION, PATTERN, INSIGHT）と 1:1 マッピング可能
2. **46% トークン削減の実態**: GDPVal ベンチマーク Phase 2（warm rerun）でスキル蓄積後に再実行した結果。スキルが検証済み手順を提供するため、エージェントがゼロから推論しなくなる
3. **Progressive disclosure**: OpenSpace はスキルヘッダー（ID + description + 品質統計）のみを選択 LLM に提示し、フル内容は選択後にロード。Forge の pre-flight でも「サマリーのみ参照、フル内容は不要」が適切
4. **Max 2-3 スキル注入**: OpenSpace の `max_skills=2` は過剰注入による逆効果を防ぐ。Forge の pre-flight も「直近 5 件の FIX シグナル要約のみ」で制限
5. **最も価値あるスキルは実行パターン**: OpenSpace の 165 スキル中、最大カテゴリは File Format I/O (44) と Execution Recovery (29)。ドメイン知識よりもエラー回復パターンが効果的

### コードベース分析（既存スペックとの関連含む）

**既存パターンとの整合性**:
- シグナルエントリフォーマット: 既存の compound (`type: compound`) / nurture (`type: nurture`) と並列の `type: signal`。YAML フロントマター + Markdown 本文の統一形式
- 挿入ポイント: implementer.md の Phase B は行 101-122。振り返りセクション後に追加。pre-flight はステップ 2-3 間
- エラーハンドリング: graceful degradation パターン（失敗はスキップ、主処理をブロックしない）を踏襲

**影響範囲**:

| カテゴリ | ファイル | 変更内容 |
|---|---|---|
| 直接変更 | `agents/implementation/implementer.md` | Phase B シグナル分類 + pre-flight ステップ + COMPLETION CRITERIA |
| 直接変更 | `commands/crystallize.md` | Phase 1 サマリー + Phase 2 FIX 集積度 |
| 間接影響 | `commands/implement.md` | COMPLETION CRITERIA テンプレート |
| 間接影響 | `agents/orchestration/implement-orchestrator.md` | COMPLETION CRITERIA テンプレート |
| 間接影響 | `agents/research/compound-learnings-researcher.md` | signal type フィルタリング |
| 間接影響 | `agents/implementation/spec-compliance-reviewer.md` | Phase B チェック項目 |

**関連する既存スペック**:
- `update-knowledge-system` REQ-006: `/crystallize` Phase 1 で `type: compound` と `type: nurture` を明示列挙。`type: signal` の追加が必要（本変更の REQ-005 で対応）
- `update-knowledge-system` REQ-008: compound-learnings-researcher のフィルタリング基準。signal type 追加が必要（本変更の REQ-006 で対応）

### 過去の学び

1. **ファイル間整合性テーブルが必須**: 複数 Markdown ファイル変更では不整合が発生しやすい（traceability 導入時に数値の更新漏れが発生）→ 本設計に整合性テーブルを含める
2. **横断残存チェックが不可欠**: agent 定義変更時は全パターン grep で影響ファイルを列挙する（domain-skills 除去時に 11 ファイルの修正漏れを捕捉）→ 最終タスクに横断チェックを含める
3. **implementer の仕様見落としは実証済みの繰り返しパターン**: chiikizukan-admin で 6 フェーズ連続発生。参考実装コピー時の仕様差分見落としが主因 → pre-flight ステップの正当性を裏付け
4. **design.md の「過去の学び」セクションは 5 フェーズ連続で有効機能**: compound-learnings-researcher → spec-writer → design.md の転記が安定動作 → フィードバックループ全体の有効性が実証済み
5. **概念変更は横断検索で検証**: 新概念（`type: signal`, `signal_class`）導入時は全ドキュメントでの一貫記述が必要 → 横断チェックタスクに概念検索を含める

## 技術的アプローチ

### DD-001: シグナルエントリの設計

**方針**: 既存の compound/nurture エントリより大幅に軽量化。implementer が TDD 完了後に素早く記述・書き込みできることを優先する。

| 項目 | compound エントリ | signal エントリ |
|---|---|---|
| フロントマター | 12 フィールド | 8 フィールド |
| 本文 | 5 セクション（状況・原因・解決・教訓・防止策） | 2 セクション（コンテキスト・学び） |
| 書き込みタイミング | `/compound` 実行時 | implementer Phase B 完了時（即時） |
| 書き込み者 | Main Agent | implementer サブエージェント |

**ファイル命名**: `YYYY-MM-DD-<project>-signals.md` -- 1 日 1 ファイル/プロジェクト。nurture ログと同じ日次集約パターン。複数エントリは `---` 区切りで追記。

**ID 体系**: `sig-NNNN`（ファイル内連番）。compound の `exp-NNNN` と名前空間を分離し、型で識別可能にする。

### DD-002: implementer pre-flight の設計

**方針**: 最小コストで最大効果。Grep 1 回で完結し、コンテキストウィンドウへの影響を最小化する。

**検索戦略**:
1. `~/.claude/docs/experiential/logs/` 内の全ファイルで `signal_class: FIX` を Grep
2. マッチした行の周辺コンテキスト（ファイル名、`related_skill`、`# ` 見出し行）を取得
3. 直近 5 件のみ参照（日付降順）
4. 技術スタックの一致で関連性を判断（厳密なセマンティック判定は不要）

**Spec Interpretation Log への記載形式**:
```markdown
## 参照したシグナル

| 日付 | プロジェクト | related_skill | 学び |
|---|---|---|---|
| 2026-03-24 | my-app | Prisma | N+1 クエリに注意 |

※ 上記シグナルを踏まえて以下の仕様解釈に反映済み
```

0 件の場合: `## 参照したシグナル\n該当なし`

### DD-003: /crystallize FIX 集積度スコアリング

**方針**: 既存の Phase 2 抽出観点に 5 番目として追加。既存観点を変更しない。

**スコアリングロジック**:
1. Phase 1 で収集した signal エントリの `related_skill` を集計
2. 同一 `related_skill` への FIX シグナルが 3 件以上 → 高優先度フラグを付与
3. Phase 2 のパターン候補生成時、高優先度フラグ付きの `related_skill` 関連パターンを候補リストの上位に配置
4. パターン候補の `evidence_count` に FIX シグナル数を加算

**閾値**: 3 件（既存の Learning Router「3回ルール (Three Strikes)」と整合）

### DD-004: フォーマット定義の配置

シグナルエントリフォーマットは `commands/compound.md` の「複利ドキュメント形式」セクション付近に `### シグナルエントリ形式` として追加する。理由:
- compound.md が experiential logs のフォーマット定義の Single Source of Truth
- implementer.md からは「compound.md のシグナルエントリ形式に従う」と参照

## ファイル間整合性テーブル

| 参照元 | 参照内容 | 整合性チェックポイント |
|---|---|---|
| `implementer.md` Phase B | シグナル分類セクション | `compound.md` のシグナルエントリ形式と一致 |
| `implementer.md` pre-flight | Grep 対象パス | `~/.claude/docs/experiential/logs/` （compound.md 出力先と同一） |
| `implementer.md` COMPLETION CRITERIA | 新規チェック項目 | `implement.md` / `implement-orchestrator.md` のテンプレートと一致 |
| `crystallize.md` Phase 1 サマリー | `signal: Z 件` 表示 | `type: signal` の YAML フロントマター形式と一致 |
| `crystallize.md` Phase 2 | FIX 集積度閾値 3 件 | Learning Router の「3回ルール」と整合 |
| `compound-learnings-researcher.md` | signal type フィルタリング | `compound.md` のシグナルエントリ形式と一致 |
| `spec-compliance-reviewer.md` | Phase B チェック | `implementer.md` のシグナル分類セクション形式と一致 |

## 受入テスト計画

### US-001: implementer がシグナル分類を記述する

- **テストレベル**: L3（手動検証）
- **GIVEN** implementer がタスクの TDD サイクルを完了した **WHEN** Phase B の Spec Interpretation Log を確認する **THEN** シグナル分類セクション（signal_class, related_skill, summary）が記述されている

### US-002: シグナルエントリが experiential logs に書き込まれる

- **テストレベル**: L3（手動検証）
- **GIVEN** implementer が `signal_class: FIX` で Phase B を完了した **WHEN** `~/.claude/docs/experiential/logs/` を確認する **THEN** 当日のシグナルファイルにエントリが追記されている

### US-003: implementer が過去のシグナルを参照する

- **テストレベル**: L3（手動検証）
- **GIVEN** experiential logs に FIX シグナルが蓄積されている **WHEN** implementer が新タスクを開始する **THEN** Spec Interpretation Log の冒頭に「参照したシグナル」セクションが存在する

### US-003 / REQ-004: /crystallize が FIX 集積度で優先付けする

- **テストレベル**: L3（手動検証）
- **GIVEN** experiential logs に同一 `related_skill` への FIX シグナルが 3 件以上蓄積されている **WHEN** `/crystallize` を実行する **THEN** パターン候補リストで当該スキルが FIX 集積度による優先付けで上位に表示される

### US-003 / REQ-005: /crystallize Phase 1 サマリーに signal 件数が表示される

- **テストレベル**: L3（手動検証）
- **GIVEN** experiential logs に signal エントリが蓄積されている **WHEN** `/crystallize` Phase 1 のサマリーを確認する **THEN** signal 件数と `related_skill` 別集計が表示される

## リスクと注意点

### R1: pre-flight の Grep 範囲によるコンテキスト圧迫

experiential logs が長期運用で大量蓄積された場合、Grep 結果がコンテキストウィンドウを圧迫する可能性がある。対策: 直近 5 件制限 + サマリー形式のみ参照。

### R2: signal_class の判断基準の曖昧さ

implementer が FIX/DERIVED/CAPTURED の判断に迷う可能性がある。対策: 判断基準を implementer.md に明確に記載。迷った場合は NONE を選択（false positive より false negative が安全）。

### R3: update-knowledge-system との未マージ状態

update-knowledge-system が未 compound（未アーカイブ）だが、実装済みファイルはワーキングツリーに存在する。本変更はその上に構築するため、直接的なブロッカーにはならない。ただし `/compound` 時のマージ順序に注意。
