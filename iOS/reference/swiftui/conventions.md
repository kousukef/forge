# SwiftUI Conventions

SwiftUI 実装の規約。状態管理、View設計、副作用処理、パフォーマンスを含む。

---

## View 設計原則

### 単一責務の原則

```swift
// 推奨: 小さく焦点を絞った View
struct UserAvatarView: View {
    let imageURL: URL?
    let size: CGFloat

    var body: some View {
        AsyncImage(url: imageURL) { image in
            image
                .resizable()
                .scaledToFill()
        } placeholder: {
            Image(systemName: "person.circle.fill")
                .foregroundStyle(.gray)
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
}

// 禁止: 巨大な View（100行超えたら分割を検討）
struct HugeView: View {  // 300行... 分割してください
    var body: some View { ... }
}
```

---

## 状態管理プロパティラッパーの正しい使い分け

### @State（ローカル状態）

```swift
struct ExpandableSection: View {
    @State private var isExpanded = false  // View のローカル状態

    var body: some View {
        VStack {
            Button("展開") { isExpanded.toggle() }
            if isExpanded {
                Text("詳細内容")
            }
        }
    }
}
```

### @StateObject（所有する ViewModel）

```swift
struct UserListView: View {
    // この View が ViewModel を所有する場合
    @StateObject private var viewModel = UserListViewModel()

    var body: some View {
        List(viewModel.users) { user in
            UserRowView(user: user)
        }
        .task { await viewModel.load() }
    }
}
```

### @ObservedObject（注入された ViewModel）

```swift
struct UserDetailView: View {
    // 外部から注入された ViewModel
    @ObservedObject var viewModel: UserDetailViewModel

    var body: some View {
        // ...
    }
}
```

### @Binding（親 View との双方向バインド）

```swift
struct TextInputView: View {
    @Binding var text: String  // 親から渡される状態

    var body: some View {
        TextField("入力してください", text: $text)
    }
}

// 親 View での使用
struct ParentView: View {
    @State private var inputText = ""

    var body: some View {
        TextInputView(text: $inputText)
    }
}
```

---

## 副作用処理のルール

### .task（非同期処理）

```swift
struct UserProfileView: View {
    @StateObject private var viewModel: UserProfileViewModel

    var body: some View {
        content
            // 推奨: .task で非同期処理を開始
            .task {
                await viewModel.loadProfile()
            }
            // 推奨: id を指定して依存値変更時に再実行
            .task(id: viewModel.userId) {
                await viewModel.loadUserData()
            }
    }
}
```

### .onAppear の注意点

```swift
struct ItemListView: View {
    @StateObject private var viewModel: ItemListViewModel

    var body: some View {
        List(viewModel.items) { item in ItemRowView(item: item) }
            // 注意: .onAppear は NavigationStack でポップ時にも呼ばれる
            // 重複呼び出しを考慮した実装が必要
            .onAppear {
                guard viewModel.items.isEmpty else { return }
                Task { await viewModel.load() }
            }
    }
}
```

### body に副作用を書かない（CRITICAL）

```swift
// 禁止: body プロパティ内での副作用
var body: some View {
    Text("Hello")
        .onAppear {
            // これは OK（.onAppear はモディファイア）
        }

    // 禁止: body 内での直接的な状態変更
    // self.isLoaded = true  <- 禁止
    // fetchData()            <- 禁止（副作用）
}
```

---

## View の再描画最適化

### @Observable の活用（iOS 17+）

```swift
@Observable
final class UserViewModel {
    var users: [User] = []
    var isLoading = false

    // @Observable は変更されたプロパティのみ再描画を引き起こす
    // ObservableObject + @Published より効率的
}
```

### Equatable による再描画抑制

```swift
struct UserRowView: View, Equatable {
    let user: User

    static func == (lhs: UserRowView, rhs: UserRowView) -> Bool {
        lhs.user.id == rhs.user.id && lhs.user.name == rhs.user.name
    }

    var body: some View {
        // user.id と user.name が同じなら再描画しない
        HStack {
            Text(user.name)
        }
    }
}
```

### List の最適化

```swift
// 推奨: id パラメータで安定した識別子を使用
List(users, id: \.id) { user in
    UserRowView(user: user)
}

// 推奨: ForEach でも id を明示
ForEach(users, id: \.id) { user in
    UserRowView(user: user)
}

// 大量データには LazyVStack
ScrollView {
    LazyVStack(spacing: 8) {
        ForEach(items, id: \.id) { item in
            ItemView(item: item)
        }
    }
}
```

---

## ナビゲーション（iOS 16+）

```swift
// 推奨: NavigationStack + navigationDestination
struct AppNavigationView: View {
    @State private var navigationPath = NavigationPath()

    var body: some View {
        NavigationStack(path: $navigationPath) {
            HomeView(path: $navigationPath)
                .navigationDestination(for: User.self) { user in
                    UserDetailView(user: user)
                }
                .navigationDestination(for: Post.self) { post in
                    PostDetailView(post: post)
                }
        }
    }
}

// NavigationLink は value ベースで使用
NavigationLink(value: user) {
    UserRowView(user: user)
}
```

---

## プレビュー

```swift
// 推奨: #Preview マクロ（Xcode 15+）
#Preview {
    UserProfileView(viewModel: UserProfileViewModel.preview)
}

// 推奨: ViewModel の preview 用スタブ
extension UserProfileViewModel {
    static var preview: UserProfileViewModel {
        let viewModel = UserProfileViewModel(
            userRepository: MockUserRepository()
        )
        viewModel.user = User.stub()
        return viewModel
    }
}
```

---

_SwiftUI Conventions: 宣言的 UI × 状態管理 × パフォーマンス_
