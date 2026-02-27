# Network Conventions

URLSession / Alamofire を用いたネットワーク層の実装規約。

---

## APIクライアントの設計

### プロトコル定義（テスト容易性）

```swift
protocol APIClientProtocol {
    func request<T: Decodable>(
        endpoint: Endpoint,
        responseType: T.Type
    ) async throws -> T
}
```

### URLSession ベースの実装

```swift
final class URLSessionAPIClient: APIClientProtocol {
    private let session: URLSession
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601
    }

    func request<T: Decodable>(
        endpoint: Endpoint,
        responseType: T.Type
    ) async throws -> T {
        let urlRequest = try endpoint.buildRequest()

        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard 200..<300 ~= httpResponse.statusCode else {
            throw NetworkError.httpError(statusCode: httpResponse.statusCode, data: data)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
}
```

---

## Endpoint 設計

```swift
struct Endpoint {
    let path: String
    let method: HTTPMethod
    let headers: [String: String]
    let queryParameters: [String: String]?
    let body: Encodable?

    func buildRequest() throws -> URLRequest {
        guard var components = URLComponents(string: baseURL + path) else {
            throw NetworkError.invalidURL
        }

        if let queryParameters {
            components.queryItems = queryParameters.map {
                URLQueryItem(name: $0.key, value: $0.value)
            }
        }

        guard let url = components.url else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = 30

        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        return request
    }
}

// エンドポイント定義
extension Endpoint {
    static func getUser(id: String) -> Endpoint {
        Endpoint(
            path: "/users/\(id)",
            method: .get,
            headers: [:],
            queryParameters: nil,
            body: nil
        )
    }
}
```

---

## エラーハンドリング

```swift
enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, data: Data)
    case decodingError(Error)
    case networkUnavailable
    case timeout
    case cancelled
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "無効なURLです"
        case .httpError(let statusCode, _):
            return "HTTPエラー: \(statusCode)"
        case .decodingError:
            return "データの解析に失敗しました"
        case .networkUnavailable:
            return "ネットワーク接続を確認してください"
        case .timeout:
            return "タイムアウトしました"
        case .cancelled:
            return nil  // キャンセルはユーザーに表示しない
        default:
            return "不明なエラーが発生しました"
        }
    }
}
```

---

## 認証トークン管理

```swift
// 推奨: Keychain にトークンを保存
actor TokenStore {
    private let keychainService = KeychainService()

    func saveAccessToken(_ token: String) throws {
        try keychainService.save(
            token,
            forKey: "access_token",
            accessibility: .whenUnlockedThisDeviceOnly
        )
    }

    func getAccessToken() -> String? {
        keychainService.get(forKey: "access_token")
    }

    func deleteAccessToken() throws {
        try keychainService.delete(forKey: "access_token")
    }
}
```

---

## SSL証明書ピニング

```swift
// URLSession の delegate で証明書ピニングを実装
final class PinningURLSessionDelegate: NSObject, URLSessionDelegate {
    private let pinnedPublicKeyHash: String

    init(pinnedPublicKeyHash: String) {
        self.pinnedPublicKeyHash = pinnedPublicKeyHash
    }

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let serverTrust = challenge.protectionSpace.serverTrust else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }

        // 証明書のハッシュを検証
        if validateServerTrust(serverTrust) {
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }

    private func validateServerTrust(_ serverTrust: SecTrust) -> Bool {
        // 公開鍵ハッシュの検証ロジック
        // 実装はプロジェクトの要件に応じて実装する
        return true  // プレースホルダー
    }
}
```

---

## リトライロジック

```swift
// 推奨: 指数バックオフ付きリトライ
func requestWithRetry<T: Decodable>(
    endpoint: Endpoint,
    responseType: T.Type,
    maxRetries: Int = 3
) async throws -> T {
    var lastError: Error?

    for attempt in 0..<maxRetries {
        do {
            return try await apiClient.request(endpoint: endpoint, responseType: responseType)
        } catch let error as NetworkError {
            switch error {
            case .httpError(let statusCode, _) where statusCode == 429 || statusCode >= 500:
                // レート制限・サーバーエラーはリトライ
                let delay = Double(attempt + 1) * 2.0
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                lastError = error
            default:
                throw error  // その他のエラーはリトライしない
            }
        }
    }

    throw lastError ?? NetworkError.unknown(NSError())
}
```

---

_Network Conventions: 型安全 × エラーハンドリング × セキュリティ_
