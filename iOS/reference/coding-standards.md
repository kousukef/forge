# Coding Standards（iOS/Swift版）

iOS/Swiftプロジェクト向けのコーディング標準。MVVM + Clean Architecture を前提とする。

---

## プロジェクト構造

```
Sources/
├── App/                    # AppDelegate / SceneDelegate / @main
├── Presentation/           # UI 層
│   ├── Feature/            # 機能単位でディレクトリを切る
│   │   ├── Views/          # SwiftUI View
│   │   └── ViewModels/     # ViewModel
├── Domain/                 # Domain 層
│   ├── Entities/           # ドメインモデル
│   ├── UseCases/           # UseCase
│   └── Repositories/       # Repository Protocol
├── Data/                   # Data 層
│   ├── Repositories/       # Repository 実装
│   ├── DataSources/        # Remote / Local DataSource
│   │   ├── Remote/
│   │   └── Local/
│   └── DTOs/               # Data Transfer Object
├── Core/                   # 共通ユーティリティ
│   ├── Extensions/         # Swift 拡張
│   ├── Utils/              # ユーティリティ
│   └── DI/                 # DI コンテナ設定
└── Resources/              # Assets / Localizable.strings

Tests/
├── UnitTests/              # ユニットテスト（swift test）
│   ├── Domain/
│   ├── Data/
│   └── Presentation/
├── IntegrationTests/       # 統合テスト
└── UITests/                # XCUITest
```

---

## 命名規則

| Type | Convention | Example |
|------|------------|---------|
| ファイル（型） | PascalCase | `UserProfileView.swift` |
| ファイル（拡張） | `TypeName+Purpose.swift` | `String+Validation.swift` |
| ディレクトリ | PascalCase | `UserProfile/` |
| 定数 | SCREAMING_SNAKE（グローバル）または lowerCamelCase（ローカル） | `MAX_RETRY_COUNT`, `maxRetryCount` |
| 関数・変数 | lowerCamelCase | `getUserById()`, `isLoading` |
| 型（クラス・構造体・列挙型・プロトコル） | PascalCase | `UserService`, `LoginError` |
| プロトコル | PascalCase（役割を表す名詞/形容詞） | `UserRepositoryProtocol`, `Loadable` |

---

## Swift コーディングルール

### Optional 安全性（CRITICAL）

```swift
// 禁止: 強制アンラップ
let name = user!.name          // クラッシュリスク
let view = view as! UIButton   // クラッシュリスク

// 推奨: guard let
guard let user = optionalUser else {
    return
}

// 推奨: if let
if let name = user.name {
    print(name)
}

// 推奨: ?? でデフォルト値
let displayName = user.name ?? "Unknown"

// 推奨: オプショナルチェーニング
let count = user.friends?.count ?? 0
```

### 不変性（Immutability）

```swift
// 推奨: let を優先
let userId = "user-123"        // 変更不要な値は let

// 必要な場合のみ var
var isLoading = false          // 変更が必要な場合のみ var

// struct の不変性
struct User {
    let id: String             // ID は変更不可
    var displayName: String    // 表示名は更新可
}
```

### エラーハンドリング

```swift
// 推奨: Result 型でエラーを明示
func fetchUser(id: String) async -> Result<User, NetworkError> {
    do {
        let user = try await networkClient.getUser(id: id)
        return .success(user)
    } catch let error as NetworkError {
        return .failure(error)
    } catch {
        return .failure(.unknown(error))
    }
}

// 推奨: throws でエラーを伝播
func validateEmail(_ email: String) throws {
    guard email.contains("@") else {
        throw ValidationError.invalidEmail(email)
    }
}

// 禁止: エラーの握りつぶし
let result = try? fetchUser(id: "123")  // エラーが消える（慎重に使用）
```

---

## SwiftUI コーディングルール

### View の構造

```swift
struct UserProfileView: View {
    // 1. プロパティラッパー（@State, @StateObject 等）
    @StateObject private var viewModel: UserProfileViewModel

    // 2. body
    var body: some View {
        content
            .task { await viewModel.load() }
    }

    // 3. プライベートな View ビルダー（body を分割）
    private var content: some View {
        VStack {
            // ...
        }
    }
}
```

### 状態管理の使い分け

```swift
// @State: View のローカル状態
@State private var isExpanded = false

// @StateObject: View が所有する ViewModel
@StateObject private var viewModel = UserProfileViewModel()

// @ObservedObject: 外部から注入された ViewModel
@ObservedObject var viewModel: UserProfileViewModel

// @Binding: 親 View から受け取る状態
@Binding var isPresented: Bool

// @EnvironmentObject: 環境から取得（乱用しない）
@EnvironmentObject var authManager: AuthManager
```

---

## Swift Concurrency ルール

```swift
// 推奨: async/await
func loadUser(id: String) async throws -> User {
    let dto = try await apiClient.fetchUser(id: id)
    return User(from: dto)
}

// 推奨: @MainActor で UI 更新
@MainActor
func updateUI(with user: User) {
    self.user = user
    self.isLoading = false
}

// 推奨: Task のキャンセル考慮
func startLoading() {
    loadTask?.cancel()
    loadTask = Task {
        defer { loadTask = nil }
        do {
            let result = try await repository.fetch()
            await MainActor.run { self.items = result }
        } catch is CancellationError {
            // キャンセルは正常終了
        } catch {
            await MainActor.run { self.error = error }
        }
    }
}
```

---

## テスト標準

### テスト構造

```swift
final class UserViewModelTests: XCTestCase {
    private var sut: UserViewModel!
    private var mockRepository: MockUserRepository!

    override func setUp() {
        super.setUp()
        mockRepository = MockUserRepository()
        sut = UserViewModel(userRepository: mockRepository)
    }

    override func tearDown() {
        sut = nil
        mockRepository = nil
        super.tearDown()
    }

    func test_loadUser_whenSuccess_updatesState() async {
        // Arrange
        let expectedUser = User.stub()
        mockRepository.stubbedUser = expectedUser

        // Act
        await sut.load()

        // Assert
        XCTAssertEqual(sut.user?.id, expectedUser.id)
        XCTAssertFalse(sut.isLoading)
    }
}
```

### テスト命名規則

```
test_[対象メソッド]_[条件]_[期待結果]
例: test_loadUser_whenNetworkError_showsErrorState
```

---

## ロギング標準

```swift
// 推奨: os_log / Logger（iOS 14+）
import os

private let logger = Logger(subsystem: "com.example.app", category: "Auth")

func signIn() async {
    logger.info("Sign in started")

    do {
        let token = try await authClient.signIn()
        logger.info("Sign in succeeded")
    } catch {
        logger.error("Sign in failed: \(error.localizedDescription)")
    }
}

// 禁止: print（本番コードでは使用しない）
// print("User signed in")  <- 削除すること
```

---

## セキュリティ必須事項

- **Keychain 使用**: パスワード・トークン・機密情報は必ず Keychain に保存
- **ATS 設定**: `NSAllowsArbitraryLoads` を本番ビルドで有効にしない
- **print禁止**: 機密情報を `print()` で出力しない（`Logger` を使用）
- **ハードコード禁止**: API キー・シークレットをコードに直書きしない

---

_Coding Standards: 品質 × セキュリティ × 保守性（iOS/Swift版）_
