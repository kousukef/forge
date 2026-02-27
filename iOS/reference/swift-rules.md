# Swift Rules

Swift 言語の規約・慣用句・パターン。iOSプロジェクト全体に適用。

---

## 型システム

### 値型と参照型

```swift
// struct: デフォルトの選択（値型、コピーセマンティクス）
struct User {
    let id: String
    var name: String
    var email: String
}

// class: 継承・参照セマンティクスが必要な場合のみ
class NetworkManager {
    // 共有状態を持ち、アプリ全体で同一インスタンスを参照する必要がある
    static let shared = NetworkManager()
}

// enum: 有限の状態・選択肢を表現
enum LoadingState<T> {
    case idle
    case loading
    case success(T)
    case failure(Error)
}
```

### Generics

```swift
// 推奨: Generic で汎用性を高める
struct Result<Success, Failure: Error> {
    // ...
}

// 推奨: associated type でプロトコルを柔軟に
protocol Repository {
    associatedtype Entity
    func fetch(id: String) async throws -> Entity
}
```

---

## Optional パターン

### guard let（早期リターン）

```swift
// 推奨: guard let で早期リターン
func processUser(_ optionalUser: User?) {
    guard let user = optionalUser else {
        handleMissingUser()
        return
    }
    // user が非オプションとして使用できる
    process(user)
}
```

### if let（スコープを限定）

```swift
// 推奨: if let でオプショナルのスコープを限定
if let cachedData = cache.get(key: "user") {
    return cachedData
}
```

### Optional チェーニング

```swift
// 推奨: ?. でオプショナルチェーニング
let firstName = user?.profile?.name?.firstName
```

### Nil 合体演算子

```swift
// 推奨: ?? でデフォルト値を提供
let displayName = user.name ?? "名前未設定"
let count = items?.count ?? 0
```

---

## プロトコル指向プログラミング

### プロトコル定義

```swift
// 推奨: テスト容易性のためにプロトコルで抽象化
protocol UserRepositoryProtocol {
    func fetchUser(id: String) async throws -> User
    func saveUser(_ user: User) async throws
}

// 本実装
final class UserRepository: UserRepositoryProtocol {
    func fetchUser(id: String) async throws -> User { ... }
    func saveUser(_ user: User) async throws { ... }
}

// テスト用モック
final class MockUserRepository: UserRepositoryProtocol {
    var stubbedUser: User?
    func fetchUser(id: String) async throws -> User {
        guard let user = stubbedUser else { throw TestError.notStubbed }
        return user
    }
    func saveUser(_ user: User) async throws { }
}
```

### Protocol Extension

```swift
// 推奨: extension でデフォルト実装を提供
protocol Loadable {
    var isLoading: Bool { get }
    func startLoading()
    func stopLoading()
}

extension Loadable {
    // デフォルト実装でボイラープレートを削減
}
```

---

## Swift Concurrency

### async/await の基本

```swift
// 推奨: async/await で非同期処理
func fetchUserProfile(id: String) async throws -> UserProfile {
    let user = try await userRepository.fetchUser(id: id)
    let posts = try await postRepository.fetchPosts(userId: id)
    return UserProfile(user: user, posts: posts)
}
```

### 並列処理

```swift
// 推奨: async let で並列実行
func fetchDashboardData() async throws -> DashboardData {
    async let user = userRepository.fetchCurrentUser()
    async let notifications = notificationRepository.fetchUnread()
    async let timeline = timelineRepository.fetchLatest()

    return DashboardData(
        user: try await user,
        notifications: try await notifications,
        timeline: try await timeline
    )
}

// 推奨: withTaskGroup で動的な並列処理
func fetchAllPosts(userIds: [String]) async throws -> [Post] {
    try await withThrowingTaskGroup(of: [Post].self) { group in
        for userId in userIds {
            group.addTask {
                try await postRepository.fetchPosts(userId: userId)
            }
        }
        return try await group.reduce(into: []) { $0 += $1 }
    }
}
```

### Actor

```swift
// 推奨: Actor でデータ競合を防止
actor UserCache {
    private var cache: [String: User] = [:]

    func get(id: String) -> User? {
        cache[id]
    }

    func set(_ user: User, for id: String) {
        cache[id] = user
    }
}
```

---

## クロージャとキャプチャ

### [weak self] の使用

```swift
// 推奨: クロージャでの循環参照防止
class ProfileViewController: UIViewController {
    func loadData() {
        viewModel.loadUser { [weak self] result in
            guard let self else { return }
            self.updateUI(with: result)
        }
    }
}

// Task 内でも同様
func startObserving() {
    Task { [weak self] in
        guard let self else { return }
        for await update in self.viewModel.updates {
            await MainActor.run { self.handleUpdate(update) }
        }
    }
}
```

---

## 拡張（Extensions）

### 機能分割

```swift
// 推奨: extension で型を論理的に分割
// UserViewModel+Loading.swift
extension UserViewModel {
    func load() async {
        isLoading = true
        defer { isLoading = false }
        // ...
    }
}

// UserViewModel+Validation.swift
extension UserViewModel {
    func validateInput() -> Bool {
        // ...
    }
}
```

---

## スコープ関数の使い方

```swift
// guard: 早期リターン（最頻出）
guard let user = getUser() else { return }

// if let: オプショナルのスコープ限定
if let cached = cache.get("key") { return cached }

// defer: クリーンアップ処理
func process() {
    isLoading = true
    defer { isLoading = false }
    // ...
}

// map / flatMap / compactMap: 変換
let names = users.map(\.name)
let validUsers = users.compactMap { $0.isValid ? $0 : nil }
```

---

## 命名規則の詳細

```swift
// Bool プロパティ: is / has / should / can / will で始める
var isLoading: Bool
var hasUnreadNotifications: Bool
var shouldShowAlert: Bool
var canEdit: Bool

// 動詞で始まる関数名（何をするかが明確）
func fetchUser(id: String) async throws -> User
func validateEmail(_ email: String) throws
func resetCache()

// 戻り値を持つ関数は名詞/形容詞
var formattedDate: String { ... }
func sortedUsers() -> [User] { ... }
```

---

_Swift Rules: 型安全 × 並行安全 × 表現力（iOS/Swift版）_
