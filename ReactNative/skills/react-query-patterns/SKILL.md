---
name: react-query-patterns
description: "TanStack Query・useQuery/useMutation・キャッシュ戦略・楽観的更新・エラーハンドリングの実装ガイド"
---

# React Query Patterns

## クエリキーの設計

```typescript
// queryKeys.ts: クエリキーを一元管理
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
};
```

## useQuery の基本パターン

```typescript
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userRepository.fetchById(userId),
    staleTime: 5 * 60 * 1000,    // 5分間は再フェッチしない
    gcTime: 10 * 60 * 1000,       // 10分間キャッシュを保持
    enabled: userId !== '',        // userId が空の場合は実行しない
    retry: (failureCount, error) => {
      if (error instanceof AuthenticationError) return false;
      return failureCount < 3;
    },
  });
};
```

## 楽観的更新パターン

```typescript
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userRepository.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });
      const previousUser = queryClient.getQueryData<User>(queryKeys.users.detail(id));

      // 楽観的更新
      queryClient.setQueryData<User>(queryKeys.users.detail(id), (old) =>
        old !== undefined ? { ...old, ...data } : old
      );

      return { previousUser };
    },

    onError: (_error, { id }, context) => {
      // ロールバック
      if (context?.previousUser !== undefined) {
        queryClient.setQueryData(queryKeys.users.detail(id), context.previousUser);
      }
    },

    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};
```

## 無限スクロールパターン

```typescript
export const useInfiniteUserList = (filters: UserFilters) => {
  return useInfiniteQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: ({ pageParam }) =>
      userRepository.fetchPage({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
```

## React Query チェックリスト

- [ ] クエリキーが `queryKeys` に一元管理されているか
- [ ] 認証エラーはリトライしないよう設定されているか
- [ ] `staleTime` / `gcTime` が適切に設定されているか
- [ ] Mutation に楽観的更新とロールバックが実装されているか
- [ ] `onSettled` でキャッシュを適切に無効化しているか
