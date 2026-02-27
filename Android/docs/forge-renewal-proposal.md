# Forge v2 リニューアル提案書

## エグゼクティブサマリー

本提案は、Forge ワークフローシステムの構造的問題を分析し、「ユーザーが求めていることを細かく仕様化し、仕様準拠して実装する、使うごとに賢く成長するシステム」を実現するためのリニューアル設計を示す。

### 核心的な設計原則

**「LLM に不確実性を自覚させるのではなく、不確実性が外部から観測可能になるアーティファクトの生成を構造的に強制する」**

現行システムの問題はすべて「検証の欠如」または「検証の遅延」に帰着する。本提案では、パイプラインの各フェーズ境界に検証ループを挿入し、問題を早期に検出・修正する設計を採用する。

### パイプライン進化の全体像

```
[現行]
/brainstorm → /spec → [ユーザー承認] → /implement → /review → /test → /compound

[提案]
/brainstorm → /spec → [spec-validate] → [ユーザー承認] → /implement(interpret-first) → /review(spec-aware) → /test → /compound(learning-router)
                         ^^^^^^^^^^^                         ^^^^^^^^^^^^^^^^^           ^^^^^^^^^^^                    ^^^^^^^^^^^^^^^
                         新規追加                            フロー再構築               大幅強化                       対象拡大
```

---

## 1. 現行システムの分析サマリー

### 1.1 アーキテクチャ概要

Forge は 7 つのスラッシュコマンド（`/brainstorm`, `/spec`, `/implement`, `/review`, `/test`, `/compound`, `/ship`）を軸とした Claude Code プラグインシステムである。16 のエージェント、6 のスキル、4 のフック、OpenSpec 仕様管理構造から構成される。

**強み:**
- Context Isolation Policy による Main Agent のコンテキスト保護が明確に設計されている
- OpenSpec（proposal -> delta-spec -> 累積スペック）による仕様ライフサイクル管理
- TDD 強制（テスト前のコード記述は削除してやり直し）の徹底
- スキル名ベース注入によるコンテキスト汚染防止
- 2 層アーキテクチャ + Teams/Sub Agents 動的選択の柔軟性

### 1.2 問題点と根本原因

#### 問題 1: 仕様の考慮漏れ・記載漏れ

| 現象 | 根本原因 |
|---|---|
| delta-spec がハッピーパスに偏重し、エラー・境界値・非機能要件が欠落 | spec-writer のテンプレートにエラーシナリオ・境界値・非機能要件の明示的要求がない |
| 仕様が完全に見えるがユーザーレビューで検出できない（Phantom Completeness） | spec 生成 → ユーザー承認の間に仕様の網羅性を検証するゲートが不在 |
| Given/When/Then が複数の解釈を許す曖昧な記述になる | spec-writer に対する adversarial（敵対的）チェックが存在しない |

#### 問題 2: 実装エージェントがエスカレーションせずに進める

| 現象 | 根本原因 |
|---|---|
| 曖昧な仕様を implementer が「合理的な解釈」で埋めて実装（Assumption Propagation） | LLM は不確実性を自覚できない。エスカレーション条件が「自信ベース」であり構造的に検出困難 |
| spec-compliance-reviewer が事後チェックで逸脱を検出するが、既にコードが書かれている | 検証がすべて post-implementation。事前の「仕様解釈宣言」ステップが存在しない |
| implementer に「仕様との照合結果の自己報告」義務がない | 実装フローが「テスト → コード → コミット」のみ。解釈・判断の記録が求められていない |

#### 問題 3: レビューの不完全性

| 現象 | 根本原因 |
|---|---|
| レビューしても新たな問題が出続ける | レビュアーが design.md / delta-spec を入力として受け取っていない。設計意図を知らずにレビューするため、意図的な選択を「問題」として指摘する |
| レビューが「完全かどうかわからない」 | レビュー結果と仕様項目を突き合わせる「カバレッジマトリクス」がない。どの仕様項目が検証されたか不明 |
| 不要なレビュアーが起動される | 7 つのレビュアーがドメインに関係なく全起動。ドメイン検出によるフィルタリングが未適用 |
| レビュー → 修正 → 再レビューのループが未設計 | レビュー結果を修正に繋げるフローが手動に依存 |

#### 問題 4: Compound Learning の限定的フィードバック

| 現象 | 根本原因 |
|---|---|
| /compound が Rule 更新のみ提案し、Skill / Hook / Agent 定義の更新を提案しない | 学びの分類・ルーティングロジックが存在しない。防止策チェックリストはあるが、自動的に適切なアーティファクト種別に振り分ける仕組みがない |
| 日常的な実装レベルの学びが記録されない | Compound Learning が「重大インシデント（100ドルルール）」にしか使われていない。軽微な改善も蓄積する仕組みがない |

#### 追加問題: Lattice 残留物

`~/.claude/hooks/` に Lattice 時代のフック（session-start.js, session-end.js, detect-corrections.js, pre-compact.js, teammate-idle.js, task-completed.js）が残存しているが、Lattice DB（`lattice.db`）は既に削除されており、これらのフックは実質的に無機能。`reference/core-rules.md` と `reference/workflow-rules.md` にも Lattice 固有の概念（log_pattern, /checkpoint 等）が残存している。

---

## 2. 提案する新システムの全体像

### 2.1 設計原則

