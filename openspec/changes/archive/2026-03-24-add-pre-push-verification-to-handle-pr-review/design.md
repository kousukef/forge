# add-pre-push-verification-to-handle-pr-review 技術設計

## 概要

`/handle-pr-review` コマンドの Step 3（修正実装）と Step 4（コミット）の間に、lint/format/type-check/test の自動検証ステップを追加する。検証コマンドは Claude 向け設定ファイル（`openspec/project.md`, `CLAUDE.md`）から取得し、失敗時は Claude が原因推論・自動修正を最大3回試行する。本変更は `commands/handle-pr-review.md` のみを対象とし、1ファイルの Markdown 変更で完結する。

## リサーチサマリー

### 公式ドキュメントからの知見

- **コマンド定義パターン**: Forge のコマンドは `## Step N: タイトル` 構造で定義される。新ステップの挿入は既存パターンに準拠する
- **検証順序のベストプラクティス**: format → lint → type-check → test（速い順に失敗させる）。早い段階で失敗すれば後続の重い検証を回避できる
- **情報源の優先順位**: `project.md` → `CLAUDE.md` の順で取得する方針は合理的。Claude 向け設定ファイルを第一情報源とする
- **gate-git-push フック**: 既存の push 時警告表示と補完関係にある。フック=警告表示、コマンド=検証実行という責務分離が明確
- **CI との重複**: ローカル検証は第一防衛線、CI は最終保証。重複は許容される

### Web検索からの知見

- **AI エージェントの自動修正ループ**: lint/format → auto-fix → 再検証 → 修正不能ならエージェントが原因推論 → 修正試行 → 最大3回リトライ。業界でのリトライ上限は3回がコンセンサス
- **ブラインド修正の落とし穴**: エージェントがパターンマッチのみで修正するとコンテキスト浪費が発生する。修正前に「なぜ失敗しているか」を推論させるべき
- **auto-fix 分離**: `--fix` 可能なもの（format, lint）と不可能なもの（test 失敗）を明確に分ける設計が重要
- **ESLint/Prettier 競合**: 設定で事前回避すべきだが、これはプロジェクト側の問題でありコマンド側では対処不要

### コードベース分析（既存スペックとの関連含む）

- **現在のフロー**: Step 1(PR取得) → Step 2(分析) → Step 3(修正) → Step 4(コミット) → Step 5(push) → Step 6(返信) → Step 7(学習ループ)。Step 3-4間に検証なし
- **既存検証パターン**:
  - `/commit`: `npm lint` + `npm check-types`（ハードコード、`--no-verify` でスキップ可）
  - `/review` Step 0: package.json 等から動的検出（非ブロッキング）
  - `/implement` Step 5: テスト + 静的解析実行、失敗時は build-error-resolver で最大3回リトライ
- **REQ-007（remove-domain-content）**: ドメイン固有ツール名をハードコードせず汎用参照する方針が確立済み。本変更でもこれに準拠する
- **影響範囲**: `commands/handle-pr-review.md` のみ。`openspec/specs/pr-review-learning/spec.md` への影響なし（Step 7 は相対参照で番号非依存）
- **allowed-tools**: 現在 `Bash(gh *), Bash(git *)` のみ。lint/test 実行には Bash 権限の拡張が必要
- **frontmatter**: `argument-hint: "<pr-number> [--no-learn]"` は変更不要

### 過去の学び

- **PRレビュー学習ループ（2026-03-23）**: 1ファイル変更でも仕様品質が高ければ曖昧性ゼロ。類似概念の差分テーブルを事前設計すべき → gate-git-push との責務区別テーブルを design.md に含める
- **ドキュメント同期チェック（2026-03-13）**: 繰り返しパターンはワークフロー自動化で根本対策。宣言的チェックリストではなく自動実行ステップ → 検証ステップを自動実行として設計
- **W-Model 左辺レビュー（2026-03-08）**: 機械的に実行可能なものは自動実行が適切 → lint/format/test は機械的に実行可能であり、自動実行ステップとして設計
- **gate-git-push フックとの責務区別テーブル**を design.md に含めるべき（compound-learnings-researcher の推奨）

## 技術的アプローチ

### 1. 検証コマンドの取得（REQ-001）

Claude 向け設定ファイルから検証コマンドを取得する。優先順位:

1. `openspec/project.md` -- `/setup` で生成されるプロジェクト設定
2. `CLAUDE.md` -- プロジェクトルール
3. フォールバック: プロジェクト設定ファイルからの動的検出（`package.json` の scripts 等）

いずれからも取得できない場合はコマンドを中断する。検証コマンドのスキップ（`--no-verify`）は提供しない。

### 2. ステップ挿入と番号体系（REQ-002）

現在の Step 3（修正実装）と Step 4（コミット）の間に「Step 4: コミット前検証」を挿入する。後続ステップは番号を繰り下げる:

| 変更前 | 変更後 |
|---|---|
| Step 1: Get PR Review Comments | Step 1: Get PR Review Comments |
| Step 2: Analyze Review Comments | Step 2: Analyze Review Comments |
| Step 3: Implement Fixes | Step 3: Implement Fixes |
| -- | **Step 4: Pre-commit Verification（新規）** |
| Step 4: Create Descriptive Commits | Step 5: Create Descriptive Commits |
| Step 5: Push All Commits | Step 6: Push All Commits |
| Step 6: Reply to Review Comment Threads | Step 7: Reply to Review Comment Threads |
| Step 7: 学習ループ | Step 8: 学習ループ |

