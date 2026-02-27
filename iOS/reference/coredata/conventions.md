# CoreData / SwiftData Conventions

CoreData および SwiftData（iOS 17+）の実装規約。エンティティ設計、マイグレーション、クエリ最適化を含む。

---

## SwiftData（iOS 17+）

### モデル定義

```swift
import SwiftData

@Model
final class User {
    // 推奨: 自動生成 ID は @Attribute(.unique) で一意性を保証
    @Attribute(.unique) var id: String
    var name: String
    var email: String
    var createdAt: Date

    // リレーションシップ
    @Relationship(deleteRule: .cascade) var posts: [Post] = []

    init(id: String, name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
        self.createdAt = Date()
    }
}

@Model
final class Post {
    @Attribute(.unique) var id: String
    var title: String
    var content: String
    var publishedAt: Date?

    // 逆方向リレーションシップ
    var author: User?

    init(id: String, title: String, content: String) {
        self.id = id
        self.title = title
        self.content = content
    }
}
```

### ModelContainer の設定

```swift
// アプリエントリーポイントでのセットアップ
@main
struct MyApp: App {
    let modelContainer: ModelContainer

    init() {
        do {
            modelContainer = try ModelContainer(
                for: User.self, Post.self,
                configurations: ModelConfiguration(
                    isStoredInMemoryOnly: false,
                    allowsSave: true
                )
            )
        } catch {
            fatalError("ModelContainer の初期化に失敗: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(modelContainer)
    }
}
```

### クエリと操作

```swift
struct UserListView: View {
    // SwiftUI との統合
    @Query(sort: \User.name) private var users: [User]
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        List(users) { user in
            Text(user.name)
        }
    }
}

// Repository パターンでの利用
final class UserLocalDataSource {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func fetchUsers(matching predicate: Predicate<User>? = nil) throws -> [User] {
        let descriptor = FetchDescriptor<User>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.name)]
        )
        return try modelContext.fetch(descriptor)
    }

    func saveUser(_ user: User) throws {
        modelContext.insert(user)
        try modelContext.save()
    }

    func deleteUser(_ user: User) throws {
        modelContext.delete(user)
        try modelContext.save()
    }
}
```

---

## CoreData（iOS 16 以下対応が必要な場合）

### Entity 設計規約

```swift
// NSManagedObject サブクラス
@objc(CDUser)
public class CDUser: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var name: String
    @NSManaged public var email: String
    @NSManaged public var createdAt: Date
    @NSManaged public var posts: NSSet?
}

// ドメインモデルへの変換
extension CDUser {
    func toDomain() -> User {
        User(
            id: id,
            name: name,
            email: email,
            createdAt: createdAt
        )
    }
}

extension User {
    func toManagedObject(in context: NSManagedObjectContext) -> CDUser {
        let entity = CDUser(context: context)
        entity.id = id
        entity.name = name
        entity.email = email
        entity.createdAt = createdAt
        return entity
    }
}
```

### NSPersistentContainer の設定

```swift
final class CoreDataStack {
    static let shared = CoreDataStack()

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "DataModel")
        container.loadPersistentStores { _, error in
            if let error {
                // 本番では適切なエラー処理を実装する
                fatalError("CoreData ストアのロードに失敗: \(error)")
            }
        }
        // マージポリシーの設定
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        container.viewContext.automaticallyMergesChangesFromParent = true
        return container
    }()

    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }

    // バックグラウンド処理用 context
    func newBackgroundContext() -> NSManagedObjectContext {
        persistentContainer.newBackgroundContext()
    }
}
```

---

## マイグレーション

### 軽量マイグレーション（属性追加等）

```swift
// NSPersistentContainer の設定でマイグレーションオプションを指定
let options: [String: Any] = [
    NSMigratePersistentStoresAutomaticallyOption: true,
    NSInferMappingModelAutomaticallyOption: true,
]
container.loadPersistentStores { description, error in
    // ...
}
```

### SwiftData マイグレーション（iOS 17+）

```swift
// バージョン定義
enum UserSchemaV1: VersionedSchema {
    static var versionIdentifier = Schema.Version(1, 0, 0)
    static var models: [any PersistentModel.Type] = [User.self]

    @Model
    final class User {
        var id: String
        var name: String
    }
}

enum UserSchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)
    static var models: [any PersistentModel.Type] = [User.self]

    @Model
    final class User {
        var id: String
        var name: String
        var email: String  // 新規フィールド追加
    }
}

// マイグレーションプラン
enum UserMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] = [UserSchemaV1.self, UserSchemaV2.self]

    static var stages: [MigrationStage] = [
        // V1 → V2: email フィールドを追加
        MigrationStage.custom(
            fromVersion: UserSchemaV1.self,
            toVersion: UserSchemaV2.self,
            willMigrate: { context in
                // マイグレーション前の処理
            },
            didMigrate: { context in
                // email のデフォルト値を設定
                let users = try context.fetch(FetchDescriptor<UserSchemaV2.User>())
                for user in users {
                    user.email = ""
                }
                try context.save()
            }
        )
    ]
}
```

---

## クエリ最適化

```swift
// 推奨: 必要なフィールドのみフェッチ
var descriptor = FetchDescriptor<User>()
descriptor.propertiesToFetch = [\.name, \.email]

// 推奨: バッチフェッチでメモリ使用量を抑制
descriptor.fetchLimit = 50
descriptor.fetchOffset = page * 50

// 推奨: 検索条件を事前に絞り込む
let predicate = #Predicate<User> { user in
    user.name.contains(searchText)
}
descriptor.predicate = predicate
```

---

_CoreData / SwiftData Conventions: 永続化 × マイグレーション × パフォーマンス_