1. **Verify-at-Every-Boundary**: 各フェーズ境界に検証ループを挿入。「生成 → 生成 → 生成 → 検証」ではなく「生成 → 検証 → 生成 → 検証」
2. **Make Uncertainty Visible**: LLM に不確実性を自覚させるのではなく、構造的にアーティファクトを生成させ、不確実性を外部から観測可能にする
3. **Spec as Contract**: 仕様を「ドキュメント」ではなく「契約」として扱い、実装・レビュー・テストの全フェーズで仕様への参照を必須化
4. **Adaptive Scope**: ドメイン検出に基づき、起動するエージェント・適用するチェックリストを動的に調整
5. **Full-System Learning**: 学びをルールだけでなく、スキル・フック・エージェント定義・コマンドフロー・仕様テンプレートに自動ルーティング

### 2.2 新コマンドパイプライン

```
/brainstorm
  │ ソクラテス式対話（変更なし）
  v
/spec
  │ リサーチ + 仕様統合（強化: シナリオ種別テンプレート）
  │
  ├──> [NEW] spec-validator（敵対的仕様検証）
  │      エラーシナリオ・境界値・非機能要件の網羅性チェック
  │      未指定シナリオの列挙と仕様への追記提案
  │      検証結果 → spec-writer にフィードバック → 仕様修正
  v
[ユーザー承認]（検証済み仕様を提示）
  │
  v
/implement（Interpretation-First フロー）
  │ Phase 1: 仕様解釈宣言（Interpretation Plan）
  │   implementer が各要件の解釈・前提・未指定事項を構造化出力
  │   spec-compliance-reviewer が事前検証
  │   不明点はエスカレーション
  │ Phase 2: TDD 実装（RED → GREEN → REFACTOR）
  │   検証済みの解釈に基づいて実装
  v
/review（Spec-Aware Review）
  │ レビュアーに delta-spec + design.md を必須入力として提供
  │ ドメイン検出に基づく動的レビュアー選択
  │ [NEW] review-aggregator がカバレッジマトリクスを生成
  │ 修正 → 再レビューの自動ループ
  v
/test（変更なし）
  v
/compound（Learning Router）
  │ 学びの分類 → 適切なアーティファクト種別への自動ルーティング
  │ ルール / スキル / フック / エージェント定義 / コマンドフロー / 仕様テンプレート
  │ 軽微な改善も蓄積（100ドルルール閾値の緩和）
  v
完了
```

### 2.3 新エージェント構成

| カテゴリ | エージェント | 状態 | 役割 |
|---|---|---|---|
| **スペック** | spec-writer | 強化 | シナリオ種別テンプレート適用、EARS + Given/When/Then 併用 |
| **スペック** | **spec-validator** | **新規** | 敵対的仕様検証。エラーパス・境界値・非機能要件の網羅性チェック |
| **実装** | implementer | 強化 | Interpretation Plan 出力を必須化。2 フェーズ実装 |
| **実装** | spec-compliance-reviewer | 強化 | 事前検証（Interpretation Plan）+ 事後検証（実装結果）の 2 段階 |
| **実装** | build-error-resolver | 変更なし | - |
| **レビュー** | security-sentinel 他 | 強化 | delta-spec + design.md を必須入力。ドメインフィルタリング |
| **レビュー** | **review-aggregator** | **新規** | レビュー結果の統合・重複排除・カバレッジマトリクス生成 |
| **リサーチ** | 4 エージェント | 変更なし | - |
| **オーケストレーション** | implement-orchestrator | 変更なし | メインスレッド専用（従来通り） |

---

## 3. 各改善策の詳細設計

### 3.1 仕様品質の向上: Spec Validation Gate

#### 3.1.1 シナリオ種別テンプレートの導入

現行の delta-spec は ADDED / MODIFIED / REMOVED と Given/When/Then のみだが、以下のシナリオ種別を明示的に要求する:

```markdown
## ADDED Requirements

### Requirement: [要件名]
[RFC 2119 記述]

#### Happy Path Scenarios
- **GIVEN** ... **WHEN** ... **THEN** ...

#### Error Scenarios（必須）
- **GIVEN** [正常な前提] **WHEN** [異常入力/操作] **THEN** [エラー処理の期待結果]
- **GIVEN** [外部依存の障害] **WHEN** [操作] **THEN** [フォールバックの期待結果]

#### Boundary Scenarios（該当する場合）
- **GIVEN** [境界値条件] **WHEN** [操作] **THEN** [期待結果]

#### Non-Functional Requirements（該当する場合）
- **PERFORMANCE**: [応答時間/スループット要件]
- **ACCESSIBILITY**: [アクセシビリティ要件]
- **ERROR_UX**: [ユーザーへのエラー表示要件]
```

この変更により、spec-writer が「ハッピーパスのみ」で仕様を生成することが構造的に困難になる。

#### 3.1.2 spec-validator エージェント（新規）

```yaml
---
name: spec-validator
description: "delta-specの網羅性を敵対的に検証する。エラーパス・境界値・非機能要件の欠落を検出し、修正を提案する"
model: opus
tools: [Read, Grep, Glob]
skills: [iterative-retrieval]
---
```

**行動規範:**

spec-validator は spec-writer とは対立的な目的を持つ。spec-writer が「仕様を書く」のに対し、spec-validator は「仕様の穴を見つける」ことが唯一の仕事である。

まず、各要件が以下の **4 品質基準**（EARS アプローチに基づく）を満たすかを判定する:

| 基準 | 検証内容 |
|---|---|
| **テスト可能性** | 各シナリオの THEN が具体的で、テストコードに変換可能か |
| **振る舞い中心** | 実装手段ではなく、期待される振る舞いが記述されているか |
| **一意解釈性** | 要件が一つの解釈のみを許すか。「適切に」「必要に応じて」等の曖昧語がないか |
| **十分な完全性** | 要件の実装に必要な情報が全て含まれているか |

次に、各 ADDED / MODIFIED 要件に対して以下を検証する:

