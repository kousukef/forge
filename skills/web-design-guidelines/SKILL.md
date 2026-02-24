---
name: web-design-guidelines
description: "When reviewing UI code or creating web interfaces. Provides Web Interface Guidelines covering accessibility, responsive design, Core Web Vitals, UX patterns, forms, navigation, and color systems. MUST be invoked when asked to review UI, check accessibility, audit design, or check against best practices."
---

# Web Interface Guidelines

UIコード・Webインターフェースのガイドライン準拠レビュースキル。

## 使い方

1. 指定されたファイル（またはパターン）を読み込む
2. 以下の全ルールに照合する
3. 発見事項を `file:line` 形式で出力する

ファイル指定がない場合は、ユーザーにレビュー対象を確認する。

## 出力形式

ファイルごとにグループ化し、VS Code でクリック可能な `file:line` 形式で報告する。

```
## src/FileName.tsx

src/FileName.tsx:42 - 問題の説明
src/FileName.tsx:18 - 別の問題

## src/OtherFile.tsx

src/OtherFile.tsx:12 - 発見事項
```

- 問題と場所のみ記載。修正が自明でない場合のみ補足する
- 前置き不要。簡潔さ優先
- 準拠ファイルは `pass` と記載

---

## ガイドライン

### 1. アクセシビリティ（WCAG 2.1 AA）

- アイコンのみのボタンには `aria-label` を付与する
- フォームコントロールには `<label>` または `aria-label` を付与する
- インタラクティブ要素にはキーボードハンドラ（`onKeyDown`/`onKeyUp`）を設定する
- アクションには `<button>`、ナビゲーションには `<a>`/`<Link>` を使用する（`<div onClick>` 禁止）
- 画像には `alt` を付与する（装飾画像は `alt=""`）
- 装飾アイコンには `aria-hidden="true"` を設定する
- 非同期更新（トースト、バリデーション）には `aria-live="polite"` を使用する
- ARIA より先にセマンティック HTML を使用する
- 見出しは `<h1>` - `<h6>` の階層構造を守り、スキップリンクを含める
- 見出しアンカーには `scroll-margin-top` を設定する
- コントラスト比: テキスト 4.5:1 以上、大テキスト 3:1 以上
- タッチターゲットは最小 44x44px を確保する

### 2. フォーカス管理

- インタラクティブ要素には可視フォーカスを付与する: `focus-visible:ring-*`
- フォーカス代替なしの `outline-none` を禁止する
- `:focus` より `:focus-visible` を優先する
- 複合コントロールには `:focus-within` でグループフォーカスを設定する

### 3. フォーム設計

- 入力欄には `autocomplete` と意味のある `name` を設定する
- 適切な `type`（`email`, `tel`, `url`, `number`）と `inputmode` を使用する
- `onPaste` + `preventDefault` によるペースト阻止を禁止する
- ラベルはクリック可能にする（`htmlFor` またはコントロールをラッピング）
- メール/コード/ユーザー名にはスペルチェックを無効化する
- チェックボックス/ラジオ: ラベルとコントロールで単一のヒットターゲットを共有する
- 送信ボタンはリクエスト開始まで有効、リクエスト中はスピナーを表示する
- エラーはインラインで表示し、送信時に最初のエラーにフォーカスする
- プレースホルダーは `...` で終わり、入力例パターンを示す
- 認証以外のフィールドには `autocomplete="off"` を設定する
- 未保存変更がある場合はナビゲーション前に警告する
- 必須フィールドは視覚的に明示する（`*` またはテキスト）
- バリデーションメッセージは修正方法を含める

### 4. レスポンシブデザイン

- モバイルファースト設計: `min-width` メディアクエリを基本とする
- ブレークポイント: 640px (sm) / 768px (md) / 1024px (lg) / 1280px (xl)
- Flexbox/Grid を JS 計測より優先する
- 全画面レイアウトには `env(safe-area-inset-*)` を設定する
- 不要なスクロールバーを回避する
- コンテナクエリ（`@container`）をコンポーネント単位のレスポンシブに活用する
- `<meta name="viewport" content="width=device-width, initial-scale=1">` を必ず設定する
- 画像・動画はコンテナ幅を超えない（`max-width: 100%`）

### 5. Core Web Vitals 最適化

#### LCP（Largest Contentful Paint）
- ファーストビュー画像には `priority` または `fetchpriority="high"` を設定する
- クリティカルフォントには `<link rel="preload">` + `font-display: swap` を使用する
- CDN ドメインには `<link rel="preconnect">` を追加する

#### CLS（Cumulative Layout Shift）
- `<img>` には明示的な `width` と `height` を設定する
- Web フォントの FOUT/FOIT を `font-display: swap` で制御する
- 動的コンテンツの挿入にはプレースホルダーを確保する

#### INP（Interaction to Next Paint）
- 大量リスト（50件超）は仮想化する
- レンダー内でレイアウト読み取りを行わない
- DOM 読み書きをバッチ処理する
- 非制御入力（`defaultValue`）を優先する
- 長時間処理は `requestIdleCallback` または Web Worker に委譲する

