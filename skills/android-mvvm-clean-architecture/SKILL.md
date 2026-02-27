---
name: android-mvvm-clean-architecture
description: "MVVM + Clean Architecture の層分離・依存方向・UseCase/Repository パターンのベストプラクティス"
---

# Android MVVM + Clean Architecture

## レイヤー構成

```
UI 層 (presentation/)
  ├── Screen / Composable (View)
  ├── ViewModel
  └── UiState / UiEvent / UiAction

Domain 層 (domain/)
  ├── UseCase
  ├── Repository Interface
  └── Model (Domain Model)

Data 層 (data/)
  ├── Repository Implementation
  ├── Remote DataSource (Retrofit)
  └── Local DataSource (Room)
```

## 依存方向の絶対ルール

- **UI → Domain → Data** の一方向のみ
- Domain 層は Android フレームワークに依存しない（純 Kotlin）
- Data 層は Domain の Repository Interface を実装する

## UseCase

- 1 UseCase = 1 つのビジネスロジック（単一責任原則）
- `operator fun invoke()` で呼び出し可能にする
- 戻り値は `Flow<Result<T>>` または `suspend fun` + `Result<T>`

```kotlin
class GetUserUseCase(private val userRepository: UserRepository) {
    operator fun invoke(userId: String): Flow<Result<User>> =
        userRepository.getUser(userId)
}
```

## ViewModel

- UI 状態は `StateFlow<UiState>` で保持（`LiveData` は新規コードでは使わない）
- `viewModelScope` で Coroutine を起動
- ViewModel から Context・View の参照禁止
- `SavedStateHandle` でプロセス再起動後の状態復元

```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(UserUiState())
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
}
```

## Repository

- Domain 層で `interface` を定義、Data 層で実装
- Remote/Local DataSource の調整ロジックをここに集約
- キャッシュ戦略（ネットワーク優先 or キャッシュ優先）を Repository が決定

## UiState 設計

- 画面の状態は 1 つの `data class UiState` で表現
- ローディング・エラー・データを別フィールドで持つ（sealed class より data class が推奨）

```kotlin
data class UserUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val errorMessage: String? = null
)
```

## パッケージ構成

機能ベースで分割する（レイヤーベース禁止）:

```
feature/
  user/
    presentation/
      UserScreen.kt
      UserViewModel.kt
      UserUiState.kt
    domain/
      GetUserUseCase.kt
      UserRepository.kt
    data/
      UserRepositoryImpl.kt
      UserRemoteDataSource.kt
      UserLocalDataSource.kt
```
