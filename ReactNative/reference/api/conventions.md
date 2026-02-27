# API Conventions

TanStack Query を使った API レイヤーの実装規約。

---

## レイヤー構成

```
UI 層（screens/, components/）
  ↓ useQuery / useMutation
Custom Hook 層（hooks/）
  ↓ Repository Interface
Data 層（repositories/, services/）
  ↓ API Client
Network 層（api/client.ts）
```

---

## API クライアントの設定

```typescript
// api/client.ts
import axios, { AxiosInstance } from 'axios';
import { SecureStorage } from '@/storage/secureStorage';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: Config.API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // リクエストインターセプター（トークン付与）
  client.interceptors.request.use(async (config) => {
    const token = await SecureStorage.getToken();
    if (token !== null) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // レスポンスインターセプター（エラーハンドリング）
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await SecureStorage.deleteToken();
        // 認証エラーは AuthenticationError にラップ
        throw new AuthenticationError('認証が切れました。再ログインしてください');
      }
      throw error;
    }
  );

  return client;
};

export const apiClient = createApiClient();
```

---

## Repository パターン

```typescript
// repositories/userRepository.ts
import { z } from 'zod';
import { apiClient } from '@/api/client';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof userSchema>;

export interface IUserRepository {
  fetchById(userId: string): Promise<User>;
  fetchAll(): Promise<User[]>;
  update(userId: string, data: Partial<User>): Promise<User>;
}

export const userRepository: IUserRepository = {
  async fetchById(userId: string): Promise<User> {
    const response = await apiClient.get(`/users/${userId}`);
    return userSchema.parse(response.data);
  },

  async fetchAll(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return z.array(userSchema).parse(response.data);
  },

  async update(userId: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.patch(`/users/${userId}`, data);
    return userSchema.parse(response.data);
  },
};
```

---

## TanStack Query の使用規約

```typescript
// hooks/useUserProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository, type User } from '@/repositories/userRepository';

// クエリキーの型安全な定義
const userQueryKeys = {
  all: ['users'] as const,
  byId: (userId: string) => ['users', userId] as const,
};

// データ取得
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: userQueryKeys.byId(userId),
    queryFn: () => userRepository.fetchById(userId),
    staleTime: 5 * 60 * 1000, // 5分間は再フェッチしない
    retry: (failureCount, error) => {
      // 認証エラーはリトライしない
      if (error instanceof AuthenticationError) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// データ更新（楽観的更新）
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
      userRepository.update(userId, data),
    onMutate: async ({ userId, data }) => {
      // 楽観的更新: キャッシュを先に更新
      await queryClient.cancelQueries({ queryKey: userQueryKeys.byId(userId) });
      const previousUser = queryClient.getQueryData<User>(userQueryKeys.byId(userId));

      queryClient.setQueryData<User>(userQueryKeys.byId(userId), (old) =>
        old !== undefined ? { ...old, ...data } : old
      );

      return { previousUser };
    },
    onError: (error, { userId }, context) => {
      // エラー時は楽観的更新を元に戻す
      if (context?.previousUser !== undefined) {
        queryClient.setQueryData(userQueryKeys.byId(userId), context.previousUser);
      }
    },
    onSettled: (data, error, { userId }) => {
      // 完了後にキャッシュを再フェッチ
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.byId(userId) });
    },
  });
};
```

---

## エラーハンドリング

```typescript
// UI でのエラー表示
const UserProfileScreen = (): React.JSX.Element => {
  const { data: user, isLoading, error } = useUserProfile(userId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error !== null) {
    if (error instanceof AuthenticationError) {
      return <Redirect to="Login" />;
    }
    return <ErrorView message={error.message} onRetry={refetch} />;
  }

  if (user === undefined) {
    return <NotFoundView />;
  }

  return <UserProfileView user={user} />;
};
```
