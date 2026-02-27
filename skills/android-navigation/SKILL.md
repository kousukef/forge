---
name: android-navigation
description: "Navigation Component・SafeArgs・ディープリンク・バックスタック管理のベストプラクティス"
---

# Android Navigation

## Navigation Component（Compose）

```kotlin
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = "home",
        modifier = modifier
    ) {
        composable("home") { HomeScreen(navController) }
        composable(
            route = "user/{userId}",
            arguments = listOf(navArgument("userId") { type = NavType.StringType })
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
            UserScreen(userId = userId, navController = navController)
        }
    }
}
```

## ルート定義

ルート文字列は `object` 定数で管理（ハードコード禁止）:

```kotlin
object AppDestinations {
    const val HOME = "home"
    const val USER_DETAIL = "user/{userId}"

    fun userDetail(userId: String) = "user/$userId"
}
```

## バックスタック管理

- 不要なバックスタック蓄積を避ける: `launchSingleTop = true`
- 画面遷移後に前の画面をスタックから除く: `popUpTo()`

```kotlin
navController.navigate(AppDestinations.userDetail(userId)) {
    launchSingleTop = true
    popUpTo(AppDestinations.HOME) { inclusive = false }
}
```

## ディープリンク

```kotlin
composable(
    route = AppDestinations.USER_DETAIL,
    deepLinks = listOf(
        navDeepLink { uriPattern = "https://example.com/user/{userId}" }
    )
) { ... }
```

## ViewModel スコープとナビゲーション

- ナビゲーションイベントは `SharedFlow<UiEvent>` で通知
- ViewModel から直接 `NavController` を保持しない

```kotlin
sealed interface UiEvent {
    data class NavigateToDetail(val userId: String) : UiEvent
    data object NavigateBack : UiEvent
}
```
