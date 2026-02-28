---
description: "提案書から実装仕様とタスクリストを作成する。Teams/Sub Agentsモードを選択し、リサーチエージェント群とspec-writerで仕様を生成する"
disable-model-invocation: true
argument-hint: "<change-name> [--teams|--agents]"
---

# /spec コマンド

REQUIRED SKILLS:
- forge-skill-orchestrator

## 目的

提案書（`openspec/changes/<change-name>/proposal.md`）から詳細なデルタスペック・技術設計・実行可能なタスクリストを作成する。

## ワークフロー

### Step 0: 引数の解析

$ARGUMENTS を解析し、以下を決定する:

1. **change-name**: `--teams`/`--agents` フラグを除いた文字列
   - 指定あり: `openspec/changes/<change-name>/` を対象とする
   - 省略: `openspec/changes/` 内のアクティブ変更（`archive/` 以外）を自動検出
     - 1つ → 自動選択
     - 複数 → AskUserQuestion で選択
     - 0 → エラー（先に `/brainstorm` を実行するよう案内）
2. **mode**: `--teams` → Teams モード、`--agents` → Sub Agents モード、省略 → デフォルト（`agents`）

mode に基づいて Phase 1a または Phase 1b に進む。

### Phase 1a: リサーチ＆スペックチーム（Teams モード）

TeamCreate でリサーチ＆スペックチームを作成し、以下の5 teammate を起動する:

```
Main Agent（チームリーダー）
  | proposal.md の内容をプロンプトで渡してチーム起動
  |
  +-- TeamCreate -> リサーチ＆スペックチーム
      +-- codebase-analyzer: プロジェクト構造・既存パターン・影響範囲分析
      +-- stack-docs-researcher: Context7 MCP経由で公式ドキュメント調査
      +-- web-researcher: Web Searchで最新ベストプラクティス・落とし穴調査
      +-- compound-learnings-researcher: docs/compound/ から過去の学び抽出
      +-- spec-writer: リサーチ結果統合 -> design.md / tasks.md / delta-spec 生成
```

**spec-writer の役割:**
- リサーチャー全員のタスク完了後、結果を読み込み・統合
- 不足があれば SendMessage でリサーチャーに追加調査を依頼
- リサーチ結果の検証（矛盾検出、セキュリティ判断等）を実施
- エスカレーションが必要な場合は SendMessage で Main Agent に選択肢付きで送信
- design.md, tasks.md, delta-spec.md を生成
- 完了時にサマリーのみを Main Agent に SendMessage で送信

**Main Agent はサマリーのみ受け取る（コンテキスト保護）。**

**エスカレーションフロー:**
- spec-writer / リサーチャーが疑問発見 -> SendMessage で Main Agent に選択肢付きで送信
- Main Agent -> AskUserQuestion でユーザーに選択肢をそのまま提示
- ユーザー回答 -> Main Agent -> SendMessage で Team Member に回答をそのまま返信

チーム完了後: TeamDelete でクリーンアップ。

### Phase 1b: リサーチ（Sub Agents モード）

以下の4つのリサーチエージェントを**並列で**起動する:

1. **stack-docs-researcher** -- Context7 MCP経由で関連フレームワーク（Next.js, Prisma, Terraform, GCP等）の公式ドキュメントから該当機能のベストプラクティスを取得
2. **web-researcher** -- Web Searchを使って以下を検索:
   - 該当技術の最新のベストプラクティス記事
   - 既知の落とし穴やバグレポート
   - コミュニティでの推奨パターン
   - 類似実装の参考例
3. **codebase-analyzer** -- 現在のプロジェクト構造を分析:
   - 既存の規約・パターンを抽出
   - 影響を受けるファイルを特定
   - 依存関係を把握
   - `openspec/specs/` の既存スペックを読み込み、関連する要件とシナリオを抽出
4. **compound-learnings-researcher** -- `docs/compound/` 配下の過去の学びを検索し、関連する教訓を抽出

### Phase 1.7: ドメイン判定

proposal.md のキーワードからドメインを推論し、spec-writer / spec-validator に渡すドメイン Skill を決定する。

#### キーワード推論テーブル

| キーワード | ドメイン | 読み込む design.md |
|---|---|---|
| データベース, テーブル, マイグレーション | prisma-database | `prisma-expert/design.md`, `database-migrations/design.md` |
| API, エンドポイント, Route Handler | typescript-backend | `nextjs-api-patterns/design.md`, `security-patterns/design.md` |
| 画面, コンポーネント, UI | nextjs-frontend | `next-best-practices/design.md`, `vercel-react-best-practices/design.md`, `vercel-composition-patterns/design.md` |
| 認証, 認可, OAuth | security | `security-patterns/design.md` |
| インフラ, Terraform, GCP | terraform-infrastructure | `terraform-gcp-expert/design.md` |

