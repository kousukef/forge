# add-doc-sync-check 技術設計

## 概要

V-Model の左辺（/implement）と右辺（/review）にドキュメント同期チェックを追加し、実装変更後のドキュメント更新漏れを自動検出・修正する仕組みを導入する。加えて /setup にドキュメント同期ルールの対話的設定ステップを追加する。

本変更は Markdown ファイルへの記述追加が主体であり、プログラムコードの実装は含まない。

## リサーチサマリー

### 公式ドキュメントからの知見

- **エージェント定義パターン**: frontmatter に `name`, `description`, `tools`, `skills` を含む YAML 形式。`description` はセマンティック判定（/review の動的レビュアー選択）のトリガーとなるため、doc-sync-reviewer の description にはドキュメント同期・整合性検証に関するキーワードを含める必要がある
- **tools 制限**: レビュアーエージェントは `[Read, Grep, Glob]` のみ（Write/Edit 不可）。doc-sync-reviewer もこのパターンに従う
- **skills frontmatter**: `skills: [iterative-retrieval]` で Claude Code が自動読み込み。既存レビュアー（review-aggregator）と同じパターン
- **コマンド定義パターン**: `disable-model-invocation: true` + `argument-hint` の frontmatter。ステップ番号体系は既存を維持する

### Web検索からの知見

- **Docs-as-Code アプローチ**: ドキュメントをコードと同様にバージョン管理し、変更プロセスに組み込むのがベストプラクティス。CI/CD での自動チェックが推奨されるが、Forge では LLM ベースの判定で代替する
- **マッピングベースの同期検出**: コード変更パターンとドキュメントの明示的マッピングが最も信頼性が高い。Forge では CLAUDE.md の自然言語ルールでマッピングを定義する
- **LLM ベースのドキュメント更新**: git diff の内容から更新が必要なドキュメントを LLM が判定し、自動更新するアプローチ。implementer に委譲することで既存のエージェントパターンを活用
- **既知の落とし穴**:
  - **偽陽性**: コード変更がドキュメントに無関係な場合（テストコードのみの変更等）でも検出してしまう → doc-sync-reviewer の整合性チェックで精査
  - **過剰自動化**: 全てを自動化するとドキュメント品質が低下する → /implement で自動更新 + /review で品質チェックの2段階で対処
  - **ルール陳腐化**: マッピングルールが実態と乖離する → /setup の再実行で更新可能（冪等性）

### コードベース分析（既存スペックとの関連含む）

**直接変更対象ファイル（5箇所 + 新規1ファイル）:**

1. `commands/implement.md` -- Step 5 の後に Step 5.5「ドキュメント同期」を追加。既存の Step 5（検証）と Step 6（完了報告）の間に挿入
2. `agents/implementation/implementer.md` -- 行動規範に doc-sync タスクの振る舞いを追加。TDD 不要・Spec Interpretation Log 不要を明記
3. `commands/review.md` -- Step 0 に L0「ドキュメント同期チェック」を追加（L1 型チェックの前）。Step 1 の REVIEW CONTEXT テンプレートに L0 結果フィールドを追加
4. `agents/review/doc-sync-reviewer.md` -- 新規作成。review-aggregator と同じ frontmatter パターン
5. `commands/setup.md` -- ステップ6 の後にステップ6.5「ドキュメント同期ルール設定」を追加

**間接的に影響を受けるファイル: なし**

以下は意図的に変更しない:

- `agents/review/review-aggregator.md` -- doc-sync-reviewer は既存の動的レビュアー選択（Step 2b）で自動検出される。review-aggregator の入力仕様に準拠するため変更不要
- `reference/core-rules.md` -- Phase Gates の implement→review エントリー基準に「ドキュメント同期」を追加する必要はない。ドキュメント同期は best-effort であり、Phase Gate のブロッキング条件にはしない
- `CLAUDE.md` -- /setup がプロジェクトの CLAUDE.md にルールを追記するため、Forge リポジトリ自身の CLAUDE.md は変更しない

**既存スペックとの関連:**

- `openspec/specs/w-model-left-review/spec.md`: REQ-004（/implement の中間レビューポイント）-- Step 5.5 は中間レビュー（Step 4a/4b 内）とは独立。中間レビューは実装中の設計適合性チェック、Step 5.5 は実装完了後のドキュメント同期。補完的な関係
- `openspec/specs/workflow-redesign/spec.md`: /implement のモード分岐 -- Step 5.5 は Teams/Sub Agents 両モードの後に実行される共通ステップ
- `openspec/specs/test-multilayer/spec.md`: /review の L1/L2/L3 テスト構造 -- L0 は新たなレベルとして L1 の前に追加。既存のテスト多層化構造を拡張する形

### 過去の学び

