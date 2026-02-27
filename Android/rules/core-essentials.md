# Core Essentials

常時読み込みされる最小限のルール。詳細は `~/.claude/reference/` を必要に応じて参照。

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

- ハードコードされたシークレット・APIキー・認証情報禁止
- 機密情報は EncryptedSharedPreferences または Android Keystore を使用
- ユーザー入力は必ず検証・サニタイズ（SQLインジェクション防止: Room パラメータ化クエリのみ）
- Network Security Config でクリアテキスト通信を禁止（本番）
- 証明書ピニングを実装（重要 API エンドポイント）
- ProGuard / R8 で難読化・シュリンクを有効化（リリースビルド）
- 認証: 適切な Intent フラグ設定・Activity エクスポート管理
- 依存関係: `./gradlew dependencyCheckAnalyze` で脆弱性確認

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
| `reference/kotlin-rules.md` | Kotlin実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/android/conventions.md` | Android全般・Activity/Fragment・Gradle作業時 |
| `reference/jetpack-compose/conventions.md` | Jetpack Compose UI実装時 |
| `reference/room/conventions.md` | Room DBスキーマ・DAO・マイグレーション時 |
| `reference/retrofit/conventions.md` | Retrofit/OkHttp APIレイヤー実装時 |
