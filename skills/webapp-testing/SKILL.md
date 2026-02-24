---
name: webapp-testing
description: "When writing, reviewing, or debugging Playwright E2E tests (.spec.ts, .e2e.ts files) or browser automation scripts in e2e/ directories. Provides Reconnaissance-then-Action pattern, auto-waiting best practices, Page Object Model, network intercept, authentication persistence, and TypeScript-first Playwright patterns. MUST be invoked before creating new E2E tests or modifying existing browser automation code."
---

# Playwright E2E テスト ベストプラクティス

## 原則

Playwright はモダン Web アプリケーション向けの E2E テストフレームワークであり、Chromium / Firefox / WebKit を単一 API で自動化する。Forge では TypeScript + Playwright Test Runner を使用し、Vitest（ユニット/統合テスト）との棲み分けを明確にする。

**テスト戦略の棲み分け**:
- **Vitest**: ユニットテスト、統合テスト（コンポーネント単体、ロジック検証）
- **Playwright**: E2E テスト（ユーザーフロー全体、ブラウザ実行が必要な検証）

---

## Reconnaissance-then-Action パターン

E2E テストやブラウザ自動化では、**まず画面の状態を偵察し、次にアクションを実行する**。推測でセレクターを書かない。

### 手順

1. **偵察フェーズ**: ページをナビゲートし、DOM の状態を確認する
2. **セレクター特定**: 偵察結果からセレクターを決定する
3. **アクション実行**: 特定したセレクターでアクションを実行する

```typescript
// 偵察: スクリーンショットで画面状態を確認
await page.goto('/dashboard');
await page.screenshot({ path: '/tmp/inspect.png', fullPage: true });

// 偵察: DOM から要素を発見
const buttons = await page.getByRole('button').all();
for (const button of buttons) {
  console.log(await button.textContent());
}

// アクション: 偵察結果に基づいて操作
await page.getByRole('button', { name: 'Submit' }).click();
```

### 動的アプリケーションの場合

```typescript
// ページ遷移後、ネットワーク通信が落ち着くまで待つ
await page.goto('/app');
await page.waitForLoadState('networkidle');

// その後に偵察を開始
const content = await page.content();
```

---

## Auto-Waiting（Playwright 1.50+ デフォルト）

Playwright はアクション実行前に自動で要素の準備完了を待つ。明示的な待機は原則不要。

### 正しいパターン

```typescript
// Auto-waiting: click は要素が actionable になるまで自動待機
await page.getByRole('button', { name: 'Save' }).click();

// Web-First Assertions: 条件が満たされるまで自動リトライ
await expect(page.getByText('Saved successfully')).toBeVisible();
await expect(page.locator('.status')).toHaveText('Complete');
```

### 避けるべきパターン

```typescript
// WRONG: waitForTimeout は非推奨（テストが遅く不安定になる）
await page.waitForTimeout(3000);
await page.click('.button');

// WRONG: 手動で isVisible を呼んで即座に判定
expect(await page.getByText('welcome').isVisible()).toBe(true);
```

### 正しい待機が必要なケース

```typescript
// ネットワーク応答を待つ場合
const responsePromise = page.waitForResponse('**/api/data');
await page.getByRole('button', { name: 'Load' }).click();
const response = await responsePromise;

// URL 遷移を待つ場合
await expect(page).toHaveURL('/dashboard');
```

---

## ロケーター戦略（優先順位）

Playwright のロケーターは安定性の高い順に選択する。

| 優先度 | ロケーター | 用途 |
|--------|-----------|------|
| 1 | `getByRole()` | アクセシビリティロール（推奨） |
| 2 | `getByLabel()` | フォーム要素（ラベル紐付き） |
| 3 | `getByTestId()` | `data-testid` 属性（安定） |
| 4 | `getByText()` | テキストコンテンツ |
| 5 | `getByPlaceholder()` | プレースホルダーテキスト |
| 6 | `page.locator()` | CSS / XPath（最終手段） |

