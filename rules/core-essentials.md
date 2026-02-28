# Core Essentials

常時読み込みされる最小限のルール。詳細は `reference/` を必要に応じて参照。

---

## エスカレーションポリシー

### 必須エスカレーション（`AskUserQuestion` で確認）

- **セキュリティ**: 認証・認可ロジックの設計・変更、暗号化方式の選択、PII処理方法
- **データ**: DBスキーマ変更、マイグレーション戦略、データ整合性に影響する変更
- **アーキテクチャ**: 新サービス・新モジュール追加、破壊的API変更、レイヤー構成変更
- **本番環境**: デプロイ設定、環境変数変更、ロールバック手順

### 状況依存エスカレーション（自信がなければ確認）

- 仕様の曖昧性・複数解釈が可能な場合
- 技術的に同等な複数アプローチの選択
- スコープ外の関連変更が必要になった場合

### 自律判断OK

- コードフォーマット、lint修正、ローカル変数リネーム
- 明らかなバグ修正（null例外、off-by-one）
- 自モジュール内のリファクタリング、テストコード追加

---

## セキュリティ必須事項

- ハードコードされたシークレット・APIキー禁止
- 環境変数は `.env.local`（開発）、Secret Manager（本番）
- ユーザー入力は必ずZodでバリデーション
- SQLインジェクション防止: Prismaパラメータ化クエリのみ
- XSS防止: `dangerouslySetInnerHTML` 禁止
- CSRF: Server Actionsは自動保護、Route Handlersは明示的対策
- 認証: middleware.tsでルートレベル保護
- 依存関係: `npm audit` でゼロ脆弱性維持

---

## Skill 1% ルール

**1% でも適用される可能性があれば、そのスキルを呼び出せ。**

スキルの呼び出しコストは低い。呼び出さなかったことによる品質低下コストは高い。迷ったら呼び出す。

---

## Context Isolation Policy

Main Agent はオーケストレーション専任。以下を厳守:

| 禁止操作 | 代替手段 |
|---|---|
| Write/Edit で実装ファイル編集 | Task(implementer) に委譲 |
| 実装ファイル（.ts/.tsx）の Read | Explore Agent / implementer に委譲 |
| SKILL.md の Read | スキル名のみ決定、Claude Code が自動解決 |
| `git diff`（内容表示） | `git diff --stat` のみ許可 |

詳細: `reference/context-isolation.md`

---

## Git・コミット

- 形式: `<type>(<scope>): <日本語の説明>`
- type: `feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `perf`
- 1コミット = 1つの論理的変更、動く状態でコミット
- PR説明は日本語
- 小さく焦点を絞ったコミット
- コミット前に `git diff` でレビュー

---

## コード品質

- TypeScript strict mode 準拠
- 既存のコード規約・パターンを踏襲
- コードやコメントにエモジを入れない
- TDD: RED → GREEN → REFACTOR
- テストをスキップ・無効化して通過させない
- TODO/モック/スタブを本実装に残さない
- `npx tsc --noEmit` をコミット前に実行

---

## オンデマンドルール参照先

作業対象に応じて `reference/` から必要なファイルを読み込むこと。参照テーブルは CLAUDE.md の Rules セクションを参照。
