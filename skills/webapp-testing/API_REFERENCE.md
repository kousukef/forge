# Playwright API Reference

SKILL.md からの参照用。Playwright Test Runner (TypeScript) の詳細 API リファレンス。

---

## 目次

1. [ロケーター API](#ロケーター-api)
2. [アサーション API](#アサーション-api)
3. [アクション API](#アクション-api)
4. [ページ API](#ページ-api)
5. [ネットワーク API](#ネットワーク-api)
6. [テスト構造 API](#テスト構造-api)
7. [設定リファレンス](#設定リファレンス)
8. [マルチブラウザテスト](#マルチブラウザテスト)
9. [ビジュアルリグレッション](#ビジュアルリグレッション)
10. [デバッグ](#デバッグ)

---

## ロケーター API

### ロールベース（推奨）

```typescript
// ボタン
page.getByRole('button', { name: 'Submit' })
page.getByRole('button', { name: /submit/i })  // 正規表現

// リンク
page.getByRole('link', { name: 'Home' })

// テキストボックス（input[type="text"], textarea）
page.getByRole('textbox', { name: 'Username' })

// チェックボックス / ラジオボタン
page.getByRole('checkbox', { name: 'Terms' })
page.getByRole('radio', { name: 'Option A' })

// コンボボックス（select）
page.getByRole('combobox', { name: 'Country' })

// ナビゲーション
page.getByRole('navigation')
page.getByRole('heading', { level: 1 })

// ダイアログ
page.getByRole('dialog')
page.getByRole('alertdialog')

// リスト
page.getByRole('list')
page.getByRole('listitem')

// タブ
page.getByRole('tab', { name: 'Settings' })
page.getByRole('tabpanel')
```

### ラベルベース

```typescript
// input / textarea / select に紐付いたラベル
page.getByLabel('Email address')
page.getByLabel('Password')
page.getByLabel(/email/i)  // 正規表現
```

### テスト ID ベース

```typescript
// data-testid 属性
page.getByTestId('submit-button')
page.getByTestId('user-avatar')

// カスタム testid 属性名（playwright.config.ts で設定）
// use: { testIdAttribute: 'data-cy' }
```

### テキストベース

```typescript
page.getByText('Welcome back')
page.getByText('Welcome', { exact: false })  // 部分一致（デフォルト）
page.getByText('Welcome back', { exact: true })  // 完全一致
page.getByText(/welcome/i)  // 正規表現
```

### プレースホルダーベース

```typescript
page.getByPlaceholder('Search...')
page.getByPlaceholder('Enter your email')
```

### Alt テキストベース

```typescript
page.getByAltText('Company logo')
page.getByAltText(/logo/i)
```

### タイトルベース

```typescript
page.getByTitle('Close dialog')
```

### CSS / XPath（最終手段）

```typescript
// CSS セレクター
page.locator('.submit-btn')
page.locator('#main-content')
page.locator('[data-status="active"]')
page.locator('article:has-text("Playwright")')

// XPath
page.locator('xpath=//button[@type="submit"]')
```

### ロケーターのフィルタリング・チェーン

```typescript
// フィルタリング
page.getByRole('listitem').filter({ hasText: 'Product A' })
page.getByRole('listitem').filter({ has: page.getByRole('button') })
page.getByRole('listitem').filter({ hasNot: page.getByText('Sold out') })

// チェーン
page.getByTestId('product-card').getByRole('button', { name: 'Add to cart' })

// nth 指定
page.getByRole('listitem').nth(0)
page.getByRole('listitem').first()
page.getByRole('listitem').last()

// count
await expect(page.getByRole('listitem')).toHaveCount(5)
```

---

## アサーション API

### Web-First Assertions（推奨 -- 自動リトライ）

#### ページアサーション

```typescript
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveURL(/.*dashboard.*/)
await expect(page).toHaveTitle('Dashboard - MyApp')
await expect(page).toHaveTitle(/dashboard/i)
```

#### 可視性

```typescript
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).not.toBeVisible()
```

#### テキスト

```typescript
await expect(locator).toHaveText('Expected text')
await expect(locator).toHaveText(/expected/i)
await expect(locator).toContainText('partial text')
await expect(locator).not.toHaveText('Unexpected')
```

#### フォーム要素

```typescript
await expect(locator).toHaveValue('john@example.com')
await expect(locator).toHaveValues(['option1', 'option2'])  // multi-select
await expect(locator).toBeChecked()
await expect(locator).not.toBeChecked()
await expect(locator).toBeEnabled()
await expect(locator).toBeDisabled()
await expect(locator).toBeEditable()
await expect(locator).toBeFocused()
await expect(locator).toBeEmpty()
```

#### 属性・CSS

```typescript
await expect(locator).toHaveAttribute('href', '/about')
await expect(locator).toHaveAttribute('aria-expanded', 'true')
await expect(locator).toHaveClass('active')
await expect(locator).toHaveClass(/active/)
await expect(locator).toHaveCSS('color', 'rgb(0, 0, 0)')
await expect(locator).toHaveCSS('display', 'flex')
await expect(locator).toHaveId('main-content')
```

#### 要素数

```typescript
await expect(page.getByRole('listitem')).toHaveCount(3)
```

#### カスタムタイムアウト

```typescript
await expect(locator).toBeVisible({ timeout: 10_000 })
await expect(locator).toHaveText('Loaded', { timeout: 30_000 })
```

### ソフトアサーション

```typescript
// テストを中断せずにアサーション失敗を記録
await expect.soft(locator).toHaveText('Expected')
await expect.soft(page).toHaveURL('/expected')
// テスト終了時にまとめて失敗報告
```

### レスポンスアサーション

```typescript
const response = await page.request.get('/api/users');
await expect(response).toBeOK()  // status 200-299
expect(response.status()).toBe(200)
expect(await response.json()).toEqual({ users: [] })
```

---

## アクション API

### クリック

```typescript
await locator.click()
await locator.click({ button: 'right' })
await locator.click({ clickCount: 2 })   // ダブルクリック
await locator.dblclick()
await locator.click({ modifiers: ['Shift'] })
await locator.click({ position: { x: 10, y: 20 } })
```

### テキスト入力

```typescript
await locator.fill('Hello World')      // 値を置換
await locator.clear()                   // フィールドをクリア
await locator.pressSequentially('Hello')  // 1文字ずつ入力
await locator.type('Hello')             // 非推奨（pressSequentially を使用）
```

### キーボード

```typescript
await locator.press('Enter')
await locator.press('Tab')
await locator.press('Escape')
await locator.press('Control+a')
await locator.press('Meta+c')           // macOS: Cmd+C
await page.keyboard.press('Control+Shift+K')

// キー名一覧: Enter, Tab, Escape, Backspace, Delete, ArrowUp,
// ArrowDown, ArrowLeft, ArrowRight, Home, End, PageUp, PageDown,
// F1-F12, Control, Shift, Alt, Meta
```

### セレクト

```typescript
// 値で選択
await locator.selectOption('blue')
// ラベルで選択
await locator.selectOption({ label: 'Blue' })
// 複数選択
await locator.selectOption(['red', 'green', 'blue'])
// インデックスで選択
await locator.selectOption({ index: 2 })
```

### チェックボックス / ラジオ

```typescript
await locator.check()
await locator.uncheck()
await locator.setChecked(true)
await locator.setChecked(false)
```

### ホバー / フォーカス

```typescript
await locator.hover()
await locator.focus()
await locator.blur()
```

### ドラッグ & ドロップ

```typescript
await source.dragTo(target)
await page.locator('#item').dragTo(page.locator('#target'))
```

### ファイルアップロード

```typescript
await page.getByLabel('Upload').setInputFiles('path/to/file.pdf')
await page.getByLabel('Upload').setInputFiles([
  'file1.pdf',
  'file2.pdf',
])
await page.getByLabel('Upload').setInputFiles([])  // ファイル選択解除
```

### スクロール

```typescript
await locator.scrollIntoViewIfNeeded()
await page.mouse.wheel(0, 500)
```

### 要素情報の取得

```typescript
const text = await locator.textContent()
const innerText = await locator.innerText()
const value = await locator.inputValue()
const attribute = await locator.getAttribute('href')
const isVisible = await locator.isVisible()
const isEnabled = await locator.isEnabled()
const isChecked = await locator.isChecked()
const count = await locator.count()
const allTexts = await locator.allTextContents()
const allInnerTexts = await locator.allInnerTexts()
const boundingBox = await locator.boundingBox()
```

---

## ページ API

### ナビゲーション

```typescript
await page.goto('/path')
await page.goto('https://example.com')
await page.goBack()
await page.goForward()
await page.reload()
```

### ロード状態の待機

```typescript
await page.waitForLoadState('load')          // load イベント
await page.waitForLoadState('domcontentloaded')  // DOMContentLoaded
await page.waitForLoadState('networkidle')   // ネットワーク通信なし 500ms
```

### セレクター待機

```typescript
await page.waitForSelector('.dynamic-element')
await page.waitForSelector('.modal', { state: 'visible' })
await page.waitForSelector('.spinner', { state: 'hidden' })
await page.waitForSelector('.item', { state: 'attached' })
await page.waitForSelector('.item', { state: 'detached' })
```

### URL 待機

```typescript
await page.waitForURL('/dashboard')
await page.waitForURL('**/success')
await page.waitForURL(/.*confirmation.*/)
```

### スクリーンショット

```typescript
await page.screenshot({ path: 'screenshot.png' })
await page.screenshot({ path: 'full.png', fullPage: true })
await locator.screenshot({ path: 'element.png' })
await page.screenshot({
  path: 'clip.png',
  clip: { x: 0, y: 0, width: 800, height: 600 },
})
```

### ダイアログ処理

```typescript
page.on('dialog', async (dialog) => {
  console.log(dialog.message());
  await dialog.accept();    // OK / Yes
  // await dialog.dismiss()  // Cancel / No
  // await dialog.accept('input value')  // prompt
});
```

### コンソールログキャプチャ

```typescript
const logs: string[] = [];
page.on('console', (msg) => {
  logs.push(`[${msg.type()}] ${msg.text()}`);
});
```

### 新しいページ（タブ/ウィンドウ）

```typescript
const [newPage] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('link', { name: 'Open' }).click(),
]);
await newPage.waitForLoadState();
await expect(newPage).toHaveURL('/new-page');
```

### iFrame

```typescript
const frame = page.frameLocator('#my-iframe');
await frame.getByRole('button', { name: 'Submit' }).click();
await expect(frame.getByText('Success')).toBeVisible();
```

### ページコンテンツ

```typescript
const html = await page.content()
const title = await page.title()
const url = page.url()
```

### JavaScript 実行（最終手段）

```typescript
const result = await page.evaluate(() => {
  return document.title;
});

await page.evaluate((data) => {
  window.localStorage.setItem('key', data);
}, 'value');
```

---

## ネットワーク API

### リクエストのインターセプト

```typescript
// レスポンスを差し替え
await page.route('**/api/users', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: [{ id: 1, name: 'User' }],
  });
});

// リクエストを加工して続行
await page.route('**/api/**', async (route) => {
  const headers = {
    ...route.request().headers(),
    'Authorization': 'Bearer test-token',
  };
  await route.continue({ headers });
});

// リクエストを中断
await page.route('**/*.{png,jpg}', (route) => route.abort());

// 実レスポンスを取得して加工
await page.route('**/api/data', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.modified = true;
  await route.fulfill({ response, json });
});
```

### ルートの解除

```typescript
// 特定のルートを解除
await page.unroute('**/api/users');

// 全ルートを解除
await page.unrouteAll();
// または特定のハンドラーを解除
await page.unrouteAll({ behavior: 'ignoreErrors' });
```

### レスポンスの待機

```typescript
// 特定の API レスポンスを待機
const responsePromise = page.waitForResponse('**/api/users');
await page.getByRole('button', { name: 'Load' }).click();
const response = await responsePromise;
const data = await response.json();

// 条件付き待機
const responsePromise = page.waitForResponse(
  (response) => response.url().includes('/api/users') && response.status() === 200
);
```

### リクエストの待機

```typescript
const requestPromise = page.waitForRequest('**/api/submit');
await page.getByRole('button', { name: 'Submit' }).click();
const request = await requestPromise;
expect(request.method()).toBe('POST');
expect(JSON.parse(request.postData()!)).toEqual({ name: 'Test' });
```

### HAR ファイルの記録と再生

```typescript
// 記録
await page.routeFromHAR('recordings/api.har', {
  url: '**/api/**',
  update: true,
});

// 再生
await page.routeFromHAR('recordings/api.har', {
  url: '**/api/**',
  update: false,
});
```

---

## テスト構造 API

### 基本構造

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature group', () => {
  test.beforeAll(async () => {
    // スイート全体で1回実行
  });

  test.afterAll(async () => {
    // スイート全体の後処理
  });

  test.beforeEach(async ({ page }) => {
    // 各テスト前に実行
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    // 各テスト後に実行
  });

  test('test case', async ({ page }) => {
    // テスト本体
  });
});
```

### テスト修飾子

```typescript
test.skip('skipped test', async ({ page }) => {});

test.only('focused test', async ({ page }) => {});  // CI では forbidOnly で禁止

test.fixme('known broken test', async ({ page }) => {});

test('conditional skip', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox not supported');
});

test.slow('slow test', async ({ page }) => {
  // タイムアウトが3倍に
});
```

### テストアノテーション

```typescript
test('annotated test', {
  annotation: {
    type: 'issue',
    description: 'https://github.com/org/repo/issues/123',
  },
  tag: ['@smoke', '@regression'],
}, async ({ page }) => {});

// タグでフィルタ実行
// npx playwright test --grep @smoke
```

### Fixture の定義

```typescript
import { test as base } from '@playwright/test';

type MyFixtures = {
  adminPage: Page;
  apiClient: APIRequestContext;
};

export const test = base.extend<MyFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  apiClient: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000/api',
    });
    await use(context);
    await context.dispose();
  },
});
```

### パラメタライズドテスト

```typescript
const testCases = [
  { input: 'valid@email.com', expected: true },
  { input: 'invalid-email', expected: false },
  { input: '', expected: false },
];

for (const { input, expected } of testCases) {
  test(`email validation: ${input}`, async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Email').fill(input);
    await page.getByRole('button', { name: 'Submit' }).click();

    if (expected) {
      await expect(page.getByText('Success')).toBeVisible();
    } else {
      await expect(page.getByText('Invalid email')).toBeVisible();
    }
  });
}
```

---

## 設定リファレンス

### playwright.config.ts 全オプション

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',

  // テストファイルのパターン
  testMatch: '**/*.spec.ts',
  testIgnore: '**/helpers/**',

  // 並列実行
  fullyParallel: true,
  workers: process.env.CI ? 1 : '50%',  // CPU コア数の割合指定可

  // リトライ
  retries: process.env.CI ? 2 : 0,

  // .only() の禁止（CI 用）
  forbidOnly: !!process.env.CI,

  // タイムアウト
  timeout: 30_000,        // テスト全体
  expect: {
    timeout: 5_000,       // アサーション
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },

  // レポーター
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'results.json' }],
    ['github'],  // GitHub Actions 用
    ['list'],
  ],

  // グローバル設定
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,

    // HTTP ヘッダー
    extraHTTPHeaders: {
      'X-Custom-Header': 'value',
    },

    // プロキシ設定
    // proxy: { server: 'http://proxy:8080' },
  },

  // ブラウザプロジェクト
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },
  ],

  // 開発サーバー
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // グローバルセットアップ / ティアダウン
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),

  // 出力ディレクトリ
  outputDir: './e2e/test-results',

  // スナップショットディレクトリ
  snapshotDir: './e2e/__snapshots__',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
});
```

---

## マルチブラウザテスト

### プロジェクト設定

```typescript
// playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
]
```

### ブラウザ固有のテストスキップ

```typescript
test('webkit only feature', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit only');
  // ...
});
```

### モバイルデバイスエミュレーション

```typescript
projects: [
  {
    name: 'mobile-chrome',
    use: {
      ...devices['Pixel 5'],
      // カスタムオーバーライド
      locale: 'ja-JP',
    },
  },
  {
    name: 'mobile-safari',
    use: {
      ...devices['iPhone 13'],
    },
  },
]
```

### ジオロケーションエミュレーション

```typescript
use: {
  geolocation: { latitude: 35.6762, longitude: 139.6503 },  // Tokyo
  permissions: ['geolocation'],
}
```

### タイムゾーン・ロケール

```typescript
use: {
  locale: 'ja-JP',
  timezoneId: 'Asia/Tokyo',
}
```

---

## ビジュアルリグレッション

### スクリーンショット比較

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/dashboard');

  // ページ全体のスクリーンショット比較
  await expect(page).toHaveScreenshot('dashboard.png');

  // 要素単位のスクリーンショット比較
  await expect(page.getByTestId('sidebar')).toHaveScreenshot('sidebar.png');

  // オプション指定
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100,           // 許容ピクセル差
    maxDiffPixelRatio: 0.02,      // 許容ピクセル差の割合
    threshold: 0.2,               // ピクセル単位の色差閾値（0-1）
    animations: 'disabled',       // アニメーション停止
    mask: [page.locator('.dynamic-content')],  // マスク対象
    fullPage: true,
  });
});
```

### スナップショット更新

```bash
# スナップショットの更新
npx playwright test --update-snapshots

