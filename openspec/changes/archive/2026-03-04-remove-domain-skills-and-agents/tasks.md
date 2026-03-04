# remove-domain-skills-and-agents タスクリスト

## テスト戦略

本変更は Markdown/Shell ベースのプラグインシステムであり、アプリケーションコード（.ts/.tsx）は存在しない。テストフレームワークは使用しない。

- ユニットテスト: N/A（テストフレームワークなし）
- 統合テスト: N/A
- E2E テスト: N/A
- **検証方法**: 各タスクの完了後に以下を実施
  - ファイルの存在・非存在確認（`ls`, `test -f`）
  - 削除対象名の残存チェック（`grep -r` で横断検索）
  - Markdown の構文整合性確認（目視）

## タスク

### Task 1: ドメイン固有スキル 14 ディレクトリの削除（推定: 3分）

- **対象ファイル**:
  - `skills/next-best-practices/`（既存・削除）
  - `skills/nextjs-api-patterns/`（既存・削除）
  - `skills/vercel-react-best-practices/`（既存・削除）
  - `skills/vercel-composition-patterns/`（既存・削除）
  - `skills/tailwind-best-practices/`（既存・削除）
  - `skills/ui-ux-pro-max/`（既存・削除）
  - `skills/prisma-expert/`（既存・削除）
  - `skills/database-migrations/`（既存・削除）
  - `skills/security-patterns/`（既存・削除）
  - `skills/terraform-gcp-expert/`（既存・削除）
  - `skills/vitest-testing-patterns/`（既存・削除）
  - `skills/webapp-testing/`（既存・削除）
  - `skills/architecture-patterns/`（既存・削除）
  - `skills/web-design-guidelines/`（既存・削除）
- **やること**: 上記 14 ディレクトリを `rm -rf` で削除する
- **検証方法**: `ls skills/` で残存ディレクトリ確認。方法論スキル（forge-skill-orchestrator, test-driven-development, systematic-debugging, verification-before-completion, iterative-retrieval, strategic-compact, skill-phase-formatter）+ ユーティリティスキル（skill-creator, story-quality-gate, proposal-readiness-check）のみが残っていること
- **関連要件**: REMOVED（ドメイン固有スキルの同梱）
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#ドメイン固有スキルの同梱`
- **依存**: なし

---

### Task 2: ドメイン固有レビューエージェント 7 ファイルの削除（推定: 2分）

- **対象ファイル**:
  - `agents/review/security-sentinel.md`（既存・削除）
  - `agents/review/performance-oracle.md`（既存・削除）
  - `agents/review/architecture-strategist.md`（既存・削除）
  - `agents/review/prisma-guardian.md`（既存・削除）
  - `agents/review/terraform-reviewer.md`（既存・削除）
  - `agents/review/type-safety-reviewer.md`（既存・削除）
  - `agents/review/api-contract-reviewer.md`（既存・削除）
- **やること**: 上記 7 ファイルを `rm` で削除する
- **検証方法**: `ls agents/review/` で `review-aggregator.md` のみが残っていること
- **関連要件**: REMOVED（ドメイン固有レビューエージェントの同梱）
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#ドメイン固有レビューエージェントの同梱`
- **依存**: なし

---

### Task 3: ドメイン固有リファレンスファイルの削除（推定: 2分）

- **対象ファイル**:
  - `reference/typescript-rules.md`（既存・削除）
  - `reference/nextjs/`（既存・ディレクトリごと削除）
  - `reference/prisma/`（既存・ディレクトリごと削除）
  - `reference/terraform/`（既存・ディレクトリごと削除）
  - `reference/common/coding-style.md`（既存・削除）
  - `reference/common/performance.md`（既存・削除）
- **やること**: 上記ファイル・ディレクトリを削除する
- **検証方法**: `ls reference/` で `coding-standards.md`, `core-rules.md`, `workflow-rules.md`, `context-isolation.md`, `common/` が残り、`common/` 配下には `testing.md` のみが残っていること
- **関連要件**: REMOVED（ドメイン固有リファレンスの同梱）
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#ドメイン固有リファレンスの同梱`
- **依存**: なし

---

### Task 4: OpenSpec domain-skills スペックのアーカイブ（推定: 2分）

- **対象ファイル**:
  - `openspec/specs/domain-skills/`（既存・移動）
  - `openspec/changes/archive/2026-03-04-domain-skills/`（新規）
