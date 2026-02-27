# Core Essentials

常時読み込みされる最小限のルール。詳細は `~/.claude/reference/` を必要に応じて参照。

---

## エスカレーションポリシー

### 必須エスカレーション（`AskUserQuestion` で確認）

- **セキュリティ**: 認証・認可ロジックの設計・変更、暗号化方式の選択、PII処理方法
- **データ**: Drift/sqflite のスキーマ変更、マイグレーション戦略、データ整合性に影響する変更
- **アーキテクチャ**: 新機能モジュール追加、状態管理手法の変更（BLoC vs Riverpod）、レイヤー構成変更
- **本番環境**: ビルド設定（flutter build オプション）、環境変数変更、難読化設定変更

### 状況依存エスカレーション（自信がなければ確認）

- 仕様の曖昧性・複数解釈が可能な場合
- 技術的に同等な複数アプローチの選択（BLoC vs Cubit、get_it vs Riverpod 等）
- スコープ外の関連変更が必要になった場合

### 自律判断OK

- コードフォーマット（`dart format`）、lint修正、ローカル変数リネーム
- 明らかなバグ修正（null 例外、off-by-one）
- 自モジュール内のリファクタリング、テストコード追加

---

## セキュリティ必須事項

- ハードコードされたシークレット・APIキー・認証情報禁止
- 機密情報は `flutter_secure_storage` を使用（Keychain/Keystore に委譲）
- ユーザー入力は必ず検証・サニタイズ（Drift の rawQuery パラメータバインド必須）
- ネットワーク通信は HTTPS を強制（HTTP 通信は本番環境で禁止）
- 証明書ピニングを実装（重要 API エンドポイント）
- `flutter build --obfuscate --split-debug-info` でリリースビルドの難読化を有効化
- `print()` によるログ出力禁止（本番コードでは `debugPrint` のみ許可）
- 依存関係: `flutter pub outdated` で脆弱性・古いパッケージを確認

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
| `reference/dart-rules.md` | Dart実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/flutter/conventions.md` | Flutter全般・Widget・pubspec作業時 |
| `reference/flutter/widget-patterns.md` | Flutter Widget パターン・状態管理・const最適化時 |
| `reference/drift/conventions.md` | Drift DBスキーマ・DAO・マイグレーション時 |
| `reference/networking/conventions.md` | Dio/HTTP APIレイヤー実装時 |
