---
name: vercel-composition-patterns
description: "When building or refactoring React components with boolean prop proliferation, compound components, context providers, or component architecture. Provides Container/Presentational, Compound Components, children composition, Context Provider, explicit variants patterns, and React 19 API compatibility guidance. MUST be invoked before designing component APIs or reviewing component architecture."
---

# React Composition Patterns

柔軟でメンテナンスしやすい React コンポーネントを構築するための Composition パターン集。
boolean prop の増殖を避け、Compound Components・状態リフティング・内部構成の合成を活用する。

## 適用タイミング

- boolean prop が増えているコンポーネントのリファクタリング
- 再利用可能なコンポーネントライブラリの構築
- 柔軟なコンポーネント API の設計
- コンポーネントアーキテクチャのレビュー
- Compound Components や Context Provider の実装

## パターン一覧（優先度順）

| 優先度 | カテゴリ | 影響度 |
| ------ | -------- | ------ |
| 1 | コンポーネントアーキテクチャ | HIGH |
| 2 | 状態管理 | MEDIUM |
| 3 | 実装パターン | MEDIUM |
| 4 | React 19 API | MEDIUM |

---

## 1. コンポーネントアーキテクチャ（HIGH）

### 1.1 Boolean Prop の増殖を避け、Explicit Variants を使う

**影響: CRITICAL**

`isThread`, `isEditing` のような boolean prop を追加してはならない。boolean 1つで状態の組み合わせが2倍になる。代わりに明示的なバリアントコンポーネントを作成し、Composition で内部パーツを共有する。

**NG: boolean prop による指数的複雑性**

```tsx
function Composer({ isThread, isEditing, isForwarding, channelId }: Props) {
  return (
    <form>
      <Input />
      {isThread ? <AlsoSendToChannelField id={channelId} /> : null}
      {isEditing ? <EditActions /> : isForwarding ? <ForwardActions /> : <DefaultActions />}
    </form>
  )
}
```

**OK: 明示的バリアント + Composition**

```tsx
// 利用側: 何をレンダリングするか一目瞭然
<ThreadComposer channelId="abc" />
<EditMessageComposer messageId="xyz" />

// 実装: 各バリアントが必要なパーツだけを合成
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <ThreadProvider channelId={channelId}>
      <Composer.Frame>
        <Composer.Input />
        <AlsoSendToChannelField channelId={channelId} />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Submit />
        </Composer.Footer>
      </Composer.Frame>
    </ThreadProvider>
  )
}

function EditMessageComposer({ messageId }: { messageId: string }) {
  return (
    <EditMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input />
        <Composer.Footer>
          <Composer.CancelEdit />
          <Composer.SaveEdit />
        </Composer.Footer>
      </Composer.Frame>
    </EditMessageProvider>
  )
}
```

各バリアントが使用する Provider、含む UI 要素、利用可能なアクションを明示。不可能な状態が存在しない。

### 1.2 Compound Components を使う

**影響: HIGH -- prop drilling なしで柔軟な合成を実現**

複雑なコンポーネントを共有コンテキストを持つ Compound Components として構成する。各サブコンポーネントは Context 経由で共有状態にアクセスする。

**NG: render props によるモノリシックコンポーネント**

```tsx
function Composer({ renderHeader, renderFooter, showAttachments }: Props) {
  return (
    <form>
      {renderHeader?.()}
      <Input />
      {showAttachments && <Attachments />}
      {renderFooter ? renderFooter() : <DefaultFooter />}
    </form>
  )
}
```

**OK: 共有コンテキストによる Compound Components**

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

function ComposerProvider({ children, state, actions, meta }: ProviderProps) {
  return (
    <ComposerContext value={{ state, actions, meta }}>{children}</ComposerContext>
  )
}

function ComposerInput() {
  const { state, actions: { update }, meta: { inputRef } } = use(ComposerContext)
  return (
    <TextInput ref={inputRef} value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))} />
  )
}

function ComposerSubmit() {
  const { actions: { submit } } = use(ComposerContext)
  return <Button onPress={submit}>Send</Button>
}

// Compound Component としてエクスポート
const Composer = {
  Provider: ComposerProvider,
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
  Header: ComposerHeader,
  Footer: ComposerFooter,
}
```

利用側は必要なパーツを明示的に合成する。state, actions, meta は親 Provider から依存注入される。

---

## 2. 状態管理（MEDIUM）

### 2.1 状態管理と UI を分離する（Container/Presentational）

**影響: MEDIUM -- UI を変更せずに状態実装を差し替え可能にする**

Provider（Container）だけが状態管理の実装を知る。UI（Presentational）はコンテキストインターフェースを消費するだけ。

**NG: UI が状態実装に結合**

```tsx
function ChannelComposer({ channelId }: { channelId: string }) {
  const state = useGlobalChannelState(channelId)  // 特定の実装に依存
  const { submit } = useChannelSync(channelId)
  return (
    <Composer.Frame>
      <Composer.Input value={state.input} onChange={submit} />
    </Composer.Frame>
  )
}
```

**OK: Provider に状態管理を隔離**

```tsx
// Container 層: 状態管理の実装詳細を担当
function ChannelProvider({ channelId, children }: Props) {
  const { state, update, submit } = useGlobalChannel(channelId)
  return (
    <Composer.Provider state={state} actions={{ update, submit }} meta={{ inputRef: useRef(null) }}>
      {children}
    </Composer.Provider>
  )
}

