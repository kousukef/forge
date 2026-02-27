---
name: android-coroutines-flow
description: "Kotlin Coroutines・Flow/StateFlow/SharedFlow・構造化並行性・ViewModel Scope のベストプラクティス"
---

# Android Coroutines & Flow

## Coroutine スコープ

| スコープ | 用途 |
|---|---|
| `viewModelScope` | ViewModel 内での非同期処理。ViewModel が destroy されると自動キャンセル |
| `lifecycleScope` | Activity/Fragment 内。ライフサイクルに連動 |
| `GlobalScope` | **禁止**。キャンセル不能でリークの原因 |

```kotlin
// CORRECT
viewModelScope.launch {
    val result = getUserUseCase(userId)
    _uiState.update { it.copy(user = result) }
}
```

## Flow の選択

| 型 | 用途 |
|---|---|
| `Flow<T>` | Cold stream。データ取得・Repository からの返却 |
| `StateFlow<T>` | UI 状態保持。初期値必須。常に最新値を持つ |
| `SharedFlow<T>` | イベント配信（ナビゲーション・Snackbar）。replay 設定可能 |

## StateFlow と SharedFlow の使い分け

```kotlin
// 状態 → StateFlow
private val _uiState = MutableStateFlow(UiState())
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

// 一回限りのイベント → SharedFlow (replay = 0)
private val _events = MutableSharedFlow<UiEvent>()
val events: SharedFlow<UiEvent> = _events.asSharedFlow()
```

## Flow 収集（UI 層）

- `collectAsStateWithLifecycle()` を使用（`collectAsState()` より推奨）
- `launchWhenStarted` / `repeatOnLifecycle(Lifecycle.State.STARTED)` を使用
- `lifecycleScope.launch { repeatOnLifecycle(STARTED) { ... } }` パターン

## 構造化並行性

- 並列実行は `async { } + awaitAll()` または `coroutineScope { }`
- エラーハンドリングは `try-catch` または `runCatching { }` で
- タイムアウトは `withTimeout(millis)` または `withTimeoutOrNull(millis)`

```kotlin
// 並列フェッチ
coroutineScope {
    val userDeferred = async { userRepository.getUser(userId) }
    val postsDeferred = async { postRepository.getPosts(userId) }
    val user = userDeferred.await()
    val posts = postsDeferred.await()
}
```

## Flow 演算子

- `map`, `filter`, `combine`, `flatMapLatest` を積極利用
- `debounce` で検索入力のデバウンス
- `distinctUntilChanged` で重複値の抑制
- `catch` で Flow 内例外をハンドリング（上流のみキャッチ）

## Dispatcher

| Dispatcher | 用途 |
|---|---|
| `Dispatchers.Main` | UI 更新（デフォルト） |
| `Dispatchers.IO` | DB・ネットワーク・ファイル IO |
| `Dispatchers.Default` | CPU バウンド処理（ソート等） |
| `Dispatchers.Unconfined` | **原則禁止** |

Repository / DataSource は `withContext(Dispatchers.IO)` で IO スレッドに切り替え。
