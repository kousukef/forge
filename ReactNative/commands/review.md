---
description: "実装済みコードをSpec-Awareレビュー（仕様コンテキスト注入 + 動的レビュアー選択 + カバレッジマトリクス）で多角的にレビューする"
disable-model-invocation: true
argument-hint: "<change-name>"
---

# /review コマンド

## 目的

実装済みコードを仕様準拠の観点を含めて多角的にレビューする。
delta-spec と design.md をレビュアーに必須入力として提供し、設計意図を理解した上でのレビューを実現する。

## 引数の解析

$ARGUMENTS から change-name を決定する:

- 指定あり: `openspec/changes/<change-name>/` を対象とする
- 省略: `openspec/changes/` 内のアクティブ変更（`archive/` 以外）を自動検出
  - 1つ → 自動選択
  - 複数 → AskUserQuestion で選択
  - 0 → エラー（先に `/brainstorm` を実行するよう案内）

## ワークフロー

### Step 1: 仕様コンテキストの準備

1. `openspec/changes/<change-name>/specs/` 配下のデルタスペックファイル一覧を取得
2. `openspec/changes/<change-name>/design.md` のパスを確認
3. `git diff --stat` で変更ファイル一覧を取得

以下の REVIEW CONTEXT を全レビュアーのプロンプトに注入する:

```
REVIEW CONTEXT:
- delta-spec: openspec/changes/<change-name>/specs/[ファイル一覧]
- design.md: openspec/changes/<change-name>/design.md
- 変更ファイル: [git diff --stat の出力]

REVIEW INSTRUCTION:
1. まず delta-spec と design.md を Read し、設計意図を理解すること
2. 設計上の意図的な選択を「問題」として指摘しないこと
3. 各指摘に「関連する仕様項目」を明記すること（仕様外の指摘は明示すること）
4. 各指摘に確信度（HIGH / MEDIUM / LOW）を付与すること
```

### Step 2: 動的レビュアー選択

`git diff --stat` の出力からドメインを検出し、起動するレビュアーを動的に決定する:

| ドメイン検出条件 | 起動するレビュアー |
|---|---|
| 常時起動（全変更） | **security-sentinel** |
| `.ts` / `.tsx` ファイルが含まれる | **typescript-reviewer** |
| `components/` または `screens/` 配下の `.tsx` ファイルが含まれる | **rn-architecture-reviewer**, **rn-ui-reviewer** |
| `hooks/` または `usecases/` 配下のファイルが含まれる | **rn-architecture-reviewer** |
| `*.test.ts` / `*.test.tsx` / `__tests__/` 配下のファイルが含まれる | **rn-test-reviewer** |
| パフォーマンス関連（`FlatList`, `useMemo`, `useCallback` 等を含む変更）またはレビュアーが1つ以上起動されている場合 | **rn-performance-reviewer** |

**注意**: security-sentinel は常時起動。その他は条件に該当する場合のみ起動する。
該当しないレビュアーは起動しない（トークン節約とノイズ低減）。

### Step 3: レビュアー並列実行

Step 2 で選択されたレビュアーを**並列で** Task として起動する。
各レビュアーには Step 1 で準備した REVIEW CONTEXT を注入する。

**レビュアーの役割（参考）:**

1. **security-sentinel**: OWASP Mobile Top 10・AsyncStorage機密情報・HTTP通信・証明書ピニング・Deep Link入力検証・認証認可
2. **typescript-reviewer**: any型排除・asキャスト・Zodバリデーション欠如・strictモード違反・型の整合性
3. **rn-architecture-reviewer**: Clean Architecture準拠・Custom Hooks設計・Repository/Service層分離・依存方向・状態管理設計
4. **rn-ui-reviewer**: FlatList最適化・useCallback/useMemo・アクセシビリティ・StyleSheet・Platform.OS
5. **rn-performance-reviewer**: メモリリーク・不要な再レンダリング・JSスレッドブロッキング・バンドルサイズ
6. **rn-test-reviewer**: Jest/RNTL カバレッジ・テスト設計品質・Custom Hooksテスト・モック戦略

### Step 4: review-aggregator による統合

レビュアー並列実行の完了後、**review-aggregator** を Task として起動する。

review-aggregator には以下を入力として提供する:
- 全レビュアーの出力テキスト
- delta-spec ファイルパス一覧
- design.md ファイルパス

review-aggregator は以下を実行する:
1. **重複排除**: 同一箇所への複数指摘を最も具体的なものに統合
2. **矛盾解決**: 相反する指摘をフラグ
3. **優先度調整**: 確信度に基づく横断的再評価。LOW 確信度の P2/P3 はノイズ候補として分離
4. **カバレッジマトリクス生成**: delta-spec の各要件・シナリオに対するレビューカバレッジを可視化

### Step 5: review-summary.md の生成

review-aggregator の統合レポートを受領後、Main Agent が以下を実行する:

1. `openspec/changes/<change-name>/reviews/` ディレクトリが存在しない場合は自動作成する
2. review-aggregator の統合結果をベースに `openspec/changes/<change-name>/reviews/review-summary.md` を生成する
3. `/review` 再実行時は既存の review-summary.md を上書きする

**注意**: change-name は「引数の解析」セクションで決定済みの値を使用する。

review-summary.md のテンプレート:

```markdown
# Review Summary: [change-name]

## レビュー実施情報
- 実施日: [日付]
- 対象レビュアー: [実行されたレビュアー一覧]
- 失敗したレビュアー: [あれば。なければ「なし」]

## 指摘一覧

### [カテゴリ: Security / TypeScript / Architecture / UI/RN / Performance / Testing]

#### 指摘 1: [タイトル]
- **レビュアー**: [レビュアー名]
- **優先度**: Critical / High / Medium / Low
- **対象ファイル**: [ファイルパス]
- **指摘内容**: [詳細]
- **推奨修正**: [修正案]

## 修正内容

### 修正 1: [指摘への対応]
- **対応**: 修正済み / スコープ外 / 次回対応
- **変更内容**: [何をどう修正したか]
- **変更ファイル**: [修正したファイルパス]
```

**指摘が0件の場合**: 「指摘一覧」セクションに「指摘なし」と記載し、「修正内容」セクションは空とする。

**レビュアーの一部が失敗した場合**: 成功したレビュアーの結果のみで review-summary.md を生成し、「失敗したレビュアー」に失敗したレビュアー名を明記する。

### Step 6: 結果提示と修正ループ

review-aggregator の統合レポートをユーザーに提示し、以下のフローで対応する:

#### P1 あり（修正ループ）

```
P1 指摘あり
  │
  ├── アーキテクチャ変更を伴う（エスカレーションフラグあり）
  │   → AskUserQuestion でユーザーに修正方針を確認
  │
  └── アーキテクチャ変更不要
      → Task(implementer) で自動修正
      → 修正部分のみ、関連レビュアーのみで再レビュー（最大 1 回）
      → 再レビューで新たな P1 が出た場合はユーザーに報告（無限ループ防止）
```

#### P2 のみ

ユーザーに修正するかどうかの判断を委ねる。

#### P3 のみ

レポートのみ出力。

#### 修正実施後の review-summary.md 追記

P1/P2 指摘に基づく修正（自動修正またはユーザー指示による修正）が実施された場合、Main Agent が review-summary.md の「修正内容」セクションに修正内容を追記する。

### Step 7: レビュー学習ループ

レビュー結果の提示後、ユーザーの反応を記録する:

1. ユーザーが指摘を**却下**した場合（修正不要と判断）:
   - 却下理由をユーザーに確認
   - `docs/compound/` に以下の形式で記録:
     ```
     category: review-gap
     レビュアー: [レビュアー名]
     指摘ID: [SEC-001 等]
     却下理由: [ユーザーの理由]
     ```

2. 同一パターンの却下が **2 回以上**蓄積した場合:
   - Learning Router が該当レビュアーのチェックリスト更新を提案

3. ノイズ候補（LOW 確信度 P2/P3）が却下された場合:
   - `docs/compound/` に `category: review-gap` で記録
   - 同一パターンの蓄積でレビュアー改善提案に昇格

## レビュー出力形式

review-aggregator の出力形式に従う。最終的にユーザーに提示する形式:

```markdown
# コードレビュー結果（Spec-Aware Review）

## サマリー
- P1（修正必須）: X件
- P2（修正推奨）: X件
- P3（あると良い）: X件
- ノイズ候補（低確信度）: X件
- 矛盾検出: X件
- 起動レビュアー: [security-sentinel, typescript-reviewer, ...]

## P1: クリティカル
### [SEC-001] AsyncStorage への機密情報の平文保存
- **重要度**: P1
- **確信度**: HIGH
- **ファイル**: `src/features/auth/hooks/useAuth.ts:42`
- **問題**: アクセストークンが AsyncStorage に平文保存されている
- **修正案**: expo-secure-store または react-native-keychain を使用
- **レビュアー**: security-sentinel
- **関連仕様**: REQ-001 (Error Scenario)

## P2: 重要
...

## P3: 軽微
...

## 矛盾検出
...

## ノイズ候補（低確信度 P2/P3）
...

## Review Coverage Matrix

| 仕様項目 | Security | TypeScript | Architecture | UI/RN | Performance | Testing | カバー状態 |
|---|---|---|---|---|---|---|---|
| REQ-001: Happy Path | - | TYPE-001 | - | UI-002 | - | - | Covered |
| REQ-001: Error Scenario | SEC-003 | - | - | - | - | TEST-001 | Covered |
| REQ-002: Boundary | - | - | - | - | - | - | **UNCOVERED** |

### 未カバー項目
- REQ-002: Boundary Scenario -- どのレビュアーも検証していない。追加レビューを推奨。
```