1. **横断整合性テーブルを仕様に含める**（3回成功パターン）→ delta-spec にファイル間整合性テーブルを含める
2. **横断チェックタスクは必須**（remove-domain-skills で3回ルール発動）→ 最終タスクに横断チェックを配置
3. **概念変更は横断 grep で残存確認が必要**（change-commit-timing 教訓）→ 新用語「doc-sync」「ドキュメント同期」「Document Sync Rules」の全ファイル確認を横断チェックに含める
4. **CLAUDE.md 更新パターンは add-setup-command に準拠**（既存パターン）→ /setup のステップ6.5 は既存の CLAUDE.md 更新ロジック（セクション存在チェック → 追記 or 重複回避）に従う
5. **YAGNI はセキュリティ防御策に適用しない**（compound 教訓）→ ドキュメント同期ルール形式は自然言語のみ（構造化は YAGNI）だが、スキップログは常に出力（安全側に倒す）

## 技術的アプローチ

### 1. /implement のドキュメント同期（commands/implement.md）

Step 5（検証）の後に Step 5.5「ドキュメント同期」を追加する。

**処理フロー:**

1. CLAUDE.md を Read し、`## Document Sync Rules` セクションの存在を確認
2. セクションが存在しない場合: `doc-sync: skipped (no rules found)` を出力して Step 6 に進む
3. セクションが存在する場合: ルールの自然言語記述を取得
4. Step 5 の `git diff --stat` 出力（既に取得済み）とルールを照合
5. マッチするルールがある場合: Task(implementer) を doc-sync タスクとして起動
   - プロンプトに「doc-sync タスク」であることを明記
   - ルール内容、変更ファイル一覧、対象ドキュメントパスを提供
6. マッチするルールがない場合: `doc-sync: skipped (no matching files)` を出力
7. implementer が更新したドキュメントはワーキングツリーに残る（通常の実装ファイルと同じ）

**エラーハンドリング**: implementer の doc-sync タスクが失敗した場合、エラーログを出力して Step 6 に進む。ドキュメント更新失敗は /implement 全体をブロックしない。

### 2. implementer の doc-sync 対応（agents/implementation/implementer.md）

行動規範セクションの末尾に doc-sync タスクの振る舞いを追加する。

**追加内容:**

- doc-sync タスクの判定: プロンプトに「doc-sync タスク」と明記されている場合に適用
- TDD サイクルは不要（ドキュメント更新にテストは不要）
- Spec Interpretation Log は不要
- 処理手順: (1) CLAUDE.md の同期ルール読み取り → (2) 変更ファイルの git diff 確認 → (3) 対象ドキュメントを Read → (4) 実装変更内容を反映して Edit
- traceability.md 更新も不要（doc-sync はトレーサビリティの対象外）

### 3. /review の L0 チェック（commands/review.md）

Step 0 の既存構造（L1 型チェック → L2 linter）の前に L0「ドキュメント同期チェック」を追加する。

**処理フロー:**

1. CLAUDE.md を Read し、`## Document Sync Rules` セクションの存在を確認
2. セクションが存在しない場合: `L0 (doc-sync): skipped (no rules found)` を記録
3. セクションが存在する場合: ルールの自然言語記述を取得
4. `git diff --stat` の変更ファイル一覧とルールのマッピングを照合
5. マッピングに該当する変更がある場合: 対応するドキュメントが `git diff --stat` に含まれているか確認
   - 含まれている: `L0 (doc-sync): PASS`
   - 含まれていない: `L0 (doc-sync): WARNING -- 以下のドキュメントが未更新: [ファイル一覧]`
6. マッピングに該当する変更がない場合: `L0 (doc-sync): PASS (no matching files)`

**REVIEW CONTEXT への注入:**

Step 1 の REVIEW CONTEXT テンプレートに L0 結果フィールドを追加:

```
- L0 (doc-sync) 結果: [Step 0 の L0 結果。スキップした場合は「ドキュメント同期ルール未検出のためスキップ」]
```

### 4. doc-sync-reviewer エージェント（agents/review/doc-sync-reviewer.md）

既存のレビュアーエージェントパターン（review-aggregator.md）に準拠して新規作成する。

**frontmatter:**

```yaml
name: doc-sync-reviewer
description: "実装変更とドキュメントの整合性を検証し、更新漏れ・記載誤り・品質劣化を検出する"
model: opus
tools: [Read, Grep, Glob]
skills: [iterative-retrieval]
```

**検証観点（3段階）:**

1. **更新有無チェック**: REVIEW CONTEXT の L0 結果を参照。L0 で WARNING が出ている場合、対象ドキュメントの未更新を P2 として報告
2. **整合性チェック**: git diff の変更内容とドキュメントの記述を突き合わせ。実装と矛盾する記述、追加機能の記載漏れを検出
3. **品質チェック**: ドキュメント内の古い情報の残存、変更前の仕様記述が残っている箇所を検出