- **やること**: `openspec/specs/domain-skills/` を `openspec/changes/archive/2026-03-04-domain-skills/` に移動する
- **検証方法**: `ls openspec/specs/` に `domain-skills/` が存在しないこと。`ls openspec/changes/archive/2026-03-04-domain-skills/` に `spec.md` が存在すること
- **関連要件**: REMOVED（openspec/specs/domain-skills/spec.md）
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#openspec/specs/domain-skills/spec.md`
- **依存**: なし

---

### Task 5: CLAUDE.md の更新（推定: 5分）

- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**:
  1. Available Skills テーブルからドメインカテゴリ行（フロントエンド、API/セキュリティ、データ、テスト、インフラ）を削除。設計カテゴリから `architecture-patterns` を削除し `skill-creator` のみにする
  2. Available Agents テーブルのレビュー行から 7 レビュアー名を削除し「review-aggregator + `agents/review/` 配下のカスタムレビュアー」に変更
  3. Reference テーブルからドメイン固有行（typescript-rules, nextjs, prisma, terraform, common/coding-style, common/performance）を削除
  4. Hook テーブルの `detect-console-log` の説明を「ソースファイル内のデバッグログを警告」に汎用化
  5. Available Skills セクションの下に拡張ガイダンスを追記:
     - ドメインスキルは `/setup` コマンドで検索・インストール、または `<project>/.claude/skills/` に手動追加
     - レビューエージェントは `agents/review/` に追加で自動認識
     - リファレンスは `reference/` に追加
- **検証方法**: `grep -c 'prisma\|terraform\|nextjs\|next-best-practices\|security-sentinel\|performance-oracle\|architecture-strategist\|prisma-guardian\|terraform-reviewer\|type-safety-reviewer\|api-contract-reviewer\|architecture-patterns' CLAUDE.md` が 0 であること
- **関連要件**: REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-006`
- **依存**: なし

---

### Task 6: USER-CLAUDE.md の更新（推定: 4分）

- **対象ファイル**: `USER-CLAUDE.md`（既存）
- **やること**: Task 5 と同一の変更を USER-CLAUDE.md にも適用する（Available Skills/Agents テーブル、Reference テーブル、Hook テーブルの汎用化、拡張ガイダンス追記）
- **検証方法**: `grep -c 'prisma\|terraform\|nextjs\|next-best-practices\|security-sentinel\|performance-oracle\|architecture-strategist\|prisma-guardian\|terraform-reviewer\|type-safety-reviewer\|api-contract-reviewer\|architecture-patterns' USER-CLAUDE.md` が 0 であること。CLAUDE.md と USER-CLAUDE.md の Available Skills/Agents テーブルが一致すること
- **関連要件**: REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-006`
- **依存**: Task 5（整合性確認のため）

---

### Task 7a: /review コマンド Step 0 の汎用化 + リスクレベル判定（推定: 3分）

- **対象ファイル**: `commands/review.md`（既存）
- **やること**:
  1. Step 0 の L1/L2 自動チェックを汎用化: `npx tsc --noEmit` → 「プロジェクトの型チェッカーを実行（存在する場合）」、`npx eslint --quiet` → 「プロジェクトの linter を実行（存在する場合）」
  2. Step 2a のリスクレベル判定条件を汎用化: ドメイン固有条件（`prisma/schema.prisma`, `terraform/`）を削除し、汎用条件（認証関連ファイル、環境設定ファイル、CI/CD 設定）に変更
- **検証方法**: `grep -c 'npx tsc\|npx eslint\|prisma/schema\|terraform/' commands/review.md` が 0 であること
- **関連要件**: REQ-002, REQ-007
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-002`, `specs/remove-domain-content/delta-spec.md#REQ-007`
- **依存**: Task 2（レビューエージェント削除後に参照を更新）

---

### Task 7b: /review コマンド Step 2b/2c の動的検出への書き換え + 0件時の手動選択（推定: 4分）

- **対象ファイル**: `commands/review.md`（既存）
- **やること**:
  1. Step 2b のドメイン検出テーブルを全て削除し、動的検出方式に置き換え: `agents/review/` ディレクトリスキャン → frontmatter パース → description と変更内容の LLM セマンティック判定によるマッチング
  2. frontmatter パースエラーまたは name フィールド欠落時はスキップし、警告を出力するエラーハンドリングを記述
  3. Step 2c のレビュアー → Skill マッピングテーブルを削除し、エージェント定義の `skills` frontmatter からの自動注入に変更
  4. 関連レビュアーが 0 件の場合、ユーザーに利用可能なレビュアー一覧を提示し、手動で起動するレビュアーを選択させる処理を追加
