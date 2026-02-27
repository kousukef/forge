---
name: rn-clean-architecture
description: "React Native Clean Architecture・UI/Domain/Data 層分離・Custom Hooks・Repository/Service パターンの実装ガイド"
---

# RN Clean Architecture

## レイヤー構造

```
UI 層（screens/, components/）
  ↓ Custom Hooks のみ呼び出す
Domain 層（hooks/, usecases/）
  ↓ Repository Interface を呼び出す
Data 層（repositories/, services/）
  ↓ API Client を呼び出す
```

## 依存方向の絶対ルール

- UI 層 → Domain 層（OK）
- Domain 層 → Data 層（OK）
- Data 層 → UI 層（NG）
- UI 層 → Data 層（NG: 必ず Domain 層経由）

## Custom Hooks パターン

```typescript
// hooks/useUserProfile.ts
// Domain 層: ビジネスロジックを Custom Hook に集約
export const useUserProfile = (userId: string) => {
  const query = useQuery({
    queryKey: userQueryKeys.byId(userId),
    queryFn: () => userRepository.fetchById(userId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<User>) => userRepository.update(userId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.byId(userId) });
    },
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
```

## Repository パターン

```typescript
// repositories/userRepository.ts
// インターフェースで依存を逆転させる
export interface IUserRepository {
  fetchById(userId: string): Promise<User>;
  fetchAll(): Promise<User[]>;
  create(data: CreateUserInput): Promise<User>;
  update(userId: string, data: Partial<User>): Promise<User>;
  delete(userId: string): Promise<void>;
}

// 具象実装
export const userRepository: IUserRepository = {
  async fetchById(userId: string): Promise<User> {
    const response = await apiClient.get(`/users/${userId}`);
    return userSchema.parse(response.data); // Zod でバリデーション
  },
  // ...
};

// テスト用モック
export const createMockUserRepository = (): IUserRepository => ({
  fetchById: jest.fn(),
  fetchAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
```

## 画面コンポーネントの責務

```typescript
// screens/UserProfile/index.tsx
// UI 層: 表示と操作のみ。ビジネスロジックは Custom Hook に委譲
const UserProfileScreen = (): React.JSX.Element => {
  const { userId } = useRoute<UserProfileRoute>().params;
  const { user, isLoading, error, updateProfile } = useUserProfile(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error !== null) return <ErrorView error={error} />;
  if (user === undefined) return <NotFoundView />;

  return <UserProfileView user={user} onUpdate={updateProfile} />;
};
```

## アーキテクチャ設計チェックリスト

- [ ] 画面コンポーネントが直接 API を呼び出していないか
- [ ] Custom Hook が UI コンポーネントに依存していないか
- [ ] Repository がインターフェース（抽象）として定義されているか
- [ ] 循環依存が発生していないか
- [ ] 各層のファイルが適切なディレクトリに配置されているか
