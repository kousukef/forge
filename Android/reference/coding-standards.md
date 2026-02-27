# Coding Standards

言語非依存のコーディング標準。すべてのプロジェクトで適用。

---

## Code Organization

### File Structure

```
src/
├── components/     # UI コンポーネント
├── services/       # ビジネスロジック
├── utils/          # ユーティリティ関数
├── types/          # 型定義
├── hooks/          # カスタムフック
├── api/            # API クライアント
└── config/         # 設定

tests/
├── unit/           # ユニットテスト
├── integration/    # 統合テスト
└── e2e/            # E2E テスト
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| ファイル (Component) | PascalCase | `UserProfile.tsx` |
| ファイル (Utils) | camelCase | `formatDate.ts` |
| ディレクトリ | kebab-case | `user-management/` |
| 定数 | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| 関数 | camelCase | `getUserById()` |
| クラス | PascalCase | `UserService` |
| インターフェース | PascalCase + I prefix (optional) | `IUserData` or `UserData` |

---

## Code Quality

### SOLID Principles

- **Single Responsibility**: 各コンポーネントは1つの責務のみ
- **Open/Closed**: 拡張に開き、修正に閉じる
- **Liskov Substitution**: 派生クラスは基底クラスと置換可能
- **Interface Segregation**: 使用しないインターフェースに依存しない
- **Dependency Inversion**: 抽象に依存、具象に依存しない

### DRY, KISS, YAGNI

- **DRY**: 重複を避ける（3回以上なら抽象化）
- **KISS**: シンプルに保つ（複雑さは敵）
- **YAGNI**: 必要になるまで実装しない

---

## Error Handling

### Error Hierarchy

```typescript
// Base error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// Domain errors
class ValidationError extends AppError {}
class AuthenticationError extends AppError {}
class NotFoundError extends AppError {}
```

### Error Handling Pattern

```typescript
// ❌ Bad: Silent failure
try {
  await doSomething();
} catch (e) {
  // Nothing
}

// ✅ Good: Explicit handling
try {
  await doSomething();
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { error });
    throw error;
  }
  logger.error('Unexpected error', { error });
  throw new AppError('Operation failed', 'OPERATION_FAILED');
}
```

---

## Input Validation

### Validation Location

```
User Input → API Gateway → Service Layer → Database
    ↓            ↓             ↓
  Basic      Schema        Business
  Sanitize   Validation    Validation
```

### Validation Pattern

```typescript
// Schema validation (API layer)
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
});

// Business validation (Service layer)
function validateUserCreation(data: UserInput): ValidationResult {
  const errors: string[] = [];

  if (await userExists(data.email)) {
    errors.push('Email already registered');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Logging Standards

### Log Levels

| Level | Use When | Example |
|-------|----------|---------|
| ERROR | システム障害、ユーザー影響あり | DB接続失敗、認証エラー |
| WARN | 潜在的問題、ユーザー影響なし | レート制限接近、非推奨API使用 |
| INFO | 重要なビジネスイベント | ユーザー登録、注文完了 |
| DEBUG | 開発時のデバッグ情報 | 関数呼び出し、変数値 |

### Log Format

```typescript
// ✅ Good: Structured logging
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});

// ❌ Bad: Unstructured logging
console.log('User created: ' + user.email);
```

### Sensitive Data

```typescript
// ❌ Never log
logger.info('Login attempt', { password: req.body.password });

// ✅ Mask sensitive data
logger.info('Login attempt', {
  email: req.body.email,
  password: '***MASKED***',
});
```

---

## Testing Standards

### Test Structure

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid input', async () => {
      // Arrange
      const input = { email: 'test@example.com', name: 'Test' };

      // Act
      const result = await userService.createUser(input);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.email).toBe(input.email);
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const input = { email: 'invalid', name: 'Test' };

      // Act & Assert
      await expect(userService.createUser(input))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Test Naming

```typescript
// Format: should_expectedBehavior_when_condition
it('should return empty array when no users exist', () => {});
it('should throw NotFoundError when user does not exist', () => {});
it('should update user email when valid email provided', () => {});
```

### Coverage Requirements

| Type | Minimum | Target |
|------|---------|--------|
| Unit Tests | 70% | 85% |
| Integration Tests | 50% | 70% |
| Critical Paths | 90% | 100% |

---

## Documentation

### Code Comments

```typescript
// ✅ Good: Explain WHY
// We use a 5-second timeout because the external API
// has known latency issues during peak hours
const TIMEOUT = 5000;

// ❌ Bad: Explain WHAT (obvious from code)
// Set timeout to 5000
const timeout = 5000;
```

### JSDoc

```typescript
/**
 * Creates a new user account.
 *
 * @param input - User registration data
 * @returns Created user object
 * @throws {ValidationError} If email is already registered
 * @throws {AuthenticationError} If not authorized to create users
 *
 * @example
 * const user = await createUser({ email: 'test@example.com', name: 'Test' });
 */
async function createUser(input: UserInput): Promise<User> {
  // ...
}
```

---

## Performance

### Optimization Rules

1. **計測してから最適化** - 推測で最適化しない
2. **ホットパスを優先** - 頻繁に実行されるコードを最適化
3. **可読性とのバランス** - 過度な最適化は避ける

### Common Optimizations

```typescript
// ❌ Bad: N+1 query
const users = await getUsers();
for (const user of users) {
  user.orders = await getOrdersByUserId(user.id);
}

// ✅ Good: Batch query
const users = await getUsers();
const userIds = users.map(u => u.id);
const orders = await getOrdersByUserIds(userIds);
```

---

## Security

### OWASP Top 10 Awareness

| Risk | Prevention |
|------|------------|
| Injection | パラメータ化クエリ、入力サニタイズ |
| Broken Auth | セッション管理、MFA |
| Sensitive Data | 暗号化、最小権限 |
| XXE | XML パーサー設定 |
| Broken Access | RBAC、最小権限原則 |
| Misconfiguration | セキュアデフォルト |
| XSS | 出力エスケープ、CSP |
| Deserialization | 信頼できるソースのみ |
| Vulnerable Components | 依存関係の更新 |
| Insufficient Logging | 監査ログ、アラート |

### Secret Management

```typescript
// ❌ Never commit secrets
const API_KEY = 'sk-1234567890abcdef';

// ✅ Use environment variables
const API_KEY = process.env.API_KEY;

// ✅ Use secret manager
const API_KEY = await secretManager.getSecret('api-key');
```

---

## Dependency Management

### Version Strategy

| Type | Strategy | Example |
|------|----------|---------|
| Major | 手動更新、テスト必須 | `2.x.x → 3.0.0` |
| Minor | 定期更新、テスト推奨 | `2.1.x → 2.2.0` |
| Patch | 自動更新可 | `2.1.1 → 2.1.2` |
| Security | 即時更新 | Critical CVE |

### Dependency Audit

```bash
# 週次で実行
npm audit
npm outdated

# セキュリティ修正
npm audit fix
```

---

_Coding Standards: 品質 × セキュリティ × 保守性_
