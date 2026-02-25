---
name: vercel-react-best-practices
description: "When writing, reviewing, or refactoring React/Next.js components. Provides 57 performance rules across 8 categories from Vercel Engineering plus React 19 API best practices. MUST be invoked when implementing React components, optimizing performance, or designing hooks/state management."
---

# React ベストプラクティス（Vercel Engineering + React 19）

Vercel Engineering による React/Next.js パフォーマンス最適化ガイド。
57 ルール / 8 カテゴリ + React 19 新 API のベストプラクティス。

---

## 適用タイミング

- React コンポーネントの新規作成・リファクタリング
- データフェッチング（クライアント/サーバー）の実装
- パフォーマンスレビュー・最適化
- バンドルサイズ削減
- Hooks 設計・状態管理

---

## カテゴリ別ルール一覧（優先度順）

### 1. ウォーターフォール排除（CRITICAL）

| ルール | 要約 |
|---|---|
| `async-defer-await` | await を実際に使うブランチまで遅延する |
| `async-parallel` | 独立した操作は `Promise.all()` で並列化 |
| `async-dependencies` | 部分依存には `better-all` で最大並列化 |
| `async-api-routes` | API Route で Promise を早期開始、await は後で |
| `async-suspense-boundaries` | Suspense で段階的にコンテンツをストリーム |

**核心**: 各 sequential await はフルネットワークレイテンシを追加する。独立した処理は常に並列化せよ。

```typescript
// NG: 逐次実行（3往復）
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()

// OK: 並列実行（1往復）
const [user, posts, comments] = await Promise.all([
  fetchUser(), fetchPosts(), fetchComments()
])
```

### 2. バンドルサイズ最適化（CRITICAL）

| ルール | 要約 |
|---|---|
| `bundle-barrel-imports` | バレルファイルを避け、直接インポート |
| `bundle-dynamic-imports` | 重いコンポーネントは `next/dynamic` |
| `bundle-defer-third-party` | 分析・ログは hydration 後にロード |
| `bundle-conditional` | フィーチャー有効時のみモジュールロード |
| `bundle-preload` | hover/focus でプリロードし体感速度向上 |

**核心**: バレルファイルは 200-800ms のインポートコストを発生させる。直接パスでインポートせよ。

```tsx
// NG: ライブラリ全体をロード
import { Check, X, Menu } from 'lucide-react'

// OK: 個別ファイルから直接インポート
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
```

### 3. サーバーサイドパフォーマンス（HIGH）

| ルール | 要約 |
|---|---|
| `server-auth-actions` | Server Actions は API Route 同様に認証 |
| `server-cache-react` | `React.cache()` でリクエスト内重複排除 |
| `server-cache-lru` | LRU キャッシュでリクエスト間キャッシュ |
| `server-dedup-props` | RSC props の重複シリアライズ回避 |
| `server-serialization` | Client Component への最小限データ送信 |
| `server-parallel-fetching` | コンポーネント構成で並列フェッチ |
| `server-after-nonblocking` | `after()` でノンブロッキング処理 |

**核心**: RSC 境界でのシリアライズコストを最小化。クライアントに送るデータは必要最小限に絞る。

### 4. クライアントサイドデータフェッチング（MEDIUM-HIGH）

| ルール | 要約 |
|---|---|
| `client-swr-dedup` | SWR で自動リクエスト重複排除 |
| `client-event-listeners` | グローバルイベントリスナーの重複排除 |
| `client-passive-event-listeners` | スクロールには passive リスナー |
| `client-localstorage-schema` | localStorage はバージョン管理・最小化 |

### 5. 再レンダリング最適化（MEDIUM）

| ルール | 要約 |
|---|---|
| `rerender-defer-reads` | コールバックでのみ使う状態を購読しない |
| `rerender-memo` | 高コスト処理はメモ化コンポーネントに抽出 |
| `rerender-memo-with-default-value` | メモ化コンポーネントのデフォルト非プリミティブ値は外に出す |
| `rerender-dependencies` | Effect 依存配列にはプリミティブを使用 |
| `rerender-derived-state` | 派生ブール値を購読、生の値ではない |
| `rerender-derived-state-no-effect` | 派生状態は render 中に計算、Effect 不要 |
| `rerender-functional-setstate` | 関数形式の setState で安定コールバック |
| `rerender-lazy-state-init` | 高コスト初期値は useState に関数を渡す |
| `rerender-simple-expression-in-memo` | 単純プリミティブ式に useMemo は不要 |
| `rerender-move-effect-to-event` | インタラクションロジックはイベントハンドラに |
| `rerender-transitions` | 非緊急更新は `startTransition` |
| `rerender-use-ref-transient-values` | 高頻度一時値は ref で保持 |