# 特定テストのスナップショット更新
npx playwright test dashboard.spec.ts --update-snapshots
```

---

## デバッグ

### Playwright Inspector

```bash
# Inspector を起動（ブラウザ + デバッガー UI）
npx playwright test --debug

# 特定テストをデバッグ
npx playwright test login.spec.ts --debug
```

### Trace Viewer

```bash
# トレースの閲覧
npx playwright show-trace e2e/test-results/trace.zip
```

```typescript
// テスト内でのトレース設定
use: {
  trace: 'on',              // 常時記録
  trace: 'on-first-retry',  // 最初のリトライ時のみ
  trace: 'retain-on-failure', // 失敗時のみ保持
}
```

### テスト内デバッグ

```typescript
test('debug example', async ({ page }) => {
  await page.goto('/');

  // ブレークポイント（Inspector が開く）
  await page.pause();

  // コンソール出力
  console.log(await page.title());
  console.log(await page.locator('.item').count());
});
```

### レポート表示

```bash
# HTML レポートを開く
npx playwright show-report

# 特定のレポートディレクトリ
npx playwright show-report ./playwright-report
```

---

## CLI コマンドリファレンス

```bash
# テスト実行
npx playwright test

# 特定ファイル
npx playwright test login.spec.ts

# 特定テスト名
npx playwright test -g "should login"