1. **エラーシナリオの存在確認**: Happy Path Scenarios があるのに Error Scenarios がない要件をフラグ
2. **境界値の検出**: 数値入力、文字列長、リスト件数など、境界値が存在しうるパラメータに対して Boundary Scenarios が定義されているか
3. **非機能要件の確認**: UI 変更にアクセシビリティ要件があるか、API 変更にパフォーマンス要件があるか
4. **シナリオ間の矛盾検出**: 複数の Given/When/Then シナリオ間で前提条件や期待結果が矛盾していないか
5. **既存スペックとの整合性**: `openspec/specs/` の累積スペックと矛盾する要件がないか
6. **未指定シナリオの列挙**: 「この要件で、もし X が起きたらどうなるべきか？」を敵対的に問い、仕様が回答していないケースを列挙
7. **タスク粒度の検証**: tasks.md の各タスクが「1 タスク = 1 焦点」の原則を守っているか（研究により、指示が増えるほど各指示の遵守率が低下することが判明しており、タスク粒度の適切さは実装品質に直結する）

**出力形式:**

```markdown
## Spec Validation Report

### 検証済み: 問題なし
- Requirement A: 全シナリオ種別が網羅されている

### 要修正: 仕様の欠落
1. **Requirement B**: Error Scenarios が未定義
   - 提案: 「GIVEN ユーザーが無効なトークンで認証 WHEN API呼び出し THEN 401エラーとリダイレクト」を追加
2. **Requirement C**: 境界値が未考慮
   - 提案: 「GIVEN リスト件数が0件の場合」「GIVEN リスト件数が上限の場合」を追加

### 要確認: 仕様の曖昧性
1. **Requirement D**: 「適切にエラーハンドリングする」の定義が不明確
   - 質問: エラー時にリトライするか、即座にユーザーに通知するか？

### カバレッジサマリー
- 全要件数: N
- Happy Path 完備: N/N
- Error Scenarios 完備: N/N
- Boundary Scenarios 完備: N/N (該当なし: M)
- Non-Functional Requirements 完備: N/N (該当なし: M)
```

#### 3.1.3 /spec コマンドフローの変更

```
[現行]
Phase 1: リサーチ → Phase 2: 仕様統合 → Phase 3: ユーザー確認

[提案]
Phase 1: リサーチ → Phase 2: 仕様統合 → Phase 3: 仕様検証（spec-validator）→ Phase 4: 修正ループ → Phase 5: ユーザー確認
```

**Phase 3 (仕様検証):** spec-validator を起動し、delta-spec の網羅性を検証する。

**Phase 4 (修正ループ):**
- Teams モード: spec-validator が spec-writer に SendMessage で修正指示を送信。spec-writer が修正 → spec-validator が再検証。最大 2 往復。
- Sub Agents モード: spec-validator の出力に基づき Main Agent が修正すべき項目を特定し、Task(spec-writer) を再起動して修正を委譲。

**Phase 5 (ユーザー確認):** 検証済みの仕様 + Validation Report をユーザーに提示。

---

### 3.2 エスカレーションの確実化: Interpretation-First Implementation

#### 3.2.1 設計思想

「LLM に不確実性を自覚させる」のではなく、「不確実性が外部から観測可能になるアーティファクトの生成を構造的に強制する」。

#### 3.2.2 実装方式: 単一呼び出し内の 2 フェーズ

**検討した方式と採用理由:**

| 方式 | コスト | 検証品質 | Context Isolation 互換 | 採用 |
|---|---|---|---|---|
| (A) 別エージェントで検証 | 高（3x 呼び出し） | 高 | 脆弱（コンテキスト喪失） | 不採用 |
| (B) Main Agent が検証 | 低 | 低（Main Agent は仕様詳細を評価不可） | 互換 | 不採用 |
| (C) 2 回の implementer 呼び出し | 高（2x 呼び出し） | 高 | 脆弱（コンテキスト喪失） | 不採用 |
| **(C-opt) 単一呼び出し内 2 フェーズ** | **低（~15% 増）** | **中〜高** | **互換** | **採用** |

**不採用理由の詳細:**
- (A)(C): Claude Code の制約「サブエージェントは他のサブエージェントを起動できない」により、implementer を 2 回起動すると 2 回目は新しいコンテキストになる。1 回目で読み込んだ仕様・コードベースの理解が失われ、全て再読み込みが必要。コンテキスト喪失による品質低下リスクが高い。
- (B): Context Isolation Policy により Main Agent は実装ドメインの詳細を評価できない。Interpretation Plan の形式チェックはできるが、解釈の正確性を判断できない。形式チェックだけでは LLM が「形式的に正しいが内容的に間違った」Plan を出力するリスクを排除できない。

**採用方式（C-optimized）: implementer の単一呼び出し内に 2 フェーズを組み込む:**

```
implementer（単一呼び出し）:
  1. delta-spec + design.md を Read
  2. Spec Interpretation Log を構造化出力
  3. interpretations/<task>.md にファイルとして書き出し
  4. [検証ポイント]
     - Teams モード: spec-compliance-reviewer に SendMessage で検証依頼 → フィードバック受信後に続行
     - Sub Agents モード: 必須チェック項目を自己検証、「仕様に未記載」があればエスカレーション
  5. TDD 実装（RED → GREEN → REFACTOR）
  6. Interpretation Log をコードと一緒にコミット
```

**この方式の利点:**
- **コンテキスト保持**: 単一呼び出しのため、仕様・コードベースの理解が維持される
- **永続アーティファクト**: `openspec/changes/<name>/interpretations/<task>.md` にファイル化されるため、ユーザー監査・事後レビューが可能
- **Teams モードの最大活用**: spec-compliance-reviewer が Interpretation Log を即座にレビューし、コード記述前にフィードバックできる
- **低オーバーヘッド**: 別エージェント起動ではなく、implementer 自身のフロー内で完結（約 15% のオーバーヘッド）