**核心**: 不要な再レンダリングの防止。状態の購読範囲を最小化し、派生状態は render 中に計算する。

```tsx
// NG: Effect で派生状態を計算
const [items, setItems] = useState([])
const [count, setCount] = useState(0)
useEffect(() => { setCount(items.length) }, [items])

// OK: render 中に直接計算
const [items, setItems] = useState([])
const count = items.length
```

### 6. レンダリングパフォーマンス（MEDIUM）

| ルール | 要約 |
|---|---|
| `rendering-animate-svg-wrapper` | SVG 要素ではなく div ラッパーをアニメーション |
| `rendering-content-visibility` | 長いリストに `content-visibility` |
| `rendering-hoist-jsx` | 静的 JSX はコンポーネント外に抽出 |
| `rendering-svg-precision` | SVG 座標精度を削減 |
| `rendering-hydration-no-flicker` | クライアント専用データにインラインスクリプト |
| `rendering-hydration-suppress-warning` | 想定されるミスマッチは suppress |
| `rendering-activity` | 表示/非表示に Activity コンポーネント |
| `rendering-conditional-render` | `&&` ではなく三項演算子で条件付きレンダー |
| `rendering-usetransition-loading` | ローディング状態は `useTransition` 推奨 |

**核心**: `{count && <Component />}` は count=0 で `0` を表示する。常に三項演算子を使え。

```tsx
// NG: count=0 で "0" が表示される
{count && <Items items={items} />}

// OK: 明示的な条件付きレンダリング
{count > 0 ? <Items items={items} /> : null}
```

### 7. JavaScript パフォーマンス（LOW-MEDIUM）

| ルール | 要約 |
|---|---|
| `js-batch-dom-css` | CSS 変更はクラスまたは cssText でまとめる |
| `js-index-maps` | 繰り返し検索には Map でインデックス構築 |
| `js-cache-property-access` | ループ内でオブジェクトプロパティをキャッシュ |
| `js-cache-function-results` | 関数結果をモジュールレベル Map にキャッシュ |
| `js-cache-storage` | localStorage/sessionStorage の読み取りキャッシュ |
| `js-combine-iterations` | 複数の filter/map を1ループに統合 |
| `js-length-check-first` | 高コスト比較の前に配列長チェック |
| `js-early-exit` | 関数から早期リターン |
| `js-hoist-regexp` | RegExp 生成をループ外に巻き上げ |
| `js-min-max-loop` | min/max はソートでなくループで |
| `js-set-map-lookups` | O(1) ルックアップに Set/Map 使用 |
| `js-tosorted-immutable` | 不変性には `toSorted()` |

### 8. 高度なパターン（LOW）

| ルール | 要約 |
|---|---|
| `advanced-event-handler-refs` | イベントハンドラを ref に格納 |
| `advanced-init-once` | アプリ初期化は1回のみ |
| `advanced-use-latest` | `useLatest` で安定コールバック参照 |

---

## React 19 新 API ベストプラクティス

### ref を直接 props として受け取る（forwardRef 不要）

React 19 では function component が `ref` を直接 props で受け取れる。`forwardRef` は不要。

```tsx
// React 18: forwardRef が必要
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />
})

// React 19: ref を直接 props で受け取る
function MyInput({ placeholder, ref }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input placeholder={placeholder} ref={ref} />
}
```

**ルール**: 新規コンポーネントでは `forwardRef` を使わない。既存コードは段階的に移行。

### use() API

`use()` は Promise または Context の値をレンダー中に読み取る新 API。Hooks と異なり、条件分岐やループ内で呼び出し可能。

