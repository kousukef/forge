# update-skill-handling 技術設計

## 概要

Forge の Skill 管理を Phase-Aware File Structure に進化させ、フェーズごとに最適な粒度の知識を物理的に分離して提供する。9個のドメイン Skill をファイル分割し、spec-validator の検証観点を拡張し、review の自動チェック・リスク調整を追加し、compound のフィードバックループを強化する。

## リサーチサマリー

### コードベース分析

#### 現在の Skill ファイル構成

```
~/.claude/skills/
├── forge-skill-orchestrator/SKILL.md  (145行)
├── prisma-expert/SKILL.md             (500行)
├── next-best-practices/SKILL.md       (446行)
├── security-patterns/SKILL.md         (413行)
├── architecture-patterns/SKILL.md     (496行)
├── nextjs-api-patterns/SKILL.md       (484行)
├── terraform-gcp-expert/SKILL.md      (488行)
├── vercel-react-best-practices/SKILL.md (362行)
├── vercel-composition-patterns/SKILL.md (404行)
├── database-migrations/SKILL.md       (391行)
├── tailwind-best-practices/SKILL.md   (467行)  ← 分割対象外
├── ui-ux-pro-max-skill/SKILL.md       (306行)  ← 分割対象外
├── web-design-guidelines/SKILL.md     (212行)  ← 分割対象外
├── vitest-testing-patterns/SKILL.md   (459行)  ← 分割対象外
├── webapp-testing/SKILL.md            (387行)  ← 分割対象外
├── frontend-design/SKILL.md           (46行)   ← 分割対象外
├── 方法論Skill 6個                              ← 分割対象外
└── find-skills/SKILL.md               (133行)  ← 分割対象外
```

#### 分割対象の判定基準

9個のドメイン Skill を分割対象とした理由:
- DB 設計の制約・設計含意が明確（prisma-expert, database-migrations）
- App Router 制約・設計パターンが分離可能（next-best-practices, nextjs-api-patterns）
- セキュリティ制約・設計チェックが分離可能（security-patterns）
- 設計パターン選択基準が分離可能（architecture-patterns）
- GCP 制約・設計判断が分離可能（terraform-gcp-expert）
- React パフォーマンス設計基準が分離可能（vercel-react-best-practices, vercel-composition-patterns）

分割対象外の理由:
- 方法論 Skill: フェーズ固有の知識差がない
- tailwind/ui-ux/web-design/frontend-design: 実装寄りの知識が主体、設計含意が限定的
- vitest/webapp-testing: テスト実装専用
- find-skills: ユーティリティ

#### 影響を受ける既存コマンド・エージェント

| ファイル | 現在の Skill 参照方式 | 変更内容 |
|---|---|---|
| `spec-writer.md` | `skills: [iterative-retrieval, verification-before-completion]` | `architecture-patterns` を常時 Skill 追加 + ドメイン Skill 参照ガイダンス |
| `spec-validator.md` | `skills: [iterative-retrieval]` | `architecture-patterns` 追加 + STRIDE + Google 4観点 + LRM |
| `spec.md` | ドメイン判定なし | Phase 1.7 ドメイン判定ステップ追加 |
| `review.md` | Step 1 から開始 | Step 0（L1/L2）追加 + リスクベース深度調整 |
| Review Agent 6個 | `skills: [iterative-retrieval]` | ドメイン Skill 追加 + SSOT ルール |
| `compound.md` | Skill 更新のみ | 派生ファイル同期 + Three Strikes + メトリクス |
| `brainstorm.md` | 制約参照なし | constraints.md 参照ステップ追加 |

#### 既存スペックとの関連

- `domain-skills` スペック: 14の Domain Skills 作成が完了済み。本変更はその上に Phase-Aware 分割を構築
- `workflow-redesign` スペック: /implement の Teams/SubAgents 選択設計は本変更のスコープ外
- `command-args` スペック: コマンド引数の仕様とは独立

### 過去の学び

