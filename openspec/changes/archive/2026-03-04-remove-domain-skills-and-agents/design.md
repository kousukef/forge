# remove-domain-skills-and-agents 技術設計

## 概要

Forge を OSS 公開に向けて汎用化するため、特定技術スタック（Next.js, Prisma, Terraform 等）に依存するドメイン固有スキル 14 個、レビューエージェント 7 個、リファレンスファイル 6 個を削除し、全ての参照元ファイル（20+ ファイル）からドメイン固有の記述を除去・汎用化する。加えて `/review` コマンドのレビュアー選択を `agents/review/` からの動的検出方式に移行する。

## リサーチサマリー

### 公式ドキュメントからの知見

本変更は Forge 自体のプラグインシステム（Markdown/Shell ベース）に対する変更であり、外部フレームワークの公式ドキュメントは直接関連しない。Claude Code の Skills / Agents / Commands 機構の動作原理（YAML frontmatter、ディレクトリベースの Auto-Discovery）が設計の基盤となる。

### Web 検索からの知見

1. **3 層スキル配布モデル**: OSS プラグインシステムのベストプラクティスとして、Layer 1（フレームワーク同梱 = 方法論スキル）、Layer 2（公式推奨 = `/setup` 経由でインストール）、Layer 3（コミュニティ = ユーザー追加）の 3 層が推奨される。今回の変更はドメインスキルを Layer 1 から除去し、Layer 2/3 に移行する設計。
2. **動的エージェントディスカバリーパターン**: ディレクトリスキャン → frontmatter パース → description による条件マッチング。Convention over Configuration の原則に従い、`agents/review/` への配置とファイル名規約で自動検出する。
3. **TypeScript 固有記述の汎用化**: OSS ツールでは特定言語への依存を避け、プロジェクトの静的解析ツール（linter, type checker）を汎用的に参照する方が、多様なユーザー層に対応できる。

### コードベース分析（既存スペックとの関連含む）

- **削除対象**: スキル 14 ディレクトリ（web-design-guidelines を含む）、エージェント 7 ファイル、リファレンス 5 ファイル + 1 ディレクトリ
- **修正対象**: 20+ ファイル（CLAUDE.md, USER-CLAUDE.md, commands/*.md, agents/review/review-aggregator.md, forge-system-prompt.md, README.md, rules/, reference/ 等）
- **影響範囲の分類**:
  - MAJOR MODIFY（大規模修正）: `commands/review.md`, `commands/spec.md`, `skills/forge-skill-orchestrator/SKILL.md`
  - MODIFY（修正）: 残り 17 ファイル
- **既存スペック**: `openspec/specs/domain-skills/spec.md` はアーカイブへ移動（`openspec/changes/archive/2026-03-04-domain-skills/`）
- **アクティブ変更への影響**: `openspec/changes/add-setup-command/design.md` に architecture-patterns への参照あり（行 107, 142）
- **影響なし**: install.sh / uninstall.sh（動的探索）、hooks/（直接参照なし。detect-console-log hook はドキュメント記述のみ変更し、hook 実装は変更しない）、settings.json、docs/compound/

### 過去の学び

1. **CLAUDE.md の整合性**: 過去 3 回の変更で全てドキュメント間の矛盾・残存が発生。横断 Grep で残存確認が必須
2. **プロジェクト/グローバル同期**: `CLAUDE.md` と `USER-CLAUDE.md` の両方の変更を忘れないこと（過去 2 回同期漏れ）
3. **概念変更の横断検索**: 削除対象のスキル名・エージェント名の残存チェックが最終検証に必須
4. **Auto-Discovery の description は 3 部構成トリガー条件形式が推奨**: 残存スキルの description が適切か確認

## 技術的アプローチ

### 1. 削除フェーズ

ドメイン固有コンテンツを物理削除する:

- **スキル 14 ディレクトリ**: `skills/` 配下の各ディレクトリを丸ごと削除（web-design-guidelines を含む）
- **エージェント 7 ファイル**: `agents/review/` 配下のドメイン固有レビュアーを削除
- **リファレンス 6 ファイル**: `reference/` 配下のドメイン固有ファイル・ディレクトリを削除
- **OpenSpec アーカイブ**: `openspec/specs/domain-skills/` を `openspec/changes/archive/2026-03-04-domain-skills/` に移動

### 2. 参照除去・汎用化フェーズ

全ての参照元ファイルからドメイン固有記述を除去・汎用化する:

#### CLAUDE.md / USER-CLAUDE.md

- Available Skills テーブル: ドメインカテゴリ行を全て削除し、方法論 + 設計（skill-creator のみ）に縮小
- Available Agents テーブル: レビューカテゴリから 7 レビュアー名を削除し、「review-aggregator + `agents/review/` 配下のカスタムレビュアー」に変更
- Reference テーブル: ドメイン固有行（typescript-rules, nextjs, prisma, terraform, coding-style, performance）を削除
- Hook テーブル: `detect-console-log` の説明を汎用化（「ソースファイル内の console.log を警告」等）。hook 実装ファイルは変更しない（ドキュメント記述のみ変更）
- 拡張ガイダンスを追記（スキル・エージェント・リファレンスの追加方法）

#### /review コマンド（MAJOR MODIFY）

現在のハードコードされたレビュアー選択を動的検出に全面書き換え:

- **Step 0**: L1/L2 自動チェックの汎用化（`npx tsc --noEmit` → 「プロジェクトの静的解析ツールを実行」）
- **Step 2b**: ドメイン検出テーブルを削除。代わりに `agents/review/` ディレクトリをスキャンし、各エージェントの frontmatter `description` を読み取り、`git diff --stat` の変更内容と照合して関連レビュアーを選択する動的検出方式に変更
- **Step 2c**: レビュアー → Skill マッピングを削除。レビュアーエージェント定義の `skills` frontmatter に記載されたスキルを自動注入する方式に変更
- **Step 3**: レビュアーの役割リスト（具体的なチェック項目）をコメントとして残すが、汎用的な記述に変更（「各レビュアーの agents/review/*.md を参照」）
- **Review Coverage Matrix**: 固定列（Security, Performance 等）を動的列（起動されたレビュアー名）に変更
- **リスクレベル判定**: ドメイン固有の条件（`prisma/schema.prisma`, `terraform/` 等）を削除し、汎用的な条件（「設定ファイルの変更」「セキュリティ関連ファイルの変更」等）に変更

#### /spec コマンド

- Phase 1.7 全体を削除・再設計: キーワード推論テーブルを除去し、`skills/` 配下のドメインスキルを動的に発見して design.md を注入する方式に変更
- ドメインスキルがない場合はドメインコンテキストなしで進める

#### forge-skill-orchestrator

- ドメイン検出テーブルのドメイン固有パターン（`src/app/**/*.tsx` → `nextjs-frontend` 等）を削除
- 使用例のドメインスキル名（`prisma-expert`, `next-best-practices` 等）を汎用プレースホルダーに変更
- Auto-Discovery の説明を強化（ドメインスキルは全て Auto-Discovery に委ねることを明記）

#### TypeScript 固有記述の汎用化

以下のファイルで TypeScript/Next.js 固有の記述を汎用化:
- `rules/core-essentials.md`: Zod → スキーマバリデーション、`middleware.ts` → ミドルウェア、TypeScript strict mode / tsc 参照削除
- `reference/core-rules.md`: `npx tsc --noEmit` → 「静的解析ツールを実行」
- `reference/workflow-rules.md`: 同上
- `reference/context-isolation.md`: tsc 参照 → 汎用化
- `reference/coding-standards.md`: Zod 例 → 汎用バリデーション例、TypeScript 固有コード例の説明を汎用化
- `reference/common/testing.md`: Vitest/Playwright のフレームワーク指定を除去

### 3. 動的レビュアー検出の設計

```
/review 実行時:
  1. agents/review/ ディレクトリ内の *.md ファイルをスキャン（review-aggregator.md を除く）
  2. 各ファイルの YAML frontmatter から name, description を抽出
     - frontmatter パースエラーまたは name フィールド欠落の場合はスキップし、警告を出力
  3. git diff --stat の変更ファイル一覧と description の LLM セマンティック判定によるマッチング
  4. マッチしたレビュアーのみを起動
     - 関連レビュアーが 0 件の場合: ユーザーに利用可能なレビュアー一覧を提示し、手動で起動するレビュアーを選択させる
  5. レビュアーのエージェント定義内 skills frontmatter から必要スキルを自動注入
  6. review-aggregator は常時起動（結果統合のため）
