---
name: vitest-testing-patterns
description: "When writing or reviewing test files using Vitest and React Testing Library. Provides Vitest 3.x mock strategies, RTL query priority, userEvent patterns, coverage configuration, and test factory patterns. MUST be invoked before creating or modifying any .test.ts/.test.tsx file."
---

# Vitest + React Testing Library テストパターン

Vitest 3.x と React Testing Library を使用したテストの標準パターン集。
Jest パターンは一切使用せず、Vitest 固有の API のみを使用する。

## 適用条件

以下のファイルを作成・変更する場合に適用:
- `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` ファイル
- テストのセットアップファイル（`vitest.setup.ts` 等）
- `vitest.config.ts` のテスト関連設定

---

## 1. セットアップファイル構成

### vitest.config.ts の基本構成

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        // クリティカルパス: 高い閾値を個別指定可能
        'src/utils/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
})
```

### vitest.setup.ts の必須インポート

```typescript
// jest-dom のカスタムマッチャーを Vitest で使用するための必須インポート
// toBeInTheDocument(), toHaveTextContent() 等を有効にする
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

**重要**: `@testing-library/jest-dom` ではなく `@testing-library/jest-dom/vitest` をインポートすること。
Vitest 用エントリポイントを使用することで `expect` への型拡張が正しく適用される。

---

## 2. RTL クエリ優先度

クエリの選択はアクセシビリティとユーザー視点を反映する。上位ほど優先して使用する。

| 優先度 | クエリ | 用途 |
|--------|--------|------|
| 1 (最優先) | `getByRole` | ボタン、リンク、見出し、フォーム要素等 |
| 2 | `getByLabelText` | フォーム入力要素 |
| 3 | `getByPlaceholderText` | ラベルのない入力要素（非推奨パターン） |
| 4 | `getByText` | 非インタラクティブ要素の表示テキスト |
| 5 | `getByDisplayValue` | 入力済みフォーム要素 |
| 6 | `getByAltText` | 画像等 |
| 7 | `getByTitle` | ツールチップ等（使用は限定的） |
| 8 (最終手段) | `getByTestId` | 他のクエリで取得不可能な場合のみ |

### クエリバリアント

| バリアント | 0件時 | 1件超時 | 非同期 | 用途 |
|------------|--------|---------|--------|------|
| `getBy` | エラー | エラー | No | 要素が必ず存在する場合 |
| `queryBy` | `null` | エラー | No | 要素が存在しないことを確認する場合 |
| `findBy` | エラー | エラー | Yes | 非同期で要素が出現するのを待つ場合 |
| `getAllBy` | エラー | 配列 | No | 複数要素が必ず存在する場合 |
| `queryAllBy` | `[]` | 配列 | No | 複数要素の不在確認 |
| `findAllBy` | エラー | 配列 | Yes | 非同期で複数要素を待つ場合 |

### クエリ使用例

```typescript
// 優先: getByRole（アクセシビリティロール + 名前）
screen.getByRole('button', { name: '送信' })
screen.getByRole('heading', { level: 2 })
screen.getByRole('textbox', { name: 'メールアドレス' })

// フォーム要素: getByLabelText
screen.getByLabelText('ユーザー名')

// テキスト表示: getByText（正規表現も可）
screen.getByText(/エラー/i)

// 不在確認: queryBy（null を返す）
expect(screen.queryByText('エラー')).not.toBeInTheDocument()

// 非同期待機: findBy（Promise を返す）
const heading = await screen.findByRole('heading', { name: 'ようこそ' })

// 最終手段: getByTestId（他のクエリで取得できない場合のみ）
screen.getByTestId('custom-dropdown')
```

---

## 3. userEvent の使用（fireEvent より優先）

`userEvent` はユーザー操作に伴う一連のイベント（focus, keydown, input, change 等）を
正しい順序で発火する。`fireEvent` は単一イベントのみのため使用しない。

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('LoginForm', () => {
  it('ログインフォームを送信できる', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})
```

### 主要 API

```typescript
const user = userEvent.setup()

await user.type(element, 'テキスト')       // テキスト入力
await user.click(element)                  // クリック
await user.dblClick(element)               // ダブルクリック
await user.keyboard('{Enter}')             // キーボード操作
await user.keyboard('{Shift>}A{/Shift}')   // 修飾キー付き
await user.selectOptions(select, ['opt1']) // セレクト
await user.clear(input)                    // クリア
await user.tab()                           // タブ移動
await user.hover(element)                  // ホバー
await user.unhover(element)                // ホバー解除
```

**重要**: `userEvent.setup()` はテストの先頭で1回呼び出す。各 API は非同期（`await` 必須）。

---

## 4. Vitest モック戦略

### 4.1 vi.fn() -- 関数モック

```typescript
const handleClick = vi.fn()
render(<Button onClick={handleClick}>送信</Button>)

await user.click(screen.getByRole('button', { name: '送信' }))
expect(handleClick).toHaveBeenCalledOnce()
```

### 4.2 vi.mock() -- モジュールモック

ファイル先頭に巻き上げ（hoist）される。

```typescript
import { fetchUser } from './api'

vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}))

