---
description: "提案書から実装仕様とタスクリストを作成する。リサーチエージェントを並列起動し、Web検索とContext7 MCPで最新情報を収集する"
disable-model-invocation: true
---

# /spec コマンド

## 目的

提案書（`openspec/changes/<change-name>/proposal.md`）から詳細なデルタスペック・技術設計・実行可能なタスクリストを作成する。

## Skill Activation

1. `forge-skill-orchestrator` スキルを呼び出し、仕様設計フェーズに適用される Skill を確認する
2. リサーチサブエージェントを起動する際、各エージェントの `skills` frontmatter に記載された Skill の SKILL.md を読み込み、タスクプロンプトに含める

## ワークフロー

### Phase 1: リサーチ（並列エージェント起動）

以下の4つのリサーチエージェントを**並列で**起動する：

1. **stack-docs-researcher** -- Context7 MCP経由で関連フレームワーク（Next.js, Prisma, Terraform, GCP等）の公式ドキュメントから該当機能のベストプラクティスを取得
2. **web-researcher** -- Web Searchを使って以下を検索：
   - 該当技術の最新のベストプラクティス記事
   - 既知の落とし穴やバグレポート
   - コミュニティでの推奨パターン
   - 類似実装の参考例
3. **codebase-analyzer** -- 現在のプロジェクト構造を分析：
   - 既存の規約・パターンを抽出
   - 影響を受けるファイルを特定
   - 依存関係を把握
   - `openspec/specs/` の既存スペックを読み込み、関連する要件とシナリオを抽出
4. **compound-learnings-researcher** -- `docs/compound/` 配下の過去の学びを検索し、関連する教訓を抽出

### Phase 1.5: リサーチ結果の検証

Phase 1 の結果を統合する前に、以下の観点で検証する。該当する場合は `AskUserQuestion` でユーザーに確認してから Phase 2 に進む：

1. **リサーチ結果の矛盾**: 複数のリサーチエージェントが矛盾する推奨を返した場合（例: web-researcher と stack-docs-researcher で推奨パターンが異なる）
2. **複数の有効なアーキテクチャ**: 技術的に同等な設計アプローチが複数存在し、プロジェクトの方針として選択が必要な場合
3. **セキュリティ設計判断**: 認証方式、暗号化戦略、アクセス制御モデルなど、セキュリティに関わる設計判断が必要な場合
4. **既存スペックとの矛盾**: codebase-analyzer が既存スペックとの矛盾をエスカレーション対象として報告した場合
5. **影響範囲の拡大**: codebase-analyzer が想定以上の影響範囲をエスカレーション対象として報告した場合

検証の結果、問題がなければそのまま Phase 2 に進む。

### Phase 2: 仕様統合

リサーチ結果を統合し、`openspec/changes/<change-name>/` 配下に以下の3ファイルを出力する：

1. `specs/<feature>/delta-spec.md` -- デルタ要件（ADDED/MODIFIED/REMOVED + Given/When/Then）
2. `design.md` -- リサーチサマリー + 技術設計
3. `tasks.md` -- タスクリスト

### Phase 3: ユーザー確認

仕様書を出力した後、**ユーザーが明示的に承認するまで実装に進まない**。
「この仕様で実装を開始してよいですか？」と確認する。

## デルタスペック形式

`openspec/changes/<change-name>/specs/<feature>/delta-spec.md`:

```markdown
# [feature] デルタスペック

## ADDED Requirements

### Requirement: [要件名]
[RFC 2119: SHALL, SHOULD, MAY]

#### Scenario: [シナリオ名]
- **GIVEN** [前提条件]
- **WHEN** [アクション]
- **THEN** [期待結果]

## MODIFIED Requirements

### Requirement: [要件名]
[変更後の記述]
**変更理由**: [理由]

#### Scenario: [シナリオ]
- **GIVEN** / **WHEN** / **THEN**

## REMOVED Requirements

### Requirement: [要件名]
**削除理由**: [理由]
```

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
- **関連スペック**: `specs/<feature>/delta-spec.md#[要件名]`
```

## タスク分解のルール

- 1タスクは**2〜5分**で完了できるサイズ
- 各タスクに**正確なファイルパス**を含める
- 各タスクに**検証方法**を必ず含める
- タスクの依存関係を明示する
- テストタスクを実装タスクの**前**に配置する（TDD）
- 各タスクに関連デルタスペック要件へのリンクを含める
- テストケースは Given/When/Then シナリオから導出する