#### 判定ルール

1. proposal.md のテキストをスキャンし、キーワード推論テーブルに該当するキーワードを検出する
2. 該当する全ドメインの design.md を Union で含める（複数ドメイン該当時は全て含める）
3. `architecture-patterns/design.md` を常に含める（proposal.md の内容に関わらず必須）
4. 注入する design.md が6個以上になる場合、最大5個に制限する（`architecture-patterns/design.md` は必須枠として確保し、残り4枠をテーブル上位から選択）
5. キーワードが一つも該当しない場合、`architecture-patterns/design.md` のみを注入する

#### Skill の注入方法

決定したドメイン Skill の design.md を、spec-writer / spec-validator のプロンプトに以下の形式で記載する:

```
REQUIRED SKILLS:
- iterative-retrieval
- verification-before-completion

DOMAIN CONTEXT FILES (Read ツールで直接読み込むこと):
- ~/.claude/skills/architecture-patterns/design.md
- ~/.claude/skills/[該当ドメイン Skill]/design.md
※ ファイルが存在しない場合は Skill ツールで該当スキルを呼び出す
```

### Phase 1.5: リサーチ結果の検証（Sub Agents モードのみ）

Teams モードでは spec-writer がチーム内で検証を実施するため、このフェーズはスキップする。

Sub Agents モードでは、Phase 1b の結果を統合する前に以下の観点で検証する。該当する場合は `AskUserQuestion` でユーザーに確認してから Phase 2 に進む:

1. **リサーチ結果の矛盾**: 複数のリサーチエージェントが矛盾する推奨を返した場合（例: web-researcher と stack-docs-researcher で推奨パターンが異なる）
2. **複数の有効なアーキテクチャ**: 技術的に同等な設計アプローチが複数存在し、プロジェクトの方針として選択が必要な場合
3. **セキュリティ設計判断**: 認証方式、暗号化戦略、アクセス制御モデルなど、セキュリティに関わる設計判断が必要な場合
4. **既存スペックとの矛盾**: codebase-analyzer が既存スペックとの矛盾をエスカレーション対象として報告した場合
5. **影響範囲の拡大**: codebase-analyzer が想定以上の影響範囲をエスカレーション対象として報告した場合

検証の結果、問題がなければそのまま Phase 2 に進む。

### Phase 2: 仕様統合

**Teams モード**: spec-writer が既にチーム内で生成済み。Main Agent は spec-writer からのサマリーを受け取り、Phase 3 に進む。

**Sub Agents モード**: Main Agent がリサーチ結果を統合し、`openspec/changes/<change-name>/` 配下に以下の3ファイルを出力する:

1. `specs/<feature>/delta-spec.md` -- デルタ要件（ADDED/MODIFIED/REMOVED + シナリオ種別テンプレート）
2. `design.md` -- リサーチサマリー + 技術設計
3. `tasks.md` -- タスクリスト

### Phase 3: 仕様検証（spec-validator）

spec-validator を起動し、delta-spec の網羅性を敵対的に検証する。

**Teams モード**: spec-validator を teammate として起動する。spec-validator は delta-spec / design.md / tasks.md / 累積スペックを読み込み、Spec Validation Report を出力する。

**Sub Agents モード**: Task(spec-validator) を起動する。入力として change-name を渡す。

spec-validator は以下を検証する:
- EARS + Google Design Review 品質基準（Correctness、テスト可能性、振る舞い中心、Clarity、Completeness、Consistency）
- 9 つの検証項目（エラーシナリオ確認、境界値検出、非機能要件確認、シナリオ間矛盾検出、既存スペック整合性、未指定シナリオ列挙、タスク粒度検証、STRIDE 簡易チェック、Last Responsible Moment）

### Phase 4: 修正ループ

Phase 3 の検証結果に基づき、仕様の修正を行う。

**Teams モード**: spec-validator が spec-writer に SendMessage で修正指示を送信する。spec-writer が修正し、spec-validator が再検証する。最大 2 往復で収束させる。「要確認」項目がある場合は spec-validator が Main Agent に SendMessage でエスカレーションし、Main Agent が AskUserQuestion でユーザーに確認する。

**Sub Agents モード**: spec-validator の Spec Validation Report に基づき、Main Agent が修正すべき項目を特定する。
- 「要修正」項目: Task(spec-writer) を再起動して修正を委譲する。修正後、Task(spec-validator) を再起動して再検証する。最大 2 往復。
- 「要確認」項目: AskUserQuestion でユーザーに確認し、回答に基づいて Task(spec-writer) に修正を委譲する。

修正ループ完了後、最終版の Spec Validation Report を保持して Phase 5 に進む。

