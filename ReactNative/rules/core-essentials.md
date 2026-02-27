# Core Essentials（React Native版）

常時読み込みされる最小限のルール。詳細は `~/.claude/reference/` を必要に応じて参照。

---

## エスカレーションポリシー

### 必須エスカレーション（`AskUserQuestion` で確認）

- **セキュリティ**: 認証・認可ロジックの設計・変更、暗号化方式の選択、PII処理方法
- **データ**: AsyncStorage/SecureStore スキーマ変更、データ整合性に影響する変更
- **アーキテクチャ**: 新スクリーン・新モジュール追加、破壊的API変更、グローバル状態の設計変更
- **本番環境**: デプロイ設定、環境変数変更、ネイティブモジュール追加

### 状況依存エスカレーション（自信がなければ確認）

- 仕様の曖昧性・複数解釈が可能な場合
- 技術的に同等な複数アプローチの選択（Zustand vs Redux 等）
- スコープ外の関連変更が必要になった場合

### 自律判断OK

- コードフォーマット、lint修正、ローカル変数リネーム
- 明らかなバグ修正（null例外、off-by-one）
- 自モジュール内のリファクタリング、テストコード追加

---

## セキュリティ必須事項

- ハードコードされたシークレット・APIキー・認証情報禁止
- JWT トークン・パスワードは SecureStore または Keychain に保存（AsyncStorage 禁止）
- ユーザー入力は必ずバリデーション（Zod スキーマを使用）
- HTTP 通信を禁止（本番環境では HTTPS のみ）
- Deep Link パラメータは必ずバリデーション（Zod で型チェック）
- `console.log` にトークン・個人情報を出力しない
- 依存関係の脆弱性を定期確認（`npm audit`）

---

## Git コミット形式

- 形式: `<type>(<scope>): <日本語の説明>`
- type: `feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `perf`
- 1コミット = 1つの論理的変更、動く状態でコミット

---

## オンデマンドルール参照先

作業対象に応じて `~/.claude/reference/` から必要なファイルを読み込むこと:

| ファイル | 読み込むタイミング |
|---|---|
| `reference/typescript-rules.md` | TypeScript実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/react-native/conventions.md` | React Native全般・コンポーネント・スタイリング作業時 |
| `reference/react-navigation/conventions.md` | React Navigation実装・画面遷移・ディープリンク作業時 |
| `reference/async-storage/conventions.md` | AsyncStorage・データ永続化作業時 |
| `reference/api/conventions.md` | TanStack Query・APIレイヤー実装時 |