#### 3.2.3 Spec Interpretation Log のフォーマット

implementer が各タスクの TDD 開始前に出力する必須アーティファクト:

```markdown
# Spec Interpretation: [タスク名]

## 対象要件
- Requirement: [要件名（REQ-XXX）]
  - **仕様の記述**: [delta-spec の Given/When/Then を引用]
  - **私の解釈**: [この要件をどう実装するか]
  - **前提（仕様に未記載だが私が仮定すること）**: [前提と根拠]
  - **仕様でカバーされないエッジケース**: [対応しない事項と判断根拠]

## 実装判断

| 判断項目 | 選択肢 | 採用 | 根拠 | 確信度 |
|---|---|---|---|---|
| [例: エラーレスポンス形式] | [A: throw, B: return null] | [A] | [仕様に SHALL return error と記載] | HIGH |

## 必須チェック項目
- [ ] 入力の有効値/無効値は何か？ → [回答 or 「仕様に未記載」→ **要エスカレーション**]
- [ ] エラー時の振る舞いは？ → [回答 or 「仕様に未記載」→ **要エスカレーション**]
- [ ] 外部依存が失敗した場合は？ → [回答 or 「仕様に未記載」→ **要エスカレーション**]
- [ ] 非同期処理の場合、競合状態への対処は？ → [回答 or 「該当なし」]

## ギャップ検出（エスカレーション候補）
- [仕様が回答すべきだが未回答の事項。ない場合は「なし」]
```

**構造的強制のメカニズム:**

- 「必須チェック項目」は閉じた質問形式。LLM は「不確実性を検出する」必要がなく、質問に回答するだけでよい。
- 回答が「仕様に未記載」の場合、自動的にエスカレーション対象になる。
- implementer は TDD（RED フェーズ）に進む前に、この Log を出力・ファイル化しなければならない。

#### 3.2.4 モード別の検証フロー

**Teams モード（推奨: 検証品質が最も高い）:**

```
implementer（teammate）
  │ Interpretation Log を出力 → interpretations/<task>.md に書き出し
  │ SendMessage → spec-compliance-reviewer
  v
spec-compliance-reviewer（teammate）
  │ Interpretation Log と delta-spec を照合
  │
  ├── 問題なし → SendMessage「実装開始 OK」
  ├── 解釈の誤り → SendMessage「Requirement X の解釈が誤り。正しくは Y。理由: ...」
  └── 仕様の欠陥を発見 → SendMessage → Main Agent → AskUserQuestion → ユーザー
  v
implementer（フィードバック反映後、TDD 開始）
```

**Sub Agents モード（フォールバック: 自己検証 + 事後レビュー）:**

```
implementer（Task）
  │ Interpretation Log を出力 → interpretations/<task>.md に書き出し
  │ 必須チェック項目を自己検証
  │ 「仕様に未記載」があれば AskUserQuestion でエスカレーション
  │ なければ TDD 開始
  v
（実装完了後）
  v
spec-compliance-reviewer（Task）
  │ Interpretation Log + 実装結果 + delta-spec を照合
  │ 「解釈は正しかったか？」「実装は解釈通りか？」の 2 段階チェック
```

#### 3.2.5 implementer エージェント定義の変更

既存の行動規範に以下を追加:

```diff
 ## 行動規範

 1. スキル確認: Required Skills + プロンプト指定の全スキルの指示に従う
-2. 受け取ったタスクテキスト + デルタスペックの Given/When/Then に基づいて実装
-3. Given/When/Then シナリオからテストケースを導出する
-4. TDD厳守: テストを先に書く
+2. 受け取ったタスクテキスト + デルタスペックの Given/When/Then を読み込む
+3. **Spec Interpretation Log を出力する（TDD 開始前に必須）**
+   - 各要件の解釈・前提・エッジケースを明文化
+   - openspec/changes/<name>/interpretations/<task>.md に書き出す
+   - [Teams mode] spec-compliance-reviewer に SendMessage で検証依頼し、フィードバックを待つ
+   - [Sub Agents mode] 必須チェック項目を自己検証。「仕様に未記載」があればエスカレーション
+4. Given/When/Then シナリオからテストケースを導出する
+5. TDD厳守: テストを先に書く
```

#### 3.2.6 /implement コマンドフローの変更

```
[現行]
Step 0: 引数解析 → Step 1: 準備 → Step 2: タスク分析 → Step 3: モード分岐 → Step 4: 実行 → Step 5: 検証

[提案]
Step 0: 引数解析 → Step 1: 準備 → Step 2: タスク分析 → Step 3: モード分岐
→ Step 4: 実行（各タスク内で Interpretation Log 出力 → 検証 → TDD 実装）
→ Step 5: 検証
```

**注意:** Step 4 と Step 5 は現行と同じステップ数だが、Step 4 の各タスク実行内に Interpretation Log フェーズが組み込まれる。implementer プロンプトテンプレートに以下を追加:

```
INTERPRETATION REQUIREMENT:
TDD 開始前に Spec Interpretation Log を openspec/changes/<CHANGE_NAME>/interpretations/<task>.md に出力すること。
必須チェック項目に「仕様に未記載」がある場合は AskUserQuestion でエスカレーションすること。
```

---

### 3.3 レビューの完全性保証: Spec-Aware Review

#### 3.3.1 レビュアーへの仕様コンテキスト注入