- **検証方法**: `grep -c 'security-sentinel\|performance-oracle\|architecture-strategist\|prisma-guardian\|terraform-reviewer\|type-safety-reviewer\|api-contract-reviewer' commands/review.md` が 0 であること。動的検出の手順と 0 件時の手動選択が記述されていること
- **関連要件**: REQ-001, REQ-003
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-001`, `specs/remove-domain-content/delta-spec.md#REQ-003`
- **依存**: Task 2（レビューエージェント削除後に参照を更新）、Task 7a

---

### Task 7c: /review コマンド Step 3 + Coverage Matrix + 出力形式（推定: 3分）

- **対象ファイル**: `commands/review.md`（既存）
- **やること**:
  1. Step 3 のレビュアー役割リスト（7 レビュアーの具体的チェック項目）を削除し、「各レビュアーの agents/review/*.md を参照」に変更
  2. Review Coverage Matrix の固定列を動的列に変更
  3. レビュー出力形式のカテゴリ・レビュアー名のハードコードを除去
- **検証方法**: Review Coverage Matrix に固定レビュアー名が含まれていないこと。出力形式が動的列に対応していること
- **関連要件**: REQ-004
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-004`
- **依存**: Task 7b

---

### Task 8: /spec コマンドの Phase 1.7 書き換え（推定: 4分）

- **対象ファイル**: `commands/spec.md`（既存）
- **やること**:
  1. Phase 1.7 のキーワード推論テーブル（行 88-102 付近）を全て削除
  2. 代わりに動的発見方式を記述: `skills/` 配下のドメインスキルを Auto-Discovery でスキャンし、proposal.md の内容と description の LLM セマンティック判定で関連スキルを決定。該当スキルの design.md を DOMAIN CONTEXT FILES として注入
  3. `architecture-patterns/design.md` の常時参照を削除
  4. ドメインスキルがない場合はドメインコンテキストなしで進める旨を記述
- **検証方法**: `grep -c 'prisma-expert\|database-migrations\|nextjs-api-patterns\|security-patterns\|next-best-practices\|vercel-react\|vercel-composition\|terraform-gcp-expert\|architecture-patterns' commands/spec.md` が 0 であること
- **関連要件**: REQ-005
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-005`
- **依存**: Task 1（スキル削除後に参照を更新）

---

### Task 9: forge-skill-orchestrator の汎用化（推定: 5分）

- **対象ファイル**: `skills/forge-skill-orchestrator/SKILL.md`（既存）
- **やること**:
  1. ドメイン検出テーブルのドメイン固有パターン（`src/app/**/*.tsx` → `nextjs-frontend` 等の全行）を削除し、「対象ファイルのパスパターンに基づいてドメインを判定する。ドメインスキルは Auto-Discovery で自動検出される」に変更
  2. Phase-Aware テンプレートの具体例（`prisma-expert/design.md`, `architecture-patterns/design.md` 等）をプレースホルダーに変更
  3. Standard テンプレートの具体例（`prisma-expert`, `architecture-patterns` 等）をプレースホルダーに変更
  4. 使用例セクション（例 1-5）のドメインスキル名を汎用化。例: 「`/implement` で Next.js コンポーネント実装時」→ 「`/implement` でプロジェクトファイル実装時」、ドメインスキル名を `<your-domain-skill>` に変更
  5. `dispatching-parallel-agents` が Methodology Skills レジストリに含まれている場合は維持（方法論スキルのため）
- **検証方法**: `grep -c 'nextjs-frontend\|typescript-backend\|prisma-database\|terraform-infrastructure\|prisma-expert\|next-best-practices\|vercel-react\|security-patterns\|architecture-patterns\|database-migrations' skills/forge-skill-orchestrator/SKILL.md` が 0 であること
- **関連要件**: REQ-009
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-009`
- **依存**: Task 1（スキル削除後に参照を更新）

---

### Task 10: /ship コマンドの修正（推定: 2分）

