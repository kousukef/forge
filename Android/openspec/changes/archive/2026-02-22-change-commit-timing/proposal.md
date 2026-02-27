# change-commit-timing 提案書

## 意図（Intent）

Forgeワークフローにおけるコミットタイミングをタスク単位から**ユーザーの明示的な指示**に変更する。現状のタスクごとの逐次コミットでは、実装完了後にユーザーが変更全体を把握しにくい。コミットログに依存していた `/compound` の学習ソースは、interpretations ファイルと reviews ファイルで代替する。

## スコープ（Scope）

### ユーザーストーリー

- ユーザーとして、実装・レビュー完了後に変更全体を `git diff` で確認してからコミットしたい。なぜなら、何が変わったかを一覧で把握した上でコミットメッセージを書きたいから。
- ユーザーとして、`/compound` で過去の判断・レビュー指摘・修正内容を学習に活かしたい。なぜなら、コミットログなしでも interpretations と reviews から十分な情報を得られるから。

### 対象領域

1. **コミットタイミングの変更**
   - implementer がタスク完了時に自動コミットしないようにする
   - ユーザーの明示的な指示（例: `/commit`、「コミットして」）でのみコミットを実行する

2. **interpretations ファイルの拡充**
   - 既存の仕様解釈に加え、以下を記録する:
     - 変更したファイル一覧（作成・修正・削除）
     - 実装判断の理由（なぜこの方針にしたか、他の選択肢を選ばなかった理由）

3. **reviews ファイルの新設**
   - `openspec/changes/<name>/reviews/review-summary.md` を新設
   - review-aggregator の統合結果をベースに、レビュー指摘と修正内容を1ファイルにまとめる

4. **interpretations / reviews のコミット除外**
   - Forge のコミットルールとして `interpretations/` と `reviews/` 配下のファイルを `git add` しない
   - `/compound` 実行時に学習抽出後、これらのファイルを自動削除する

5. **`/compound` の学習ソース変更**
   - コミットログベースから以下のファイルベースに切り替える:
     - `proposal.md` -- 変更の意図
     - `design.md` -- 設計判断
     - `interpretations/<task>.md` -- 各タスクの判断ログ + 変更ファイル一覧
     - `reviews/review-summary.md` -- レビュー指摘と修正内容

## スコープ外（Out of Scope）

- `.gitignore` での除外: Forge のルールで制御するため不要 -- YAGNI
- レビュアーごとの個別ファイル出力: 統合結果1ファイルで十分 -- YAGNI
- コミットメッセージの自動生成: ユーザーが明示的に指示するフローなので自動化は不要 -- YAGNI

## 未解決の疑問点（Open Questions）

- なし（対話で解消済み）