- **SSOT 原則の重要性**: 知識の重複管理は陳腐化リスクが高い。SKILL.md をマスターとし派生ファイルを部分集合として管理することで対応
- **プロジェクト/グローバル同期漏れ**: CLAUDE.md 更新時に両方を確認する検証ステップが必要
- **コンテキスト圧迫の実測**: spec フェーズで5 Skill ロード時、500行x5=2500行がコンテキストに入る問題を確認

## 技術的アプローチ

### 1. Phase-Aware File Structure

ドメイン Skill を3つのファイルに物理分割し、フェーズに応じて異なるファイルを読み込む。

```
skills/<skill-name>/
├── SKILL.md           # マスター（SSOT）。実装用フル知識 ~500行
├── design.md          # 設計向け。/spec で使用 ~80-120行
└── constraints.md     # 制約のみ。/brainstorm で使用 ~20-30行
```

#### SSOT 原則

- SKILL.md がマスター（Single Source of Truth）
- design.md / constraints.md は SKILL.md の部分集合
- 派生ファイルにのみ存在する知識は禁止
- 新しい知識はまず SKILL.md に追加し、必要に応じて派生ファイルに反映

#### フェーズ別読み込みマッピング

| フェーズ | 読み込みファイル | スキル名指定 | コンテキスト効率 |
|---|---|---|---|
| `/brainstorm` | constraints.md | `<skill>/constraints` | ~20-30行/Skill |
| `/spec` | design.md | `<skill>/design` | ~80-120行/Skill |
| `/implement` | SKILL.md | `<skill>`（現行通り） | ~500行/Skill |
| `/review` | SKILL.md | `<skill>`（現行通り） | ~500行/Skill |

#### コンテキスト削減効果の試算

spec フェーズで5つのドメイン Skill をロードした場合:
- 現行: 500行 x 5 = **2,500行**
- 改善後: 100行 x 5 = **500行**（**80%削減**）

#### フォールバック機構

サフィックス付きスキル名（例: `prisma-expert/design`）で指定されたファイルが存在しない場合:
1. SKILL.md にフォールバック（ファイル分割未実施の Skill に対応）
2. 警告を出力: 「[skill-name] の design.md が未作成です。`/skill-format <skill-name>` で分割してください」

### 2. skill-phase-formatter Skill

Skill のファイル分割を標準化する方法論 Skill。分割基準・手順・検証項目を定義。

#### 分割基準

**constraints.md に含めるもの**:
- 技術的にできないこと（ランタイム制約、API制限、互換性制約）
- 数値的な上限・下限
- 前提条件、禁止事項（理由なし、事実のみ）
- 目安: 20-30行

**design.md に含めるもの**:
- パターン選択の判断基準
- トレードオフの説明
- 非機能要件の考慮事項
- アンチパターンとその理由
- 目安: 80-120行

**design.md に含めないもの**:
- 具体的なコード例（コードブロック）
- 実装手順、API リファレンス

#### 検証項目
- constraints.md が30行以内
- design.md が120行以内
- design.md にコードブロックが含まれていない
- 全内容が SKILL.md の部分集合

### 3. /skill-format コマンド

4つのモード: 単一分割、一括分割（`--all`）、状況確認（`--check`）、同期（`--sync`）

### 4. forge-skill-orchestrator サフィックス判定

フェーズ検出テーブルにサフィックス列を追加し、Sub Agent 向けテンプレートを Phase-Aware 版と標準版に分離。

### 5. spec-validator 検証観点拡張

既存7項目に加えて:
- **項目8: STRIDE 簡易チェック** -- Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege
- **品質基準拡張: Google Design Review 4観点** -- Correctness, Completeness, Consistency, Clarity
- **項目9: Last Responsible Moment** -- Type 1（不可逆）判断は今確定、Type 2（可逆）判断は実装に委譲

### 6. /spec ドメイン判定（Phase 1.7）

proposal.md のキーワードからドメインを推論し、spec-writer/spec-validator に渡すドメイン Skill を決定。