- **対象ファイル**: `commands/ship.md`（既存）
- **やること**: 「7つの専門レビュアー」→「`agents/review/` 配下のレビュアー」に文言修正
- **検証方法**: `grep -c '7つ' commands/ship.md` が 0 であること
- **関連要件**: REQ-001
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-001`
- **依存**: なし

---

### Task 11: /brainstorm コマンドの修正（推定: 3分）

- **対象ファイル**: `commands/brainstorm.md`（既存）
- **やること**: Step 5.5 のドメイン推論例（`prisma-expert`, `nextjs-api-patterns`）を汎用化。「ドメインスキルの constraints.md が存在する場合に参照する」という汎用的な記述に変更。具体的なスキル名の例示を除去
- **検証方法**: `grep -c 'prisma-expert\|nextjs-api-patterns' commands/brainstorm.md` が 0 であること
- **関連要件**: REQ-005
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-005`
- **依存**: なし

---

### Task 12: /compound コマンドの修正（推定: 2分）

- **対象ファイル**: `commands/compound.md`（既存）
- **やること**:
  1. `security-sentinel` への具体的参照を汎用化（Learning Router 分類テーブルの例示等）
  2. 複利ドキュメント形式の `stack` フィールドの固有値（`nextjs | prisma | terraform | gcp | typescript`）を `general` または自由記述に汎用化
  3. Shift-Left フィードバック分類の「ドメイン Skill の更新を提案」を「プロジェクト固有のスキルの更新を提案」に汎用化
- **検証方法**: `grep -c 'security-sentinel\|nextjs\|prisma\|terraform\|gcp\|typescript' commands/compound.md` が 0 であること（ただし汎用的な文脈での言及は許容）
- **関連要件**: REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-006`
- **依存**: なし

---

### Task 13: /implement コマンドの修正（推定: 3分）

- **対象ファイル**: `commands/implement.md`（既存）
- **やること**:
  1. implementer プロンプト構造の `[ドメイン固有スキル名]` の例示を汎用化
  2. Step 4b の検証コマンド（`npx vitest run`, `npx tsc --noEmit`）を「プロジェクトのテストコマンド」「プロジェクトの静的解析ツール」に汎用化
  3. Step 5 の検証コマンドも同様に汎用化
  4. Main Agent 禁止事項の `実装ファイル（.ts, .tsx 等）` をそのまま維持（例示として適切なため、ただし Context Isolation Policy の本文で汎用化済みであることを確認）
- **検証方法**: `grep -c 'npx vitest\|npx tsc\|prisma-expert\|next-best-practices' commands/implement.md` が 0 であること
- **関連要件**: REQ-007, REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-007`
- **依存**: なし

---

### Task 14: /setup コマンドの修正（推定: 2分）

- **対象ファイル**: `commands/setup.md`（既存）
- **やること**: 表示例からドメインスキル具体名（`next-best-practices`, `prisma-expert` 等）を汎用的な例に変更
- **検証方法**: `grep -c 'next-best-practices\|prisma-expert\|vercel-react' commands/setup.md` が 0 であること
- **関連要件**: REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-006`
- **依存**: なし

---

### Task 15: /skill-format コマンドの修正（推定: 2分）

- **対象ファイル**: `commands/skill-format.md`（既存）
- **やること**: 例テーブル・状況確認モードの例示からドメインスキル名（`prisma-expert`, `next-best-practices` 等）を汎用プレースホルダーに変更
- **検証方法**: `grep -c 'prisma-expert\|next-best-practices' commands/skill-format.md` が 0 であること
- **関連要件**: REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-006`
- **依存**: なし

---

### Task 16: review-aggregator の修正（推定: 3分）

- **対象ファイル**: `agents/review/review-aggregator.md`（既存）
- **やること**:
  1. 出力形式のカテゴリ・レビュアー名の具体例（security-sentinel, performance-oracle 等）を汎用プレースホルダーに変更
  2. Review Coverage Matrix の固定列（Security, Performance, Architecture, Type Safety, API Contract, Prisma, Terraform）を「起動されたレビュアー名を動的に列挙」に変更
  3. 注意事項の「ドメインフィルタリング」の記述を「動的検出」に変更
