# iOS Conventions

iOS アプリ開発全般の規約。AppDelegate、SceneDelegate、Xcode プロジェクト設定、ライフサイクル管理を含む。

---

## アプリエントリーポイント

### @main（SwiftUI App）

```swift
@main
struct MyApp: App {
    // 依存関係の初期化はここで行う
    @StateObject private var appDependencies = AppDependencies()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appDependencies.authManager)
        }
    }
}
```

### AppDelegate（UIKit ベース）

```swift
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // DIコンテナの初期化
        DependencyContainer.shared.initialize()
        return true
    }
}
```

---

## Info.plist 設定

### App Transport Security（ATS）

```xml
<!-- 本番: 厳格な設定（デフォルト） -->
<!-- NSAllowsArbitraryLoads は絶対に true にしない -->

<!-- 開発環境での例外（本番ビルドから除外すること） -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 権限リクエスト説明文

```xml
<!-- カメラ -->
<key>NSCameraUsageDescription</key>
<string>プロフィール写真の撮影に使用します</string>

<!-- 位置情報 -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>近くの店舗を表示するために使用します</string>

<!-- 写真ライブラリ -->
<key>NSPhotoLibraryUsageDescription</key>
<string>プロフィール写真の選択に使用します</string>
```

---

## Xcode プロジェクト設定

### ビルド設定

```
Swift Language Version: Swift 6.0（最新の安定版）
iOS Deployment Target: 17.0 以上（新規プロジェクトの場合）
Enable Bitcode: No（Xcode 14 以降は廃止済み）
Debug Information Format: DWARF with dSYM File（Release）
Swift Compilation Mode: Whole Module（Release）
Optimization Level: Optimize for Speed（Release）
```

### Swift Package Manager（SPM）

```swift
// Package.swift でのバージョン指定
dependencies: [
    // 範囲指定（セキュリティアップデート自動適用）
    .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
    // 正確なバージョン指定（破壊的変更を避ける場合）
    .package(url: "https://github.com/nicklockwood/SwiftyJSON.git", exact: "5.0.2"),
]
```

---

## アプリライフサイクル

### SwiftUI ライフサイクル

```swift
struct ContentView: View {
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        MainView()
            .onChange(of: scenePhase) { oldPhase, newPhase in
                switch newPhase {
                case .active:
                    // アプリがフォアグラウンドになった
                    startObserving()
                case .background:
                    // バックグラウンドに移行
                    saveState()
                case .inactive:
                    // 非アクティブ（通知センター表示中等）
                    break
                @unknown default:
                    break
                }
            }
    }
}
```

---

## ディープリンク / Universal Links

### Universal Links 設定

```swift
// Info.plist に Associated Domains を設定
// applinks:example.com

// SwiftUI: onOpenURL
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }

    private func handleDeepLink(_ url: URL) {
        // 必ず URL を検証すること
        guard isValidDeepLink(url) else { return }
        router.handle(url)
    }
}
```

---

## Push通知

### 通知権限リクエスト

```swift
func requestNotificationPermission() async {
    let center = UNUserNotificationCenter.current()
    do {
        let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
        if granted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    } catch {
        logger.error("通知権限リクエスト失敗: \(error.localizedDescription)")
    }
}
```

---

## ローカライゼーション

```swift
// String Catalog（Xcode 15+）を使用
// Localizable.xcstrings

// 使用方法
Text("welcome_message")
    // または
let message = String(localized: "welcome_message")

// 引数付き
Text("items_count \(count)")
// Localizable.xcstrings: "items_count %lld" = "%lld 件のアイテム"
```

---

## アクセシビリティ

```swift
// VoiceOver サポート
Button(action: deleteItem) {
    Image(systemName: "trash")
}
.accessibilityLabel("削除")
.accessibilityHint("このアイテムを削除します")

// Dynamic Type サポート
Text("見出し")
    .font(.headline)  // システムフォントを使用（固定サイズ禁止）

// カラーアクセシビリティ
// カラーのみで情報を伝えない（アイコンや形状も使用する）
```

---

_iOS Conventions: Apple プラットフォーム開発標準_