### Phase 5: ユーザー確認

検証済みの仕様 + Spec Validation Report をユーザーに提示し、**ユーザーが明示的に承認するまで実装に進まない**。

提示内容:
1. 生成されたファイルの場所（delta-spec.md, design.md, tasks.md）
2. Spec Validation Report のカバレッジサマリー
3. 修正ループで解消された項目の概要
4. 残存する注意事項（もしあれば）

「この仕様で実装を開始してよいですか?」と確認する。

## デルタスペック形式

`openspec/changes/<change-name>/specs/<feature>/delta-spec.md`:

```markdown
# [feature] デルタスペック

## ADDED Requirements

### Requirement: REQ-001 [要件名]
[RFC 2119: SHALL, SHOULD, MAY]

#### Happy Path Scenarios
- **GIVEN** [前提条件] **WHEN** [アクション] **THEN** [期待結果]

#### Error Scenarios（必須）
- **GIVEN** [正常な前提] **WHEN** [異常入力/操作] **THEN** [エラー処理の期待結果]
- **GIVEN** [外部依存の障害] **WHEN** [操作] **THEN** [フォールバックの期待結果]

#### Boundary Scenarios（該当する場合）
- **GIVEN** [境界値条件] **WHEN** [操作] **THEN** [期待結果]

#### Non-Functional Requirements（該当する場合）
- **PERFORMANCE**: [応答時間/スループット要件]
- **ACCESSIBILITY**: [アクセシビリティ要件]
- **ERROR_UX**: [ユーザーへのエラー表示要件]

## MODIFIED Requirements

### Requirement: REQ-XXX [要件名]
[変更後の記述]
**変更理由**: [理由]

#### Happy Path Scenarios
- **GIVEN** / **WHEN** / **THEN**

#### Error Scenarios（必須）
- **GIVEN** / **WHEN** / **THEN**

#### Boundary Scenarios（該当する場合）
- **GIVEN** / **WHEN** / **THEN**

#### Non-Functional Requirements（該当する場合）
- ...

## REMOVED Requirements

### Requirement: [要件名]
**削除理由**: [理由]
```

### シナリオ種別ルール

- **Happy Path Scenarios**: 正常系。全要件で必須
- **Error Scenarios**: 異常系。全要件で**必須**。異常入力、外部依存障害、権限不足等のケースを最低1つ含める
- **Boundary Scenarios**: 数値入力、文字列長、リスト件数など境界値が存在する場合に記述
- **Non-Functional Requirements**: UI変更時のアクセシビリティ、API変更時のパフォーマンス等、該当する場合に記述

### 要件 ID（REQ-XXX）ルール

- 形式: `REQ-XXX`（XXX は変更単位内の連番、001から開始）
- ADDED / MODIFIED の全要件に付与する（REMOVED は任意）
- tasks.md の各タスクの「関連要件」に要件 ID を含める
- 要件 ID は変更単位（change-name）内で一意であればよい

## 設計ドキュメント形式

`openspec/changes/<change-name>/design.md`:

```markdown
# [変更名] 技術設計

## 概要

## リサーチサマリー
### 公式ドキュメントからの知見
[stack-docs-researcherの結果]

### Web検索からの知見
[web-researcherの結果]
- 最新ベストプラクティス
- 既知の落とし穴
- 参考実装

### コードベース分析（既存スペックとの関連含む）
[codebase-analyzerの結果]
- 既存パターンとの整合性
- 影響範囲
- 関連する既存スペックの要件

### 過去の学び
[compound-learnings-researcherの結果]

## 技術的アプローチ

## リスクと注意点
[リサーチで判明した落とし穴、既知のバグ等]
```

## タスクリスト形式

`openspec/changes/<change-name>/tasks.md`:

```markdown
# [変更名] タスクリスト

## テスト戦略
- ユニットテスト: [対象と方針]
- 統合テスト: [対象と方針]
- E2Eテスト: [対象と方針]

## タスク

### Task 1: [タスク名]（推定: X分）
- **対象ファイル**: `src/app/xxx/page.tsx`（新規 or 既存）
- **やること**: [具体的な変更内容]
- **検証方法**: [テストコマンド]
- **関連要件**: REQ-001, REQ-003
- **関連スペック**: `specs/<feature>/delta-spec.md#[要件名]`
- **依存**: [依存タスク番号。なければ「なし」]
```

## タスク分解のルール

- 1タスクは**2〜5分**で完了できるサイズ
- 各タスクに**正確なファイルパス**を含める
- 各タスクに**検証方法**を必ず含める
- タスクの依存関係を明示する
- テストタスクを実装タスクの**前**に配置する（TDD）
- 各タスクに関連デルタスペック要件へのリンクを含める
- テストケースは Given/When/Then シナリオから導出する