// Presentational 層: インターフェースのみに依存
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer><Composer.Submit /></Composer.Footer>
    </Composer.Frame>
  )
}
```

### 2.2 依存注入のための汎用コンテキストインターフェース

**影響: HIGH -- ユースケース横断の依存注入を実現**

`state`, `actions`, `meta` の3部構成でインターフェースを定義。任意の Provider がこの契約を実装できる。

```tsx
interface ComposerState {
  input: string
  attachments: Attachment[]
  isSubmitting: boolean
}
interface ComposerActions {
  update: (updater: (state: ComposerState) => ComposerState) => void
  submit: () => void
}
interface ComposerMeta {
  inputRef: React.RefObject<TextInput>
}
interface ComposerContextValue {
  state: ComposerState
  actions: ComposerActions
  meta: ComposerMeta
}
const ComposerContext = createContext<ComposerContextValue | null>(null)
```

**異なる Provider が同じインターフェースを実装:**

```tsx
// ローカル状態版
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const submit = useForwardMessage()
  return (
    <ComposerContext value={{ state, actions: { update: setState, submit }, meta: { inputRef: useRef(null) } }}>
      {children}
    </ComposerContext>
  )
}

// グローバル同期状態版
function ChannelProvider({ channelId, children }: Props) {
  const { state, update, submit } = useGlobalChannel(channelId)
  return (
    <ComposerContext value={{ state, actions: { update, submit }, meta: { inputRef: useRef(null) } }}>
      {children}
    </ComposerContext>
  )
}
```

Provider を差し替えるだけで同じ UI が異なる状態実装で動作する。

### 2.3 状態を Provider にリフトする

**影響: HIGH -- コンポーネント境界外からの状態共有を実現**

状態管理を Provider に移動し、メイン UI の外にある兄弟コンポーネントからもアクセス可能にする。

**NG: コンポーネント内に状態が閉じ込められ、外部からアクセス不能**

```tsx
function ForwardMessageDialog() {
  return (
    <Dialog>
      <ForwardMessageComposer /> {/* 状態がこの中に閉じている */}
      <MessagePreview />          {/* composer の状態にアクセスできない */}
      <ForwardButton />           {/* submit を呼べない */}
    </Dialog>
  )
}
```

**OK: Provider に状態をリフト**

```tsx
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()
  return (
    <Composer.Provider state={state} actions={{ update: setState, submit: forwardMessage }}
      meta={{ inputRef: useRef(null) }}>
      {children}
    </Composer.Provider>
  )
}

function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        <ForwardMessageComposer />
        <MessagePreview />
        <DialogActions>
          <ForwardButton />
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  )
}

// Composer.Frame の外だが Provider の中にあるのでアクセス可能
function ForwardButton() {
  const { actions } = use(ComposerContext)
  return <Button onPress={actions.submit}>Forward</Button>
}
```

**重要:** 共有状態を必要とするコンポーネントは視覚的にネストされている必要はない。同じ Provider 内にあればよい。

---

## 3. 実装パターン（MEDIUM）

### 3.1 children Composition パターン

**影響: MEDIUM -- よりクリーンな合成と可読性**

`renderX` props の代わりに `children` で合成する。children はより読みやすく、自然に合成される。

**NG: render props**

```tsx
<Composer
  renderHeader={() => <CustomHeader />}
  renderFooter={() => <><Formatting /><Emojis /></>}
/>
```

**OK: children による合成**

```tsx
<Composer.Frame>
  <CustomHeader />
  <Composer.Input />
  <Composer.Footer>
    <Composer.Formatting />
    <SubmitButton />
  </Composer.Footer>
</Composer.Frame>
```

**render props が適切な場合:** 親から子にデータを渡す必要がある場合のみ。

```tsx
<List data={items} renderItem={({ item, index }) => <Item item={item} index={index} />} />
```

---

## 4. React 19 API 互換性（MEDIUM）

> React 19+ 専用。React 18 以前では適用しない。

### 4.1 ref as prop -- forwardRef の廃止

```tsx
// NG
const Input = forwardRef<TextInput, Props>((props, ref) => <TextInput ref={ref} {...props} />)

// OK
function Input({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

### 4.2 use() -- useContext の置き換え

`use()` は条件分岐内でも呼び出せる。

```tsx
// NG
const value = useContext(MyContext)

// OK
const value = use(MyContext)
```

### 4.3 Context Provider の JSX 記法

```tsx
// NG
<ComposerContext.Provider value={contextValue}>{children}</ComposerContext.Provider>

// OK
<ComposerContext value={contextValue}>{children}</ComposerContext>
```

---

## 判断フローチャート

1. **boolean prop が2つ以上ある?** --> Explicit Variants パターンへリファクタ（1.1）
2. **サブコンポーネント間で状態共有が必要?** --> Compound Components + Context Provider（1.2）
3. **コンポーネント外から状態アクセスが必要?** --> 状態を Provider にリフト（2.3）
4. **renderX props を使っている?** --> children Composition に置き換え（3.1）
5. **状態実装の差し替えが想定される?** --> 汎用コンテキストインターフェースで依存注入（2.2）
6. **React 19?** --> forwardRef 削除、useContext を use() に、Context.Provider を Context に（4.x）

---

## 参考資料

- https://react.dev
- https://react.dev/learn/passing-data-deeply-with-context
- https://react.dev/reference/react/use
