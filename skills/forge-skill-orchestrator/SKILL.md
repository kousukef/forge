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

| コマンド / 作業内容 | フェーズ | Domain Skill サフィックス |
|---|---|---|
| `/brainstorm` | design | `/constraints` |
| `/spec` | spec | `/design` |
| `/implement` | implementation | なし（SKILL.md 全体） |
| `/review` | review | なし（SKILL.md 全体） |
| `/test` | test | なし（SKILL.md 全体） |
| `/compound` | documentation | なし（SKILL.md 全体） |
| `/ship` | all（フェーズ遷移あり） | フェーズごとに切替 |
| バグ修正・エラー対応 | debug | なし（SKILL.md 全体） |
| コード変更・新機能追加 | implementation | なし（SKILL.md 全体） |
| コードレビュー依頼 | review | なし（SKILL.md 全体） |
| テスト実行・修正 | test | なし（SKILL.md 全体） |
| 設計・要件整理 | design / spec | `/design` |

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
   - フェーズ検出テーブルの「Domain Skill サフィックス」列に基づき、ドメイン Skill 名にサフィックスを付与する
   - サブエージェントのプロンプトにスキル名を記載する
   - SKILL.md の内容を自分で読む必要はない

2. **プロンプト記載テンプレート**:

   **Phase-Aware テンプレート**（`/brainstorm`, `/spec` 用）:
   ```
   REQUIRED SKILLS:
   - iterative-retrieval
   - verification-before-completion
   - [ドメイン固有スキル名/サフィックス]
   例: prisma-expert/design, architecture-patterns/design
   ```

   **Standard テンプレート**（`/implement`, `/review` 等 用）:
   ```
   REQUIRED SKILLS:
   - test-driven-development
   - iterative-retrieval
   - verification-before-completion
   - [ドメイン固有スキル名]
   例: prisma-expert, architecture-patterns
   ```

   > Methodology Skills にはサフィックスを付けない。サフィックスはドメイン Skill のみに適用する。

3. **スキル解決の優先順位**:
   - プロジェクト固有スキル（`<project>/.claude/skills/`）が優先
   - グローバルスキル（`~/.claude/skills/`）がフォールバック
   - Claude Code が自動的に解決するため、パス指定は不要

4. **サブエージェントの責務**:
   - エージェント定義の `skills` frontmatter で宣言されたスキルに従う
   - プロンプトで追加指定されたスキルにも従う

## フォールバック機構

サフィックス付きスキル名（例: `prisma-expert/design`）で指定された派生ファイルが存在しない場合:

1. **SKILL.md にフォールバック**: サフィックスを除去し、スキル名のみ（例: `prisma-expert`）で解決する。SKILL.md 全体が読み込まれる
2. **警告を出力**: 「[skill-name] の [suffix].md が未作成です。`/skill-format <skill-name>` で分割してください」

> フォールバックはファイル分割未実施の Skill への後方互換性を確保するための機構。
> 分割が完了した Skill では常にサフィックス付きファイルが優先される。

## 決定フローチャート

```
START
  │
  ├─ 1. フェーズ判定
  │     └─ コマンド名 or 作業内容 → フェーズ検出テーブル → phases[], suffix
  │
  ├─ 2. ドメイン判定
  │     └─ 対象ファイルパス → ドメイン検出テーブル → domains[]
  │
  ├─ 3. スキル照合
  │     ├─ Methodology Skills: phases[] でレジストリ照合 → matched_methodology[]
  │     └─ Domain Skills: domains[] から Auto-Discovery（Claude Code が自動検出） → matched_domain[]
  │
  ├─ 4. サフィックス付与
  │     ├─ Methodology Skills: サフィックスなし（常に SKILL.md 全体）
  │     └─ Domain Skills: suffix が設定されている場合 → matched_domain[] の各スキル名にサフィックスを付与
  │        例: suffix="/design" → prisma-expert → prisma-expert/design
  │        派生ファイルが存在しない場合はフォールバック機構を適用
  │
  ├─ 5. Union
  │     └─ skills_to_invoke = matched_methodology ∪ matched_domain（サフィックス付き）
  │
  ├─ 6. 1% ルール適用
  │     └─ 「本当に除外してよいか？」を各 Skill について確認
  │     └─ 疑わしければ追加
  │
  ├─ 7. プロジェクトスキル考慮
  │     └─ Claude Code が検出したプロジェクト固有スキル（<project>/.claude/skills/）も
  │        ドメイン・フェーズとの関連性を判断して追加
  │
  └─ 8. 呼び出し
        ├─ メインセッション: `Skill` ツールで各スキルを名前で呼び出す
        └─ サブエージェント: プロンプトにスキル名を記載（Phase-Aware or Standard テンプレート使用）
```

## 使用例

### 例 1: `/implement` で Next.js コンポーネント実装時（Standard テンプレート）

1. フェーズ: `implementation` → サフィックス: なし
2. ドメイン: `src/app/dashboard/page.tsx` → `nextjs-frontend`
3. Methodology Skills: `test-driven-development`, `verification-before-completion`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `next-best-practices`, `vercel-react-best-practices` 等（サフィックスなし = SKILL.md 全体）
5. → 5つの Skill を呼び出し

### 例 2: `/spec` で Prisma 関連の仕様策定時（Phase-Aware テンプレート）

1. フェーズ: `spec` → サフィックス: `/design`
2. ドメイン: proposal.md のキーワードから `prisma-database` を推論
3. Methodology Skills: `iterative-retrieval`, `verification-before-completion`（サフィックスなし）
4. Domain Skills: `prisma-expert/design`, `database-migrations/design`, `architecture-patterns/design`
5. → コンテキスト効率: ~100行/Skill x 3 = ~300行（従来 ~1,500行 → 80%削減）

### 例 3: `/brainstorm` で認証機能のアイデア出し（Phase-Aware テンプレート）

1. フェーズ: `design` → サフィックス: `/constraints`
2. ドメイン: 要件キーワードから `security` を推論
3. Methodology Skills: `iterative-retrieval`（サフィックスなし）
4. Domain Skills: `security-patterns/constraints`, `architecture-patterns/constraints`
5. → コンテキスト効率: ~25行/Skill x 2 = ~50行（従来 ~900行 → 94%削減）

### 例 4: Prisma スキーマ変更を含むデバッグ時（Standard テンプレート）

1. フェーズ: `debug` → サフィックス: なし
2. ドメイン: `prisma/schema.prisma` → `prisma-database`
3. Methodology Skills: `systematic-debugging`, `test-driven-development`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: `prisma-expert` 等（サフィックスなし = SKILL.md 全体）
5. → 4つの Skill を呼び出し

### 例 5: 3つ以上の独立したテスト失敗時

1. フェーズ: `debug` → サフィックス: なし
2. ドメイン: 各テストファイルから判定
3. Methodology Skills: `systematic-debugging`, `dispatching-parallel-agents`, `iterative-retrieval`
4. Domain Skills（Auto-Discovery）: 該当ドメインのスキルを自動検出（サフィックスなし = SKILL.md 全体）
5. → 並列エージェントで各失敗を独立調査
