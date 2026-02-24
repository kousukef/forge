---
name: ui-ux-pro-max-skill
description: "When designing, building, or reviewing UI/UX for web or mobile applications. Provides design system principles, color palette selection, font pairing guidelines, and 99 curated UX rules organized by priority. MUST be invoked before any UI component creation, page design, or UX review task."
---

# UI/UX Pro Max - デザインシステム原則 & UXガイドライン

UI/UXデザインの意思決定を体系化したスキル。カラーパレット選定、フォントペアリング、UXガイドライン（99項目から厳選）、デザインシステム構築原則を提供する。

## 適用タイミング

以下の作業時にこのスキルを参照すること:

- 新規UIコンポーネント・ページの設計・実装
- カラーパレット・タイポグラフィの選定
- UX品質のレビュー・改善
- ランディングページ・ダッシュボードの構築
- アクセシビリティ要件の実装
- デザインシステムの構築・拡張

## MCP プラグイン連携（任意）

ui-ux-pro-max MCP プラグインが利用可能な場合、Python スクリプトによる検索コマンドでより詳細なデータベース検索が可能。MCP が未設定でも本スキルの内容だけで十分に機能する。

### 検索コマンド（MCP 利用時のみ）

> **注意事項**:
> - **実行方法**: MCP サーバー経由での実行を推奨する。直接スクリプトを実行する場合は必ず絶対パスを使用すること（相対パス不可）。
> - **バージョン固定**: MCP プラグインのインストール時はバージョンを固定すること（例: `pip install ui-ux-pro-max==<version>`）。浮動バージョンは予期しない動作変更を招く。
> - **入力サニタイズ**: 検索キーワードはMCPサーバー内部でサニタイズされる。直接スクリプト実行時も、ユーザー入力をそのままコマンドライン引数に渡す前にサニタイズを行うこと。

```bash
# デザインシステム一括生成（推奨: 最初に実行）
python3 /absolute/path/to/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Project Name"

# ドメイン別検索
python3 /absolute/path/to/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>
# domain: product | style | typography | color | landing | chart | ux | web

# スタック別ベストプラクティス
python3 /absolute/path/to/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack>
# stack: html-tailwind | react | nextjs | vue | svelte | shadcn
```

---

## 1. カラーパレット選定ガイドライン

### 原則

- **プロダクトタイプに応じた色彩心理を活用する**: SaaS は信頼のブルー、ヘルスケアは落ち着きのシアン、EC は成功のグリーン
- **CTA にはメインカラーの補色・対比色を使う**: ブルー基調なら CTA はオレンジ、グリーン基調なら CTA はオレンジ
- **背景・テキスト・ボーダーの3層で一貫性を保つ**: 背景は薄く、テキストは濃く、ボーダーは中間
- **ダークモードとライトモードの両方でコントラスト比 4.5:1 以上を確保する**

### プロダクト別推奨パレット

| プロダクト | Primary | CTA | Background | Text | 根拠 |
|---|---|---|---|---|---|
| SaaS（汎用） | #2563EB (Blue) | #F97316 (Orange) | #F8FAFC | #1E293B | 信頼のブルー + オレンジ CTA のコントラスト |
| EC（汎用） | #059669 (Green) | #F97316 (Orange) | #ECFDF5 | #064E3B | 成功のグリーン + 緊急性のオレンジ |
| EC（ラグジュアリー） | #1C1917 (Black) | #CA8A04 (Gold) | #FAFAF9 | #0C0A09 | プレミアムダーク + ゴールドアクセント |
| ヘルスケア | #0891B2 (Cyan) | #059669 (Green) | #ECFEFF | #164E63 | 落ち着きのシアン + 健康のグリーン |
| Fintech | #F59E0B (Gold) | #8B5CF6 (Purple) | #0F172A | #F8FAFC | 信頼のゴールド + テックパープル |
| AI/チャットボット | #7C3AED (Purple) | #06B6D4 (Cyan) | #FAF5FF | #1E1B4B | AIパープル + インタラクションシアン |
| ポートフォリオ | #18181B (Black) | #2563EB (Blue) | #FAFAFA | #09090B | モノクローム + ブルーアクセント |
| 教育 | #4F46E5 (Indigo) | #F97316 (Orange) | #EEF2FF | #1E1B4B | 知的インディゴ + エネルギッシュオレンジ |
| ウェルネス/メンタルヘルス | #8B5CF6 (Lavender) | #10B981 (Green) | #FAF5FF | #4C1D95 | 癒しのラベンダー + 健康グリーン |
| ダッシュボード（金融） | #0F172A (Navy) | #22C55E (Green) | #020617 | #F8FAFC | ダーク背景 + 正値グリーン |