- **検証方法**: `grep -c 'security-sentinel\|performance-oracle\|architecture-strategist\|prisma-guardian\|terraform-reviewer\|type-safety-reviewer\|api-contract-reviewer' agents/review/review-aggregator.md` が 0 であること
- **関連要件**: REQ-004
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-004`
- **依存**: Task 2（レビューエージェント削除後に参照を更新）

---

### Task 17: forge-system-prompt.md の修正（推定: 4分）

- **対象ファイル**: `forge-system-prompt.md`（既存）
- **やること**:
  1. 技術スタック前提セクションを「ユーザーのプロジェクトに合わせて設定」に汎用化
  2. レビューエージェントの個別定義（security-sentinel 〜 api-contract-reviewer の行動規範・チェック項目）を「将来追加枠」テンプレートに置き換え
  3. ルール詳細仕様の NextJS/Prisma/Terraform 固有セクションを削除
  4. ドメインスキル参照をプレースホルダーに変更
  5. ディレクトリ構造のレビューエージェント一覧を「agents/review/ 配下にカスタムレビュアーを配置」に変更
- **検証方法**: `grep -c 'security-sentinel\|performance-oracle\|architecture-strategist\|prisma-guardian\|terraform-reviewer\|type-safety-reviewer\|api-contract-reviewer\|Prisma規約\|Next.js規約\|Terraform規約' forge-system-prompt.md` が 0 であること
- **関連要件**: REQ-001, REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-001`
- **依存**: なし

---

### Task 18: README.md の修正（推定: 4分）

- **対象ファイル**: `README.md`（既存）
- **やること**:
  1. 「7つのレビュアー」「7 専門レビュアー」文言を修正
  2. レビューエージェントセクションの個別テーブルを汎用記述に変更
  3. ドメインスキルのリストを「ユーザーが追加可能」の案内に変更
  4. カスタマイズセクションにレビューエージェント・ドメインスキル・リファレンスの追加方法を充実
  5. リポジトリ構成の `agents/review/` 配下の「7種」を汎用記述に変更
- **検証方法**: `grep -c 'security-sentinel\|performance-oracle\|architecture-strategist\|prisma-guardian\|terraform-reviewer\|type-safety-reviewer\|api-contract-reviewer\|7つ\|7 専門\|7種' README.md` が 0 であること
- **関連要件**: REQ-006
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-006`
- **依存**: なし

---

### Task 19: rules/core-essentials.md の汎用化（推定: 4分）

- **対象ファイル**: `rules/core-essentials.md`（既存）
- **やること**:
  1. セキュリティ必須事項:
     - 「ユーザー入力は必ずZodでバリデーション」→「ユーザー入力は必ずスキーマバリデーションを適用」
     - 「SQLインジェクション防止: Prismaパラメータ化クエリのみ」→「SQLインジェクション防止: パラメータ化クエリのみ使用」
     - 「XSS防止: `dangerouslySetInnerHTML` 禁止」→「XSS防止: 生HTMLの出力を禁止」
     - 「CSRF: Server Actionsは自動保護、Route Handlersは明示的対策」→「CSRF: フレームワークの保護機構を活用し、必要に応じて明示的対策」
     - 「認証: middleware.tsでルートレベル保護」→「認証: ミドルウェアでルートレベル保護」
  2. コード品質:
     - 「TypeScript strict mode 準拠」→「静的型チェックの厳格モード準拠（該当する場合）」
     - 「`npx tsc --noEmit` をコミット前に実行」→「静的解析ツールをコミット前に実行」
  3. Context Isolation Policy:
     - 「実装ファイル（.ts/.tsx）の Read」→「実装ファイルの Read」
- **検証方法**: `grep -c 'Zod\|Prisma\|dangerouslySetInnerHTML\|Server Actions\|middleware\.ts\|TypeScript strict\|npx tsc\|\.ts/\.tsx' rules/core-essentials.md` が 0 であること
- **関連要件**: REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-008`
- **依存**: なし

---

### Task 20: reference/core-rules.md の汎用化（推定: 3分）

- **対象ファイル**: `reference/core-rules.md`（既存）
- **やること**:
  1. Verification Gates の `TypeCheck` を「静的解析」に変更
  2. Before Commit の `npx tsc --noEmit` → 「プロジェクトの静的解析ツールを実行」
  3. Before Phase Advance の `npm test && npx tsc --noEmit` → 「テスト実行 && 静的解析ツール」
  4. Pre-Commit Checklist の `npx tsc --noEmit` / `npm test` 参照を汎用化