**出力形式**: review-aggregator の入力仕様に準拠（指摘ID、優先度、確信度、対象ファイル、指摘内容、推奨修正、関連仕様）。

### 5. /setup のドキュメント同期ルール設定（commands/setup.md）

ステップ6（スキル作成提案）の後にステップ6.5「ドキュメント同期ルール設定」を追加する。

**処理フロー:**

1. **ドキュメントディレクトリ自動検出**: 以下のパターンでプロジェクトルートをスキャン
   - ディレクトリ: `docs/`, `doc/`, `documentation/`, `wiki/`
   - ファイル: `README.md`, `CLAUDE.md`, `AGENTS.md`
   - 特殊: `.claude/` 配下の Markdown ファイル
   - 検出範囲: ルート直下 + 1階層下（既存のステップ1の技術スタック検出と同じスコープ）
2. **検出結果の提示**: 検出されたドキュメントディレクトリ/ファイルをリスト表示
3. **マッピング設定の対話**: 各ドキュメントに対して「このドキュメントはどのファイル変更時に更新が必要ですか？」と問いかけ、ユーザーがパターンを指定
   - 例: 「`commands/` 配下のファイルを変更したら `CLAUDE.md` の Forge ワークフロー セクションを確認・更新する」
4. **CLAUDE.md への追記**: `## Document Sync Rules` セクションを追記
5. **冪等性**: 既に `## Document Sync Rules` セクションが存在する場合は既存ルールを表示し、更新するか確認

**検出失敗時のフォールバック**: 「ドキュメントディレクトリが検出されませんでした。手動で指定しますか？」と問いかけ。ユーザーが辞退した場合はステップ6.5 をスキップしてステップ7 に進む。

## 受入テスト計画

### US-001: /implement 完了時にドキュメント更新漏れを自動検出・更新

- **テストレベル**: L1
- **GIVEN** commands/implement.md に Step 5.5「ドキュメント同期」が定義されている **WHEN** Step 5.5 の内容を検証する **THEN** CLAUDE.md からルールを読み取り、git diff とルールを照合し、Task(implementer) を doc-sync タスクとして起動するワークフローが記述されており、ルール未定義時のスキップログ出力が明記されている

### US-002: /review 時にドキュメント同期の過不足と品質をレビュー

- **テストレベル**: L1
- **GIVEN** commands/review.md に L0 チェックが定義され、agents/review/doc-sync-reviewer.md が存在する **WHEN** L0 チェックと doc-sync-reviewer の内容を検証する **THEN** L0 は更新有無の機械的チェック、doc-sync-reviewer は整合性・品質のセマンティックチェックという2段階構成が記述されており、REVIEW CONTEXT に L0 結果が注入されている

### US-003: /setup 時にドキュメント同期ルールを対話的に設定

- **テストレベル**: L1
- **GIVEN** commands/setup.md にステップ6.5 が定義されている **WHEN** ステップ6.5 の内容を検証する **THEN** ドキュメントディレクトリの自動検出、マッピング設定の対話、CLAUDE.md への `## Document Sync Rules` セクション追記のワークフローが記述されており、検出失敗時のフォールバックが明記されている

## リスクと注意点

### 未解決の疑問点への解決案

proposal.md の未解決事項「/implement で自動更新したドキュメントが /review で不十分と判定された場合のフロー」について:

**解決案**: /review の既存フロー（Step 6: 結果提示と修正ループ）に統合する。doc-sync-reviewer の指摘は他のレビュアーの指摘と同様に review-aggregator で統合され、P1 なら自動修正（Task(implementer)）、P2 ならユーザー判断となる。新たなフローの追加は不要。

### ドキュメント同期ルールの品質依存

ルールが自然言語であるため、ルールの品質がチェック精度に直結する。曖昧なルール（「重要なファイルを変更したらドキュメントを更新する」等）は偽陽性/偽陰性を招く。

**対策**: /setup のステップ6.5 で具体的なマッピング（ファイルパターン → ドキュメントパス）を対話的に設定し、ルールの具体性を確保する。

### L0 チェックの偽陽性

git diff に対応するドキュメントが含まれていない場合でも、ドキュメント更新が不要なケースがある（テストコードのみの変更、内部リファクタリング等）。

**対策**: L0 は WARNING のみ出力（ブロッキングしない）。doc-sync-reviewer が内容を精査して最終判断する2段階構成。

### implementer の doc-sync タスクと通常タスクの混同

implementer が doc-sync タスクと通常の実装タスクを混同し、TDD を不要にスキップするリスク。

**対策**: doc-sync タスクの判定はプロンプトに「doc-sync タスク」と明記することで行う。implementer.md の行動規範で doc-sync タスクの条件を明確に定義する。
