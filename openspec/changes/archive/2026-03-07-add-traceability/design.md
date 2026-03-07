# add-traceability 技術設計

## 概要

Forge ワークフローにトレーサビリティマトリクスを導入し、ユーザーストーリー（US-xxx）→ 設計決定（DD-xxx）→ タスク（T-xxx）→ テスト観点（TP-xxx）+ 実装/テストファイルパスの双方向追跡を可能にする。traceability.md は `openspec/changes/<change-name>/traceability.md` に配置し、/spec で生成、/implement でタスク完了毎に更新、/compound で累積スペックに反映する。

本変更は Markdown ファイル（エージェント定義・コマンド定義）への記述追加が主体であり、プログラムコードの実装は含まない。

## リサーチサマリー

### 公式ドキュメントからの知見

- Claude Code のエージェント定義・コマンド定義は Markdown ベースであり、YAML frontmatter + 本文構造で宣言的に記述する
- skills/agents/commands の拡張は既存のファイル構造に追記する形で行うのが標準パターン
- Forge プロジェクト固有のトレーサビリティフレームワークは存在しないため、新規設計が必要

### Web検索からの知見

- **Requirements Traceability Matrix (RTM)** は ISO 29148、DO-178C 等の規格で定義される要件管理手法
- RTM のベストプラクティス: (1) Forward traceability（要件→実装）と Backward traceability（実装→要件）の双方向追跡、(2) 自動生成と手動メンテナンスの組み合わせ、(3) Coverage Summary による網羅性の可視化
- Markdown ベースの RTM は軽量プロジェクトで広く採用されており、テーブル形式が最も可読性が高い
- 落とし穴: (1) 過度に詳細な粒度は保守コストが高い、(2) 自動生成できない部分は形骸化しやすい、(3) ID の衝突回避が重要

### コードベース分析（既存スペックとの関連含む）

- **影響を受けるファイル（4箇所）**:
  1. `agents/spec/spec-writer.md` -- 出力リストに traceability.md を追加、生成ロジックをワークフローに追記
  2. `agents/spec/spec-validator.md` -- 入力ファイルと検証項目にトレーサビリティを追加
  3. `agents/implementation/implementer.md` -- COMPLETION CRITERIA と行動規範に traceability.md 更新を追加
  4. `commands/compound.md` -- スペックマージにトレーサビリティマージを追加
- **ドキュメント更新（2箇所）**:
  5. `commands/spec.md` -- Phase 2 出力リストと Phase 5 提示内容に traceability.md を追加
  6. `CLAUDE.md` -- OpenSpec 構造に traceability.md を追加
- **既存パターンとの整合性**:
  - spec-writer の生成フローは「リサーチ統合 → 3ファイル生成」のパターンに traceability.md を4つ目として追加
  - implementer の COMPLETION CRITERIA はチェックリスト形式で、1項目追加が自然
  - /compound のスペックマージは ADDED/MODIFIED/REMOVED パターンだが、traceability.md は行追記のみ
- **関連する既存スペック**:
  - `workflow-redesign/spec.md`: spec-writer の役割定義（design.md / tasks.md / delta-spec 生成）-- traceability.md を追加
  - `remove-domain-content/spec.md`: /spec の Phase 1.7 動的ドメインスキル発見 -- 影響なし
  - `command-args/spec.md`: argument-hint パターン -- 影響なし

### 過去の学び

- **YAGNI の徹底**: Phase 1 では生成・更新・アーカイブのみに絞り、/review や /test での活用は Phase 2 以降に延期する（proposal.md のスコープ外と一致）
- **同期漏れへの注意**: エージェント定義の変更が複数ファイルにまたがる場合、ファイル間の整合性検証が重要。過去に CLAUDE.md とエージェント定義の不整合が発生した事例あり
- **spec-gap パターン**: 仕様の記述が曖昧な場合、implementer が独自解釈で進めてしまう問題が過去に発生。traceability.md のフォーマットを明確に定義し、解釈の余地を最小化する

## 技術的アプローチ

### 1. traceability.md のフォーマット設計

Markdown テーブル形式で Forward Traceability（要件→実装）と Backward Traceability（実装→要件）の2方向を表現する。Coverage Summary セクションで網羅性を数値化する。

テーブル構造:
- Forward Traceability: US → DD → T → TP → impl → test の列。**行複製方式**: 1行につき1つの対応関係を記載し、1つの US に複数の T/TP が対応する場合は US を複数行に展開する（ユーザー確認済み）
- Backward Traceability: impl/test → T → TP → DD → US の逆引き列
- Coverage Summary: カテゴリ別の総数/カバー済み/未カバーの集計