- **検証方法**: `grep -c 'npx tsc\|TypeCheck' reference/core-rules.md` が 0 であること
- **関連要件**: REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-008`
- **依存**: なし

---

### Task 21: reference/workflow-rules.md の汎用化（推定: 2分）

- **対象ファイル**: `reference/workflow-rules.md`（既存）
- **やること**:
  1. During Session の「7並列レビュー」を「並列レビュー」に変更
  2. After Code Changes / Before Commit の `npx tsc --noEmit` を「静的解析ツール」に汎用化
- **検証方法**: `grep -c 'npx tsc\|7並列' reference/workflow-rules.md` が 0 であること
- **関連要件**: REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-008`
- **依存**: なし

---

### Task 22: reference/context-isolation.md の汎用化（推定: 2分）

- **対象ファイル**: `reference/context-isolation.md`（既存）
- **やること**: Main Agent の責務にある `tsc --noEmit` を「静的解析ツール」に汎用化
- **検証方法**: `grep -c 'tsc' reference/context-isolation.md` が 0 であること
- **関連要件**: REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-008`
- **依存**: なし

---

### Task 23: reference/coding-standards.md の汎用化（推定: 3分）

- **対象ファイル**: `reference/coding-standards.md`（既存）
- **やること**:
  1. Naming Conventions テーブルの `.tsx` 拡張子の例をファイル種別に汎用化
  2. Input Validation の Zod 固有のコード例の説明を汎用化（コード例自体はサンプルとして残し、「例: TypeScript + Zod の場合」のように限定する記述に変更）
  3. Error Handling Pattern の TypeScript コード例に「例: TypeScript の場合」を追記
- **検証方法**: 目視で TypeScript 固有の記述がサンプルとして明示的にラベル付けされていること
- **関連要件**: REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-008`
- **依存**: なし

---

### Task 24: reference/common/testing.md の汎用化（推定: 2分）

- **対象ファイル**: `reference/common/testing.md`（既存）
- **やること**: Vitest/Playwright のフレームワーク指定を除去し、汎用テスト原則（ファイル配置規約、命名規約、テスト原則）のみに変更
- **検証方法**: `grep -c 'Vitest\|Playwright\|Testing Library' reference/common/testing.md` が 0 であること
- **関連要件**: REQ-008
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-008`
- **依存**: なし

---

### Task 25: アクティブ変更（add-setup-command）の修正（推定: 2分）

- **対象ファイル**: `openspec/changes/add-setup-command/design.md`（既存）
- **やること**: architecture-patterns への参照（行 107, 142 付近）を汎用的な記述に変更。「architecture-patterns/design.md を参照」→「ドメインスキルの design.md を参照（存在する場合）」
- **検証方法**: `grep -c 'architecture-patterns' openspec/changes/add-setup-command/design.md` が 0 であること
- **関連要件**: REQ-009
- **関連スペック**: `specs/remove-domain-content/delta-spec.md#REQ-009`
- **依存**: なし

---

### Task 26: 横断残存チェック（最終検証）（推定: 5分）

- **対象ファイル**: 全ファイル
- **やること**: 以下のパターンで横断 Grep を実行し、残存参照がないことを確認する:
  1. 削除したスキル名: `next-best-practices`, `nextjs-api-patterns`, `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-best-practices`, `ui-ux-pro-max`, `prisma-expert`, `database-migrations`, `security-patterns`, `terraform-gcp-expert`, `vitest-testing-patterns`, `webapp-testing`, `architecture-patterns`, `web-design-guidelines`
  2. 削除したエージェント名: `security-sentinel`, `performance-oracle`, `architecture-strategist`, `prisma-guardian`, `terraform-reviewer`, `type-safety-reviewer`, `api-contract-reviewer`
  3. 削除したリファレンスパス: `reference/typescript-rules`, `reference/nextjs/`, `reference/prisma/`, `reference/terraform/`, `reference/common/coding-style`, `reference/common/performance`
  4. TypeScript 固有: `npx tsc --noEmit`（commands/, rules/, reference/ 内）, `npx vitest`（commands/ 内）
  5. 例外: `docs/compound/`（歴史的記録として保持）、`openspec/changes/archive/`（アーカイブとして保持）は除外
- **検証方法**: 上記パターンの Grep 結果が 0 件であること（例外パスを除く）。検証結果のログを出力する
- **関連要件**: REQ-001, REQ-005, REQ-006, REQ-008, REQ-009
- **関連スペック**: `specs/remove-domain-content/delta-spec.md` 全体
- **依存**: Task 1-25（全タスク完了後に実行）
