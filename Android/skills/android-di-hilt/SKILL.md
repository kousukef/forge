---
name: android-di-hilt
description: "Dagger/Hilt による DI・モジュール定義・スコープ管理・テスト用モック注入のベストプラクティス"
---

# Android DI with Hilt

## 基本原則

- コンストラクタインジェクションを最優先（`@Inject constructor`）
- フィールドインジェクションは Activity/Fragment/ViewModel に限定
- 手動で `new` するのは禁止（DI で管理されるオブジェクトのみ）

## スコープ

| アノテーション | ライフタイム |
|---|---|
| `@Singleton` | アプリ全体で 1 インスタンス |
| `@ActivityRetainedScoped` | ViewModel と同じスコープ |
| `@ViewModelScoped` | ViewModel 内で 1 インスタンス |
| `@ActivityScoped` | Activity ライフサイクル |
| `@FragmentScoped` | Fragment ライフサイクル |

## モジュール定義

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
}
```

## Repository バインディング

Interface と Implementation の紐付けは `@Binds` を使う（`@Provides` より効率的）:

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    abstract fun bindUserRepository(
        userRepositoryImpl: UserRepositoryImpl
    ): UserRepository
}
```

## ViewModel への注入

```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel()
```

## テスト時の差し替え

- `@TestInstallIn` でテスト用モジュールを差し替え
- `@UninstallModules` + `@BindValue` でフィールド単位の差し替え

```kotlin
@HiltAndroidTest
class UserViewModelTest {
    @get:Rule
    val hiltRule = HiltAndroidRule(this)

    @BindValue
    val userRepository: UserRepository = mockk()
}
```