現行の `/review` コマンドはレビュアーに change-name のみ渡し、仕様コンテキストを提供していない。以下を必須入力として追加する:

```
REVIEW CONTEXT:
- delta-spec: openspec/changes/<change-name>/specs/[ファイル一覧]
- design.md: openspec/changes/<change-name>/design.md
- 変更ファイル: [git diff --stat の出力]

REVIEW INSTRUCTION:
1. まず delta-spec と design.md を Read し、設計意図を理解すること
2. 設計上の意図的な選択を「問題」として指摘しないこと
3. 各指摘に「関連する仕様項目」を明記すること（仕様外の指摘は明示すること）
```

#### 3.3.2 動的レビュアー選択

forge-skill-orchestrator のドメイン検出ロジックを /review に適用し、変更されたファイルパターンに基づいてレビュアーを動的に選択する:

```
変更ファイル分析（git diff --stat）
  │
  ├── .prisma / prisma/ → prisma-guardian を追加
  ├── .tf / terraform/ → terraform-reviewer を追加
  ├── src/app/ (.tsx) → architecture-strategist, performance-oracle を追加
  ├── src/app/api/ / src/actions/ → api-contract-reviewer を追加
  ├── .ts / .tsx → type-safety-reviewer を追加
  └── 常時起動 → security-sentinel（セキュリティは常にチェック）
```

**コスト削減効果:** UI のみの変更で prisma-guardian と terraform-reviewer が不要な場合、7 並列 → 5 並列に削減（約 30% のトークン節約）。

#### 3.3.3 review-aggregator エージェント（新規）

```yaml
---
name: review-aggregator
description: "複数レビュアーの結果を統合し、重複排除・矛盾解決・カバレッジマトリクスを生成する"
model: opus
tools: [Read, Grep, Glob]
skills: [iterative-retrieval]
---
```

**役割:**

1. **重複排除**: 複数レビュアーが同一箇所を指摘した場合、最も具体的な指摘に統合
2. **矛盾解決**: レビュアー間で相反する指摘がある場合、フラグしてユーザーに判断を委ねる
3. **優先度調整**: 各レビュアーが個別に付けた P1/P2/P3 を横断的に再評価。各指摘の確信度（HIGH/MEDIUM/LOW）も考慮し、低確信度の P2/P3 はノイズ候補として分離（ただし Compound Learning に記録）
4. **カバレッジマトリクス生成**: delta-spec の各 Given/When/Then シナリオに対して、どのレビュアーがどの指摘を行ったかをマッピング（要件 ID ベース）

**カバレッジマトリクスの形式:**

```markdown
## Review Coverage Matrix

| 仕様項目 | Security | Performance | Architecture | Type Safety | API Contract | カバー状態 |
|---|---|---|---|---|---|---|
| Req-A: Happy Path | - | PERF-001 | - | TYPE-002 | - | Covered |
| Req-A: Error Scenario | SEC-003 | - | - | - | API-001 | Covered |
| Req-B: Happy Path | - | - | ARCH-001 | - | - | Covered |
| Req-B: Boundary | - | - | - | - | - | **UNCOVERED** |

### 未カバー項目
- Req-B: Boundary Scenario -- どのレビュアーも検証していない。追加レビューを推奨。
```

#### 3.3.4 レビュー → 修正 → 再検証ループ

```
/review 実行
  │
  v
7レビュアー並列実行（ドメインフィルタリング済み）
  │
  v
review-aggregator が統合
  │
  ├── P1 あり → 修正対象を特定
  │     │ アーキテクチャ変更不要 → Task(implementer) で自動修正 → 修正部分のみ再レビュー（2回目は関連レビュアーのみ）
  │     │ アーキテクチャ変更必要 → AskUserQuestion でユーザーに確認
  │     └── 再レビューは最大 1 回（無限ループ防止）
  │
  ├── P2 のみ → ユーザーに判断を委ねる
  └── P3 のみ → レポートのみ出力
```

---

### 3.4 Compound Learning の拡張: Learning Router

#### 3.4.1 学びの分類と自動ルーティング

現行の Compound Learning は学びを記録し、「100 ドルルール」に該当する場合にルール更新を提案する。これを拡張し、学びの種別に応じて適切なアーティファクトへの更新を自動提案する。

**分類テーブル:**

| 学びの種別 | 更新対象アーティファクト | 例 |
|---|---|---|
| コーディングパターンの発見 | `rules/` または `reference/` | 「Prisma の findMany には必ず take を付ける」 |
| 仕様作成時の見落としパターン | spec-writer テンプレート / spec-validator チェックリスト | 「認証 API には必ずトークン期限切れシナリオを含める」 |
| 実装時の解釈誤りパターン | implementer の必須チェック項目 | 「"適切に処理する" という記述は常にエスカレーション対象」 |
| レビュー見落としパターン | レビュアーのチェックリスト | 「Server Actions の CSRF 対策は security-sentinel が常にチェック」 |
| ワークフロープロセスの改善 | コマンド定義 (`commands/`) | 「/implement の前に必ず型定義ファイルを先行生成する」 |
| 繰り返し発生するビルドエラー | build-error-resolver の知識ベース / フック | 「特定の import パターンでエラーが発生する → フックで検出」 |
| エスカレーション判断の誤り | implementer / spec-compliance-reviewer のエスカレーション条件 | 「DB のカスケード削除は常にエスカレーション」 |

#### 3.4.2 /compound コマンドフローの変更

```
[現行]
1. 学びを抽出 → 2. docs/compound/ に記録 → 3. 100ドルルールでルール更新提案 → 4. スペックマージ → 5. アーカイブ

[提案]
1. 学びを抽出
2. docs/compound/ に記録
3. 学びを分類テーブルに基づいて分類
4. 各分類に対応するアーティファクトの具体的な更新差分を生成
5. ユーザーに更新提案を提示（アーティファクト種別ごとにグループ化）
6. ユーザー承認後に適用
7. スペックマージ
8. アーカイブ
```