### ダーク/ライトモード切替の注意

| 要素 | ライトモード | ダークモード | 禁止事項 |
|---|---|---|---|
| Glass カード | `bg-white/80` 以上 | `bg-white/10` | ライトで `bg-white/10` は透明すぎ |
| テキスト | `#0F172A` (slate-900) | `#F8FAFC` (slate-50) | ライトで `#94A3B8` は薄すぎ |
| ミューテッドテキスト | `#475569` (slate-600) 以上 | `#94A3B8` (slate-400) | ライトで gray-400 は読めない |
| ボーダー | `border-gray-200` | `border-white/10` | ライトで `border-white/10` は見えない |

---

## 2. フォントペアリング原則

### 原則

- **見出しとボディで性格を対比させる**: Serif 見出し + Sans ボディ、Display + Sans が最も汎用性が高い
- **同一フォントファミリーでのウェイト差も有効**: Inter のみで 300-700 を使い分けるスイスミニマル
- **Google Fonts を標準とし、`font-display: swap` でレンダリングブロックを防ぐ**
- **装飾フォントは見出しのみに限定し、ボディには高い可読性のフォントを使う**

### プロダクト別推奨ペアリング

| ユースケース | 見出し | ボディ | ムード |
|---|---|---|---|
| ラグジュアリー/ファッション | Playfair Display | Inter | elegant, luxury, sophisticated |
| SaaS/ビジネス | Poppins | Open Sans | modern, professional, clean |
| テックスタートアップ | Space Grotesk | DM Sans | tech, innovative, bold |
| ダッシュボード/管理画面 | Inter | Inter | minimal, clean, functional |
| ウェルネス/ヘルス | Lora | Raleway | calm, wellness, natural |
| 開発者ツール | JetBrains Mono | IBM Plex Sans | code, technical, precise |
| EC/ショッピング | Rubik | Nunito Sans | clean, shopping, conversion |
| ゲーミング | Russo One | Chakra Petch | bold, action, competitive |
| 金融/銀行 | IBM Plex Sans | IBM Plex Sans | trustworthy, professional |
| 日本語サイト | Noto Serif JP | Noto Sans JP | elegant, traditional + modern |

### アンチパターン

- **禁止**: Arial, Times New Roman, Comic Sans をプロダクションで使用すること
- **禁止**: 3種類以上のフォントファミリーを1ページに混在させること
- **禁止**: Display/Script フォントをボディテキストに使用すること
- **注意**: `font-display: swap` なしでの Web Font 読み込みは FOIT を引き起こす

---

## 3. UX ガイドライン（優先度別）

### CRITICAL: アクセシビリティ（違反は即修正）

| ルール | Do | Don't |
|---|---|---|
| **コントラスト比 4.5:1** | `#333` on white (7:1) | `#999` on white (2.8:1) |
| **フォーカスリング表示** | `focus-visible:ring-2 focus-visible:ring-blue-500` | `outline-none` のみ（代替なし） |
| **alt テキスト** | 意味のある画像に説明的な alt | 空の alt や alt 属性なし |
| **aria-label** | アイコンのみのボタンに `aria-label` | `<button><Icon /></button>` ラベルなし |
| **キーボードナビ** | Tab 順序がビジュアル順序と一致 | キーボードトラップや到達不能な要素 |
| **フォームラベル** | `<label for="email">` と input の紐付け | placeholder のみのラベル |
| **color-only 禁止** | 色 + アイコン/テキストで情報伝達 | 赤/緑だけでエラー/成功を表現 |
| **見出し階層** | h1 -> h2 -> h3 の順序 | h1 -> h4 のスキップ |
| **モーション感度** | `prefers-reduced-motion` を尊重 | パララックス/スクロールジャッキングの強制 |

