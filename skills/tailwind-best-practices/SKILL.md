---
name: tailwind-best-practices
description: "When implementing, reviewing, or refactoring styles in .tsx/.jsx/.css files using Tailwind CSS, shadcn/ui components, or Radix UI primitives. Provides utility-first conventions, cn() pattern, responsive design, dark mode, Tailwind v4 CSS-first configuration (@theme directive), and headless UI integration patterns. MUST be invoked before creating new styled components, modifying theme configuration, or integrating headless UI primitives."
---

# Tailwind CSS + Headless UI ベストプラクティス

## 原則

Tailwind CSS はユーティリティファーストの CSS フレームワークであり、HTML/JSX 内にスタイルを直接記述することで、カスタム CSS の肥大化を防ぎ、スタイルの一貫性を保つ。Headless UI（Radix UI）との組み合わせにより、アクセシブルかつ柔軟なコンポーネントを構築する。

---

## 1. ユーティリティファーストの原則

### 基本ルール

- カスタム CSS ファイルを作成せず、ユーティリティクラスで直接スタイリングする
- `@apply` の使用は最小限に抑える（コンポーネント抽出で代替）
- クラス名の順序を統一する（レイアウト → スペーシング → サイズ → タイポグラフィ → 色 → エフェクト → ステート）

```tsx
// GOOD: ユーティリティクラスを直接使用
<button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
  Save
</button>

// BAD: @apply でカスタムクラスを作成
// .btn-primary { @apply flex items-center gap-2 ... }
```

### クラス名の整理

- 長いクラス名リストは改行で整理する
- 関連するユーティリティをグループ化する
- Prettier の `prettier-plugin-tailwindcss` でクラス順序を自動整列する

---

## 2. cn() パターン（clsx + tailwind-merge）

### セットアップ

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 使用パターン

```tsx
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "default" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export function Button({ variant = "default", size = "md", className, children }: ButtonProps) {
  return (
    <button
      className={cn(
        // ベーススタイル
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // バリアント
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
        },
        // サイズ
        {
          "h-8 px-3 text-xs": size === "sm",
          "h-10 px-4 text-sm": size === "md",
          "h-12 px-6 text-base": size === "lg",
        },
        // 外部からのオーバーライド（必ず最後）
        className,
      )}
    >
      {children}
    </button>
  );
}
```

### cn() の重要ルール

- `className` prop は常に `cn()` の最後の引数にする（tailwind-merge がオーバーライドを解決）
- 条件付きクラスにはオブジェクト構文を使用する
- 配列構文は使わない（`clsx` が処理するため不要）

---

## 3. レスポンシブデザイン

### モバイルファーストの原則

- デフォルトスタイルはモバイル向けに記述する
- ブレークポイントプレフィックスで段階的に拡張する
- Tailwind v4 のデフォルトブレークポイント: `sm`(40rem), `md`(48rem), `lg`(64rem), `xl`(80rem), `2xl`(96rem)

```tsx
// GOOD: モバイルファースト
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// BAD: デスクトップファースト（不要な上書きが発生）
<div className="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
```

### コンテナクエリ（Tailwind v4）

```tsx
// 親コンテナのサイズに応じたレスポンシブ
<div className="@container">
  <div className="flex flex-col @md:flex-row @lg:gap-8">
    <Sidebar />
    <MainContent />
  </div>
</div>
```

### カスタムブレークポイント（v4）

```css
@import "tailwindcss";

@theme {
  --breakpoint-xs: 30rem;
  --breakpoint-3xl: 120rem;
}
```

---

## 4. ダークモード実装

### セットアップ（Tailwind v4）

```css
/* app.css */
@import "tailwindcss";

/* クラスベースのダークモード切り替え */
@custom-variant dark (&:where(.dark, .dark *));
```

### 使用パターン

```tsx
// コンポーネントでの使用
<div className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### CSS 変数によるテーマ管理（shadcn/ui 方式）

```css
/* globals.css */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
}
```

### ダークモード切替の実装

```tsx
// next-themes との統合
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
```

---

## 5. Radix UI / Headless UI 統合パターン

### 基本方針

- Radix UI Primitives はスタイルなしのアクセシブルなコンポーネントを提供する
- Tailwind ユーティリティで見た目を付与する
- `data-[state=*]` 属性セレクタでステート別スタイリングを行う

### Radix UI + Tailwind パターン

```tsx
import * as Dialog from "@radix-ui/react-dialog";