#### 3.4.3 閾値の緩和

現行の「100 ドルルール」は「防げたはずの重大な失敗」にのみ適用されるが、軽微な改善も蓄積することで複利効果を高める:

| 閾値 | アクション |
|---|---|
| 重大（100 ドル超相当） | ルール / スキル / フック / エージェント定義の更新を強く提案 |
| 中程度（繰り返し発生） | 同一種別の学びが 2 回以上蓄積した場合、更新を提案 |
| 軽微（初回発生） | docs/compound/ に記録のみ。次回発生時に中程度に昇格 |

#### 3.4.4 Compound Learning ドキュメントテンプレートの拡張

```markdown
---
category: [bug-fix | performance | architecture | security | testing | devops | pattern | spec-gap | escalation-failure | review-gap]
stack: [nextjs | prisma | terraform | gcp | typescript | general]
severity: [critical | important | minor]
date: YYYY-MM-DD
tags: [関連タグ]
artifact-targets: [rules | skills | hooks | agents | commands | spec-template | reference]
---

# [学びのタイトル]

## 何が起きたか
## なぜ起きたか
## どう解決したか
## 教訓

## 防止策と更新提案
### ルール更新
- [ ] [具体的な更新内容と対象ファイル]

### スキル更新
- [ ] [具体的な更新内容と対象ファイル]

### フック更新
- [ ] [具体的な更新内容と対象ファイル]

### エージェント定義更新
- [ ] [具体的な更新内容と対象ファイル]

### コマンドフロー更新
- [ ] [具体的な更新内容と対象ファイル]

### 仕様テンプレート更新
- [ ] [具体的な更新内容と対象ファイル]
```

---

### 3.5 追加改善: Best Practice 自動収集の強化

#### 3.5.1 /spec 時の自動収集（強化）

現行でもリサーチエージェントが Best Practice を収集するが、以下を強化:

- **stack-docs-researcher**: 検索クエリに delta-spec の技術要素を自動反映。例えば delta-spec に「認証」が含まれていれば、Next.js の認証ベストプラクティスを自動検索
- **web-researcher**: 過去の compound learning で記録された「落とし穴」キーワードを検索クエリに自動追加
- **compound-learnings-researcher**: 検索結果に `artifact-targets` フィールドを含め、過去の学びがどのアーティファクトに反映済みかを追跡

#### 3.5.2 /implement 時の Just-in-Time 収集

implementer が Interpretation Plan を作成する際、design.md のリサーチサマリーに含まれない技術的詳細が必要になる場合がある。このため、implementer に Context7 MCP ツールへのアクセスを許可し、実装時に必要な公式ドキュメントを Just-in-Time で参照できるようにする。

---

### 3.6 追加改善: Lattice 残留物のクリーンアップ

#### 3.6.1 対象

| 対象 | アクション |
|---|---|
| `~/.claude/hooks/session-start.js` | 削除（Lattice DB 不在で無機能） |
| `~/.claude/hooks/session-end.js` | 削除（同上） |
| `~/.claude/hooks/detect-corrections.js` | 削除（同上） |
| `~/.claude/hooks/pre-compact.js` | 削除（同上） |
| `~/.claude/hooks/teammate-idle.js` | 削除（phase.yaml 不在で無機能） |
| `~/.claude/hooks/task-completed.js` | 削除（同上） |
| `reference/core-rules.md` | Lattice 固有概念（log_pattern, /checkpoint 等）を削除し、Forge 専用に整理 |
| `reference/workflow-rules.md` | 同上 |
| `~/.claude/hooks/package.json` | "lattice-hooks" から "forge-hooks" にリネーム。不要な依存（better-sqlite3）を削除 |

#### 3.6.2 Forge ネイティブのセッション管理（将来検討）

Lattice が提供していた以下の機能は、将来的に Forge ネイティブで再実装を検討する:

- セッション開始時のコンテキスト注入（過去の学び、最近のパターン）
- セッション終了時の学びの自動抽出
- パターン検出と自動記録

ただし、これらは本提案のスコープ外とし、まず上記 6 つの改善を優先する。

---

### 3.7 追加改善: Spec-to-Review トレーサビリティ

パイプライン全体で「要件番号 → タスク番号 → コミット → レビュー指摘」の紐付けを明示化する。

#### 3.7.1 要件 ID の導入

delta-spec の各要件に一意の ID を付与する:

```markdown
### Requirement: REQ-001 [要件名]
```

tasks.md の各タスクに関連要件 ID を記載する（現行の `関連スペック` フィールドを ID ベースに変更）:

```markdown
### Task 1: [タスク名]
- **関連要件**: REQ-001, REQ-003
```

implementer のコミットメッセージに要件 ID を含める:

```
feat(auth): ログイン画面のバリデーション追加 [REQ-001]
```

review-aggregator のカバレッジマトリクスが要件 ID で照合する:

```markdown
| REQ-001 | SEC-003 | - | ARCH-001 | - | - | Covered |
```

#### 3.7.2 トレーサビリティの効果

- **仕様漏れの検出**: どの要件にもタスクが紐付いていない場合、実装漏れの可能性
- **スコープ逸脱の検出**: タスクが要件 ID を持たない場合、スコープ外の実装の可能性
- **レビューカバレッジの正確な測定**: 要件 ID ベースでカバレッジを計算可能
- **Compound Learning のトレーサビリティ**: 問題が発生した場合、要件 → タスク → コミット → レビュー の因果連鎖を追跡可能