# 特定プロジェクト（ブラウザ）
npx playwright test --project=chromium

# タグフィルタ
npx playwright test --grep @smoke
npx playwright test --grep-invert @slow

# 並列数指定
npx playwright test --workers=4

# ヘッドモード（ブラウザ表示）
npx playwright test --headed

# UI モード（インタラクティブ）
npx playwright test --ui

# コードジェネレーター
npx playwright codegen http://localhost:3000

# ブラウザのインストール
npx playwright install chromium
npx playwright install --with-deps  # システム依存関係も
```

---

## よくあるパターン集

### ファイルダウンロードの処理

```typescript
const downloadPromise = page.waitForEvent('download');
await page.getByRole('link', { name: 'Download' }).click();
const download = await downloadPromise;

const path = await download.path();
const suggestedFilename = download.suggestedFilename();
await download.saveAs(`/tmp/downloads/${suggestedFilename}`);
```

### 無限スクロール

```typescript
async function scrollToBottom(page: Page) {
  let previousHeight = 0;
  while (true) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === previousHeight) break;
    previousHeight = currentHeight;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');
  }
}
```

### Cookie の操作

```typescript
// Cookie の設定
await page.context().addCookies([
  {
    name: 'session',
    value: 'abc123',
    domain: 'localhost',
    path: '/',
  },
]);

// Cookie の取得
const cookies = await page.context().cookies();

// Cookie のクリア
await page.context().clearCookies();
```

### localStorage / sessionStorage

```typescript
// 値の設定
await page.evaluate(() => {
  localStorage.setItem('theme', 'dark');
  sessionStorage.setItem('token', 'abc123');
});

// 値の取得
const theme = await page.evaluate(() => localStorage.getItem('theme'));
```

### ポップアップ / 新しいウィンドウ

```typescript
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('button', { name: 'Open Window' }).click(),
]);

await popup.waitForLoadState();
await expect(popup).toHaveURL('/popup-page');
await popup.close();
```

### マルチタブ操作

```typescript
const context = await browser.newContext();
const page1 = await context.newPage();
const page2 = await context.newPage();

await page1.goto('/page1');
await page2.goto('/page2');

// page1 で操作
await page1.getByRole('button', { name: 'Send' }).click();

// page2 で結果を確認
await expect(page2.getByText('Received')).toBeVisible();
```

### アクセシビリティチェック

```typescript
// axe-playwright との統合
import AxeBuilder from '@axe-core/playwright';

test('accessibility', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// 特定ルールのみチェック
test('color contrast', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```
