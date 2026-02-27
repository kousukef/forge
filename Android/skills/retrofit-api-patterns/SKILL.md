---
name: retrofit-api-patterns
description: "Retrofit/OkHttp・Interceptor・エラーハンドリング・Result ラッパーのベストプラクティス"
---

# Retrofit API Patterns

## API インターフェース

```kotlin
interface UserApiService {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") userId: String): UserResponse

    @POST("users")
    suspend fun createUser(@Body request: CreateUserRequest): UserResponse
}
```

- `suspend fun` を使用（`Call<T>` や `Observable<T>` は使わない）
- レスポンスは DTO（Data Transfer Object）クラスで受け取る

## Result ラッパー

API 呼び出しは必ず `Result<T>` でラップする:

```kotlin
suspend fun <T> safeApiCall(block: suspend () -> T): Result<T> =
    runCatching { block() }
        .onFailure { throwable ->
            // Timber.e(throwable) でログ記録
        }
```

## OkHttp Interceptor

```kotlin
class AuthInterceptor(private val tokenProvider: TokenProvider) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${tokenProvider.getToken()}")
            .build()
        return chain.proceed(request)
    }
}
```

- 認証トークン付与: `AuthInterceptor`
- ログ記録（デバッグのみ）: `HttpLoggingInterceptor`
- リトライ: `RetryInterceptor`

## エラーハンドリング

```kotlin
sealed interface ApiError {
    data class NetworkError(val cause: Throwable) : ApiError
    data class HttpError(val code: Int, val message: String) : ApiError
    data object UnknownError : ApiError
}

fun Throwable.toApiError(): ApiError = when (this) {
    is IOException -> ApiError.NetworkError(this)
    is HttpException -> ApiError.HttpError(code(), message())
    else -> ApiError.UnknownError
}
```

## タイムアウト設定

```kotlin
OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .writeTimeout(30, TimeUnit.SECONDS)
    .build()
```

## DTO とドメインモデルの変換

- DTO は Data 層のみ（Domain 層に持ち込まない）
- 変換関数は拡張関数で定義: `UserResponse.toDomain(): User`
