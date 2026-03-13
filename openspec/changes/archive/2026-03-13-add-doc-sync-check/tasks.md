# add-doc-sync-check タスクリスト

## テスト戦略

### L1: Unit テスト
- ユニットテスト: Markdown ファイルの変更のみのためユニットテスト対象なし
- 静的解析: 各 Markdown ファイルの構造が既存パターンに準拠していることを手動確認
- ビルド検証: ビルド対象なし

### L2: Integration テスト
- L2 対象なし（Markdown ファイルの変更のみ）

### L3: Acceptance テスト
- 受入テスト: design.md の受入テスト計画に基づき、各 US の構造的検証を実施

## タスク

### Task 1: agents/review/doc-sync-reviewer.md を新規作成（推定: 4分）
- **対象ファイル**: `agents/review/doc-sync-reviewer.md`（新規）
- **やること**: review-aggregator.md のパターンに準拠して doc-sync-reviewer エージェント定義を作成する。frontmatter（name, description, model, tools, skills）、役割、Required Skills、検証観点（更新有無・整合性・品質の3段階）、処理手順、出力形式、エラーハンドリングを記述する
- **検証方法**: ファイルを Read して (1) frontmatter が正しい形式で存在する (2) description にドキュメント同期関連のキーワードが含まれている (3) tools が [Read, Grep, Glob] である (4) 3つの検証観点が定義されている (5) 出力形式が review-aggregator の入力仕様に準拠している ことを確認
- **関連要件**: REQ-004, REQ-005
- **関連スペック**: `specs/doc-sync/delta-spec.md#REQ-004`, `specs/doc-sync/delta-spec.md#REQ-005`
- **依存**: なし

### Task 2: commands/review.md に L0 ドキュメント同期チェックを追加（推定: 4分）
- **対象ファイル**: `commands/review.md`（既存）
- **やること**: (1) Step 0 の既存 L1/L2 チェックの前に L0「ドキュメント同期チェック」を追加する。CLAUDE.md からルール読み取り、git diff との照合、PASS/WARNING/skipped の結果出力を記述する。(2) Step 1 の REVIEW CONTEXT テンプレートに `L0 (doc-sync) 結果` フィールドを追加する。L0 は既存の L1、L2 の前に配置する
- **修正対象セクション見出し**: 「### Step 0: L1/L2 自動チェック」内の冒頭に L0 を追加、「### Step 1: 仕様コンテキストの準備」内の REVIEW CONTEXT テンプレートを更新
- **検証方法**: ファイルを Read して (1) L0 チェックが L1 の前に定義されている (2) CLAUDE.md からのルール読み取りが記述されている (3) 3パターンの結果出力（PASS, WARNING, skipped）が定義されている (4) REVIEW CONTEXT に L0 結果フィールドがある (5) 既存の L1、L2 の内容が変更されていない ことを確認
- **関連要件**: REQ-003
- **関連スペック**: `specs/doc-sync/delta-spec.md#REQ-003`
- **依存**: なし

### Task 3: commands/implement.md に Step 5.5 ドキュメント同期を追加（推定: 4分）
- **対象ファイル**: `commands/implement.md`（既存）
- **やること**: Step 5（検証）と Step 6（完了報告）の間に Step 5.5「ドキュメント同期」を追加する。CLAUDE.md からの `## Document Sync Rules` セクション読み取り、git diff との照合、Task(implementer) の doc-sync タスク起動、スキップログ出力、エラーハンドリング（失敗時は Step 6 に進む）を記述する
- **修正対象セクション見出し**: 「### Step 5: 検証」の後、「### Step 6: 完了報告」の前に「### Step 5.5: ドキュメント同期」を新設
- **検証方法**: ファイルを Read して (1) Step 5.5 が Step 5 と Step 6 の間にある (2) CLAUDE.md からのルール読み取りが記述されている (3) Task(implementer) の doc-sync タスク起動が記述されている (4) ルール未定義時のスキップログ `doc-sync: skipped (no rules found)` がある (5) エラー時の非ブロッキング動作が明記されている (6) 既存の Step 5、Step 6 の内容が変更されていない ことを確認
- **関連要件**: REQ-001
- **関連スペック**: `specs/doc-sync/delta-spec.md#REQ-001`
- **依存**: なし

