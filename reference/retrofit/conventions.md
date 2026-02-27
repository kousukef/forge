# Retrofit / OkHttp Conventions

## API サービスインターフェース

```kotlin
interface UserApiService {
    @GET("v1/users/{id}")
    suspend fun getUser(@Path("id") userId: String): Response<UserResponse>

    @GET("v1/users")
    suspend fun getUsers(
        @Query("page") page: Int,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<UserResponse>>

    @POST("v1/users")
    suspend fun createUser(@Body request: CreateUserRequest): Response<UserResponse>
}
```

## DTO 命名規則

- リクエスト: `*Request`（例: `CreateUserRequest`）
- レスポンス: `*Response`（例: `UserResponse`）
- DTO と Domain Model の変換は拡張関数で: `UserResponse.toDomain(): User`

## OkHttpClient 設定

```kotlin
OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .writeTimeout(30, TimeUnit.SECONDS)
    .addInterceptor(AuthInterceptor(tokenProvider))
    .addInterceptor(
        HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    )
    .build()
```

## エラーハンドリング

```kotlin
suspend fun <T> Response<T>.toResult(): Result<T> =
    if (isSuccessful) {
        body()?.let { Result.success(it) }
            ?: Result.failure(ApiException("Empty response body"))
    } else {
        Result.failure(ApiException("HTTP ${code()}: ${message()}"))
    }
```

## テスト

- MockWebServer（OkHttp）でネットワーク層のユニットテスト
- テスト用 `FakeUserApiService` を実装して Repository テスト
