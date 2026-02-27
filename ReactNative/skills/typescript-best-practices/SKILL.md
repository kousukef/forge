---
name: typescript-best-practices
description: "TypeScript 慣用句・Null Safety・型推論・ジェネリクス・Utility Types・strict mode の実装ガイド"
---

# TypeScript Best Practices

## 核心原則

1. **any 型ゼロ**: `any` は型システムの無効化。`unknown` + 型ガードで代替する
2. **as キャスト最小化**: 型推論を信頼し、ランタイムバリデーション（Zod）で型を確定する
3. **Null Safety 徹底**: `?.` と `??` を使い、null/undefined を明示的に扱う
4. **Discriminated Union**: 状態を表すフラグの組み合わせより型で状態を表現する

## any 型の代替パターン

```typescript
// NG: any による型の放棄
const processResponse = (data: any) => data.result;

// OK1: unknown + 型ガード
const processResponse = (data: unknown): string => {
  if (
    typeof data === 'object' &&
    data !== null &&
    'result' in data &&
    typeof (data as { result: unknown }).result === 'string'
  ) {
    return (data as { result: string }).result;
  }
  throw new TypeError('Invalid response format');
};

// OK2: Zod スキーマ（推奨）
const responseSchema = z.object({ result: z.string() });
const processResponse = (data: unknown): string => {
  return responseSchema.parse(data).result;
};
```

## Discriminated Union で状態管理

```typescript
// NG: フラグの組み合わせ（不完全な状態が存在できる）
interface AsyncState<T> {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
}

// OK: Discriminated Union（完全な状態管理）
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// 使用例（exhaustive check）
const renderContent = (state: AsyncState<User>): JSX.Element => {
  switch (state.status) {
    case 'idle': return <IdleView />;
    case 'loading': return <LoadingSpinner />;
    case 'success': return <UserView user={state.data} />;
    case 'error': return <ErrorView error={state.error} />;
    // TypeScript が全ケースのカバーを保証
  }
};
```

## ジェネリクスの実践

```typescript
// 汎用的な Result 型
type Result<TSuccess, TError = Error> =
  | { ok: true; value: TSuccess }
  | { ok: false; error: TError };

// 非同期操作のラッパー
async function tryCatch<T>(
  operation: () => Promise<T>
): Promise<Result<T>> {
  try {
    const value = await operation();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
```

## Utility Types の活用

```typescript
// API 更新リクエスト（一部フィールドのみ送信）
type UserUpdateRequest = Partial<Pick<User, 'name' | 'email' | 'avatar'>>;

// 読み取り専用のドメインオブジェクト
type ReadonlyUser = Readonly<User>;

// イベントハンドラの型
type EventHandler<T = void> = (event: T) => void;

// 非同期関数の戻り値の型
type UserResponse = Awaited<ReturnType<typeof userRepository.fetchById>>;
```

## 型の一貫性チェックリスト

実装前に確認:
- [ ] `any` 型を使用していないか
- [ ] `as` キャストを最小限にしているか（Zod でバリデーション）
- [ ] Optional chaining (`?.`) と Nullish coalescing (`??`) を適切に使用しているか
- [ ] Discriminated Union で状態を表現しているか
- [ ] ジェネリクスで型の再利用を図っているか
- [ ] `tsconfig.json` の `strict: true` に違反していないか
