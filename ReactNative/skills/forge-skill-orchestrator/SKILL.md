---
name: forge-skill-orchestrator
description: "Use at the START of every task, before writing any code, running tests, debugging, reviewing, or designing. This skill determines which methodology and domain skills must be invoked. MUST be invoked before any implementation, debugging, review, testing, or specification work begins."
---

# Forge Skill Orchestrator（React Native版）

## 1% ルール

**1% でも適用される可能性があれば、そのスキルを呼び出せ。**

スキルの呼び出しコストは低い。呼び出さなかったことによる品質低下コストは高い。
迷ったら呼び出す。迷わなくても呼び出す。

## フェーズ検出テーブル

現在のコマンド名または作業内容からフェーズを判定する:

| コマンド / 作業内容 | フェーズ |
|---|---|
| `/brainstorm` | design |
| `/spec` | spec |
| `/implement` | implementation |
| `/review` | review |
| `/test` | test |
| `/compound` | documentation |
| `/ship` | all（フェーズ遷移あり） |
| バグ修正・エラー対応 | debug |
| コード変更・新機能追加 | implementation |
| コードレビュー依頼 | review |
| テスト実行・修正 | test |
| 設計・要件整理 | design / spec |

## ドメイン検出テーブル

対象ファイルのパスパターンからドメインを判定する:

| ファイルパスパターン | ドメイン |
|---|---|
| `**/screens/**/*.tsx`, `**/*Screen.tsx` | rn-ui |
| `**/components/**/*.tsx`, `**/*Component.tsx` | rn-ui |
| `**/hooks/**/*.ts`, `**/*Hook.ts`, `**/use*.ts` | rn-domain |
| `**/usecases/**/*.ts`, `**/*UseCase.ts` | rn-domain |
| `**/repositories/**/*.ts`, `**/*Repository.ts` | rn-data |
| `**/services/**/*.ts`, `**/*Service.ts` | rn-data |
| `**/store/**/*.ts`, `**/*Slice.ts`, `**/*Store.ts` | rn-state |
| `**/navigation/**/*.tsx`, `**/*Navigator.tsx` | rn-navigation |
| `**/api/**/*.ts`, `**/*Api.ts` | rn-network |
| `**/*.test.ts`, `**/*.test.tsx`, `**/__tests__/**` | rn-testing |
| `**/*.ts`, `**/*.tsx`（上記以外） | rn-typescript |
| 複数ドメインにまたがる場合 | 該当する全ドメインの Union |

## Methodology Skills レジストリ（universal -- 全ドメイン共通）

| Skill 名 | 適用フェーズ | トリガー条件 |
|---|---|---|
| `test-driven-development` | implementation, debug | コードを書く前。新機能実装、バグ修正、リファクタリング時 |
| `systematic-debugging` | debug, implementation, test | バグ、テスト失敗、ビルドエラー、予期しない動作の発生時 |
| `verification-before-completion` | ALL（完了境界） | タスク完了宣言の直前。「完了」と言う前に必ず |
| `iterative-retrieval` | ALL | サブエージェントとして起動された時。コードベース探索の開始時 |
| `strategic-compact` | ALL | コンテキストウィンドウ 80% 超過時。フェーズ切り替え時。大量出力処理後 |

## ガイダンステーブル（ドメイン別スキルマッピング）

| ドメイン | 適用スキル名 |
|---|---|
| `rn-typescript`（`.ts`/`.tsx` 全般） | `test-driven-development`, `verification-before-completion`, `iterative-retrieval`, `typescript-best-practices` |
| `rn-ui`（`screens/`, `components/`） | 上記 + `rn-ui-patterns`, `rn-clean-architecture` |
| `rn-domain`（`hooks/`, `usecases/`） | 基本 + `rn-clean-architecture` |
| `rn-data`（`repositories/`, `services/`） | 基本 + `rn-clean-architecture`, `react-query-patterns` |
| `rn-state`（`store/`, `*Slice.ts`） | 基本 + `rn-state-management` |
| `rn-navigation`（`navigation/`, `*Navigator.tsx`） | 基本 + `rn-navigation` |
| `rn-network`（`api/`, `*Api.ts`） | 基本 + `react-query-patterns` |
| `rn-testing`（`*.test.ts`, `__tests__/`） | `rn-testing`, `test-driven-development` |
| セキュリティ関連 | `security-patterns` |
| アーキテクチャ設計 | `architecture-patterns`, `rn-clean-architecture` |
| デバッグ / エラー修正 | `systematic-debugging`, `iterative-retrieval` |
| パフォーマンス最適化 | `rn-performance` |

## サブエージェント向け指示

サブエージェントには**スキル名**を渡す。Claude Code がスキル名から自動的にスキル内容を解決・読み込みする。

**プロンプト記載テンプレート**:
```
REQUIRED SKILLS:
- test-driven-development
- iterative-retrieval
- verification-before-completion
- [ドメイン固有スキル名（例: rn-ui-patterns, react-query-patterns）]
```

## 決定フローチャート

```
START
  │
  ├─ 1. フェーズ判定
  │     └─ コマンド名 or 作業内容 → フェーズ検出テーブル → phases[]
  │
  ├─ 2. ドメイン判定
  │     └─ 対象ファイルパス → ドメイン検出テーブル → domains[]
  │
  ├─ 3. スキル照合
  │     ├─ Methodology Skills: phases[] でレジストリ照合 → matched_methodology[]
  │     └─ Domain Skills: domains[] から Auto-Discovery → matched_domain[]
  │
  ├─ 4. Union
  │     └─ skills_to_invoke = matched_methodology ∪ matched_domain
  │
  ├─ 5. 1% ルール適用
  │     └─ 「本当に除外してよいか？」を各 Skill について確認
  │
  └─ 6. 呼び出し
        ├─ メインセッション: Skill ツールで各スキルを名前で呼び出す
        └─ サブエージェント: プロンプトにスキル名を記載（Claude Code が自動解決）
```

## 使用例

### 例 1: `/implement` で UserProfileScreen 実装時

1. フェーズ: `implementation`
2. ドメイン: `src/screens/UserProfile/index.tsx` → `rn-ui`
3. Methodology Skills: `test-driven-development`, `verification-before-completion`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `rn-ui-patterns`, `rn-clean-architecture`, `typescript-best-practices`
5. → 6つの Skill を呼び出し

### 例 2: Custom Hook のデバッグ時

1. フェーズ: `debug`
2. ドメイン: `src/hooks/useUserProfile.ts` → `rn-domain`
3. Methodology Skills: `systematic-debugging`, `test-driven-development`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `rn-clean-architecture`, `react-query-patterns`
5. → 5つの Skill を呼び出し