```

**動的検出の判定方式**: LLM によるセマンティック判定を使用する。各レビュアーの description と `git diff --stat` の変更内容を LLM に渡し、「このレビュアーは今回の変更に関連するか」を意味的に判定させる。キーワードマッチングや正規表現ではなく、LLM の自然言語理解能力に依存する方式である。

リスクレベル判定は以下の汎用条件に変更:
- **HIGH**: 認証・認可関連ファイル、環境設定ファイル、CI/CD 設定の変更
- **LOW**: ドキュメント (.md)、テストファイル (.test.*, .spec.*)、スタイルシート (.css) のみの変更
- **MEDIUM**: 上記以外

**関連レビュアー 0 件時の振る舞い**: ユーザーに利用可能なレビュアー一覧を提示し、手動で起動するレビュアーを選択させる。LLM 判定で全レビュアーが不要と判断されても、ユーザーの判断で任意のレビュアーを起動できるようにする。

### 4. 拡張ポイントの整備

OSS ユーザーが自身のプロジェクトに合わせて拡張するための案内を以下に追加:
- **CLAUDE.md**: 拡張方法の簡易ガイダンス
- **README.md**: カスタマイズセクションの強化

## リスクと注意点

1. **参照残存リスク**: 20+ ファイルの修正漏れ。最終検証で全削除対象の名前を Grep して残存チェック必須
2. **CLAUDE.md / USER-CLAUDE.md 同期漏れ**: 過去 2 回発生。両ファイルを同時に修正すること
3. **アクティブ変更への影響**: `openspec/changes/add-setup-command/design.md` にドメインスキル参照あり。修正が必要
4. **動的レビュアー検出の信頼性**: description ベースの LLM セマンティック判定に依存するため、過剰起動（トークン消費）または起動漏れ（レビュー品質低下）のリスクがある。リスクレベル HIGH の場合は全レビュアー起動で安全側に倒す設計、関連 0 件時はユーザー手動選択で緩和
5. **forge-system-prompt.md の扱い**: このファイルは Forge の初期構築プロンプトとしての歴史的価値がある。レビュアー定義セクション等のドメイン固有部分を「将来追加枠」テンプレートに置き換えつつ、汎用構造は維持する
6. **detect-console-log hook**: ドキュメント記述（CLAUDE.md の Hook テーブル）のみ汎用化する。hook 実装ファイル自体は変更しない（.ts/.tsx 内の console.log 検出という実装は、hook の技術的動作として妥当であり、ドキュメント上の説明文のみを汎用化する）