export function Modal({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {children}
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### data 属性によるステートスタイリング

```tsx
// Radix の data 属性を活用
<AccordionItem className="border-b data-[state=open]:border-b-0">
  <AccordionTrigger className="flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180">
    {title}
    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
  </AccordionTrigger>
  <AccordionContent className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
    {content}
  </AccordionContent>
</AccordionItem>
```

### asChild パターン

```tsx
// asChild で子要素にプリミティブの振る舞いを委譲
<Dialog.Trigger asChild>
  <Button variant="outline">Open Dialog</Button>
</Dialog.Trigger>

// asChild なし（Radix が独自の要素を生成）は避ける
// カスタムスタイルの制御が困難になるため
```

---

## 6. shadcn/ui コンポーネントパターン

### 設計原則

- コンポーネントはコピーベースで管理する（`components/ui/` に配置）
- npm パッケージとしてインストールしない（カスタマイズの自由度を確保）
- `cn()` による条件付きスタイリングとオーバーライドを標準とする
- `cva`（class-variance-authority）でバリアント管理を行う

### cva パターン

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

### コンポーネントの拡張パターン

```tsx
// forwardRef + cn() + className prop のパターン
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
```

---

## 7. Tailwind v4 CSS ファーストコンフィグレーション

### @theme ディレクティブ

Tailwind v4 では `tailwind.config.js` を廃止し、CSS 内で直接設定する。

```css
/* app.css */
@import "tailwindcss";

@theme {
  /* カスタムカラー -- bg-brand, text-brand 等を生成 */
  --color-brand: oklch(0.72 0.11 178);
  --color-accent: oklch(0.84 0.18 117.33);

  /* フォント -- font-display を生成 */
  --font-display: "Satoshi", sans-serif;

  /* スペーシング倍率 */
  --spacing: 0.25rem;

  /* カスタムブレークポイント */
  --breakpoint-3xl: 120rem;

  /* アニメーション */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes accordion-down {
    from { height: 0; }
    to { height: var(--radix-accordion-content-height); }
  }

  @keyframes accordion-up {
    from { height: var(--radix-accordion-content-height); }
    to { height: 0; }
  }

  /* イージング */
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
}
```

### @variant ディレクティブ

```css
/* カスタム CSS 内で Tailwind バリアントを使用 */
.my-component {
  background: white;

  @variant hover {
    background: #f0f0f0;
  }

  @variant dark {
    background: #1a1a1a;
    color: white;
  }

  @variant md {
    padding: 2rem;
  }
}
```

### v3 からの移行ポイント

- `tailwind.config.js` → CSS 内の `@theme` ディレクティブに移行
- `theme.extend.colors` → `--color-*` CSS 変数
- `theme.extend.fontFamily` → `--font-*` CSS 変数
- `theme.extend.animation` → `--animate-*` CSS 変数 + `@keyframes`
- `darkMode: 'class'` → `@custom-variant dark (&:where(.dark, .dark *))`
- `content` 配列は不要（v4 は自動検出）

---

## 8. アンチパターン

### 避けるべきパターン

| アンチパターン | 理由 | 代替 |
|---|---|---|
| `@apply` の多用 | ユーティリティファーストの利点が失われる | コンポーネント抽出で再利用 |
| `!important` の使用 | 詳細度の戦争を招く | `cn()` で tailwind-merge によるオーバーライド |
| インラインスタイル (`style={}`) | Tailwind の一貫性が崩れる | ユーティリティクラスまたは CSS 変数 |
| カスタム CSS ファイルの増殖 | メンテナンスコスト増大 | ユーティリティ + `@theme` での変数定義 |
| `className` を文字列結合で構築 | クラスの衝突が未解決になる | `cn()` を必ず使用 |
| Radix の `data-*` を無視した独自ステート管理 | アクセシビリティの喪失 | `data-[state=*]` セレクタ活用 |
| shadcn/ui コンポーネントを npm から import | カスタマイズ不可 | `components/ui/` にコピーして管理 |
| `tailwind.config.js` の使用（v4） | 旧方式 | `@theme` ディレクティブに移行 |

---

## Applicability

- **フェーズ**: implementation, review
- **ドメイン**: nextjs-frontend
- **対象ファイル**: `*.tsx`, `*.jsx`, `*.css`（Tailwind クラスを含むファイル）, `tailwind.config.*`, `app.css`, `globals.css`
