# add-command-arguments タスクリスト

## テスト戦略
- ユニットテスト: 対象外（.md ファイルのみ）
- 統合テスト: 対象外
- E2Eテスト: 対象外
- 検証方法: grep による禁止ワード確認 + argument-hint 存在確認 + プロジェクト/グローバル同期確認

## タスク

### Task 1: spec.md の更新
- **対象ファイル**: `commands/spec.md`（既存）
- **やること**:
  - フロントマターに `argument-hint: "<change-name> [--teams|--agents]"` を追加
  - 「## Skill Activation」セクション（見出し + 内容2行 + 空行）を削除
  - 「## ワークフロー」の冒頭に「### Step 0: 引数の解析」セクションを追加
    - $ARGUMENTS から change-name と --teams/--agents フラグを解析
    - change-name 省略時の自動検出ロジック
    - フラグ省略時のデフォルト（agents）
  - 「### Phase 0: モード選択」を削除し、Step 0 の解析結果に基づいて Phase 1a/1b に分岐するよう変更
- **検証方法**: grep で "Skill Activation" が存在しないこと、"argument-hint" が存在すること、"Phase 0" が存在しないこと
- **関連スペック**: `specs/command-args/delta-spec.md#argument-hint フロントマター`, `#モードフラグ引数`, `#change-name 引数`, `#Skill Activation セクションの削除`, `#Phase 0 モード選択の置換`
- **依存**: なし

### Task 2: implement.md の更新
- **対象ファイル**: `commands/implement.md`（既存）
- **やること**:
  - フロントマターに `argument-hint: "<change-name> [--teams|--agents]"` を追加
  - 「### Step 1: 準備」の冒頭に引数解析ロジックを追加（Step 0 として分離または Step 1 に統合）
    - $ARGUMENTS から change-name と --teams/--agents フラグを解析
    - change-name 省略時の自動検出ロジック
    - フラグ省略時のデフォルト（agents）
  - 「### Step 3: モード選択」の AskUserQuestion を引数ベースの分岐に置換
- **検証方法**: grep で "argument-hint" が存在すること、"AskUserQuestion で以下を提示" が Step 3 に存在しないこと
- **関連スペック**: `specs/command-args/delta-spec.md#argument-hint フロントマター`, `#モードフラグ引数`, `#change-name 引数`, `#Phase 0 モード選択の置換`
- **依存**: なし

### Task 3: review.md の更新
- **対象ファイル**: `commands/review.md`（既存）
- **やること**:
  - フロントマターに `argument-hint: "<change-name>"` を追加
  - 「## Skill Activation」セクション（見出し + 内容2行 + 空行）を削除
  - 「## ワークフロー」の前に「## 引数の解析」セクションを追加
    - $ARGUMENTS から change-name を解析
    - change-name 省略時の自動検出ロジック
- **検証方法**: grep で "Skill Activation" が存在しないこと、"argument-hint" が存在すること
- **関連スペック**: `specs/command-args/delta-spec.md#argument-hint フロントマター`, `#change-name 引数`, `#Skill Activation セクションの削除`
- **依存**: なし

### Task 4: compound.md の更新
- **対象ファイル**: `commands/compound.md`（既存）
- **やること**:
  - フロントマターに `argument-hint: "<change-name>"` を追加
  - 「## Skill Activation」セクション（見出し + 内容1行 + 空行）を削除
  - 「## ワークフロー」の前に「## 引数の解析」セクションを追加
    - $ARGUMENTS から change-name を解析
    - change-name 省略時の自動検出ロジック
- **検証方法**: grep で "Skill Activation" が存在しないこと、"argument-hint" が存在すること
- **関連スペック**: `specs/command-args/delta-spec.md#argument-hint フロントマター`, `#change-name 引数`, `#Skill Activation セクションの削除`
- **依存**: なし

### Task 5: brainstorm.md の更新
- **対象ファイル**: `commands/brainstorm.md`（既存）
- **やること**:
  - フロントマターに `argument-hint: "<topic>"` を追加
  - 「## Skill Activation」セクション（見出し + 内容1行 + 空行）を削除
  - 「## ワークフロー」の手順1を更新: $ARGUMENTS が指定されていればトピックとして使用、なければ質問
- **検証方法**: grep で "Skill Activation" が存在しないこと、"argument-hint" が存在すること
- **関連スペック**: `specs/command-args/delta-spec.md#argument-hint フロントマター`, `#brainstorm topic 引数`, `#Skill Activation セクションの削除`
- **依存**: なし

### Task 6: test.md / ship.md の Skill Activation 削除
- **対象ファイル**: `commands/test.md`, `commands/ship.md`（既存）
- **やること**:
  - 両ファイルから「## Skill Activation」セクション（見出し + 内容 + 空行）を削除
  - ship.md にはフロントマターに `argument-hint: "<change-name>"` を追加（パイプライン対象の変更名を指定可能にする）
  - test.md は引数不要（変更なし以外）
- **検証方法**: grep で "Skill Activation" が両ファイルに存在しないこと
- **関連スペック**: `specs/command-args/delta-spec.md#Skill Activation セクションの削除`
- **依存**: なし

### Task 7: CLAUDE.md の更新
- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**:
  - 「Context Isolation Policy」セクション内の「Teams vs Task 切り替え基準」の記述を更新
    - AskUserQuestion による選択 → 引数（`--teams`/`--agents`）による選択に変更
    - デフォルトモード（agents）の記載
  - コマンドパイプライン図に引数の使用例を追記（任意）
- **検証方法**: grep で "AskUserQuestion でモード" が CLAUDE.md に存在しないこと
- **関連スペック**: `specs/command-args/delta-spec.md#Phase 0 モード選択の置換`
- **依存**: Task 1, Task 2（spec.md と implement.md の最終形を参照）

### Task 8: プロジェクト → グローバル同期
- **対象ファイル**: 全変更ファイル
- **やること**:
  - `forge/commands/*.md` → `~/.claude/commands/*.md` に同期
  - `forge/CLAUDE.md` → `~/.claude/CLAUDE.md` に同期
- **検証方法**: diff で全ファイルが同一であること
- **関連スペック**: 全要件（同期は全ての前提）
- **依存**: Task 1-7

### Task 9: 最終検証
- **対象ファイル**: 全コマンド + CLAUDE.md
- **やること**:
  - `grep "Skill Activation" commands/*.md` → 0件であること
  - `grep "argument-hint" commands/*.md` → spec, implement, review, compound, brainstorm, ship に存在すること
  - `grep "Phase 0" commands/spec.md commands/implement.md` → 0件であること
  - 全プロジェクト/グローバルファイルのペアが同一であること（diff）
- **検証方法**: 上記 grep/diff コマンドの実行結果
- **関連スペック**: 全要件
- **依存**: Task 8
