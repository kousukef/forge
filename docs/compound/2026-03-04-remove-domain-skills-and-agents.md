---
category: pattern
stack: general
severity: important
date: 2026-03-04
tags: oss-generalization, cross-file-refactoring, residual-check, dynamic-discovery, codebase-analysis-gap
artifact-targets: agents, commands, spec-template
---

# ドメイン固有コンテンツ除去: 横断残存チェックの不可欠性と影響範囲分析の限界

## 何が起きたか

Forge を OSS 公開に向けて汎用化するため、ドメイン固有スキル14個、レビューエージェント7個、リファレンス6個を削除し、20+ファイルからドメイン固有記述を除去・汎用化した。`/review` コマンドを動的レビュアー検出方式に移行した。全26タスク、レビュー検証26項目で全PASS。

### うまくいったパターン

1. **CLAUDE.md/USER-CLAUDE.md 同期を事前設計に組み込んだ**: 過去2回（2026-02-18, 2026-02-22）の同期漏れの教訓を活かし、Task 5-6 で両ファイルの同時修正を設計段階で明示。今回は同期漏れゼロ。
2. **Task 26（最終横断チェック）が11ファイルの修正漏れを捕捉**: skills-lock.json、commands/test.md、forge-system-prompt.md（ディレクトリ構造の残存含む）、agents/ 配下4ファイル、docs/ 配下1ファイル、openspec/ 配下1ファイル等。仕様タスクのスコープ外だったファイルの残存を検出し修正した。
3. **動的レビュアー検出の設計が整合的**: LLM セマンティック判定 + frontmatter Auto-Discovery + 0件時の手動選択フォールバックで、堅牢な拡張ポイントを実現。
4. **レビューが P1/P2 指摘ゼロ**: 仕様準拠率 26/26 でクリーンレビュー。P3 は `npm audit` の残存1件のみ（仕様逸脱ではなく将来検討事項）。

### 問題が発生したパターン

1. **codebase-analyzer の影響範囲分析が不十分**: design.md で「修正対象: 20+ ファイル」と特定していたが、実際には skills-lock.json、commands/test.md、agents/ 配下の implementer.md / build-error-resolver.md / implement-orchestrator.md / stack-docs-researcher.md / compound-learnings-researcher.md 等が漏れていた。
2. **forge-system-prompt.md のディレクトリ構造にも削除済みファイルが残存**: Task 17 の修正範囲が不十分で、ディレクトリ構造セクション内の削除済みファイル・ディレクトリが残っていた。
3. **タスク設計時の grep パターンが限定的**: 削除対象の名前（14スキル + 7エージェント + 6リファレンス + TypeScript固有コマンド）の全パターンを design.md 作成時点で grep して影響ファイルを完全列挙すべきだったが、主要ファイルのみの分析にとどまった。

## なぜ起きたか

1. **codebase-analyzer のリサーチスコープ**: 「修正対象ファイル」の特定時に、主要なドキュメントファイル（CLAUDE.md, commands/, skills/）に焦点を当て、agents/ 配下のエージェント定義やJSON設定ファイル（skills-lock.json）まで網羅的に grep していなかった。
2. **タスク粒度の問題**: Task 17（forge-system-prompt.md）は5つの変更点を定義していたが、ディレクトリ構造セクションの残存パターンが明示的な変更点に含まれていなかった。
3. **影響ファイルの列挙が「既知のファイル」に偏る**: codebase-analyzer が「このファイルにドメイン参照がある」と報告するのは分析対象に含めたファイルのみ。分析対象から漏れたファイルの残存は検出できない。

## どう解決したか

Task 26（最終横断チェック）で全削除対象名の grep を実行し、11ファイルの修正漏れを即座に修正した。このタスクがセーフティネットとして機能した。

## 教訓

1. **リファクタリング型変更では codebase-analyzer に「全パターン grep」を明示的に依頼せよ**: 削除・名前変更を含む変更では、対象名の全パターンを grep して影響ファイルを完全列挙する。「主要ファイルの分析」ではなく「全ファイルの機械的検索」が必要。
2. **最終横断チェックタスクはリファクタリング型変更で必須**: Task 26 のような「全パターン grep → 残存修正」タスクを仕様段階で設計に組み込むことで、タスク設計の漏れを補完できる。今回で有効性が実証された。
3. **JSON/設定ファイルも影響範囲に含めよ**: skills-lock.json のような設定ファイルはドキュメント分析では見落としやすい。grep 対象に `*.json` も含めるべき。
4. **過去の学びの防止策は機能する**: CLAUDE.md 同期漏れは過去2回の教訓を事前設計に反映して防止に成功した。Compound Learning の複利効果を実証。

## 防止策と更新提案

### エージェント定義更新
- [ ] codebase-analyzer に「リファクタリング型変更（削除・名前変更）では全パターン grep による影響ファイル完全列挙を行う」指示を追加（3回ルール発動: 2026-02-18, 2026-02-22, 今回）

### コマンドフロー更新
- [ ] `/spec` の codebase-analyzer 呼び出し時に「削除・名前変更パターンの全 grep 結果を tasks.md に反映する」ステップを追加（3回ルール発動）

### 仕様テンプレート更新
- [ ] spec-writer のタスク設計テンプレートに「リファクタリング型変更では最終横断チェックタスクを必ず含める」チェック項目を追加（重要: 今回の有効性で実証済み）