Step 7（旧）の学習ループ内のサブステップ（[7a]〜[7d]）は [8a]〜[8d] に繰り下げる。

### 3. 自動修正フロー（REQ-003）

```
検証コマンド実行（format → lint → type-check → test）
  ├── 全成功 → Step 5（コミット）へ
  └── 失敗
       ├── auto-fix 可能（format/lint）→ --fix 実行 → 再検証
       │    ├── 成功 → 次のコマンドへ（リトライカウントなし）
       │    └── 失敗 → 原因推論 → 修正試行（リトライ 1/3）
       └── auto-fix 不可能（test/type-check）
            └── エラー出力分析 → 原因推論 → 修正実装 → 全検証再実行（リトライ N/3）
                 ├── 成功 → Step 5（コミット）へ
                 └── 3回失敗 → 中断
```

リトライ回数は検証フロー全体で共有する（個別コマンドごとではない）。

### 4. allowed-tools の拡張（REQ-004）

現在の frontmatter:
```yaml
allowed-tools: Bash(gh *), Bash(git *), Grep, Read, Edit, Write, Glob
```

検証コマンド実行には汎用の `Bash` 権限が必要。ただし、既に `Grep, Read, Edit, Write, Glob` が許可されており、検証コマンドは `Bash` で実行される。現在の `Bash(gh *), Bash(git *)` のパターン制限を拡張して、検証コマンドも実行可能にする。

変更後:
```yaml
allowed-tools: Bash, Grep, Read, Edit, Write, Glob
```

`Bash(gh *)`, `Bash(git *)` のパターン制限を外し、汎用 `Bash` に変更する。これにより `npm run lint`, `pytest` 等の検証コマンドも実行可能になる。検証コマンド以外の用途での Bash 使用はコマンド定義のプロンプトで制限する。

### 5. gate-git-push フックとの責務区別（REQ-005）

| 観点 | コミット前検証（本変更） | gate-git-push フック（既存） |
|---|---|---|
| **タイミング** | コミット前（Step 3 → Step 4 の間） | push 時 |
| **アクション** | 検証コマンドの**実行** | チェックリストの**表示** |
| **失敗時** | 自動修正を試行、不可なら中断 | 警告表示（ブロッキングは force push のみ） |
| **スコープ** | `/handle-pr-review` コマンド内のみ | 全 `git push` 操作 |
| **目的** | CI 失敗の未然防止 | push 前の最終確認（人的チェック） |

両者は補完的に動作する。コミット前検証が第一防衛線、gate-git-push は最終チェックポイント。

## 受入テスト計画

### US-001: /handle-pr-review で検証なしに push されない
- **テストレベル**: L1
- **GIVEN** `commands/handle-pr-review.md` に検証ステップが定義されている **WHEN** Step 構造を検証する **THEN** Step 3（修正実装）と Step 5（コミット）の間に検証ステップが存在し、検証成功が Step 5 の前提条件として記述されている
- **GIVEN** `commands/handle-pr-review.md` に検証ステップが定義されている **WHEN** 検証コマンドの情報源を確認する **THEN** `openspec/project.md` → `CLAUDE.md` → 動的検出のフォールバックチェーンが記述されている
- **GIVEN** `commands/handle-pr-review.md` に検証ステップが定義されている **WHEN** 検証失敗時のフローを確認する **THEN** 自動修正フロー（auto-fix → 原因推論 → 修正試行、最大3回）が記述されている

## リスクと注意点

### Step 番号繰り下げの影響

Step 7（学習ループ）のサブステップ [7a]〜[7d] を [8a]〜[8d] に繰り下げる必要がある。これらのサブステップは同一ファイル内で閉じており、外部参照はないため影響は限定的。ただし、横断チェックタスクで全参照の整合性を確認する。

### allowed-tools の拡張による権限範囲

`Bash(gh *), Bash(git *)` から汎用 `Bash` への変更により、技術的には任意のシェルコマンドが実行可能になる。これは検証コマンド実行に必要な措置であり、コマンド定義のプロンプトで検証目的以外の使用を制限する。Claude Code の allowed-tools はパターン制限による技術的制御と、プロンプトによる意図的制御の2層で運用されており、本変更は後者に依存する。

### openspec/project.md が未作成の場合

`/setup` 未実施のプロジェクトでは `openspec/project.md` が存在しない。この場合は `CLAUDE.md` → 動的検出のフォールバックチェーンで対応する。全て失敗した場合はコマンドを中断し、`/setup` の実行を案内する。

### 検証コマンドの実行時間

大規模テストスイートを持つプロジェクトでは test コマンドの実行に時間がかかる可能性がある。ただし、`/handle-pr-review` はレビュー指摘への修正を対象としており、通常は小規模な変更であるため、関連テストのみの実行で十分なケースが多い。検証コマンドの最適化（関連テストのみ実行等）はプロジェクト側の `project.md` で設定する。
