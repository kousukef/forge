# Coding Standards（React Native版）

React Native / TypeScript プロジェクトのコーディング標準。

---

## Code Organization

### ディレクトリ構造

```
src/
├── screens/          # 画面コンポーネント（1画面 = 1ディレクトリ）
│   └── UserProfile/
│       ├── index.tsx             # メイン画面コンポーネント
│       ├── UserProfile.test.tsx  # テスト
│       └── components/           # 画面固有コンポーネント
├── components/       # 共有UIコンポーネント
│   └── Button/
│       ├── index.tsx
│       ├── Button.test.tsx
│       └── styles.ts
├── hooks/            # Custom Hooks（ビジネスロジック）
├── repositories/     # データアクセス層
├── services/         # 外部サービス層
├── store/            # グローバル状態（Zustand/Redux）
├── navigation/       # React Navigation設定
├── api/              # API クライアント・エンドポイント定義
├── types/            # 型定義
├── utils/            # ユーティリティ関数
└── constants/        # 定数・設定値

__tests__/            # または各ファイルと同階層の *.test.tsx
```

### 命名規則

| 種別 | 規則 | 例 |
|------|------|-----|
| コンポーネントファイル | PascalCase | `UserProfileCard.tsx` |
| 画面コンポーネント | PascalCase + Screen | `UserProfileScreen.tsx` |
| Custom Hook | camelCase + use prefix | `useUserProfile.ts` |
| Repository | PascalCase + Repository | `UserRepository.ts` |
| Service | PascalCase + Service | `AuthService.ts` |
| Store（Zustand） | camelCase + Store | `useAuthStore.ts` |
| Store（Redux Slice） | camelCase + Slice | `authSlice.ts` |
| 型定義ファイル | camelCase | `userTypes.ts` |
| ユーティリティ | camelCase | `formatDate.ts` |
| ディレクトリ | PascalCase (コンポーネント) / kebab-case (その他) | `UserProfile/`, `api-client/` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

## TypeScript ルール

### 型の厳密性

```typescript
// tsconfig.json 必須設定
{
  "strict": true,                    // 全 strict オプションを有効化
  "noImplicitAny": true,            // 暗黙的な any を禁止
  "strictNullChecks": true,          // null/undefined の厳密チェック
  "noUncheckedIndexedAccess": true,  // 配列アクセスに undefined を付加
  "exactOptionalPropertyTypes": true // オプショナルプロパティの厳密化
}
```

### any 型の禁止

```typescript
// NG: any 型の使用
function processData(data: any): any {
  return data.value;
}

// OK: unknown + 型ガード
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new TypeError('Invalid data format');
}
```

### as キャストの最小化

```typescript
// NG: 危険な as キャスト
const user = response.data as User;

// OK: Zod によるランタイムバリデーション
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const parseResult = userSchema.safeParse(response.data);
if (!parseResult.success) {
  throw new Error(`Invalid user data: ${parseResult.error.message}`);
}
const user = parseResult.data; // 型安全
```

---

## コンポーネント設計

### コンポーネントの責務分離

```typescript
// NG: ビジネスロジックが混在
const UserListScreen = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data as User[])); // 型安全でない
  }, []);

  return <FlatList data={users} renderItem={...} />;
};

// OK: Custom Hook でビジネスロジックを分離
const UserListScreen = () => {
  const { users, isLoading, error } = useUserList();
  return <UserListView users={users} isLoading={isLoading} error={error} />;
};

// Custom Hook（ビジネスロジック）
const useUserList = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userRepository.fetchAll,
  });
};
```

### StyleSheet の使用

```typescript
// NG: インラインスタイル
<View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>

// OK: StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});
<View style={styles.container}>
```

---

## エラーハンドリング

### エラー階層

```typescript
// ベースエラー
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ドメインエラー
class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 503);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
  }
}
```

### エラーハンドリングパターン

```typescript
// NG: サイレントな失敗
try {
  await someOperation();
} catch {
  // 何もしない
}

// OK: 明示的なエラーハンドリング
try {
  await someOperation();
} catch (error) {
  if (error instanceof NetworkError) {
    // ネットワークエラー固有の処理
    showToast({ message: '通信エラーが発生しました', type: 'error' });
    return;
  }
  // 予期しないエラーはロガーで記録
  logger.error('Unexpected error in someOperation', { error });
  throw error; // 上位に再スロー
}
```

---

## テスト標準

### テスト構造（AAA パターン）

```typescript
describe('useUserProfile', () => {
  describe('プロフィール取得', () => {
    it('有効なユーザーIDでプロフィールを取得できる', async () => {
      // Arrange
      const userId = 'user-123';
      server.use(
        http.get('/api/users/:id', () => HttpResponse.json(mockUser))
      );

      // Act
      const { result } = renderHook(() => useUserProfile(userId), {
        wrapper: createTestWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data).toEqual(mockUser);
    });

    it('存在しないユーザーIDでエラーになる', async () => {
      // Arrange
      const userId = 'non-existent';
      server.use(
        http.get('/api/users/:id', () => new HttpResponse(null, { status: 404 }))
      );

      // Act
      const { result } = renderHook(() => useUserProfile(userId), {
        wrapper: createTestWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Assert
      expect(result.current.error).toBeInstanceOf(NetworkError);
    });
  });
});
```

---

## セキュリティ

### 機密データの保存

```typescript
// NG: AsyncStorage への平文保存
await AsyncStorage.setItem('token', jwtToken);

// OK: SecureStore への暗号化保存（expo-secure-store）
await SecureStore.setItemAsync('token', jwtToken);

// OK: Keychain への保存（react-native-keychain）
await Keychain.setGenericPassword('user', jwtToken);
```

### API キーの管理

```typescript
// NG: ソースコードへのハードコード
const API_KEY = 'sk-1234567890abcdef';

// OK: 環境変数から読み込み（react-native-config）
import Config from 'react-native-config';
const API_KEY = Config.API_KEY;
```

---

_Coding Standards: 型安全 × パフォーマンス × セキュリティ × 保守性_