---

### 3.8 追加改善: レビュー学習ループ

レビュー指摘の受け入れ/却下パターンを Compound Learning に蓄積し、レビュー精度を向上する。

#### 3.8.1 仕組み

1. /review の指摘に対してユーザーが「受け入れ」または「却下（理由付き）」を判断する
2. 却下された指摘のパターンを docs/compound/ に記録（category: `review-gap`）
3. 同一パターンの却下が 2 回以上蓄積した場合、Learning Router が該当レビュアーのチェックリスト更新を提案
4. 例: 「architecture-strategist が Server Actions の直接 DB アクセスを常に指摘するが、このプロジェクトでは設計上許容している」→ architecture-strategist のチェックリストにプロジェクト固有の例外を追加

#### 3.8.2 False Positive の抑制効果

業界の調査によると、AI レビューの 70-80% は的確な「ローハンギングフルーツ」を検出するが、残りにノイズが混じる。レビュー学習ループにより、プロジェクト固有のノイズパターンを学習し、的外れな指摘を漸進的に削減する。

---

## 4. 実装ロードマップ

### Phase 1: 基盤整備（即座に実施可能）

| 項目 | 作業内容 | 影響度 | 工数 |
|---|---|---|---|
| 1-1 | Lattice 残留物のクリーンアップ | 低リスク | 小 |
| 1-2 | delta-spec テンプレートにシナリオ種別を追加（Error / Boundary / Non-Functional） | 中 | 小 |
| 1-3 | /review コマンドにレビュアーへの仕様コンテキスト注入を追加 | 中 | 小 |
| 1-4 | /review コマンドにドメインベースのレビュアーフィルタリングを追加 | 中 | 小 |
| 1-5 | Compound Learning テンプレートに artifact-targets と拡張防止策セクションを追加 | 低 | 小 |
| 1-6 | delta-spec に要件 ID（REQ-XXX）を導入し、tasks.md との紐付けを必須化 | 中 | 小 |

### Phase 2: 仕様品質ゲート（高優先度）

| 項目 | 作業内容 | 影響度 | 工数 |
|---|---|---|---|
| 2-1 | spec-validator エージェント定義の作成 | 高 | 中 |
| 2-2 | /spec コマンドに Phase 3 (検証) と Phase 4 (修正ループ) を追加 | 高 | 中 |
| 2-3 | spec-writer の出力テンプレートをシナリオ種別テンプレートに更新 | 中 | 小 |

### Phase 3: Interpretation-First Implementation（高優先度）

| 項目 | 作業内容 | 影響度 | 工数 |
|---|---|---|---|
| 3-1 | implementer エージェント定義に Spec Interpretation Log 出力フェーズを追加（行動規範の変更） | 高 | 小 |
| 3-2 | spec-compliance-reviewer に事前検証モード（Interpretation Log 照合）を追加 | 高 | 小 |
| 3-3 | /implement コマンドの implementer プロンプトテンプレートに INTERPRETATION REQUIREMENT を追加 | 高 | 小 |
| 3-4 | `openspec/changes/<name>/interpretations/` ディレクトリの規約を OpenSpec 構造に追加 | 低 | 小 |

### Phase 4: レビュー完全性保証（中優先度）

| 項目 | 作業内容 | 影響度 | 工数 |
|---|---|---|---|
| 4-1 | review-aggregator エージェント定義の作成 | 高 | 中 |
| 4-2 | /review コマンドに review-aggregator 統合と修正ループを追加 | 高 | 中 |
| 4-3 | カバレッジマトリクス出力形式の実装（要件 ID ベース） | 中 | 小 |
| 4-4 | レビュー学習ループ（受け入れ/却下パターンの蓄積と False Positive 抑制） | 中 | 小 |

### Phase 5: Compound Learning Router（中優先度）

| 項目 | 作業内容 | 影響度 | 工数 |
|---|---|---|---|
| 5-1 | /compound コマンドに学びの分類ルーティングロジックを追加 | 中 | 中 |
| 5-2 | 各アーティファクト種別への具体的更新差分生成ロジックを追加 | 中 | 中 |
| 5-3 | 閾値緩和（重大 / 中程度 / 軽微の 3 段階）の実装 | 低 | 小 |

---

## 5. 期待される効果

### 5.1 定量的効果（推定）

| 指標 | 現行 | 提案後 | 改善根拠 |
|---|---|---|---|
| 仕様のエラーシナリオカバレッジ | 推定 30-40% | 目標 80%+ | シナリオ種別テンプレート + spec-validator による網羅性強制 |
| 実装時のサイレント仮定発生率 | 高（検出不能） | 低（Interpretation Plan で可視化） | 構造的にアーティファクト生成を強制 |
| レビューの仕様カバレッジ | 不明（測定不能） | 測定可能（マトリクス） | review-aggregator によるカバレッジ追跡 |
| レビュー → 修正の手動介入 | 毎回必要 | P1 は自動修正 + 自動再検証 | 修正ループの自動化 |
| 不要なレビュアー起動 | 常に 7 並列 | ドメインに応じて 3-7 並列 | 動的レビュアー選択で 0-30% のトークン節約 |
| Compound Learning のフィードバック範囲 | ルールのみ | 7 種別のアーティファクト | Learning Router による全アーティファクト対象化 |

### 5.2 定性的効果

1. **ユーザーの信頼性向上**: 仕様がユーザー承認前に検証済みであるため、「承認したのに漏れがあった」が減少
2. **デバッグコストの削減**: 仕様の曖昧性が実装前に検出されるため、実装後の手戻りが減少
3. **レビュー品質の向上**: レビュアーが設計意図を理解した上でレビューするため、的確な指摘が増加
4. **システムの自己改善**: Compound Learning が全アーティファクトに作用するため、使うごとに仕様品質・実装品質・レビュー品質が向上する複利効果