| キーワード | ドメイン | 注入する Skill |
|---|---|---|
| データベース, テーブル, マイグレーション | prisma-database | `prisma-expert/design`, `database-migrations/design` |
| API, エンドポイント, Route Handler | typescript-backend | `nextjs-api-patterns/design`, `security-patterns/design` |
| 画面, コンポーネント, UI | nextjs-frontend | `next-best-practices/design`, `vercel-react-best-practices/design`, `vercel-composition-patterns/design` |
| 認証, 認可, OAuth | security | `security-patterns/design` |
| インフラ, Terraform, GCP | terraform-infrastructure | `terraform-gcp-expert/design` |

判定ルール: 複数ドメイン該当時は全て含める（Union）。`architecture-patterns/design` は常に含める。最大5個まで。

### 7. /review L1/L2 自動チェック + リスクベース深度調整

**Step 0（L1/L2）**: LLM レビュアー起動前に `npx tsc --noEmit` + `npx eslint --quiet` を実行。結果を REVIEW CONTEXT に注入し、同一指摘の重複を防止。

**リスクベース深度調整**:
- **HIGH**: middleware.ts, prisma/schema.prisma, 新規 API, terraform/, .env 変更 → 全レビュアー + spec-compliance-reviewer
- **MEDIUM**: 上記以外の一般的な変更 → 既存ドメイン検出ルール通り
- **LOW**: .css/.md/.test.ts のみ → security-sentinel + type-safety-reviewer のみ

### 8. Review Agent ドメイン Skill 宣言

| Agent | 追加する Skill |
|---|---|
| security-sentinel | `security-patterns` |
| performance-oracle | `next-best-practices`, `prisma-expert` |
| architecture-strategist | `architecture-patterns`, `next-best-practices` |
| prisma-guardian | `prisma-expert`, `database-migrations` |
| terraform-reviewer | `terraform-gcp-expert` |
| api-contract-reviewer | `nextjs-api-patterns`, `security-patterns` |

各 Agent に SSOT ルール追加: ドメイン Skill の内容と Agent 定義が矛盾する場合、ドメイン Skill を優先。

### 9. /compound フィードバックループ強化

**派生ファイル同期（ステップ4.5）**: SKILL.md 更新時に design.md/constraints.md の存在を確認し、影響がある場合に同期更新。

**Three Strikes Rule**: 同一種別の問題が3回蓄積した場合、必ずプロセス改善を提案。

**Shift-Left フィードバック分類**: /review, /test で発見された問題を「設計で防げた」「実装で防げた」「テストで防げた」に分類し、前段フェーズへの防止策を提案。

**レビューメトリクス蓄積**: review-summary.md から P1/P2/P3/ノイズ候補、却下率、カバレッジ率を抽出し `docs/compound/metrics/review-metrics.md` に蓄積。

### 10. /brainstorm constraints.md 参照

ステップ5.5 として技術的制約チェックを追加。constraints.md のみ参照（design.md は参照しない）。ブロッキングではなく、ユーザーが「そのまま進める」と判断すれば許可。提案書に「技術的考慮事項」セクションを追加。

## リスクと注意点

1. **派生ファイルの陳腐化**: design.md/constraints.md がマスターと乖離するリスク → `/compound` での自動同期 + `/skill-format --check` で定期確認
2. **ファイル数増加**: 管理対象が ~18ファイル増加 → 分割対象はドメイン Skill のみ。方法論 Skill は対象外
3. **Claude Code 互換性**: ファイルサフィックス指定（`skill/design`）が期待通り機能するか → フォールバック機構で未分割 Skill にも対応。Phase 1 で検証
4. **Shift-Left Fatigue**: チェック過多で開発速度低下 → brainstorm は constraints.md のみ（~25行）で最小限
5. **CLAUDE.md 更新**: 全 Phase 完了後に core-essentials.md と CLAUDE.md の更新が必要 → 最終検証で同期確認
