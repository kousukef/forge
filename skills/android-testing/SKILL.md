---
name: android-testing
description: "JUnit/MockK・Espresso・Compose UI Test の TDD サイクルとカバレッジのベストプラクティス"
---

# Android Testing

## TDD サイクル（Android）

1. **RED**: テストを書いて失敗させる（`./gradlew testDebugUnitTest`）
2. **GREEN**: テストを通す最小限の実装
3. **REFACTOR**: テストを通したまま改善

## ユニットテスト（JUnit4 + MockK）

```kotlin
@ExtendWith(MockKExtension::class)
class GetUserUseCaseTest {

    @MockK
    private lateinit var userRepository: UserRepository

    private lateinit var useCase: GetUserUseCase

    @BeforeEach
    fun setUp() {
        useCase = GetUserUseCase(userRepository)
    }

    @Test
    fun `ユーザーが存在する場合 Success を返す`() = runTest {
        // Arrange
        val userId = "user-1"
        val expectedUser = User(id = userId, name = "Alice")
        every { userRepository.getUser(userId) } returns flowOf(Result.success(expectedUser))

        // Act
        val result = useCase(userId).first()

        // Assert
        assertThat(result.getOrNull()).isEqualTo(expectedUser)
    }
}
```

## ViewModel テスト

- `TestCoroutineDispatcher` または `StandardTestDispatcher` を使用
- `turbine` ライブラリで Flow のテスト（`test { }` ブロック）
- `MainDispatcherRule` を設定して `Dispatchers.Main` を差し替え

```kotlin
@get:Rule
val mainDispatcherRule = MainDispatcherRule()

@Test
fun `UIState が正しく更新される`() = runTest {
    viewModel.uiState.test {
        assertThat(awaitItem().isLoading).isFalse()
        viewModel.loadUser("user-1")
        assertThat(awaitItem().isLoading).isTrue()
        assertThat(awaitItem().user).isNotNull()
    }
}
```

## Compose UI テスト

```kotlin
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun `ユーザー名が画面に表示される`() {
    composeTestRule.setContent {
        UserScreen(user = User(name = "Alice"), onProfileClick = {})
    }
    composeTestRule.onNodeWithText("Alice").assertIsDisplayed()
}
```

## テスト命名規則

- 日本語で「状況 + 期待する結果」: `` `ユーザーが存在しない場合 Error を返す` ``

## カバレッジ目標

- Domain 層（UseCase）: 90%+
- ViewModel: 80%+
- Repository: 70%+
- Composable: Compose UI テストで主要フロー網羅

## テスト禁止事項

- `Thread.sleep` によるウェイト（`advanceUntilIdle()` を使う）
- 本番 DB・ネットワークへのアクセス（必ず Fake/Mock に差し替え）
- `@Ignore` の安易な使用（理由コメント必須・チケット番号を添付）