### Task 4: agents/implementation/implementer.md に doc-sync タスク対応を追加（推定: 3分）
- **対象ファイル**: `agents/implementation/implementer.md`（既存）
- **やること**: 行動規範セクション（行26-43）の末尾に doc-sync タスクの振る舞いを追加する。(1) doc-sync タスクの判定条件（プロンプトに「doc-sync タスク」と明記されている場合）(2) TDD サイクル不要 (3) Spec Interpretation Log 不要 (4) traceability.md 更新不要 (5) 処理手順（ルール読み取り → git diff 確認 → ドキュメント Read → Edit で更新）を記述する
- **修正対象セクション見出し**: 「## 行動規範」セクション末尾に doc-sync タスク用のサブセクションを追加
- **検証方法**: ファイルを Read して (1) doc-sync タスクの判定条件が明記されている (2) TDD 不要が明記されている (3) Spec Interpretation Log 不要が明記されている (4) 処理手順が記述されている (5) 通常の実装タスクの振る舞い（行26-43）が変更されていない ことを確認
- **関連要件**: REQ-002
- **関連スペック**: `specs/doc-sync/delta-spec.md#REQ-002`
- **依存**: なし

### Task 5: commands/setup.md にステップ6.5 ドキュメント同期ルール設定を追加（推定: 5分）
- **対象ファイル**: `commands/setup.md`（既存）
- **やること**: ステップ6（スキル作成提案）の後、ステップ7（設定ファイル生成）の前にステップ6.5「ドキュメント同期ルール設定」を追加する。(1) ドキュメントディレクトリ自動検出パターン（docs/, doc/, documentation/, wiki/, README.md, CLAUDE.md, AGENTS.md, .claude/ 配下の Markdown）(2) 検出結果のユーザー提示 (3) マッピング設定の対話 (4) CLAUDE.md への `## Document Sync Rules` セクション追記 (5) 冪等性（既存セクションの確認・更新確認）(6) 検出失敗時のフォールバック を記述する
- **修正対象セクション見出し**: 「### ステップ6: スキル作成提案」の後、「### ステップ7: 設定ファイル生成」の前に「### ステップ6.5: ドキュメント同期ルール設定」を新設
- **検証方法**: ファイルを Read して (1) ステップ6.5 がステップ6 と ステップ7 の間にある (2) 自動検出パターンが列挙されている (3) マッピング設定の対話フローが記述されている (4) CLAUDE.md への追記形式が `## Document Sync Rules` セクションである (5) 冪等性（既存セクションの確認）が記述されている (6) 検出失敗時のフォールバックがある (7) 既存のステップ6、ステップ7 の内容が変更されていない ことを確認
- **関連要件**: REQ-006, REQ-007, REQ-008
- **関連スペック**: `specs/doc-sync/delta-spec.md#REQ-006`, `specs/doc-sync/delta-spec.md#REQ-007`, `specs/doc-sync/delta-spec.md#REQ-008`
- **依存**: なし

### Task 6: 横断整合性チェック（推定: 3分）
- **対象ファイル**: 全変更対象ファイル
- **やること**: (1) delta-spec のファイル間整合性テーブルに基づき、全ファイル間の整合性を検証。特に「CLAUDE.md の `## Document Sync Rules` セクション」への参照が全ファイルで統一されていることを確認。(2) 「doc-sync」「ドキュメント同期」「Document Sync Rules」の用語で全変更ファイルを Grep し、意図しない残存や不整合がないか確認。(3) スキップログ形式 `doc-sync: skipped (no rules found)` が implement.md と review.md で統一されていることを確認。(4) doc-sync-reviewer の出力形式が review-aggregator の入力仕様に準拠していることを確認。(5) 既存のステップ番号体系（implement.md: Step 5→5.5→6、review.md: Step 0→1→2→...、setup.md: ステップ6→6.5→7）が維持されていることを確認
- **検証方法**: Grep で用語検索、各ファイルを Read して整合性テーブルの全項目を目視確認
- **関連要件**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008
- **関連スペック**: `specs/doc-sync/delta-spec.md#ファイル間整合性テーブル`
- **依存**: Task 1, Task 2, Task 3, Task 4, Task 5
