# Core Essentials（iOS版）

常時読み込みされる最小限のルール。詳細は `~/.claude/reference/` を必要に応じて参照。

---

## エスカレーションポリシー

### 必須エスカレーション（`AskUserQuestion` で確認）

- **セキュリティ**: Keychain設計、認証・認可ロジックの設計・変更、暗号化方式の選択、PII処理方法
- **データ**: CoreData/SwiftDataスキーマ変更、マイグレーション戦略、データ整合性に影響する変更
- **アーキテクチャ**: 新サービス・新モジュール追加、破壊的API変更、レイヤー構成変更
- **本番環境**: Xcodeビルド設定、証明書・プロビジョニング変更、App Store提出設定

### 状況依存エスカレーション（自信がなければ確認）

- 仕様の曖昧性・複数解釈が可能な場合
- 技術的に同等な複数アプローチの選択（UIKit vs SwiftUI、CoreData vs SwiftData等）
- スコープ外の関連変更が必要になった場合

### 自律判断OK

- コードフォーマット、SwiftLint修正、ローカル変数リネーム
- 明らかなバグ修正（nil クラッシュの根本修正、off-by-one）
- 自モジュール内のリファクタリング、テストコード追加

---

## セキュリティ必須事項

- ハードコードされたシークレット・APIキー・認証情報禁止
- パスワード・トークン・機密情報は Keychain に保存（`Security` フレームワーク）
- `UserDefaults` に機密情報を保存しない
- `print()` に機密情報を出力しない（`Logger` を使用）
- ATS（App Transport Security）でクリアテキスト通信を本番環境で禁止
- 証明書ピニングを重要 API エンドポイントに実装
- ユーザー入力は必ず検証・サニタイズ
- force unwrap（`!`）は絶対禁止（クラッシュ原因）

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
| `reference/swift-rules.md` | Swift実装・型設計・慣用句確認時 |
| `reference/coding-standards.md` | コーディング規約の確認時 |
| `reference/core-rules.md` | フェーズ管理・検証ゲート確認時 |
| `reference/workflow-rules.md` | セッション管理・チェックポイント時 |
| `reference/common/coding-style.md` | ファイルサイズ・命名規約確認時 |
| `reference/common/testing.md` | テスト作成・TDD実践時 |
| `reference/common/performance.md` | パフォーマンス最適化時 |
| `reference/ios/conventions.md` | iOS全般・AppDelegate/SceneDelegate・Xcode作業時 |
| `reference/swiftui/conventions.md` | SwiftUI UI実装時 |
| `reference/coredata/conventions.md` | CoreData/SwiftDataスキーマ・マイグレーション時 |
| `reference/network/conventions.md` | URLSession/Alamofire APIレイヤー実装時 |