// vi.mocked() で型安全にモック API にアクセス
vi.mocked(fetchUser).mockResolvedValue({ id: '1', name: 'テストユーザー' })
```

### 4.3 vi.mock() with import() -- 型安全なモジュールモック

`import()` で IDE の型推論とリファクタリングサポートが向上する。

```typescript
vi.mock(import('./api'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    fetchUser: vi.fn(),
  }
})
```

### 4.4 vi.hoisted() -- ESM モジュールモックの巻き上げ

`vi.mock()` は巻き上げされるため通常のスコープ変数にアクセスできない。
`vi.hoisted()` で宣言した変数は `vi.mock()` より先に評価される。

```typescript
import { sendEmail } from './email-service'

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}))

vi.mock('./email-service', () => ({
  sendEmail: mocks.sendEmail,
}))

// テスト内で使用
mocks.sendEmail.mockResolvedValue({ success: true })
await notifyUser('user@example.com', '件名', '本文')
expect(mocks.sendEmail).toHaveBeenCalledWith('user@example.com', '件名', '本文')
```

### 4.5 vi.spyOn() -- 既存実装のスパイ

元の実装を維持しつつ呼び出しを追跡。一時的に実装を差し替えることも可能。

```typescript
import * as mathUtils from './math-utils'

// 追跡のみ（元の実装が実行される）
const spy = vi.spyOn(mathUtils, 'add')
expect(mathUtils.add(1, 2)).toBe(3)
expect(spy).toHaveBeenCalledWith(1, 2)

// 実装差し替え
vi.spyOn(mathUtils, 'add').mockReturnValue(999)
expect(mathUtils.add(1, 2)).toBe(999)

// 必ず復元する
afterEach(() => { vi.restoreAllMocks() })
```

### 4.6 vi.mock() with { spy: true } -- スパイモード

モジュール全体の呼び出しを追跡しつつ元の実装を維持する。

```typescript
import { calculator } from './calculator'

vi.mock('./calculator', { spy: true })

const result = calculator(1, 2)
expect(result).toBe(3)
expect(calculator).toHaveBeenCalledWith(1, 2)
```

### 4.7 デフォルトエクスポートのモック

```typescript
vi.mock('./logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))
```

### 4.8 vi.mocked() -- 型ユーティリティ

モック化した関数に型安全にアクセスする。`mockResolvedValue` 等の型補完が有効になる。

```typescript
import { fetchData } from './api'
vi.mock('./api', () => ({ fetchData: vi.fn() }))

vi.mocked(fetchData).mockResolvedValue({ id: '1', name: 'test' })
expect(vi.mocked(fetchData)).toHaveBeenCalledWith('/endpoint')
```

---

## 5. テストファクトリパターン

テストデータの生成を関数化し、テスト間の重複を排除する。

```typescript
// test/factories/user.ts
import type { User } from '@/types'

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'テストユーザー',
    email: 'test@example.com',
    role: 'member',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function createAdmin(overrides: Partial<User> = {}): User {
  return createUser({ role: 'admin', ...overrides })
}
```

### シーケンス付きファクトリ（一意性が必要な場合）

```typescript
let seq = 0
export function createUser(overrides: Partial<User> = {}): User {
  seq++
  return {
    id: `user-${seq}`,
    name: `テストユーザー${seq}`,
    email: `test${seq}@example.com`,
    role: 'member',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}
```

### 使用例

```typescript
it('ユーザー名を表示する', () => {
  render(<UserCard user={createUser({ name: '山田太郎' })} />)
  expect(screen.getByText('山田太郎')).toBeInTheDocument()
})
```

---

## 6. テスト構造パターン

### Arrange-Act-Assert (AAA)

```typescript
it('検索結果を表示する', async () => {
  // Arrange
  const user = userEvent.setup()
  vi.mocked(searchApi).mockResolvedValue([{ id: '1', title: '結果1' }])
  render(<SearchForm />)

  // Act
  await user.type(screen.getByRole('searchbox'), 'テスト')
  await user.click(screen.getByRole('button', { name: '検索' }))

  // Assert
  expect(await screen.findByText('結果1')).toBeInTheDocument()
})
```

### 非同期テスト

```typescript
it('データ読み込み後にコンテンツを表示する', async () => {
  render(<DataList />)

  // findBy を優先（waitFor + getBy より簡潔）
  expect(await screen.findByRole('list')).toBeInTheDocument()

  // 複数アサーションを待つ場合は waitFor
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
```

---

## 7. タイマーモック

```typescript
describe('Debounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('指定時間後に関数が実行される', () => {
    const callback = vi.fn()
    const debounced = debounce(callback, 300)

    debounced()
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(callback).toHaveBeenCalledOnce()
  })
})
```

---

## 8. 禁止パターン

### Jest API の使用禁止

| 禁止 (Jest) | 代替 (Vitest) |
|---|---|
| `jest.mock()` | `vi.mock()` |
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `jest.resetAllMocks()` | `vi.resetAllMocks()` |
| `jest.restoreAllMocks()` | `vi.restoreAllMocks()` |

### fireEvent の使用禁止

```typescript
// NG
fireEvent.click(button)
fireEvent.change(input, { target: { value: 'text' } })

// OK
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'text')
```

### 実装詳細のテスト禁止

```typescript
// NG: 内部状態をテスト
expect(component.state.count).toBe(1)

// OK: ユーザーに見える振る舞いをテスト
expect(screen.getByText('1')).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: '増加' }))
expect(screen.getByText('2')).toBeInTheDocument()
```

### getByTestId の安易な使用禁止

```typescript
// NG: 他のクエリで取得可能なのに testid を使う
screen.getByTestId('submit-button')

// OK: アクセシビリティクエリを優先
screen.getByRole('button', { name: '送信' })
```