### 5.3 トレードオフ

| トレードオフ | 影響 | 緩和策 |
|---|---|---|
| spec-validator 追加によるパイプライン時間の増加 | /spec の実行時間が 1.3-1.5 倍に | spec-validator は軽量（Read + 分析のみ）。修正ループは最大 2 往復に制限 |
| Spec Interpretation Log による /implement の時間増加 | 各タスクに約 15% のオーバーヘッド | 単一呼び出し内の追加ステップのため、別エージェント呼び出しの 2 倍コストは回避。事前検証で実装後の手戻りを削減するため、総合的には時間短縮 |
| review-aggregator 追加によるトークン消費 | +1 エージェント分のトークン | ドメインフィルタリングによるレビュアー削減で相殺 |
| Compound Learning の拡張による手動承認の増加 | 更新提案がアーティファクト種別ごとに増加 | 軽微な学びは記録のみ。2 回以上蓄積で初めて更新提案 |

---

## 6. 設計上の判断と代替案

### 6.1 Spec Interpretation Log の実装方式

**採用案: implementer の単一呼び出し内に 2 フェーズを組み込む（C-optimized）**

詳細な比較分析は Section 3.2.2 を参照。4 つの方式を検討し、コスト・検証品質・Context Isolation 互換性の観点から C-optimized を採用した。

**採用の決め手:**
- Claude Code の「サブエージェントはネスト不可」制約により、別エージェント方式（A）と 2 回呼び出し方式（C）はコンテキスト喪失のリスクが高い
- Main Agent 検証方式（B）は Context Isolation Policy により検証品質が不十分
- 単一呼び出し内 2 フェーズ（C-opt）は約 15% のオーバーヘッドで、80% 以上の構造的保証を実現
- 残りのギャップは spec-compliance-reviewer の事前検証（Teams モード）/ 事後検証（Sub Agents モード）+ ユーザー監査可能なファイルアーティファクトでカバー

### 6.2 レビュアーフィルタリングの方式

**採用案: ドメイン検出に基づく動的レビュアー選択（security-sentinel は常時起動）**

**検討した代替案と却下理由:**

| 代替案 | 却下理由 |
|---|---|
| 全レビュアーを常時起動（現行） | 不要なレビュアーのトークン消費。無関係な指摘によるノイズ |
| ユーザーがレビュアーを手動選択 | ユーザーの負担増加。ドメイン検出の自動化が可能 |
| スコープ指示のみ（全レビュアー起動 + 「関係ないファイルは無視」指示） | LLM のスコープ遵守は不完全。起動しない方が確実 |

### 6.3 spec-validator の位置づけ

**採用案: /spec コマンド内の Phase として実行（ユーザー承認前）**

**検討した代替案と却下理由:**

| 代替案 | 却下理由 |
|---|---|
| /spec と /implement の間に独立コマンド `/validate-spec` を追加 | パイプラインのステップ増加。/spec 内に統合する方がユーザー体験が良い |
| ユーザー承認後に検証 | 承認後の修正はユーザーの再承認が必要。承認前に検証する方が効率的 |
| spec-writer に検証機能を統合 | 生成と検証は対立的な目的。同一エージェントに統合するとチェックが甘くなる |

---

## 7. 現行システムからの移行

### 7.1 後方互換性

すべての変更は既存のコマンドインターフェースを維持する。ユーザーは同じ `/brainstorm`, `/spec`, `/implement`, `/review`, `/test`, `/compound`, `/ship` コマンドを使い続けられる。内部フローが改善されるが、ユーザーの操作は変わらない。

### 7.2 段階的移行

Phase 1（基盤整備）から Phase 5（Compound Learning Router）まで段階的に実装できる。各 Phase は独立しており、Phase 1 だけでも即座に改善効果がある。

### 7.3 ロールバック

各 Phase の変更はコマンド定義（.md）とエージェント定義（.md）の編集のみで構成される。Git でバージョン管理されるため、問題が発生した場合は即座にロールバック可能。

---

## 付録 A: CLAUDE.md の更新方針

本提案の実装に伴い、CLAUDE.md の以下のセクションを更新する必要がある:

1. **コマンドパイプライン図**: spec-validate ステップの追加を反映
2. **Available Agents テーブル**: spec-validator, review-aggregator の追加
3. **Context Isolation Policy**: Interpretation Plan の読み込みを「許可される操作」に追加
4. **Compound Learning セクション**: Learning Router の分類テーブルと閾値を反映

また、グローバル CLAUDE.md (`~/.claude/CLAUDE.md`) とプロジェクト CLAUDE.md (`forge/CLAUDE.md`) の役割分担を明確化する:
- グローバル: Forge システム共通の設計原則・ルール・スキル一覧
- プロジェクト: プロジェクト固有のコンテキスト（技術スタック、DB 構成、デプロイ先等）

## 付録 B: 新規エージェント定義のドラフト

### spec-validator

```yaml
---
name: spec-validator
description: "delta-specの網羅性を敵対的に検証する。エラーパス・境界値・非機能要件の欠落を検出し修正を提案する"
model: opus
tools: [Read, Grep, Glob]
skills: [iterative-retrieval]
---
```

### review-aggregator

```yaml
---
name: review-aggregator
description: "複数レビュアーの結果を統合し重複排除・矛盾解決・カバレッジマトリクスを生成する"
model: opus
tools: [Read, Grep, Glob]
skills: [iterative-retrieval]
---
```