### 2. ID 抽出ルール

各成果物から ID を抽出する規則を明確に定義する:

| ID | ソース | 抽出ルール |
|---|---|---|
| US-xxx | proposal.md | `US-xxx:` 形式があればそのまま使用。なければ箇条書き項目を出現順に連番 |
| DD-xxx | design.md | 「技術的アプローチ」配下の `###` 見出しを出現順に連番 |
| T-xxx | tasks.md | `### Task N:` を出現順に連番 |
| TP-xxx | delta-spec.md | 全シナリオ（Happy Path / Error / Boundary）を出現順に連番 |

### 3. spec-writer への生成ロジック追加

spec-writer エージェント定義のワークフロー Step 4 に、design.md / tasks.md / delta-spec.md 生成後の追加ステップとして traceability.md 生成を記述する。生成順序は delta-spec.md → design.md → tasks.md → traceability.md（他3ファイルの情報を参照するため最後）。

### 4. spec-validator への検証ロジック追加

spec-validator エージェント定義の「9つの検証項目」に10番目として「トレーサビリティ網羅性チェック」を追加する。検証レベルは警告（非ブロッキング）とし、Spec Validation Report のカバレッジサマリーにトレーサビリティの項目を追加する。

### 5. implementer への更新ロジック追加

implementer エージェント定義の行動規範と COMPLETION CRITERIA に traceability.md 更新ステップを追加する。更新タイミングは Spec Interpretation Log Phase B（実装完了後の追記）と同時とする。Backward Traceability テーブルに実装ファイルパスを追記し、Forward Traceability テーブルの impl/test 列も更新する。

### 6. /compound への累積反映ロジック追加

/compound コマンド定義のスペックマージ（ステップ6）に traceability.md のマージサブステップを追加する。マージ方式は行追記（ADDED のみ、MODIFIED/REMOVED なし）。累積トレーサビリティの配置先は `openspec/specs/<feature>/traceability.md`。feature 名は delta-spec.md の配置ディレクトリ名と一致させる（ユーザー確認済み。例: `specs/traceability/delta-spec.md` → `openspec/specs/traceability/traceability.md`）。

### 7. Open Questions の解決

#### 累積スペックへの反映形式

**決定**: 別ファイル（`openspec/specs/<feature>/traceability.md`）として累積する。

**根拠**: 既存の spec.md は Requirements + Scenario の構造であり、トレーサビリティマトリクスのテーブル構造とは形式が異なる。同一ファイルに混在させると可読性が低下する。また、traceability.md は変更ごとに行が追記される累積型であり、spec.md の要件置換型（MODIFIED → 置換）とはマージ方式が異なる。

#### 設計決定（DD-xxx）の粒度

**決定**: design.md の「技術的アプローチ」セクション配下の `###` レベル見出しを1つの設計決定とする。

**根拠**: `###` 見出しは既存の design.md で一貫して使用されている粒度であり（例: add-setup-command の design.md では「1. コマンド定義」「2. 8ステップのワークフロー」等）、自動抽出が容易。箇条書き項目レベルでは粒度が細かすぎ、`##` レベルでは粗すぎる。

## リスクと注意点

### 複数ファイル間の整合性

4つのエージェント定義 + 2つのコマンド/ドキュメントの変更が必要。ファイル間で traceability.md のフォーマット記述やID体系の記述が矛盾しないよう、実装タスクの順序で整合性を確保する。

### traceability.md の保守コスト

自動生成（spec-writer）と自動更新（implementer）で保守コストを最小化するが、手動修正が必要になるケース（タスク追加・削除等）では形骸化のリスクがある。Phase 1 では自動化に注力し、手動修正のガイダンスは Phase 2 で検討する。

### 累積トレーサビリティの ID 衝突

複数の変更を順次マージする際、US-xxx の ID が衝突する可能性がある。/compound のマージ時にリナンバリングで対応するが、過去の参照が壊れるリスクがある。Phase 1 ではリナンバリング方式を採用し、Phase 2 で変更名プレフィックス方式（例: `add-traceability:US-001`）への移行を検討する。

### implementer の更新負荷

タスク完了毎に traceability.md を更新する追加ステップが必要。best-effort（非ブロッキング）とすることで、更新失敗時に実装フローを妨げない設計としている。
