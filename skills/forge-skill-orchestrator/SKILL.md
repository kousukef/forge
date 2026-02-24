---
name: forge-skill-orchestrator
description: "Use at the START of every task, before writing any code, running tests, debugging, reviewing, or designing. This skill determines which methodology and domain skills must be invoked. MUST be invoked before any implementation, debugging, review, testing, or specification work begins."
---

# Forge Skill Orchestrator

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
| `src/app/**/*.tsx`, `src/components/**/*.tsx` | nextjs-frontend |
| `src/app/api/**/*.ts`, `src/actions/**/*.ts` | typescript-backend |
| `prisma/**/*`, `*.prisma` | prisma-database |
| `terraform/**/*`, `*.tf` | terraform-infrastructure |
| `e2e/**/*`, `**/*.spec.ts`, `**/*.e2e.ts` | testing |
| `src/**/*.ts` (上記以外) | typescript-backend |
| 複数ドメインにまたがる場合 | 該当する全ドメインの Union |

## Methodology Skills レジストリ（universal -- 全ドメイン共通）

| Skill 名 | 適用フェーズ | トリガー条件 |
|---|---|---|
| `test-driven-development` | implementation, debug | コードを書く前。新機能実装、バグ修正、リファクタリング時 |
| `systematic-debugging` | debug, implementation, test | バグ、テスト失敗、ビルドエラー、予期しない動作の発生時 |
| `verification-before-completion` | ALL（完了境界） | タスク完了宣言の直前。「完了」と言う前に必ず |
| `iterative-retrieval` | ALL | サブエージェントとして起動された時。コードベース探索の開始時 |
| `strategic-compact` | ALL | コンテキストウィンドウ 80% 超過時。フェーズ切り替え時。大量出力処理後 |
| `dispatching-parallel-agents` | debug, implementation | 3つ以上の独立した失敗・タスクが存在し、並列調査が可能な時 |

> **Domain Skills について**: Domain Skills は Auto-Discovery 方式に移行済み。
> プロジェクト固有スキル（`<project>/.claude/skills/`）およびグローバルスキル（`~/.claude/skills/`）に
> 配置されたドメインスキルは Claude Code が自動検出するため、ここにレジストリとして列挙する必要はない。

## サブエージェント向け指示

サブエージェントには**スキル名**を渡す。Claude Code がスキル名から自動的にスキル内容を解決・読み込みする。

1. **親コマンド（`/implement`, `/spec` 等）の責務**:
   - ドメイン・フェーズから適用スキル名を決定する
   - サブエージェントのプロンプトにスキル名を記載する
   - SKILL.md の内容を自分で読む必要はない

2. **プロンプト記載テンプレート**:
   ```
   REQUIRED SKILLS:
   - test-driven-development
   - iterative-retrieval
   - verification-before-completion
   - [ドメイン固有スキル名]
   ```

3. **スキル解決の優先順位**:
   - プロジェクト固有スキル（`<project>/.claude/skills/`）が優先
   - グローバルスキル（`~/.claude/skills/`）がフォールバック
   - Claude Code が自動的に解決するため、パス指定は不要

4. **サブエージェントの責務**:
   - エージェント定義の `skills` frontmatter で宣言されたスキルに従う
   - プロンプトで追加指定されたスキルにも従う

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
  │     └─ Domain Skills: domains[] から Auto-Discovery（Claude Code が自動検出） → matched_domain[]
  │
  ├─ 4. Union
  │     └─ skills_to_invoke = matched_methodology ∪ matched_domain
  │
  ├─ 5. 1% ルール適用
  │     └─ 「本当に除外してよいか？」を各 Skill について確認
  │     └─ 疑わしければ追加
  │
  ├─ 6. プロジェクトスキル考慮
  │     └─ Claude Code が検出したプロジェクト固有スキル（<project>/.claude/skills/）も
  │        ドメイン・フェーズとの関連性を判断して追加
  │
  └─ 7. 呼び出し
        ├─ メインセッション: `Skill` ツールで各スキルを名前で呼び出す
        └─ サブエージェント: プロンプトにスキル名を記載（Claude Code が自動解決）
```

## 使用例

### 例 1: `/implement` で Next.js コンポーネント実装時

1. フェーズ: `implementation`
2. ドメイン: `src/app/dashboard/page.tsx` → `nextjs-frontend`
3. Methodology Skills: `test-driven-development`, `verification-before-completion`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `next-best-practices`, `vercel-react-best-practices` 等
5. → 5つの Skill を呼び出し

### 例 2: Prisma スキーマ変更を含むデバッグ時

1. フェーズ: `debug`
2. ドメイン: `prisma/schema.prisma` → `prisma-database`
3. Methodology Skills: `systematic-debugging`, `test-driven-development`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `prisma-expert` 等
5. → 4つの Skill を呼び出し

### 例 3: 3つ以上の独立したテスト失敗時

1. フェーズ: `debug`
2. ドメイン: 各テストファイルから判定
3. Methodology Skills: `systematic-debugging`, `dispatching-parallel-agents`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: 該当ドメインのスキルを自動検出
5. → 並列エージェントで各失敗を独立調査
