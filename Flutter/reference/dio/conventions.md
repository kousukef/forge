# Dio Conventions

Dio / HTTP API レイヤーの実装規約。ネットワーク通信実装時に参照する。

---

## Dio の初期設定

```dart
// ✅ Good: Dio の設定を一元管理
class DioFactory {
  static Dio create({required String baseUrl, required String apiKey}) {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([
      AuthInterceptor(apiKey: apiKey),
      LoggingInterceptor(),
      ErrorInterceptor(),
    ]);

    return dio;
  }
}
```

---

## Interceptor の実装

### 認証 Interceptor

```dart
class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _secureStorage;

  const AuthInterceptor({required FlutterSecureStorage secureStorage})
      : _secureStorage = secureStorage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    // 401 エラー時にトークンリフレッシュ
    if (error.response?.statusCode == 401) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        return handler.resolve(await _retry(error.requestOptions));
      }
    }
    return handler.next(error);
  }
}
```

### エラーハンドリング Interceptor

```dart
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException error, ErrorInterceptorHandler handler) {
    final exception = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.sendTimeout =>
        NetworkException(message: '接続がタイムアウトしました'),
      DioExceptionType.connectionError =>
        NetworkException(message: 'ネットワーク接続を確認してください'),
      DioExceptionType.badResponse => _handleBadResponse(error.response),
      _ => ServerException(message: 'サーバーエラーが発生しました'),
    };

    // カスタム例外を error に付加して次のハンドラに渡す
    handler.next(error.copyWith(error: exception));
  }

  AppException _handleBadResponse(Response? response) {
    return switch (response?.statusCode) {
      400 => ValidationException(message: 'リクエストが不正です'),
      401 => UnauthorizedException(message: '認証が必要です'),
      403 => ForbiddenException(message: 'アクセス権限がありません'),
      404 => NotFoundException(message: 'リソースが見つかりません'),
      429 => TooManyRequestsException(message: 'リクエストが多すぎます'),
      >= 500 => ServerException(message: 'サーバーエラーが発生しました'),
      _ => ServerException(message: '予期しないエラーが発生しました'),
    };
  }
}
```

---

## API クライアントの実装

```dart
// ✅ Good: API クライアントを抽象インターフェースで定義
abstract interface class UserRemoteDataSource {
  Future<UserModel> getUser(String userId);
  Future<List<UserModel>> getUsers({int page = 1, int limit = 20});
  Future<UserModel> createUser(CreateUserRequest request);
  Future<UserModel> updateUser(String userId, UpdateUserRequest request);
  Future<void> deleteUser(String userId);
}

// ✅ Good: Dio を使った具体実装
class UserRemoteDataSourceImpl implements UserRemoteDataSource {
  final Dio _dio;

  const UserRemoteDataSourceImpl({required Dio dio}) : _dio = dio;

  @override
  Future<UserModel> getUser(String userId) async {
    try {
      final response = await _dio.get('/users/$userId');
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (exception) {
      throw _mapDioExceptionToAppException(exception);
    }
  }

  @override
  Future<List<UserModel>> getUsers({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/users',
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data as Map<String, dynamic>;
      return (data['items'] as List)
          .map((item) => UserModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (exception) {
      throw _mapDioExceptionToAppException(exception);
    }
  }

  AppException _mapDioExceptionToAppException(DioException exception) {
    if (exception.error is AppException) {
      return exception.error as AppException;
    }
    return ServerException(message: exception.message ?? 'ネットワークエラー');
  }
}
```

---

## リクエスト/レスポンスモデル

```dart
// ✅ Good: JSON シリアライズ（json_serializable パッケージ）
@JsonSerializable()
class UserModel {
  final String id;
  final String name;
  @JsonKey(name: 'email_address')
  final String email;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  // ✅ Good: Domain Entity への変換
  User toEntity() => User(id: id, name: name, email: email);
}

// ✅ Good: リクエストクラス
@JsonSerializable()
class CreateUserRequest {
  final String name;
  @JsonKey(name: 'email_address')
  final String email;
  final String password;

  const CreateUserRequest({
    required this.name,
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() => _$CreateUserRequestToJson(this);
}
```

---

## マルチパートファイルアップロード

```dart
// ✅ Good: ファイルアップロード
Future<String> uploadAvatar(String userId, File imageFile) async {
  final formData = FormData.fromMap({
    'avatar': await MultipartFile.fromFile(
      imageFile.path,
      filename: 'avatar.jpg',
      contentType: DioMediaType('image', 'jpeg'),
    ),
  });

  final response = await _dio.post(
    '/users/$userId/avatar',
    data: formData,
    onSendProgress: (sent, total) {
      debugPrint('Upload progress: ${(sent / total * 100).toStringAsFixed(0)}%');
    },
  );

  return response.data['avatarUrl'] as String;
}
```

---

## テスト（Dio のモック）

```dart
// ✅ Good: DioAdapter でモック
void main() {
  late UserRemoteDataSourceImpl dataSource;
  late Dio dio;
  late DioAdapter dioAdapter;

  setUp(() {
    dio = Dio();
    dioAdapter = DioAdapter(dio: dio);
    dataSource = UserRemoteDataSourceImpl(dio: dio);
  });

  group('UserRemoteDataSource', () {
    test('getUser_正常なID_UserModelを返す', () async {
      // Arrange
      dioAdapter.onGet(
        '/users/user-1',
        (server) => server.reply(200, {
          'id': 'user-1',
          'name': 'テストユーザー',
          'email_address': 'test@example.com',
          'created_at': '2024-01-01T00:00:00.000Z',
        }),
      );

      // Act
      final result = await dataSource.getUser('user-1');

      // Assert
      expect(result.id, 'user-1');
      expect(result.name, 'テストユーザー');
    });
  });
}
```
