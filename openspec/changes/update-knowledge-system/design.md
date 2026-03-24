# update-knowledge-system 技術設計

## 概要

Forge の学びの記録システムを NFD（Nurture-First Development）の知見で拡張する。現在プロジェクト単位（`docs/compound/`）に分散している経験ログをユーザーレベル（`~/.claude/docs/experiential/`）に一元化し、ワークフロー外の暗黙知も自動蓄積する。蓄積された経験は `/crystallize` コマンドで結晶化し、rules/skills/hooks に昇格させる。併せて `reference/` の手動読み込みルールを `.claude/rules/` の自動ロードに移行する。

## リサーチサマリー

### 公式ドキュメントからの知見

1. **paths フロントマター**: Claude Code v2.1.59 で導入、v2.1.71 でバグ修正済み。`.claude/rules/` に配置した YAML フロントマターの `paths` glob にマッチするファイルを操作した時のみルールがロードされる。`paths` なしのルールは毎セッション無条件ロード
2. **HTML コメント**: v2.1.73 で自動注入時に非表示。仮説タグ `<!-- hypothesis: ... -->` はルール/スキルの既存パーサーに影響しない安全な形式
3. **~/.claude/docs/**: Claude Code の auto-discovery 対象外。経験ログ配置先として独立しており、Claude の auto-memory（`~/.claude/projects/<hash>/MEMORY.md`）とは別物
4. **InstructionsLoaded フック**: ルールロード時に発火。将来の仮説検証トリガーに活用可能だが、現時点では `/compound` の Learning Router での検証に留める
5. **ルールロード優先順位**: user CLAUDE.md → project CLAUDE.md → user rules → project rules

### Web検索からの知見

1. **paths は「ファイル読み取り時のみ」トリガー**: プロセス系ルール（core-rules, workflow-rules, context-isolation）には `paths` なしが正しい設計判断
2. **CLAUDE.md 200 行制限**: 超えると遵守度が低下する。Nurturing Protocol は簡潔に記述し、詳細ルールは `.claude/rules/` に分離する
3. **ログ肥大化防止策**: 最小セッション長フィルタ、ignore パターン、構造化サマリーが有効。REQ-005 の記録判断基準（記録対象/記録対象外の明確な分類）で対応
4. **クロスプロジェクト汚染防止**: `project` フィールドでプロジェクト文脈を保持しつつ一元蓄積することで、意図しない知識の混入を防ぐ
5. **CLAUDE.md は行動ガイダンス**: 確実な制約には hooks を使う。Nurturing Protocol は CLAUDE.md のガイダンスとして記述し、記録の強制は行わない
6. **@import 構文**: `@path/to/import` で外部ファイルインポート可能だが、今回は `.claude/rules/` の自動ロードを優先採用
7. **ECC の instinct モデル**: confidence スコア + ドメインタグ + スコープ管理が仮説検証ループの設計に影響

### コードベース分析（既存スペックとの関連含む）

**既存パターンとの整合性**:
- コマンド設計パターン（YAML フロントマター + セクション構造）: `/crystallize` の定義もこのパターンに従う
- Learning Router パターン（分類テーブル + 閾値ルール）: 結晶化チェック（ステップ 4.3）が Learning Router と統合される
- 複利ドキュメント形式（YAML フロントマター + 5 セクション構造）: 経験ログのワークフロー由来分は既存形式を踏襲し、追加フィールド（`project`, `crystallized`, `id`, `type`, `source`）を付与

**影響範囲**:

| カテゴリ | ファイル | 変更内容 |
|---|---|---|
| 直接変更 | `commands/compound.md` | 出力先変更 + ステップ 4.3 追加 |
| 直接変更 | `agents/research/compound-learnings-researcher.md` | 検索対象変更 + Nurture ログ対応 |
| 直接変更 | `CLAUDE.md` | Compound Learning → Experiential Learning + Rules セクション更新 |
| 直接変更 | `~/.claude/CLAUDE.md` | Nurturing Protocol 追加 |
| 新規作成 | `commands/crystallize.md` | /crystallize コマンド定義 |
| 新規作成 | `.claude/rules/*.md` | reference/ からの移行先（5 ファイル） |
| 新規作成 | `~/.claude/docs/experiential/{logs,patterns,metrics}/` | ディレクトリ構造 |
| 間接影響 | `commands/ship.md` | `docs/compound/` パス参照更新 |
| 間接影響 | `commands/spec.md` | compound-learnings-researcher 参照更新（3 箇所） |
| 間接影響 | `reference/workflow-rules.md` | Compound Learning セクション + パス参照更新 |
| 間接影響 | `rules/core-essentials.md` | `reference/context-isolation.md` 参照更新 |
| 間接影響 | `agents/orchestration/implement-orchestrator.md` | `reference/` 言及更新 |

**関連する既存スペック**:
- `workflow-redesign/spec.md`: compound-learnings-researcher が含まれる。検索対象変更による影響あり
- `remove-domain-content/spec.md`: REQ-006 が `reference/` への追加をガイダンスに記載。移行後に乖離する（REQ-015 で対応）
- `doc-sync/spec.md`: `/compound` 変更時に Document Sync Rules が適用される

### 過去の学び

1. **Compound Learning の複利効果は実証済み**: 3 回目の変更でゼロ同期漏れを達成。経験蓄積 → 結晶化の仕組みはこの成功体験の延長線上にある
2. **Context Isolation は必須**: Main Agent にリサーチ結果を大量に渡さない。spec-writer がリサーチ統合を全て担当する設計が有効
3. **宣言的チェックリストは自動ブロッキングより実用的**: hooks による強制より CLAUDE.md のガイダンスが柔軟。Nurturing Protocol もこのアプローチ
4. **Progressive Disclosure が件数増加時に必要**: 経験ログが増加した場合、結晶化チェックの閾値通知で段階的にユーザーの注意を促す
5. **3回ルールの発動遅延**: 閾値判定の厳格化が課題。結晶化チェックの閾値（15 件）は初期値であり、運用で調整する
6. **リファクタリング型変更では全パターン grep が必須**: `docs/compound/` → `~/.claude/docs/experiential/logs/` の移行では、プロジェクト全体での参照パス grep を必ず実行する
7. **未完了の防止策アクション 16 件蓄積**: 追跡の仕組みがない。結晶化メカニズムが蓄積された防止策の棚卸しの機会を提供する

## 技術的アプローチ

### DD-001: NFD 三層認知アーキテクチャとの対応

NFD の三層を Forge の構造にマッピングする:

| NFD 層 | 揮発性 | ロード方式 | Forge での実体 |
|---|---|---|---|
| Constitutional Layer | 低 | 常時 | `CLAUDE.md` + `.claude/rules/`（`paths` なし） |
| Skill Layer | 中 | オンデマンド | `skills/`（Phase-Aware） + `.claude/rules/`（`paths` 付き） |
| Experiential Layer | 高 | Grep/フィルタ | `~/.claude/docs/experiential/logs/` |

### DD-002: 経験の蓄積と結晶化の二段階分離

- `/compound`（Stage 1）: 変更単位の学び抽出 + 軽量チェック（未結晶化件数確認、`[CORRECTION]` 即座昇格提案）
- `/crystallize`（Stage 2）: プロジェクト横断のパターン抽出 + 人間レビュー + rules/skills/hooks への昇格

十分な経験が蓄積されてからパターン抽出する方が品質が高い（NFD 論文の知見）。毎回の `/compound` では軽量チェックのみ行い、本格的な結晶化は `/crystallize` で実施する。

### DD-003: Nurture ログの設計

1 日 1 ファイル `YYYY-MM-DD-nurture.md` に `---` 区切りで追記。フロントマターに `type: nurture`, `date`, `entry_count` を持ち、各エントリに `project`, `context`, `user_said`/`reasoning`, `learning`, `tags`, `crystallized` フィールドを含む。

記録は CLAUDE.md の Nurturing Protocol に基づくガイダンスレベル。hooks による強制は行わない（過去の学び「宣言的チェックリストは自動ブロッキングより実用的」に基づく）。

### DD-004: /crystallize の 5 Phase 設計

1. **Phase 1（データ収集）**: `--scope` に基づく未結晶化エントリのフィルタリング
2. **Phase 2（パターン抽出）**: タグ別グループ化 → 繰り返し/プロジェクト横断/因果関係/Shift-Left 観点の分析 → 既存 rules/skills/hooks との重複・矛盾検出
3. **Phase 3（人間レビュー）**: AskUserQuestion による承認/却下/修正の選択（自動結晶化はスコープ外）
4. **Phase 4（昇格実行）**: 脱文脈化 → 昇格先決定（昇格先テーブルに基づく） → `paths` フロントマター自動付与 → 仮説タグ付与
5. **Phase 5（後処理）**: `crystallized: true` 更新 → パターン status 更新 → crystallization-log.md 追記

### DD-005: paths フロントマターによるルール自動ロード

`reference/` → `.claude/rules/` 移行の方針:

| ルール種別 | paths | 理由 |
|---|---|---|
| core-rules | なし（常時ロード） | フェーズ管理はファイルパスに紐づかない |
| workflow-rules | なし（常時ロード） | セッション管理はファイルパスに紐づかない |
| context-isolation | なし（常時ロード） | Context Isolation は常時適用 |
| coding-standards | プロジェクト構造に応じて調整 | ソースコード編集時のみ必要。Forge 本体では `paths` なし |
| testing | プロジェクト構造に応じて調整 | テストファイル操作時のみ必要。Forge 本体では `paths` なし |

Forge 本体にはソースコードディレクトリ（`src/` 等）が存在しないため、coding-standards と testing の `paths` は Forge プロジェクト固有では `paths` なし（常時ロード）とし、他プロジェクトへのインストール時にプロジェクト構造に合わせた `paths` を設定する。

### DD-006: フォールバック設計

| コンポーネント | 新規パスが存在しない場合 |
|---|---|
| `/compound` 出力 | `docs/compound/` にフォールバック |
| Nurturing Protocol | ログ記録をスキップ（エラーにしない） |
| `/crystallize` | 「経験ログが見つかりません」と表示して終了 |
| compound-learnings-researcher | `docs/compound/` を検索（現行動作を維持） |

### DD-007: マイグレーション戦略（段階的導入）

| Phase | 期間 | 内容 | 得られる価値 |
|---|---|---|---|
| 0 | 即時 | ディレクトリ構造作成 + reference/ → .claude/rules/ 移行 | 準備完了 + ルール自動ロード |
| 1 | 1 週目 | /compound 出力先変更 + compound-learnings-researcher 修正 + 間接影響ファイル更新 | 経験ログの一元化 |
| 2 | 1-2 週目 | USER-CLAUDE.md に Nurturing Protocol 追加 | ワークフロー外の知識捕捉開始 |
| 3 | 2-4 週目 | /crystallize コマンド実装 | パターン抽出 → skills/rules 昇格 |
| 4 | 運用後 | 仮説検証ループ導入（/compound の Learning Router で検証） | 知識品質の継続的向上 |

各 Phase は独立して価値を持つ。前 Phase の完了を前提とする。

## ファイル間整合性テーブル

過去の学び（「リファクタリング型変更では全パターン grep が必須」）に基づき、変更対象ファイル間の参照整合性を以下にまとめる。

| 参照元 | 参照先（旧） | 参照先（新） | 備考 |
|---|---|---|---|
| `commands/compound.md` ステップ 3 | `docs/compound/YYYY-MM-DD-<topic>.md` | `~/.claude/docs/experiential/logs/YYYY-MM-DD-<project>-<topic>.md` | 出力先変更 |
| `commands/compound.md` ステップ 3.5 | `docs/compound/metrics/review-metrics.md` | `~/.claude/docs/experiential/metrics/review-metrics.md` | メトリクス出力先変更 |
| `commands/ship.md` 完了レポート | `docs/compound/YYYY-MM-DD-<topic>.md` | `~/.claude/docs/experiential/logs/YYYY-MM-DD-<project>-<topic>.md` | パス参照更新 |
| `commands/spec.md` Phase 1a | `docs/compound/` から過去の学び抽出 | `~/.claude/docs/experiential/logs/` から過去の学び抽出 | 説明文更新（3 箇所） |
| `agents/research/compound-learnings-researcher.md` | `docs/compound/` | `~/.claude/docs/experiential/logs/` + フォールバック `docs/compound/` | 検索対象変更 |
| `reference/workflow-rules.md` | `docs/compound/` に記録 | `~/.claude/docs/experiential/logs/` に蓄積 | パス参照 + セクション名更新 |
| `rules/core-essentials.md` | `reference/context-isolation.md` | `.claude/rules/context-isolation.md` | 参照先更新 |
| `agents/orchestration/implement-orchestrator.md` | `reference/` | `.claude/rules/` | 言及更新 |
| `CLAUDE.md` Rules セクション | 手動読み込み指示テーブル | `.claude/rules/` 自動ロード説明 | セクション書き換え |
| `CLAUDE.md` Compound Learning | セクション全体 | Experiential Learning セクション | セクション書き換え |
| `~/.claude/CLAUDE.md` | （なし） | Nurturing Protocol セクション追加 | 新規セクション |
| `openspec/specs/remove-domain-content/spec.md` REQ-006 | `reference/` への追加ガイダンス | `.claude/rules/` への配置ガイダンス | 累積スペック更新 |

## 受入テスト計画

### US-001: 経験ログの一元蓄積

- **テストレベル**: L3（手動検証）
- **GIVEN** 2 つの異なるプロジェクトで `/compound` を実行済み **WHEN** `~/.claude/docs/experiential/logs/` を確認する **THEN** 両プロジェクトのログファイルが存在し、各ファイルの `project` フィールドが正しいプロジェクト名を持つ

### US-002: ワークフロー外の学び自動記録

- **テストレベル**: L3（手動検証）
- **GIVEN** Forge ワークフロー外の対話でユーザーが Claude の提案を修正した **WHEN** `~/.claude/docs/experiential/logs/YYYY-MM-DD-nurture.md` を確認する **THEN** `[CORRECTION]` タグ付きのエントリが追記されている

### US-003: /crystallize によるパターン昇格

- **テストレベル**: L3（手動検証）
- **GIVEN** `~/.claude/docs/experiential/logs/` に未結晶化エントリが蓄積されている **WHEN** `/crystallize` を実行し、パターンを承認する **THEN** 承認したパターンが rules/skills/hooks のいずれかに反映され、仮説タグが付与されている

### US-004: 仮説検証ループ

- **テストレベル**: L3（手動検証）
- **GIVEN** 仮説タグ付きの知識が skills/ に存在する **WHEN** `/compound` で同じ知識に関連する学びが処理される **THEN** confidence スコアと evidence カウントが更新されている

### US-005: 結晶化タイミング通知

- **テストレベル**: L3（手動検証）
- **GIVEN** `~/.claude/docs/experiential/logs/` に `crystallized: false` のエントリが 16 件以上存在する **WHEN** `/compound` を実行する **THEN** 結晶化推奨の通知が表示される

### US-006: reference/ → .claude/rules/ 移行

- **テストレベル**: L1（構造検証）
- **GIVEN** `.claude/rules/` にルールファイルが配置されている **WHEN** ファイルを読み込む **THEN** `paths` なしルール（core-rules, workflow-rules, context-isolation）と `paths` 付きルール（coding-standards, testing）が存在し、YAML フロントマターが正しい形式で記述されている

### US-007: 既存データの移行手順

- **テストレベル**: L3（手動検証）
- **GIVEN** design.md にマイグレーション手順が記載されている **WHEN** 手順に従って `docs/compound/` のファイルを移行する **THEN** `~/.claude/docs/experiential/logs/` に正しいファイル名とフロントマターで配置されている

## リスクと注意点

### R1: ログ肥大化

経験ログが長期運用で大量に蓄積される可能性がある。対策として:
- 記録判断基準の明確化（記録対象/記録対象外の分類）で不要なログを防ぐ
- `/crystallize` で結晶化済みエントリにフラグを付けることで、未結晶化エントリの実質的な母数を管理する
- 将来的にはアーカイブ機構を追加可能だが、現時点ではスコープ外

### R2: CLAUDE.md 200 行制限

Nurturing Protocol を USER-CLAUDE.md に追加する際、200 行制限を超える可能性がある。対策として:
- Nurturing Protocol セクションは簡潔な記録対象テーブルと記録方法のみ記載（20-30 行程度）
- 詳細な記録ルール（Nurture ログ形式の詳細等）は `.claude/rules/` に paths なしで配置

### R3: クロスプロジェクト汚染

異なるプロジェクトの知識が意図せず混入するリスク。対策として:
- 各エントリの `project` フィールドでプロジェクト文脈を保持
- compound-learnings-researcher が現プロジェクトの学びを優先表示
- `/crystallize --scope project:<name>` でプロジェクト単位のフィルタリングが可能

### R4: paths フロントマターの glob 設計

Forge 本体にはソースコード（`src/` 等）が存在しない。coding-standards.md や testing.md の paths glob はソースコードディレクトリを前提としているが、Forge プロジェクトでは `paths` なし（常時ロード）とする。他プロジェクトへのインストール時にプロジェクト構造に合わせた paths を設定する運用が必要。

### R5: 間接影響ファイルの見落とし

過去の学びで「リファクタリング型変更では全パターン grep が必須」と記録されている。`docs/compound/` と `reference/` の参照パスを全ファイルで grep し、更新漏れを防ぐ横断チェックタスクが必須。

### R6: 既存スペックとの乖離

`remove-domain-content/spec.md` の REQ-006 が `reference/` への追加をガイダンスに記載している。移行後に累積スペックの更新を忘れると、スペックと実態が乖離する。delta-spec の REQ-015（MODIFIED）で対応。
