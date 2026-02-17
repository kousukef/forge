---
description: "実装済みコードを7つの専門レビュアーエージェントで並列レビューする"
disable-model-invocation: true
argument-hint: "<change-name>"
---

# /review コマンド

## 目的

実装済みコードを多角的にレビューする。

## 引数の解析

$ARGUMENTS から change-name を決定する:

- 指定あり: `openspec/changes/<change-name>/` を対象とする
- 省略: `openspec/changes/` 内のアクティブ変更（`archive/` 以外）を自動検出
  - 1つ → 自動選択
  - 複数 → AskUserQuestion で選択
  - 0 → エラー（先に `/brainstorm` を実行するよう案内）

## ワークフロー

以下の7つのレビューエージェントを**並列で**起動する：

1. **security-sentinel**: OWASP Top 10、シークレット検出、XSS/CSRF、認証・認可の穴、Terraformセキュリティ（IAM、ファイアウォール）
2. **performance-oracle**: PrismaのN+1クエリ、Next.jsバンドルサイズ、不要な再レンダリング、キャッシュ戦略、Server Components最適化
3. **architecture-strategist**: コンポーネント境界、責務分離、App Router規約準拠、Route Handlers設計、レイヤー構成
4. **prisma-guardian**: マイグレーション安全性、参照整合性、クエリ最適化、インデックスカバレッジ、トランザクション境界
5. **terraform-reviewer**: IaCベストプラクティス、GCPリソース設定、ステート管理、ドリフト検出、セキュリティグループ
6. **type-safety-reviewer**: TypeScript strictモード準拠、Zodスキーマ検証、any型の排除、型の整合性（Server/Client間、API層）
7. **api-contract-reviewer**: Route Handlers / Server Actionsの入出力型整合性、エラーレスポンス統一、バリデーション

## レビュー出力形式

```markdown
# コードレビュー結果

## サマリー
- P1（修正必須）: X件
- P2（修正推奨）: X件
- P3（あると良い）: X件

## P1: クリティカル
### [SECURITY-001] SQLインジェクションの可能性
- **ファイル**: `src/app/api/users/route.ts:42`
- **問題**: ユーザー入力が直接クエリに渡されている
- **修正案**: Prismaのパラメータ化クエリを使用
- **レビュアー**: security-sentinel

## P2: 重要
### [PERF-001] N+1クエリの検出
...

## P3: 軽微
...
```

## レビュー結果の検証

レビュー結果を集約した後、アクションに進む前に以下を確認する：

### レビュアー間の矛盾検出
7つのレビュアーの指摘が矛盾する場合（例: architecture-strategist と performance-oracle が相反する修正案を提示）、`AskUserQuestion` でユーザーに判断を仰ぐ。

### P1指摘のアーキテクチャ影響評価
P1指摘の中にアーキテクチャ変更を必要とするもの（security-sentinel がエスカレーションフラグを付与したもの等）がある場合、自動修正ではなく `AskUserQuestion` でユーザーに確認する。

## レビュー後のアクション

- **P1（アーキテクチャ変更不要）**: 即座に修正を提案（ユーザーの承認後に自動修正エージェントを起動）
- **P1（アーキテクチャ変更を伴う）**: `AskUserQuestion` で修正方針をユーザーに確認してから対応
- **P2がある場合**: 修正を推奨するが、ユーザーに判断を委ねる
- **P3のみの場合**: レポートのみ出力