#### パフォーマンス一般
- ビューポート外の画像には `loading="lazy"` を設定する
- コード分割を活用し、初期バンドルサイズを最小化する
- 不要な再レンダリングを `React.memo` / `useMemo` / `useCallback` で防止する

### 6. アニメーション

- `prefers-reduced-motion` を尊重する
- アニメーションは `transform`/`opacity` のみで行う
- `transition: all` を禁止する。プロパティを明示的に列挙する
- 正しい `transform-origin` を設定する
- SVG トランスフォームは `<g>` に `transform-box`/`transform-origin` を設定する
- アニメーションはユーザー入力で中断可能にする

### 7. タイポグラフィ

- 省略記号は `...` でなく `…` を使用する
- カーリークォート `"` `"` を使用する（ストレートクォート禁止）
- 計測値/ショートカット/ブランド名にはノーブレークスペースを使用する
- 読み込み状態は `…` で終わる
- 数字列には `font-variant-numeric: tabular-nums` を設定する
- 見出しには `text-wrap: balance` または `text-pretty` を使用する

### 8. コンテンツ処理

- テキストコンテナは長文を `truncate`/`line-clamp-*` で処理する
- Flex 子要素にはテキスト切り詰め用に `min-w-0` を設定する
- 空状態を処理する。壊れた UI を表示しない
- 短い/平均的/非常に長いユーザー入力を想定する

### 9. ナビゲーション・状態管理

- URL に状態を反映する（フィルタ、タブ、ページネーション、パネル）
- リンクは `<a>`/`<Link>` を使用する（Cmd/Ctrl+クリック対応）
- 状態を持つ UI は全てディープリンク可能にする
- 破壊的操作には確認またはアンドゥを提供する
- パンくずリストで現在位置を明示する
- ナビゲーション要素には `<nav>` と `aria-label` を使用する

### 10. タッチ・インタラクション

- `touch-action: manipulation` でダブルタップ遅延を防止する
- `-webkit-tap-highlight-color` を意図的に設定する
- モーダル/ドロワーには `overscroll-behavior: contain` を設定する
- ドラッグ中: テキスト選択を無効化し、要素に `inert` を設定する
- `autoFocus` は慎重に使用する（デスクトップのみ、単一入力）
- ホバー状態はボタン/リンクに必ず設定する
- インタラクティブ状態はコントラストを高める

### 11. カラーシステム

- CSS カスタムプロパティでカラートークンを定義する
- セマンティックカラー名を使用する（`--color-primary`, `--color-error` 等）
- ダークモード: `<html>` に `color-scheme: dark` を設定する
- `<meta name="theme-color">` を背景色に合わせる
- ネイティブ `<select>` には明示的な `background-color`/`color` を設定する
- 色だけに依存しない情報伝達（アイコン/テキストを併用）
- システムカラースキーム（`prefers-color-scheme`）を尊重する

### 12. 国際化（i18n）

- 日付/時刻には `Intl.DateTimeFormat` を使用する
- 数値/通貨には `Intl.NumberFormat` を使用する
- 言語検出はヘッダー/`navigator.languages` で行う
- ハードコードされた日付/数値フォーマットを禁止する

### 13. ハイドレーション安全性

- `value` を持つ入力には `onChange` を設定するか `defaultValue` を使用する
- 日付/時刻レンダリングはハイドレーションミスマッチを防止する
- `suppressHydrationWarning` の使用を最小限にする

### 14. コンテンツ・コピーライティング

- 能動態を優先する
- 見出し/ボタンはタイトルケース
- 数値にはアラビア数字を使用する
- ボタンラベルは具体的にする
- エラーメッセージには修正方法/次のステップを含める
- 二人称を使用し、一人称を避ける
- スペースが限られる場合は `&` を "and" の代わりに使用する

---

## アンチパターン検出（必ずフラグする）

以下のパターンを検出した場合は必ず報告する:

| パターン | 問題 |
|---|---|
| `user-scalable=no` / `maximum-scale=1` | ズーム無効化（アクセシビリティ違反） |
| `onPaste` + `preventDefault` | ペースト阻止 |
| `transition: all` | パフォーマンス低下 |
| `outline-none`（代替フォーカスなし） | フォーカス不可視 |
| インライン `onClick` ナビゲーション（`<a>` なし） | セマンティクス違反 |
| `<div>`/`<span>` + クリックハンドラ | セマンティクス違反 |
| サイズ未指定の画像 | CLS 発生 |
| 大量配列の仮想化なし | パフォーマンス低下 |
| ラベルなしのフォーム入力 | アクセシビリティ違反 |
| `aria-label` なしのアイコンボタン | アクセシビリティ違反 |
| ハードコードされた日付/数値フォーマット | i18n 非対応 |
| 根拠なしの `autoFocus` | UX 問題 |
| `dangerouslySetInnerHTML` | XSS リスク |
| コントラスト比不足 | WCAG 違反 |
