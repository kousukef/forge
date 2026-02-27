# AsyncStorage Conventions

データ永続化のセキュリティと型安全な実装規約。

---

## 重要: 機密情報の取り扱い

```
機密データ → expo-secure-store / react-native-keychain（必須）
非機密データ → AsyncStorage（OK）
```

### 機密データの定義

以下は **AsyncStorage に保存してはならない**:
- JWT トークン・リフレッシュトークン
- パスワード・PINコード
- 個人情報（氏名・住所・電話番号）
- クレジットカード情報
- セッションID（認証に使用するもの）

---

## AsyncStorage の型安全なラッパー

```typescript
// storage/asyncStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

export class TypedAsyncStorage {
  // 型安全な保存
  static async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  }

  // 型安全な読み込み（バリデーション付き）
  static async get<T>(
    key: string,
    schema: z.ZodSchema<T>
  ): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);

    if (!result.success) {
      // スキーマ不一致は古いデータのため削除して null を返す
      await AsyncStorage.removeItem(key);
      return null;
    }

    return result.data;
  }

  static async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
```

---

## キー管理

```typescript
// storage/storageKeys.ts
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
  THEME_SETTING: 'theme_setting',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
```

---

## SecureStore（機密データ）

```typescript
// storage/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export class SecureStorage {
  static async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token, {
      keychainService: 'com.myapp.auth',
    });
  }

  static async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('auth_token', {
      keychainService: 'com.myapp.auth',
    });
  }

  static async deleteToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token', {
      keychainService: 'com.myapp.auth',
    });
  }
}
```
