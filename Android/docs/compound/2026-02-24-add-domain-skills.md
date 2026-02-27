---
category: pattern
stack: general
severity: important
date: 2026-02-24
tags: domain-skills, auto-discovery, description-quality, progressive-disclosure, dual-path, mcp-security, skill-orchestration
artifact-targets: skills, spec-template, agents
---

# Domain Skills 追加: Auto-Discovery Dual-Path 設計と外部リポジトリ取り込みパターン

## 何が起きたか

Forge システムに14の Domain Skills を新規追加した。各スキルは外部リポジトリ（vercel-labs, anthropics, supabase, hashicorp, nextlevelbuilder, affaan-m）を参考に Forge スタック向けに再構成。forge-skill-orchestrator を Auto-Discovery 方式に移行し、CLAUDE.md・implement-orchestrator にガイダンステーブル（推奨マッピング）を追加した。

### うまくいったパターン

1. **Dual-Path 設計が機能した**: Auto-Discovery（description ベースの自動起動）とガイダンステーブル（サブエージェント委譲時の明示指定）の2経路を設計。Auto-Discovery の起動不安定性（GitHub Discussions #182117）へのフォールバックとして堅牢。
2. **description 3部構成形式の標準化**: "When [condition]. Provides [content]. MUST be invoked [timing]." の形式を全14スキルに統一。650回の実験で起動率97-100%を達成した知見を活用。
3. **過去の学びからの改善**: 同期漏れ対策としてタスクリスト Task 18 で CLAUDE.md のグローバル/プロジェクト同期を明示的に設計。過去2回の教訓（2026-02-18, 2026-02-22）が効いた。
4. **レビュアーの動的起動が効率的**: .md ファイルのみの変更では security-sentinel のみが起動し、他のレビュアーはドメイン条件未該当で未起動。無駄なレビューコストを回避。
5. **Progressive Disclosure パターン**: SKILL.md 500行制限 + API_REFERENCE.md 分離で webapp-testing に適用。コンテキストウィンドウへの影響を最小化。

### レビューで検出された問題

1. **MCP プラグインのセキュリティリスク（P2）**: ui-ux-pro-max の Python スクリプト実行でパストラバーサル・バージョン未固定・入力サニタイズ不足を security-sentinel が検出。MCP サーバー経由の実行推奨・バージョン固定・サニタイズ注記を追加して修正。
2. **CSP ヘッダーの nonce テンプレートリテラル（P3）**: security-patterns の CSP コード例で `headers()` がビルド時に静的評価される問題。教育用コード例の意図と実際の動作の乖離。
3. **OWASP A08/A10 未カバー（P3）**: 500行制限内での優先度として妥当とレビュアーも認定。将来の REFERENCE.md 分離で対応可能。

## なぜ起きたか

1. **MCP 統合のセキュリティチェックリスト不在**: MCP プラグイン統合は今回が初ケース。セキュリティ観点のチェック項目（実行パス、バージョン固定、入力サニタイズ）が spec-validator にも security-sentinel のチェックリストにも事前定義されていなかった。
2. **外部リポジトリの取り込み基準が暗黙的**: Jest → Vitest, AWS → GCP, 生SQL → Prisma の翻訳は design.md で定義したが、スタック適合性フィルタの一般的なテンプレートが spec-writer に存在しなかった。
3. **keywords frontmatter の無効性が実証まで不明だった**: 650回の実験により keywords の効果ゼロが判明。description 品質こそが Auto-Discovery の唯一の決定因子。

## どう解決したか

1. MCP セキュリティ: レビュー指摘に基づき SKILL.md にセキュリティ注記を追加
2. 外部リポジトリ取り込み: design.md のソースマッピングテーブルで翻訳基準を明示
3. Auto-Discovery: description 3部構成形式を全スキルに適用し、Dual-Path 設計でフォールバックを確保

## 教訓

1. **MCP プラグイン統合時はセキュリティチェックリストを適用せよ**: 実行パス（絶対パス or MCP サーバー経由）、バージョン固定、入力サニタイズ、依存関係の脆弱性スキャンを必ず確認する。
2. **外部リポジトリの取り込み時はスタック適合性マトリクスを作成せよ**: 何を取り込み、何を除外し、何を翻訳するかを明示的にマッピングする。暗黙的な判断は見落としの原因。
3. **Auto-Discovery の description は3部構成トリガー条件形式を必須とせよ**: 曖昧な description は起動されないリスクがある。condition にファイルパスパターンと作業内容を必ず含める。
4. **Progressive Disclosure で SKILL.md のサイズを制御せよ**: 500行を超える詳細は REFERENCE.md / API_REFERENCE.md に分離。コンテキストウィンドウ保護と情報量のバランス。
5. **keywords frontmatter は不使用**: 650回の実験で効果ゼロと実証済み。description の品質に集中すべき。

## 防止策と更新提案

### スキル更新
- [ ] 新規 Domain Skill 作成時のテンプレートに description 3部構成形式のチェックを追加（軽微: 初回記録）

### 仕様テンプレート更新
- [ ] spec-writer に「外部リポジトリ取り込み時のスタック適合性マトリクス」テンプレートを追加（軽微: 初回記録）
- [ ] spec-validator に「MCP プラグイン統合時のセキュリティチェックリスト」を追加（軽微: 初回記録）

### エージェント定義更新
- [ ] security-sentinel に MCP プラグイン統合のセキュリティチェック項目を追加（軽微: 初回記録）