### CRITICAL: タッチ & インタラクション

| ルール | Do | Don't |
|---|---|---|
| **タッチターゲット 44x44px** | `min-h-[44px] min-w-[44px]` | `w-6 h-6` の小さなボタン |
| **hover vs tap** | click/tap を主要インタラクションに | hover のみに重要な機能を依存 |
| **ローディングボタン** | 非同期操作中は disabled + spinner | 処理中もクリック可能 |
| **エラーフィードバック** | 問題箇所の近くに明確なメッセージ | サイレント失敗 |
| **確認ダイアログ** | 破壊的操作前に確認 | クリック即削除 |
| **cursor-pointer** | クリッカブル要素に `cursor-pointer` | インタラクティブ要素にデフォルトカーソル |

### HIGH: レイアウト & レスポンシブ

| ルール | Do | Don't |
|---|---|---|
| **viewport meta** | `width=device-width, initial-scale=1` | `maximum-scale=1` でズーム無効化 |
| **フォントサイズ** | モバイルでボディ最小 16px | `text-xs` でボディテキスト |
| **横スクロール防止** | コンテンツが viewport 幅に収まること | モバイルで横スクロールバー |
| **z-index 管理** | 定義済みスケール (10, 20, 30, 50) | `z-[9999]` の乱用 |
| **コンテンツジャンプ防止** | 非同期コンテンツのスペース確保 | 画像/コンテンツの後読みでレイアウトシフト |
| **viewport 単位** | `dvh` またはモバイルブラウザ chrome 考慮 | モバイルで `100vh` |
| **テキスト幅制限** | `max-w-prose` (65-75 文字/行) | フル幅の長文パラグラフ |

### HIGH: パフォーマンス

| ルール | Do | Don't |
|---|---|---|
| **画像最適化** | WebP, srcset, lazy loading | 4000px 画像を 400px 表示に使用 |
| **リスト仮想化** | 50 項目超は VirtualList | 全アイテムを DOM にレンダリング |
| **フォント読み込み** | `font-display: swap` | FOIT（Flash of Invisible Text） |
| **サードパーティ** | analytics/logging は `async`/`defer` | 同期的なサードパーティスクリプト |
| **バンドルサイズ監視** | Bundle Analyzer で定期チェック | サイズ増加の無視 |

### MEDIUM: アニメーション

| ルール | Do | Don't |
|---|---|---|
| **マイクロインタラクション** | 150-300ms の duration | 500ms 超の UI アニメーション |
| **transform 使用** | `transform`, `opacity` でアニメーション | `width`, `height`, `top`, `left` のアニメーション |
| **easing** | `ease-out`（進入）, `ease-in`（退出） | UI遷移に `linear` |
| **transition 指定** | `transition-colors duration-200` | `transition-all`（全プロパティ遷移は重い） |
| **連続アニメーション** | ローディングインジケーターのみ | 装飾要素に `animate-bounce` |

### MEDIUM: フォーム

| ルール | Do | Don't |
|---|---|---|
| **入力ラベル** | 常にラベルを表示 | placeholder のみ |
| **エラー配置** | 各フィールド直下に表示 | フォーム上部に全エラー一括表示 |
| **インライン検証** | blur 時にバリデーション | submit 時のみの検証 |
| **input type** | `email`, `tel`, `number` を適切に | 全て `type="text"` |
| **autocomplete** | `autocomplete="email"` 等を設定 | `autocomplete="off"` の乱用 |
| **パスワード表示** | 表示/非表示トグル | パスワード常時非表示 |
| **ペースト許可** | 全入力フィールドでペースト可能に | `onPaste={e => e.preventDefault()}` |

---

## 4. デザインシステム構築原則

### 構成要素

デザインシステムは以下の階層で構築する:

```
Design Tokens（変数層）
  - Color: primary, secondary, accent, background, text, border
  - Typography: font-family, font-size scale, line-height, font-weight
  - Spacing: 4px 基準のスケール (4, 8, 12, 16, 24, 32, 48, 64)
  - Border Radius: consistent scale (0, 4, 8, 12, 9999)
  - Shadow: none, sm, md, lg, xl
  - Z-index: 10, 20, 30, 40, 50

Primitive Components（原子層）
  - Button, Input, Badge, Avatar, Icon

Composite Components（分子層）
  - Card, Form Group, Navigation Item, List Item

Pattern Components（有機体層）
  - Header, Sidebar, Data Table, Modal, Toast
```

### CSS 変数による一貫性

```css
:root {
  /* Color */
  --color-primary: #2563EB;
  --color-secondary: #3B82F6;
  --color-accent: #F97316;
  --color-bg: #F8FAFC;
  --color-text: #1E293B;
  --color-border: #E2E8F0;
  --color-muted: #64748B;

  /* Typography */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing (4px base) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

### スタイル選定マトリクス

| プロダクトタイプ | 推奨スタイル | 避けるスタイル |
|---|---|---|
| SaaS/エンタープライズ | Minimalism, Flat Design | Brutalism, 過剰なアニメーション |
| EC ラグジュアリー | Glassmorphism, Liquid Glass | Vibrant Block, カジュアルなデザイン |
| ヘルスケア | Neumorphism, Accessible | ネオンカラー, モーション過多 |
| Fintech | Glassmorphism, Dark Mode | ライト背景, セキュリティ指標なし |
| 教育 | Claymorphism, Micro-interactions | ダークモード, 複雑な専門用語 |
| ポートフォリオ | Motion-Driven, Minimalism | テンプレート的デザイン |
| 政府/公共 | Accessible & Ethical | 装飾的デザイン, 低コントラスト |

---

## 5. アイコン & ビジュアル要素ルール

| ルール | Do | Don't |
|---|---|---|
| **SVG アイコンを使用** | Heroicons, Lucide, Simple Icons | 絵文字をUIアイコンとして使用 |
| **安定した hover** | color/opacity のトランジション | scale でレイアウトを動かす hover |
| **ブランドロゴ検証** | Simple Icons から公式 SVG を取得 | ロゴパスの推測 |
| **一貫したサイズ** | 固定 viewBox (24x24) + `w-6 h-6` | 異なるサイズのアイコン混在 |
| **テーマカラー直接使用** | `bg-primary`, `text-accent` | `var()` ラッパーの過剰使用 |

---

## 6. 納品前チェックリスト

### ビジュアル品質

- [ ] 絵文字をアイコンとして使用していないこと（SVG を使用）
- [ ] アイコンセットが統一されていること（Heroicons/Lucide）
- [ ] hover でレイアウトシフトが発生しないこと
- [ ] ライト/ダークモード両方でテストしたこと

### インタラクション

- [ ] クリッカブル要素に `cursor-pointer` があること
- [ ] hover で明確なビジュアルフィードバックがあること
- [ ] transition が 150-300ms であること
- [ ] キーボードナビゲーションでフォーカスが見えること

### アクセシビリティ

- [ ] テキストコントラスト比 4.5:1 以上
- [ ] 全画像に alt テキスト
- [ ] フォーム入力にラベル
- [ ] `prefers-reduced-motion` 対応
- [ ] アイコンボタンに `aria-label`
- [ ] セマンティック HTML（`<nav>`, `<main>`, `<article>`）

### レスポンシブ

- [ ] 375px, 768px, 1024px, 1440px でテスト
- [ ] モバイルで横スクロールなし
- [ ] タッチターゲット 44x44px 以上
- [ ] 固定要素の下にコンテンツが隠れていないこと

### パフォーマンス

- [ ] 画像に `loading="lazy"` (below-fold)
- [ ] Web Font に `font-display: swap`
- [ ] `transition-all` でなく `transition-colors` 等の具体指定
- [ ] 50項目超のリストは仮想化