```typescript
// 推奨: ロールベース
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('link', { name: 'Dashboard' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

// 推奨: ラベルベース（フォーム要素）
await page.getByLabel('Password').fill('secret');

// 推奨: data-testid（動的コンテンツ）
await page.getByTestId('user-avatar').click();

// 避ける: CSS セレクター（変更に弱い）
await page.locator('.btn-primary').click();  // クラス名は変わりやすい
```

---

## Page Object Model パターン

テストの保守性を高めるため、ページ操作を Page Object に集約する。

```typescript
// pages/LoginPage.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}

// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('successful login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});

test('shows error for invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('invalid@example.com', 'wrong');
  await loginPage.expectError('Invalid credentials');
});
```

### Fixture との統合

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

// テストで fixture を使用
test('login test', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
});
```

---

## ネットワークインターセプト

`page.route()` で API レスポンスをモックし、テストを外部依存から分離する。

```typescript
// API モック: レスポンスを固定値に差し替え
await page.route('**/api/users', async (route) => {
  await route.fulfill({
    json: [
      { id: 1, name: 'Test User', email: 'test@example.com' },
    ],
  });
});

// 実レスポンスを加工
await page.route('**/api/products', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.push({ id: 999, name: 'Mock Product' });
  await route.fulfill({ response, json });
});

// 特定リソースをブロック（画像読み込みを省略して高速化）
await page.route('**/*.{png,jpg,jpeg,gif}', (route) => route.abort());

// API レスポンスを待機してから検証
const responsePromise = page.waitForResponse('**/api/save');
await page.getByRole('button', { name: 'Save' }).click();
const response = await responsePromise;
expect(response.status()).toBe(200);
```

---

## 認証状態の永続化

ログインセッションを保存・再利用し、テストの実行速度を向上させる。

```typescript
// auth.setup.ts（グローバルセットアップ）
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');

  // 認証状態をファイルに保存
  await page.context().storageState({ path: authFile });
});
```

```typescript
// playwright.config.ts での設定
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

**注意**: `e2e/.auth/` は `.gitignore` に追加すること。

---

## テスト設計原則

### 独立性

```typescript
// 各テストは独立して実行可能であること
test.describe('User management', () => {
  test.beforeEach(async ({ page }) => {
    // テストごとにクリーンな状態を作る
    await page.goto('/users');
  });

  test('create user', async ({ page }) => {
    // 他のテストに依存しない
  });

  test('delete user', async ({ page }) => {
    // 必要なデータはテスト内でセットアップ
  });
});
```

### テスト構造

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature: Checkout', () => {
  test('should complete purchase with valid card', async ({ page }) => {
    // Arrange
    await page.goto('/cart');

    // Act
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByLabel('Card number').fill('4242424242424242');
    await page.getByRole('button', { name: 'Pay' }).click();

    // Assert
    await expect(page.getByText('Payment successful')).toBeVisible();
    await expect(page).toHaveURL('/confirmation');
  });
});
```

---

## CI/CD 設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

---

## アンチパターン

| パターン | 問題 | 代替 |
|---------|------|------|
| `waitForTimeout()` | 遅い・不安定 | Web-First Assertions / auto-waiting |
| CSS クラスセレクター | 変更に弱い | `getByRole()` / `getByTestId()` |
| テスト間の依存 | 順序依存・並列不可 | 各テストを独立させる |
| ハードコード URL | 環境依存 | `baseURL` 設定を使用 |
| `page.evaluate()` 多用 | Playwright API を活用できていない | ロケーター + アサーションを使用 |
| `force: true` 多用 | 本番ユーザーの操作と乖離 | 要素が操作可能になるのを待つ |

---

## Applicability

- **フェーズ**: test, implementation
- **ドメイン**: testing
- **ファイルパターン**: `e2e/**/*`, `**/*.spec.ts`, `**/*.e2e.ts`, `playwright.config.ts`

---

## 詳細リファレンス

Playwright API の詳細（全ロケーター一覧、全アサーション一覧、アクション詳細、設定オプション、マルチブラウザ設定、ビジュアルリグレッション）は `API_REFERENCE.md` を参照。
