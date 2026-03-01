# Forge - プロジェクトコンテキスト

## 概要

Forge は Claude Code 向けの統合開発ワークフローシステム。AI エージェントとスキルを組み合わせ、要件定義から実装・レビュー・テスト・学習までの開発ライフサイクルを自動化する。

## プロジェクトタイプ

CLI プラグインシステム（Claude Code のスラッシュコマンドとして動作）

## 技術スタック

| レイヤー | 技術 |
|---|---|
| 対象フレームワーク | Next.js (App Router), Prisma, Terraform |
| クラウド | Google Cloud Platform |
| 言語 | TypeScript (strict mode) |
| テスト | Vitest + Playwright |
| 配布 | シンボリックリンク方式インストーラー |

## 主要構成

- `commands/` - スラッシュコマンド定義（brainstorm, spec, implement, review, test, compound, ship 等）
- `agents/` - 15 の専門 AI エージェント（リサーチ, スペック, 実装, レビュー）
- `skills/` - 24 のスキル（方法論 7 + ドメイン 17、Phase-Aware 構造）
- `rules/` - ガバナンスルール（常時読み込み）
- `reference/` - オンデマンド参照ルール
- `hooks/` - 自動品質ゲート
- `openspec/` - OpenSpec 仕様管理

## アーキテクチャ特性

- **Phase-Aware**: フェーズに応じてスキルの読み込み範囲を最適化
- **Context Isolation**: Main Agent はオーケストレーション専任、実装は Sub Agent に委譲
- **OpenSpec**: 累積仕様 + デルタ記法による変更管理
- **Compound Learning**: 開発サイクルごとの学びを蓄積

## ワークフロー

```
/brainstorm → /spec → [承認] → /implement → /review → /test → /compound
```