```tsx
import { use, Suspense } from 'react'

function MessageComponent({ messagePromise }: { messagePromise: Promise<string> }) {
  const message = use(messagePromise)    // Promise を読み取り
  const theme = use(ThemeContext)         // Context を読み取り
  return <p className={theme}>{message}</p>
}

// Suspense + ErrorBoundary と組み合わせて使用
function App({ messagePromise }: { messagePromise: Promise<string> }) {
  return (
    <ErrorBoundary fallback={<p>Error occurred</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <MessageComponent messagePromise={messagePromise} />
      </Suspense>
    </ErrorBoundary>
  )
}
```

**ルール**:
- Promise の `use()` は必ず Suspense 内で使用
- エラーハンドリングは ErrorBoundary で
- 複数コンポーネントで同一 Promise を共有してフェッチ重複排除

### useActionState

フォームアクションの状態管理用フック。送信状態・結果・保留状態を一括管理。

```tsx
import { useActionState } from 'react'

function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: State, formData: FormData) => {
      const result = await login(formData)
      if (!result.success) return { error: result.message }
      return { error: null }
    },
    { error: null }
  )

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {state.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  )
}
```

**ルール**: `<form action={...}>` と組み合わせて宣言的なフォーム管理。手動の `onSubmit` + `e.preventDefault()` は避ける。

### useOptimistic

非同期操作中に楽観的 UI 更新を即座に反映。操作失敗時は自動的にロールバック。

```tsx
import { useOptimistic } from 'react'

function TodoList({ todos, addTodoAction }: Props) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  )

  async function handleSubmit(formData: FormData) {
    const newTodo = { id: crypto.randomUUID(), text: formData.get('text') as string }
    addOptimisticTodo(newTodo)
    await addTodoAction(newTodo)
  }

  return (
    <form action={handleSubmit}>
      <input name="text" required />
      <button type="submit">Add</button>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </form>
  )
}
```

**ルール**: `useActionState` + `useOptimistic` を組み合わせて、即座のフィードバックとサーバー状態同期を両立。

### ref クリーンアップ関数

React 19 では ref コールバックからクリーンアップ関数を返せる。DOM 要素削除時に自動実行。

```tsx
<input
  ref={(node) => {
    // ref 生成時
    if (node) {
      const observer = new IntersectionObserver(handleIntersect)
      observer.observe(node)

      // クリーンアップ: DOM 要素削除時に実行
      return () => {
        observer.disconnect()
      }
    }
  }}
/>
```

**ルール**: リソースの確保と解放が必要な ref には必ずクリーンアップ関数を返す。

---

## コンポーネント設計原則

### 単一責任

- 1コンポーネント = 1つの責務
- 表示ロジック（UI）とビジネスロジック（データ取得・加工）を分離
- カスタムフックでロジックを抽出し、コンポーネントは描画に専念

### 型安全性

- Props は必ず TypeScript の型/インターフェースで定義
- `any` 禁止。`unknown` + 型ガードを使用
- イベントハンドラの型は `React.MouseEvent<HTMLButtonElement>` のように具体的に
- ジェネリックコンポーネントで再利用性と型安全性を両立

### Hooks ベストプラクティス

- Hooks のルール厳守: トップレベルでのみ呼び出し、条件分岐・ループ内不可（`use()` は例外）
- カスタムフックは `use` プレフィックス必須
- useEffect の依存配列を正確に記述。ESLint の `exhaustive-deps` ルールに従う
- useEffect 内でのデータフェッチは SWR/React Query を優先
- クリーンアップ関数でリソースリーク防止

### アクセシビリティ

- セマンティック HTML 要素を優先（`<button>`, `<nav>`, `<main>` 等）
- インタラクティブ要素に適切な `aria-*` 属性
- フォームは `<label>` と入力要素を関連付け
- キーボードナビゲーション対応（`tabIndex`, `onKeyDown`）
- `role="alert"` でエラーメッセージをスクリーンリーダーに通知

### エラーハンドリング

- Error Boundary で UI クラッシュを防止
- 非同期エラーは try/catch + ユーザーへのフィードバック
- フォームバリデーションエラーは入力フィールド近くに表示
- `use()` の Promise reject は ErrorBoundary で捕捉

### テスタビリティ

- Props 駆動のコンポーネント設計（外部依存を注入可能に）
- `data-testid` でテスト用セレクタを提供
- 副作用をカスタムフックに分離してモック可能に
- Server Component のテストではデータ取得関数をモック
