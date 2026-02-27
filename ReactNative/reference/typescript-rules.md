# TypeScript Rules

React Native プロジェクトにおける TypeScript の実装ガイドライン。

---

## 基本方針

### Strict Mode の必須化

```json
// tsconfig.json（必須設定）
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 型定義のベストプラクティス

### interface vs type

```typescript
// 拡張が必要な場合は interface
interface BaseUser {
  id: string;
  name: string;
}

interface AdminUser extends BaseUser {
  role: 'admin';
  permissions: Permission[];
}

// Union型・Intersection型・Utility型には type を使用
type UserRole = 'admin' | 'member' | 'guest';
type OptionalUser = Partial<BaseUser>;
type UserWithRole = BaseUser & { role: UserRole };
```

### Literal Union Type（enum より推奨）

```typescript
// NG: enum（ランタイムコストあり、Tree-shakingされない）
enum UserRole {
  Admin = 'admin',
  Member = 'member',
  Guest = 'guest',
}

// OK: Literal Union Type
type UserRole = 'admin' | 'member' | 'guest';

// OK: as const オブジェクト（値への参照が必要な場合）
const USER_ROLES = {
  Admin: 'admin',
  Member: 'member',
  Guest: 'guest',
} as const;

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
```

### Discriminated Union（状態管理に必須）

```typescript
// NG: フラグの組み合わせで状態を表現
interface DataState {
  isLoading: boolean;
  data: User[] | null;
  error: Error | null;
}

// OK: Discriminated Union で状態を表現
type DataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: Error };
```

---

## 型安全なパターン

### 型ガード関数

```typescript
// 型ガード関数の定義
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).id === 'string' &&
    typeof (value as Record<string, unknown>).name === 'string'
  );
}

// 使用例
function processValue(value: unknown): string {
  if (isUser(value)) {
    return value.name; // TypeScript が User 型として認識
  }
  throw new TypeError('Expected User object');
}
```

### Zod によるランタイムバリデーション

```typescript
import { z } from 'zod';

// スキーマ定義
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'guest']),
  createdAt: z.string().datetime(),
});

// 型の自動生成
type User = z.infer<typeof userSchema>;

// API レスポンスの安全なパース
async function fetchUser(userId: string): Promise<User> {
  const response = await apiClient.get(`/users/${userId}`);
  const parseResult = userSchema.safeParse(response.data);

  if (!parseResult.success) {
    throw new ValidationError(
      `Invalid user data: ${parseResult.error.message}`
    );
  }

  return parseResult.data;
}
```

### オプショナルチェーンと Nullish Coalescing

```typescript
// NG: 長い null チェック
if (user !== null && user !== undefined &&
    user.address !== null && user.address !== undefined) {
  const city = user.address.city;
}

// OK: オプショナルチェーン
const city = user?.address?.city;

// NG: || によるフォールバック（falsy 値で意図しない動作）
const name = user.name || 'Anonymous'; // name が '' の場合も 'Anonymous' になる

// OK: ?? によるフォールバック（null/undefined のみ）
const name = user.name ?? 'Anonymous';
```

---

## Utility Types の活用

```typescript
// Partial: 全プロパティをオプショナルに
type UserUpdate = Partial<User>;

// Required: 全プロパティを必須に
type RequiredUser = Required<User>;

// Pick: 特定プロパティのみ選択
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit: 特定プロパティを除外
type UserWithoutPassword = Omit<User, 'password'>;

// Record: キーと値の型を指定したオブジェクト
type UserMap = Record<string, User>;

// ReturnType: 関数の戻り値の型を取得
type FetchUserResult = ReturnType<typeof fetchUser>;

// Parameters: 関数の引数の型を取得
type FetchUserArgs = Parameters<typeof fetchUser>;
```

---

## ジェネリクスの活用

```typescript
// 汎用的な Result 型
type Result<TValue, TError = Error> =
  | { success: true; data: TValue }
  | { success: false; error: TError };

// 使用例
async function safeOperation<T>(
  operation: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof Error
      ? error
      : new Error(String(error));
    return { success: false, error: appError };
  }
}
```

---

## React Native 固有の型

### Navigation の型安全化

```typescript
// navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  UserProfile: { userId: string };
  Settings: { section?: string };
};

// 型安全な useNavigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const navigation = useNavigation<NavigationProp>();
navigation.navigate('UserProfile', { userId: 'user-123' }); // 型チェック
```

### StyleSheet の型安全化

```typescript
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type Styles = {
  container: ViewStyle;
  title: TextStyle;
  avatar: ImageStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
```

---

## ESLint ルール（TypeScript 関連）

```json
// .eslintrc.json（TypeScript 関連ルール）
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/consistent-type-imports": "error"
  }
}
```
