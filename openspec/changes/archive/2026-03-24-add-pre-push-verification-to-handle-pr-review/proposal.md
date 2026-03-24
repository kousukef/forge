# add-pre-push-verification-to-handle-pr-review 提案書

## 意図（Intent）

`/handle-pr-review` でレビュー指摘を修正後、lint/format/test を実行せずに push して CI が失敗するケースが繰り返し発生している。通常の Forge ワークフロー（brainstorm -> spec -> implement -> review -> test -> commit）では `/review` や `/test` で品質チェックが走るが、`/handle-pr-review` はこのフローの外で動作するため、検証ステップが欠落している。push 前に自動検証を必須化することで、CI 失敗を未然に防ぐ。

## スコープ（Scope）

### ユーザーストーリー

- 開発者として、`/handle-pr-review` でレビュー指摘を修正した後、push 前に lint/format/test が自動実行されてほしい。なぜなら、修正後に検証を忘れて CI が失敗するケースを防ぎたいから。
  - 検証観点: `/handle-pr-review` 実行時に、検証なしで push されないこと

### 対象領域

- `commands/handle-pr-review.md`（検証ステップの追加）

### 設計方針

- 検証コマンドの情報源: `openspec/project.md` や `CLAUDE.md` など Claude 向け設定ファイルから読み取る
- 検証タイミング: コミット前（検証通過後にコミット -> push）
- 検証失敗時: Claude が修正を試み、直せたら続行・直せなければ中断
- `--no-verify` オプション: 不要（`/handle-pr-review` では検証は常に必須）

## スコープ外（Out of Scope）

- `/commit` への検証ステップ追加: 通常フローで既にカバーされている -- YAGNI
- `/ship` への検証ステップ追加: 通常フローで既にカバーされている -- YAGNI
- ツール自動検出ロジックの共通モジュール化: 今回は `/handle-pr-review` 内で完結 -- YAGNI
- 設定ファイルからのスキャン（`pyproject.toml`, `package.json` 等の直接パース）: Claude 向け設定ファイルから読み取る方針 -- YAGNI

## 未解決の疑問点（Open Questions）

- `openspec/project.md` が未作成のプロジェクト（`/setup` 未実施）での振る舞い: エラーにするか、フォールバック検出を行うか
