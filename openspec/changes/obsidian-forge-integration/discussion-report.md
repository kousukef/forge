# Obsidian × Forge 統合設計議論レポート

## AI駆動ナレッジベースと Forge ワークフローシステムの統合可能性

**2026年3月2日 | Agent Team 多角的議論の成果物（4ラウンド統合版）**

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [議論プロセスと参加エージェント](#2-議論プロセスと参加エージェント)
3. [アーキテクチャ統合分析](#3-アーキテクチャ統合分析)
4. [ワークフロー統合分析](#4-ワークフロー統合分析)
5. [ナレッジフロー分析](#5-ナレッジフロー分析)
6. [ドメイン知識の分類学と配置フレームワーク](#6-ドメイン知識の分類学と配置フレームワークround-3-新セクション) ★Round 3
7. [批判的分析：リスクと代替案](#7-批判的分析リスクと代替案)
8. [MCP 技術リスク評価](#8-mcp-技術リスク評価)
9. [レポート構造の自己検証](#9-レポート構造の自己検証)
10. [PKM 理論からの評価](#10-pkm-理論からの評価)
11. [統合設計提案（修正版）](#11-統合設計提案修正版)
12. [段階的導入計画（修正版）](#12-段階的導入計画修正版)
13. [具体的実装タスクリスト](#13-具体的実装タスクリスト)
14. [KPIと効果測定](#14-kpiと効果測定)
15. [/forge-init 設計：既存プロジェクトへの知識導入戦略](#15-forge-init-設計既存プロジェクトへの知識導入戦略round-4-新セクション) ★Round 4

---

## 1. エグゼクティブサマリー

### 推奨度：Phase 0（内部最適化）最優先 — Vault 統合は Phase 0 の結果次第

4ラウンド計19の専門視点からの分析を総合した結論として、**Obsidian 統合の前に Forge 内部の未活用機能を最大化する「Phase 0」を最優先で実施する**。Phase 0 の効果測定後、不足を感じた場合にのみ段階的に Vault 統合に進む。

**Round 1（初回分析）の結論:**

4つの専門エージェント（architecture-analyst, workflow-analyst, knowledge-analyst, critical-analyst）による分析で、「選択的統合」を推奨しつつも、critical-analyst が「既存層の活用最大化が先」と指摘。

**Round 2（レビュー分析）で追加された重要な知見:**

4つの専門エージェント（Pragmatist, Architect, Critic, KM Expert）が Round 1 のレポートを多角的に検証し、以下の重大な問題を特定:

1. **MCP 接続に未解決の技術的バグ** が複数存在（mcp-remote ツール非表示、graph.path バグ）
2. **レポートの数値根拠が全て定性的見積もり** であり、定量的裏付けがない
3. **推進派3:懐疑派1の構造的バイアス** が Round 1 に存在
4. **代替案A（docs/ を Obsidian で直接開く）** がMCP統合より低リスク・高リターン
5. **PKM 放棄リスク** が最大の運用上の懸念（Web調査結果）

**Round 3（ドメイン知識配置戦略）で追加された重要な知見:**

4つの専門エージェント（Architecture Analyst, Workflow Analyst, KM Theorist, Pragmatic Skeptic）が Round 1-2 の未解決課題「プロジェクト固有ドメイン知識の配置戦略」を深掘り分析:

1. **docs/domain/ + docs/inbox/ の新設**: プロジェクト固有ドメイン知識の明示的配置場所と未分類知識の一時退避場所
2. **ドメイン知識の6類型分類**: 半減期・移植可能性に基づく体系的分類（ビジネスルール、ドメインモデル、ステークホルダー要件、業界規制、技術的制約、運用知識）
3. **「知識の卒業」概念**: プロジェクトスコープから案件横断ナレッジベースへの移行プロセス（3条件 + 4トリガー）
4. **Learning Router にドメインルール分類追加**: 現行 /compound の技術的学びのみのルーティングを拡張
5. **/compound --close（プロジェクト完了モード）**: プロジェクトクローズ時の知識棚卸し機能
6. **業界規制の SSOT 例外**: 案件横断で不変性が高い業界規制は Vault を SSOT とする

**Round 4（知識導入戦略 + /forge-init 設計）で追加された重要な知見:**

2チーム計7エージェントが Round 1-3 の未解決課題「既存プロジェクトへの Forge 導入時に、AIが必要とする知識をどう準備するか」を分析:

1. **根本的洞察「AIが実装する以上、人間が知っているだけでは不十分」**: Round 3 で docs/domain/ を新設したが、ファイルが空のままでは AI は活用できない。AIへの体系的な知識移転メカニズムが必要
2. **/forge-init コマンドの設計**: ソクラテス式質問によるAIへの知識移転コマンド。自動分析→ソース提供→コア質問→深掘り質問→ドキュメント生成の5フェーズ
3. **AIが必要とする15の知識領域（K1-K15）の体系的マッピング**: ビジネスルール、ドメインモデル、ステークホルダー要件等を重要度・自動抽出可能性で分類
4. **情報が収集された領域のみファイル生成（空ファイル禁止）**: Pragmatic Reviewer の指摘を反映し、MVK（Minimum Viable Knowledge）を設計原則とする
5. **/brainstorm との境界整理**: /forge-init はプロジェクト導入時の1回きり（体系的・網羅的）、/brainstorm は各変更の提案時（プロジェクト知識を前提として参照）

**全エージェント（19名）が一致した結論:**

- Phase 0（Forge 内部最適化）を最優先で実施すべき
- memory/ の活用開始はコストゼロで即時着手すべき
- 同期漏れの解決は Vault 統合の前提条件
- フル統合（全フェーズ Vault 参照）は非推奨
- 「人間が書き、AIが読む」原則は正しい
- docs/domain/ + docs/inbox/ を Phase 0a で新設すべき（★Round 3 追加）
- Learning Router へのドメインルール分類追加は即時実施（★Round 3 追加）
- プロジェクト完了時の知識棚卸し（/compound --close）を Phase 3 で設計（★Round 3 追加）
- 業界規制は Vault 20_Tech/regulations/ を SSOT とする例外を認める（★Round 3 追加）
- 既存プロジェクトへの Forge 導入時は /forge-init でAIへの知識移転を実施すべき（★Round 4 追加）
- 空ファイル生成は禁止。情報が収集された知識領域のみドキュメントを生成する（★Round 4 追加）
- /forge-init と /brainstorm の境界を明確にし、機能重複を最小化する（★Round 4 追加）

**修正版ロードマップ:**

```
Phase 0a (1-3日)   : Forge 内部修復（memory/ 活用、同期フック、compound 棚卸し）
                     + docs/domain/ + docs/inbox/ 新設、Learning Router ドメインルール分類追加（★Round 3）
                     + /forge-init コマンド作成（ソクラテス式質問によるAIへの知識移転）（★Round 4）
Phase 0b (2週間)   : 効果測定（「案件横断知識が欲しかった場面」を記録）
                     → 記録 0件 → 終了（Vault 不要）
                     → 記録 3件以上 → Phase 1 へ
Phase 1 (1日)      : Obsidian 最小導入 ★MCP なし（docs/ を Obsidian で直接開く）
Phase 2 (2週間後)  : MCP PoC + /brainstorm 統合（PoC 失敗 → Phase 1 で運用継続）
Phase 3 (1ヶ月後)  : /compound 還元 + /compound --close 設計（★Round 3）
```

---

## 2. 議論プロセスと参加エージェント

### 2.1 議論体制

本レポートは、4ラウンド計19の専門エージェントによる分析を経て統合されたものである。

**Round 1: 初回分析（統合設計の可能性分析）**

| エージェント | 役割 | 視点の特徴 |
|---|---|---|
| **architecture-analyst** | アーキテクチャ統合分析 | 構造的整合性、Context Isolation、MCP設計 |
| **workflow-analyst** | ワークフロー統合分析 | 各フェーズでの具体的活用シナリオ |
| **knowledge-analyst** | ナレッジフロー分析 | 知識ライフサイクル、Single Source of Truth |
| **critical-analyst** | 批判的分析（Devil's Advocate） | リスク、代替案、費用対効果、現実性検証 |

**Round 2: レビュー分析（Round 1 レポートの検証・改善）**

| エージェント | 役割 | 視点の特徴 |
|---|---|---|
| **Pragmatist** | 実践的改善策 | 1人開発者の現実、PKM 放棄リスク、Web 実例調査 |
| **Architect** | 技術リスク評価 | MCP バグ調査、呼び出しチェーン分析、代替アーキテクチャ |
| **Critic** | 論理構造検証 | 数値根拠、バイアス分析、測定基準の妥当性 |
| **KM Expert** | ナレッジ管理理論 | Zettelkasten/LYT/PARA 理論、知識循環設計 |

**Round 3: ドメイン知識配置戦略分析（プロジェクト固有知識の配置・ライフサイクル設計）**

| エージェント | 役割 | 視点の特徴 |
|---|---|---|
| **Architecture Analyst** | アーキテクチャ統合分析 | Internal/External Layer 分離、パターンD、SSOT 時間軸分離 |
| **Workflow Analyst** | ワークフロー統合分析 | Learning Router ギャップ分析、docs/domain/ + inbox/ 提案、摩擦ポイント特定 |
| **KM Theorist** | ナレッジ管理理論分析 | 6類型分類、知識の卒業概念、PKM 4フレームワーク適用（pkm-theory-analysis.md） |
| **Pragmatic Skeptic** | 実践的懐疑・検証 | 実態データ分析、PKM 失敗パターン、撤退基準の具体化 |

**Round 4a: 知識保管アーキテクチャ分析（3エージェント）**

| エージェント | 役割 | 視点の特徴 |
|---|---|---|
| **knowledge-architecture-analyst** | 知識保管構造分析 | Layer 0-5 の保管経路、知識フロー図、ギャップ分析 |
| **onboarding-strategist** | 導入戦略設計 | MVK（Minimum Viable Knowledge）、/forge-init 初期設計、段階的知識準備 |
| **pragmatic-critic** | 実践的批判 | 過剰準備リスク、/forge-init 不要論、自然蓄積派 |

**Round 4b: /forge-init コマンド設計（4エージェント）**

| エージェント | 役割 | 視点の特徴 |
|---|---|---|
| **knowledge-requirements-analyst** | AI必要知識分析 | 15知識領域マッピング、フェーズ別必要度、自動抽出可能性 |
| **interaction-designer** | ソクラテス式対話設計 | 5フェーズフロー、7ドメイン質問、収束判定基準 |
| **technical-architect** | コマンド技術設計 | コマンド定義、Agent 設計、ドキュメントテンプレート |
| **pragmatic-reviewer** | 実践的レビュー | /brainstorm との境界、空ファイル禁止、段階的生成 |

### 2.2 議論体制の限界（Round 2 Critic による自己検証）

Round 1 には以下の構造的偏りが存在する:

- architecture/workflow/knowledge の3エージェントは **名前自体に「統合」が含まれ、統合方法の検討がデフォルト前提** となっている
- **推進派3:懐疑派1** の構成であり、結論が「選択的統合」に傾くのは構造的に予測可能
- Round 2 で4エージェント全員が Phase 0 最優先に合意したことで、このバイアスは補正されている

### 2.3 分析方法

各エージェントは Forge プロジェクトの既存構造（CLAUDE.md、rules/、reference/、docs/、openspec/、.claude/skills/、.claude/commands/、.claude/agents/、.claude/hooks/）を実際に調査した上で、提案書との対比分析を行った。Round 2 では Web 検索による外部事例調査も実施した。Round 3 では Round 1-2 の議論レポートを入力として、未解決課題「プロジェクト固有ドメイン知識の配置戦略」に焦点を当てた深掘り分析を実施。KM Theorist は PKM 理論（Zettelkasten、PARA、LYT、CODE）の体系的適用分析を独立レポート（pkm-theory-analysis.md）として記録した。Round 4 では2つの Agent Team を並行投入し、Team 1（3エージェント）がプロジェクトごとの知識保管場所・保管経路を分析、Team 2（4エージェント）がユーザーの重要フィードバック「実装はAIが行うので人間が知っているだけだと意味がない」を受けて /forge-init コマンドの設計を実施した。

---

## 3. アーキテクチャ統合分析

### 3.1 Forge 既存アーキテクチャの評価

Forge は既に以下の多層知識管理アーキテクチャを実現している：

```
[Internal Layers（プロジェクト内）]
Layer 0: hooks/              （自動ガードレール、0トークン）
Layer 1: CLAUDE.md           （常時読込、~100行）
Layer 2: rules/ + reference/ （オンデマンド参照）
Layer 3: Skills + docs/      （スキャン→フルロード）
  └── docs/domain/           （★Round 3 追加: プロジェクト固有ドメイン知識）
  └── docs/inbox/            （★Round 3 追加: 未分類知識の一時退避）
Layer 4: OpenSpec            （変更単位の仕様管理）
+ memory/                    （セッション間メモリ）★未使用

[External Layer（案件横断）]
Layer 5: Obsidian Vault      （★Phase 1以降で段階導入）
+ Agent群                    （専門エージェント20+）
```

提案書の3層モデルと比較すると、Forge は既に **より細粒度の層分離** を達成している。Round 3 の Architecture Analyst は、Internal Layers（Layer 0-4）の強化を Phase 0 で先行し、External Layer（Layer 5）は Phase 1 以降に段階導入する「パターンD（ハイブリッド段階モデル）」を提案した。

**知識保管経路の詳細フロー（★Round 4 追加）:**

Round 4 の knowledge-architecture-analyst が、各知識領域（K1-K15）がどの Layer に保管され、どのフェーズで参照されるかを分析した:

```
知識の生成源              保管経路                       参照フェーズ
───────────────────────────────────────────────────────────────────
暗黙知（人間の頭）         │                              │
  ↓ /forge-init           │                              │
  ├─ K1 ビジネスルール    → docs/domain/business-rules.md → /brainstorm, /spec
  ├─ K2 ドメインモデル    → docs/domain/domain-model.md   → /spec, /implement
  ├─ K3 ステークホルダー  → docs/domain/stakeholders.md   → /brainstorm
  ├─ K14 技術的負債       → docs/domain/tech-constraints.md→ /brainstorm
  │                        │                              │
コードベース自動分析       │                              │
  ↓ codebase-analyzer     │                              │
  ├─ K5 技術スタック      → openspec/project.md           → 全フェーズ
  ├─ K6 外部依存          → openspec/project.md           → /spec, /implement
  ├─ K7 データモデル      → docs/domain/domain-model.md   → /spec, /implement
  ├─ K8 認証・認可        → docs/domain/tech-constraints.md→ /implement, /review
  ├─ K10 インフラ構成     → docs/domain/runbooks/         → /implement
  └─ K15 コーディング規約 → reference/ + CLAUDE.md        → /implement, /review
```

**KM Expert の PKM 理論評価: A-（優秀）**

Forge の9層構造は Luhmann の Zettelkasten が追求した「外部化された思考パートナー」を、AI エージェントで部分的に実現している。特に Skills（パターンの実行可能なコード化）と Agents（専門知識の人格化）は、従来の PKM にはない革新的アプローチ。

### 3.2 構造的重複と補完の分析

> **注意（Round 2 Critic による検証）:** 以下の「重複度」は全て **定性的見積もり** であり、定量的な算出根拠はない。機能カバー率・ユースケースカバー率・情報量カバー率のいずれを指すかも未定義である。critical-analyst の「80-90%」と他エージェントの「60-70%」の乖離は、「案件横断知識」の重要度の重み付けの違いに起因すると推測される。

| 提案書の概念 | Forge 既存の対応物 | 重複度（定性的見積もり） | Obsidian の追加価値 |
|---|---|---|---|
| Layer 1: CLAUDE.md | CLAUDE.md（既存） | **100%** | なし |
| Layer 2: Skills/docs | Skills + docs/ + reference/ | **100%** | なし |
| Layer 3: Obsidian Vault | docs/compound/ + memory/ | **60-90%**（評価者により差異） | 案件横断・長期蓄積・人間の知識整理体験 |
| プロジェクトコンテキスト | openspec/project.md | **90%** | 案件横断の一覧性 |
| コーディング規約 | reference/ + Skills | **95%** | なし |
| ドメイン知識 | docs/domain-rules.md 等 | **70%** | 案件横断のドメインパターン |
| ADR | docs/compound/decisions/ | **80%** | 案件横断の意思決定履歴 |
| パターン/アンチパターン | Skills + docs/ | **85%** | 案件横断パターン集 |
| 品質基準 | reference/ + Skills | **90%** | なし |
| 過去の失敗 | docs/compound/learnings/ | **75%** | 案件横断のゴッチャ集 |

**結論：** Obsidian が真に追加価値を提供するのは **「案件横断」** と **「長期蓄積」** の2軸である。単一プロジェクト内の知識管理では Forge 既存システムで十分。

> **Round 2 Critic 補足:** 「案件横断」の価値は **管理するプロジェクト数に強く依存** する。1人開発者が同時に管理するプロジェクトが2-3件程度なら、docs/ の手動参照で十分な可能性がある。この閾値分析は未実施であり、Phase 0b の効果測定で検証すべき。

### 3.3 Layer 統合設計

Obsidian Vault は Forge の **Layer 5（外部ナレッジベース）** として位置づける：

```
┌─────────────────────────────────────────────┐
│                   Forge 統合アーキテクチャ                │
├─────────────────────────────────────────────┤
│                                             │
│  [Layer 0] Hooks ──────── 自動ガードレール        │
│      ↓                                      │
│  [Layer 1] CLAUDE.md ──── アイデンティティ + ポインタ │
│      ↓                                      │
│  [Layer 2] rules/ + reference/ ── 規約・ルール    │
│      ↓                                      │
│  [Layer 3] Skills + docs/ ── ワークフロー・手順    │
│      ↓                                      │
│  [Layer 4] OpenSpec ────── 変更単位の仕様管理      │
│      ↓                                      │
│  [Layer 5] Obsidian Vault ─ 案件横断ナレッジ      │
│      │    (MCP経由、読み取り専用)                  │
│      │                                      │
│      └── 00_MOC/ ← AIナビゲーションの入口        │
│          10_Projects/ ← 案件別ドメイン知識       │
│          20_Tech/ ← 案件横断の技術知識           │
│                                             │
│  [memory/] ──────────── セッション間メモリ        │
│  [Agent群] ──────────── 専門エージェント          │
│                                             │
├─────────────────────────────────────────────┤
│  アクセスルール:                                │
│  - Layer 1-4: 全フェーズで自動参照              │
│  - Layer 5: /brainstorm, /compound,           │
│            /vault-search 時のみ参照            │
└─────────────────────────────────────────────┘
```

**Architect の構造分析:** Layer 5 は「新しい層の追加」ではなく「外部サービスとの統合ポイント」。循環依存は生まれない（一方向の読み取りのみ）。問題は「層の数」ではなく「層間の同期コスト」にある。

### 3.4 Context Isolation との整合性

Forge の Context Isolation Policy では Main Agent はオーケストレーション専任で実装ファイルの Read も禁止されている。Vault 参照もこのポリシーに従う：

| Agent | Vault アクセス権限 | 理由 |
|---|---|---|
| Main Agent | **間接参照のみ**（Agent経由） | Context Isolation 遵守 |
| spec-writer | **読み取り可**（brainstorm時のみ） | ドメイン知識が提案品質に直結 |
| implementer | **読み取り不可**（docs/で十分） | プロジェクト内知識で完結すべき |
| ~~reviewer群~~ | ~~読み取り可~~ | ~~案件横断パターン違反の検出~~ |
| compound agent | **書き込みのみ**（40_Inbox/） | 学びの Vault 還元 |

> **Round 2 修正:** /review での Vault 参照は ROI 不明確のため **不採用**。/vault-search はユーザー明示的コマンドのため Main Agent での実行を許容するが、結果はサマリー表示のみ（フルテキストは返さない）。

### 3.5 MCP 接続設計

**aaronsb/obsidian-mcp-plugin（Semantic MCP Native Plugin）** を採用。Native Plugin は Obsidian 内部で動作し、バックリンクインデックスへの直アクセス、multi-hop グラフ走査、セマンティック検索を提供する。

```bash
# Native Plugin 経由で MCP 接続（mcp-remote ブリッジ使用）
claude mcp add obsidian-vault -s user -- \
  npx -y mcp-remote http://localhost:3001/mcp
```

**Obsidian 側の設定:**
- Community Plugins から "Semantic MCP" (aaronsb) をインストール・有効化
- Settings > Semantic MCP > **Read-only Mode: ON**
- HTTP ポート: 3001（デフォルト）

**Native Plugin が提供するツール群:**
- `vault`（list, read, search）: ファイル一覧、本文取得、セマンティック検索
- `graph`（traverse, search-traverse, backlinks）: グラフ走査、キーワード付き走査、バックリンク取得

**トークンバジェット管理：**
- MCP サーバー追加による常時コスト: ツール定義で約 500-1000 トークン/リクエスト
- Vault ファイル読み取り時: ファイルサイズに依存（アトミックノート原則で 200行以下に制限）
- graph traverse: depth <= 2, maxNodes <= 30 に制限（トークン爆発防止）
- **緩和策:** Vault 参照は /brainstorm, /compound, /vault-search のみに限定し、常時参照を避ける

> **重要（Round 2 Architect による技術リスク）:** この接続方式には未解決の技術的問題がある。詳細はセクション8を参照。**Phase 2 で PoC（接続確認）を必ず実施してから設計を進めること。**

---

## 4. ワークフロー統合分析

### 4.1 フェーズ別 Vault 活用設計

#### /brainstorm フェーズ（★★★ 最高価値）

**現状:** proposal.md はユーザーの口頭指示とプロジェクト内 docs/ に基づいて生成される。

**Vault 統合後:**
```
ユーザー指示
    ↓
[brainstorm Agent]
    ├── docs/ 参照（プロジェクト固有知識）
    ├── openspec/specs/ 参照（既存仕様）
    └── Vault 参照（★追加）
        ├── 00_MOC/Home.md → 関連技術MOC特定
        ├── 20_Tech/adr/ → 過去の類似意思決定
        ├── 20_Tech/gotchas/ → 関連ゴッチャ
        └── 10_Projects/他案件/ → 類似実装の知見
    ↓
proposal.md（品質向上）
```

**具体的ユースケース:** 案件Aで認証機能を /brainstorm する場合：
1. Vault の `00_MOC/Security.md` → 認証関連ノートの一覧を取得
2. `20_Tech/adr/auth-strategy-*.md` → 過去の認証設計判断を参照
3. `20_Tech/gotchas/jwt-token-*.md` → JWT 関連のハマりポイントを取得
4. `10_Projects/ClientB/domain/auth-flow.md` → 別案件の認証フロー知見

**期待効果:** proposal.md に「過去の失敗を踏まえた提案」が含まれるようになる。

#### /spec フェーズ（★ 限定的価値 — Round 2 で下方修正）

> **Round 2 修正:** /spec での自動的な Vault 参照は **不採用** とする。

**理由（Pragmatist 分析）:**
1. /brainstorm で得た知見は proposal.md に既に記載済み。/spec は proposal.md を入力として design.md を生成するため、Vault の知見は間接的に流入する
2. vault-knowledge-researcher（5番目のリサーチャー）の追加は、4リサーチャーで十分機能している現状に対してトークンコスト（~2000トークン/spec実行）に見合わない
3. /spec の目的は「提案を仕様に変換する」ことであり、新しい知識を探索するフェーズではない

**代替:** /spec 設計中に追加知識が必要な場合は、ユーザーが `/vault-search` を手動で呼び出す。

#### /implement フェーズ（Vault 直接参照は不要 — 変更なし）

**判定：Vault 直接参照は不要。**

理由：
- implementer は Context Isolation 下で動作し、プロジェクト内ファイルのみ参照すべき
- 必要なパターン知識は /brainstorm → /spec フェーズで design.md に既に反映済み
- Vault 参照はスコープクリープのリスクを増大させる

#### /review フェーズ（不採用 — Round 2 で下方修正）

> **Round 2 修正:** /review での Vault 参照は **不採用** とする。

**理由（Pragmatist 分析）:** ROI 不明確。reviewer がフルに Vault を読むとトークン爆発するリスクがあり、review-aggregator による事前検索パイプラインの構築コストに見合う効果が実証されていない。Phase 3 以降の運用実績に基づいて再検討する。

#### /compound フェーズ（★★★ 最高価値 — 還元フロー詳細化）

**現状:** 学びは docs/compound/ に種別ルーティングされるが、プロジェクトスコープに閉じる。

**Vault 統合後の還元フロー（Round 2 で詳細化）:**
```
/compound 実行
    ↓
[compound agent]
    ├── docs/compound/ に学びを書き出し（既存動作、変更なし）
    │   ├── learnings/   ← gotcha
    │   ├── decisions/   ← ADR
    │   └── metrics/     ← プロセス改善
    │
    └── ★案件横断性の判定（追加ステップ）
        │
        ├── 判定基準（ヒューリスティック）:
        │   ├── 技術名（Prisma, NextAuth等）を含む → 高
        │   ├── 「〜すべきでない」「〜に注意」形式 → 高
        │   ├── ビジネスロジック固有の記述 → 低
        │   └── プロジェクト固有の設定値 → 低
        │
        ├── 高: ~/vault/40_Inbox/ にドラフト自動生成
        │   ├── フロントマター（type, domain, tags, source_file, status: draft）
        │   ├── 本文: compound の教訓セクションを転記
        │   └── [[リンク]] 候補を提示
        │
        ├── 中: ユーザーに確認（AskUserQuestion）
        │
        └── 低: docs/ のみ（既存動作）
    ↓
人間が Obsidian で整理（週1回10分）
    ├── 40_Inbox/ → 20_Tech/gotchas/ 等に移動
    ├── [[リンク]] 確認・修正
    ├── status: draft → validated に変更
    └── 不要なら削除
    ↓
次回 /brainstorm で自動参照
```

**Learning Router ドメインルール分類（★Round 3 追加）:**

現行の /compound は技術的学び（gotcha, pattern, ADR）のルーティングのみ実装しており、ドメインルールの分類が欠落していた。Round 3 で以下の分類を追加:

```
/compound 実行時の Learning Router（拡張版）:
    ├── 既存ルーティング:
    │   ├── gotcha → docs/compound/learnings/
    │   ├── ADR → docs/compound/decisions/
    │   └── metrics → docs/compound/metrics/
    │
    └── ★ドメインルール分類（Round 3 追加）:
        ├── ビジネスルール → docs/domain/business-rules.md
        ├── ドメインモデル → docs/domain/domain-model.md
        ├── ステークホルダー要件 → docs/domain/stakeholders.md
        ├── 技術的制約 → docs/domain/tech-constraints.md
        ├── 運用知識 → docs/domain/runbooks/
        ├── 業界規制 → ~/vault/20_Tech/regulations/（Vault SSOT）
        └── 分類不明 → docs/inbox/（一時退避）
```

**docs/inbox/ スキャン機能（★Round 3 追加）:** /compound 実行時に docs/inbox/ を自動スキャンし、分類可能になった知識を docs/domain/ の適切なファイルに移動提案する。

**/compound --close（プロジェクト完了モード）（★Round 3 追加）:**
- プロジェクトクローズ時に docs/ 内の全ドメイン知識を走査
- 6類型に基づく分類と「卒業の3条件」に照らした卒業候補の提示
- 卒業先: Vault 20_Tech/（一般化パターン）or Vault 10_Projects/（卒業済みアーカイブ）
- 卒業しない知識: Archives 処理（プロジェクトスコープに閉じて保管）

**SSOT 設計（Round 2 で簡略化、Round 3 で例外追加）:**
- **docs/compound/ が唯一の SSOT（正）**
- **Vault は docs/ の「整理・改善版ビュー」（副）**
- Vault が消えても docs/compound/ から再生成可能（source_file で追跡可能）
- 両方に同じ情報が存在するが、Vault 側は人間が編集・改善した版。内容が異なっても問題ない

**「人間が書き、AIが読む」原則との整合性：**
- AI は直接 Vault を編集しない（40_Inbox/ への Write のみ）
- AI が生成するのは「ドラフト」であり、人間が承認・整理する
- KM Expert: この原則は Zettelkasten, PARA, GTD, LYT の全主要PKMフレームワークと整合

### 4.2 Slash Commands 連携設計

| 既存 Forge コマンド | Obsidian 連携 | 統合方法 |
|---|---|---|
| /brainstorm | Vault 参照を brainstorm Agent に組み込み | brainstorm スキル/コマンドの拡張 |
| ~~/spec~~ | ~~Vault 参照を spec-writer Agent に組み込み~~ | **不採用**（/brainstorm で十分） |
| /compound | Vault 還元パイプライン追加 | compound コマンドの拡張 |
| ~~/review~~ | ~~reviewer に Vault サマリー提供~~ | **不採用**（ROI 不明確） |

| 提案書のコマンド | Forge での位置づけ | 採用判定 |
|---|---|---|
| /today | Forge ワークフローと直交 | × 不採用（PKM 放棄リスク） |
| /learn | /compound の学び機能と重複 | × 不採用（/compound で統合） |
| /wrapup | /compound と類似 | × 不採用（/compound で統合） |
| /research | Vault 横断検索 | ○ 採用（/vault-search として追加） |

| ★Round 3 追加コマンド | 説明 | Phase |
|---|---|---|
| /compound --close | プロジェクト完了時の知識棚卸しモード。docs/ 内の全ドメイン知識を走査し、6類型に基づく卒業候補を提示 | Phase 3 |

**新コマンド `/vault-search` の提案:**
```
/vault-search <query>
→ Obsidian Vault を MCP 経由で検索
→ 関連ノートのサマリーを表示（フルテキストは返さない）
→ /brainstorm の前に手動で呼び出し可能
→ /spec 中に追加知識が必要な場合にも使用
```

### 4.3 具体的ユースケースシナリオ（Round 2 修正版）

**シナリオ: 案件A で認証機能（NextAuth.js + Prisma）を実装**

```
Day 1 作業開始:
  $ claude
  > /vault-search "認証 authentication NextAuth"
    → Vault から関連ノート3件発見:
      - 20_Tech/adr/auth-nextauth-vs-clerk.md
      - 20_Tech/gotchas/nextauth-prisma-adapter.md
      - 10_Projects/ClientB/domain/auth-requirements.md

  > /brainstorm 認証機能を実装したい。NextAuth.js + Prisma Adapter を使用。
    → brainstorm Agent が上記 Vault ノートも参照
    → proposal.md に「ClientB での Adapter 設定ハマり（gotcha参照）を考慮」が自動記載

  > /spec （承認後）
    → spec-writer は proposal.md の情報を基に design.md を生成
    → proposal.md に含まれる Vault 由来の知見が design.md に自然に反映
    → （必要に応じて /vault-search を手動実行し追加知識を取得）

  > /implement
    → implementer は docs/ + design.md のみ参照（Vault 直接参照なし）
    → 実装完了

  > /review
    → reviewer はプロジェクト内知識で十分（Vault 参照なし）

  > /compound
    → 新しい学び: 「NextAuth Prisma Adapter v5 では createdAt の型が変更」
    → docs/compound/learnings/ に記録（SSOT）
    → 案件横断性: 高（技術名含む gotcha）
    → ~/vault/40_Inbox/gotcha-prisma-adapter-v5-createdAt-type.md を自動生成
    → 人間が週次で Obsidian を開き、20_Tech/gotchas/ に移動、[[Prisma]] [[NextAuth]] リンク付与
```

---

## 5. ナレッジフロー分析

### 5.1 知識の生成源と蓄積先の整理（Round 2 修正版）

```
知識の生成源                    蓄積先（現状）         蓄積先（統合後）
─────────────────────────────────────────────────────────────────
Forge /compound               docs/compound/        docs/compound/(SSOT) + Vault(ビュー)
過去のハマり体験                docs/gotchas.md       docs/ + Vault 20_Tech/gotchas/
設計判断                       docs/adr/             docs/ + Vault 20_Tech/adr/
案件固有ドメイン知識            docs/domain-rules.md  docs/domain/（★Round 3で明確化）+ Vault 10_Projects/
案件横断パターン                Skills                Skills + Vault 20_Tech/patterns/
業界規制                       docs/（散在）          ~/vault/20_Tech/regulations/（★Vault SSOT）
未分類知識                     （なし）               docs/inbox/（★Round 3 新設）
Claude Code memory             memory/               memory/（変更なし）
```

> **Round 2 修正:** 「人間の日常メモ → Vault 30_Daily/」は **削除**。30_Daily/（デイリーノート）は PKM 放棄の最大原因であり、1人開発者には不向き。日々の気づきは /compound → docs/compound/ が担う。

### 5.2 Single Source of Truth 設計（Round 2 で簡略化）

**問題：** docs/compound/ と Vault 20_Tech/ に同じ情報が二重存在するリスク。

**解決策（Round 2 修正版）: docs/ が正、Vault はビュー**

Round 1 では「Ownership-Based SSOT」（知識のオーナーシップによる分離）を提案したが、Round 2 の Pragmatist 分析で「1人開発者が毎回『プロジェクト固有か案件横断か』を判断する認知負荷が高い」と指摘された。

**簡略化されたルール:**
- **docs/compound/ が全ての学びの SSOT（原本）**
- **Vault は人間が整理した「ベスト版ビュー」**
- /compound は常に docs/ に書き出す（既存動作、変更なし）
- 月次の Vault 整理時に、人間が「これは案件横断だな」と思ったものだけ Vault にコピー
- Vault が壊れても docs/ から復元可能

**知識の流れ:**
```
docs/compound/ (SSOT: 正)
       │
       │  案件横断と判定されたもの
       ↓
~/vault/40_Inbox/ (ドラフト: AI生成)
       │
       │  人間が整理
       ↓
~/vault/20_Tech/ (ビュー: 副、人間が改善した版)
```

### 5.3 知識配置基準フレームワーク

```
        高頻度参照
            │
   ┌────────┼────────┐
   │        │        │
   │  docs/ │Skills/ │  ← 毎タスク参照
   │reference/│      │
   │        │        │
   ├────────┼────────┤
   │        │        │
   │OpenSpec│ Vault  │  ← 特定フェーズのみ
   │        │ MOC    │
   │        │        │
   └────────┼────────┘
            │
        低頻度参照

   浅い知識 ←────→ 深い知識
```

**配置判断ルール：**
1. **毎タスク参照 × 浅い** → CLAUDE.md / rules/
2. **毎タスク参照 × 深い** → Skills / docs/
3. **特定フェーズ × 浅い** → OpenSpec
4. **特定フェーズ × 深い** → Vault
5. **案件横断** → Vault（条件なし）

### 5.4 Compound Learning → Vault 還元の詳細設計

**40_Inbox/ ドラフトのフォーマット:**

```markdown
~/vault/40_Inbox/gotcha-prisma-adapter-v5-createdAt-type.md
---
type: gotcha
domain: [prisma, nextauth]
source_project: forge
source_file: docs/compound/learnings/2026-03-02.md
date: 2026-03-02
status: draft
---

# Prisma Adapter v5 では createdAt カラムの型が DateTime? に変更

NextAuth Prisma Adapter v5 にアップグレードすると、createdAt カラムが
NOT NULL → nullable に変更される。既存データがある場合、マイグレーション失敗。

## 対処法
expand-contract パターンで段階的に移行する

## 関連リンク候補
- [[Prisma]]
- [[NextAuth]]
- [[Database Migration]]
```

**ポイント:**
- `source_file` で docs/compound/ の元ファイルへの参照を保持（トレーサビリティ）
- `status: draft` で「人間未レビュー」を明示
- `[[リンク]]` は候補として提示するのみ。人間が最終判断

### 5.5 陳腐化管理（Round 2 KM Expert による改善提案）

| 対象 | 鮮度管理 | 閾値 |
|---|---|---|
| docs/ | なし（手動確認） | — |
| reference/ | なし（変更頻度が低い） | — |
| OpenSpec | changes/ のライフサイクルで自然管理 | — |
| Vault gotcha | last_validated フロントマター | **3ヶ月**（ライブラリ変更で無効化されやすい） |
| Vault ADR | last_validated フロントマター | **6ヶ月**（設計原則は比較的安定） |
| Vault pattern | last_validated フロントマター | **6-12ヶ月**（ベストプラクティスは緩やかに変化） |
| Vault domain | last_validated フロントマター | **12ヶ月**（ビジネスルールは年単位で変化） |
| memory/ | Claude Code が自動管理 | — |

> **Round 2 KM Expert:** 一律3ヶ月ではなく、knowledge_type 別に閾値を設定すべき。また、/brainstorm で参照されたノートの last_validated を自動更新する「使用による自然更新」と、Dataview による「明示的チェック」の併用を推奨。

### 5.6 「知識の卒業」概念（★Round 3 KM Theorist による新概念）

**定義:** 知識の卒業（Knowledge Graduation）とは、プロジェクトスコープに閉じていた知識が、意図的な抽象化・一般化を経て、案件横断の個人ナレッジベースに移行するプロセスである。

**卒業の3条件:**

| 条件 | 変容 | 検証方法 |
|---|---|---|
| 具体 → 抽象 | 「案件Aでは消費税1円未満切り捨て」→「金融ドメインの端数処理パターン」 | 元のプロジェクト名を削除しても意味が通じるか |
| 固有 → 一般化 | 「NextAuth v5 で createdAt が nullable に」→「ORM アダプター更新時のスキーマ確認パターン」 | 異なる技術スタックでも適用可能か |
| コンテキスト付き → コンテキストフリー | 「CTO が3階層承認を指定」→「承認フロー設計時の組織構造考慮」 | 元のステークホルダーを知らない人が読んでも有用か |

**卒業の4つのトリガーイベント:**

| トリガー | 説明 | Forge アクション |
|---|---|---|
| **プロジェクト完了** | クローズ時の知識棚卸し | `/compound --close` |
| **2回目の遭遇** | 同じパターンが別プロジェクトで出現 | `/brainstorm` 時に類似知識を検出 |
| **反復的参照** | 同じノートが3回以上参照 | 参照カウントで自動検知 |
| **技術ブログ化** | 外部発信時に一般化が自然発生 | CODE の Express 段階 |

**「卒業しない知識」の重要性:** すべての知識が Vault に昇格すべきではない。ステークホルダー要件や特定バージョンの技術的制約は、プロジェクトライフタイムを超えて保持する価値がない場合が多い。「卒業せずに Archives で安らかに眠る」ことが正しい帰結である。

### 5.7 知識の成熟モデル（★Round 3 追加）

```
Level 0: 暗黙知（頭の中にのみ存在）
  ↓  /compound で言語化
Level 1: docs/（生の記録、プロジェクト固有）
  ↓  案件横断性判定 + 人間の整理（卒業プロセス）
Level 2: Vault 20_Tech/（一般化済み、案件横断）
  ↓  3回以上参照 + パターン化
Level 3: Skills/（実行可能なコード化）
```

この4段階は、Zettelkasten の Fleeting → Literature → Permanent に1段階追加したもの。Skills への昇格は Forge 固有の概念であり、「知識のコード化」という従来の PKM にはない最終段階を表す。

---

## 6. ドメイン知識の分類学と配置フレームワーク（★Round 3 新セクション）

Round 3 の KM Theorist が提案し、全エージェントが合意したドメイン知識の体系的分類。詳細な理論的分析は [pkm-theory-analysis.md](./pkm-theory-analysis.md) を参照。

### 6.1 プロジェクト固有ドメイン知識の6類型

| 類型 | 定義 | 例 |
|---|---|---|
| **ビジネスルール** | ドメインの業務上の制約・計算ロジック | 「月末締め翌月15日払い」「消費税1円未満切り捨て」 |
| **ドメインモデル** | 概念構造・エンティティ関係・ユビキタス言語 | 「顧客」と「アカウント」の区別、集約ルート |
| **ステークホルダー要件** | 特定人物の暗黙的・明示的な期待 | 「CTOはパフォーマンス最優先」 |
| **業界規制** | 法令・業界標準・コンプライアンス | GDPR、PCI DSS、金融規制 |
| **技術的制約** | インフラ・既存システム固有の制約と回避策 | 「APIレートリミット100req/min」 |
| **運用知識** | デプロイ手順・障害対応・ランブック | 「Blue-Green デプロイ切り替え手順」 |

### 6.2 4軸の評価

| 類型 | 半減期 | 移植可能性 | 抽象化可能性 | 暗黙知度 |
|---|---|---|---|---|
| ビジネスルール | 1-3年 | 低（同業界なら中） | 中（パターン化可能） | 高 |
| ドメインモデル | 2-5年 | 低-中（同ドメインなら高） | 高（DDD パターン） | 中 |
| ステークホルダー要件 | 0.5-1年 | 極低 | 低 | 極高 |
| 業界規制 | 3-10年 | 高（同業界で共通） | 高（コンプライアンスパターン） | 低 |
| 技術的制約 | 0.5-2年 | 低（同スタックなら中） | 中（制約回避パターン） | 中 |
| 運用知識 | 1-3年 | 中（類似インフラ間） | 高（ランブックパターン） | 高 |

### 6.3 半減期スペクトラム

```
短命 ← ─────────────────────────────────────────── → 長命
0.5年        1年        2年        3年        5年       10年
  │           │          │          │          │         │
  ├── ステークホルダー要件 ──┤          │          │         │
  │           ├── 技術的制約 ─┤         │          │         │
  │           │    ├── ビジネスルール ──┤          │         │
  │           │    │    ├── 運用知識 ──┤          │         │
  │           │    │    │     ├── ドメインモデル ──┤        │
  │           │    │    │     │          ├── 業界規制 ──────┤
```

### 6.4 PKM 理論の適用結果サマリー

**Zettelkasten: ノート類型への分類**
- ビジネスルール: Fleeting → Literature → Permanent への昇格候補（パターン化されれば）
- ドメインモデル: Literature → Permanent（DDD で既に抽象化済みのことが多い）
- ステークホルダー要件: **Fleeting のまま留まる**（卒業しない）
- 業界規制: **Permanent（初期から）**
- 技術的制約: Fleeting → Literature（「制約回避パターン」に抽象化されれば Permanent）
- 運用知識: Literature → Permanent への昇格候補（ランブックパターン化）

**PARA: プロジェクト完了時のライフサイクル**
- アクティブ期: 全ドメイン知識 → docs/（Forge の Projects に対応）
- 完了時: ビジネスルール/ドメインモデル → Resources、ステークホルダー要件 → Archives、業界規制 → Areas、技術的制約 → Archives、運用知識 → Areas or Archives

**CODE: Forge ワークフローとの対応**
- Capture/Organize: docs/ で発生（/compound の自動蓄積）
- Distill/Express: Vault で発生（人間の整理 → /brainstorm での参照）

### 6.5 ドメイン知識類型別の配置先対応表

| 類型 | 生成時配置 | 卒業後配置 | 卒業条件 |
|---|---|---|---|
| ビジネスルール | `docs/domain/business-rules.md` | `~/vault/20_Tech/patterns/` | 同パターンが2回出現 |
| ドメインモデル | `docs/domain/domain-model.md` | `~/vault/10_Projects/<domain>/` | プロジェクト完了時の棚卸し |
| ステークホルダー要件 | `docs/domain/stakeholders.md` | **卒業しない**（Archives） | -- |
| 業界規制 | **`~/vault/20_Tech/regulations/`（直接 Vault）** | -- | 初期から案件横断 |
| 技術的制約 | `docs/domain/tech-constraints.md` | `~/vault/20_Tech/gotchas/` | 制約パターンとして一般化 |
| 運用知識 | `docs/domain/runbooks/` | `~/vault/20_Tech/patterns/` | ランブックパターンとして一般化 |

> **SSOT 例外（Round 3 全エージェント合意）:** 業界規制は案件横断で不変性が高いため、Vault 20_Tech/regulations/ を SSOT とする。docs/ からはポインタ（参照リンク）で Vault のノートを指す。

### 6.6 AI + PKM パラダイムの影響

AI による Capture 自動化 + セマンティック検索の組み合わせは、プロジェクト固有知識の管理コスト計算を根本的に変える:

1. **Capture コストの劇的低下**: /compound による自動蓄積
2. **検索コストの劇的低下**: セマンティック検索 + グラフ走査
3. **Distill のジャストインタイム化**: AI が /brainstorm 時に必要部分だけを自動抽出

従来「整理する価値がない」と判断されていたドメイン知識が、**低コストで蓄積・低コストで検索・低コストで活用** できるようになる。docs/domain/ に「やや雑でも良いから」蓄積しておけば、AI が必要な時に必要な部分だけを取り出す。

---

## 7. 批判的分析：リスクと代替案

### 7.1 過剰複雑性のリスク

**Forge の実測データ（critical-analyst による調査結果）：**

| 層 | ファイル数 | 規模 |
|---|---|---|
| CLAUDE.md + USER-CLAUDE.md + core-essentials | 3 | 316行（常時読込） |
| Skills | 185ファイル | 27,587行, 1.8MB |
| Reference | 11ファイル | 60KB |
| docs/compound/ | 4件 | 構造化教訓 |
| OpenSpec | 24+ファイル | 累積スペック + アーカイブ5件 |
| Agents | 18定義 | 2,059行, 108KB |
| Commands | 10定義 | 92KB |
| Hooks | 4定義 | 自動ガードレール |
| memory/ | 0件 | **未使用** |
| **合計** | **260+ Markdown** | **9層の知識管理** |

**critical-analyst の重要な発見：**

> Compound Learning ドキュメント4件中3件で **「同期漏れ」が繰り返し課題として言及** されている（2026-02-18, 2026-02-22, 2026-02-24）。既存層間の同期すら未解決の状態で、外部 Vault との同期を追加するのはリスクが高い。

**Round 2 全エージェント合意:** 同期漏れの解決は Vault 統合の **絶対的な前提条件**。Phase 0a で同期チェックフックを実装し、2週間の検証で同期漏れゼロを確認するまで Phase 1 に進まない。

### 7.2 メンテナンスバーデンの現実（Round 2 で再評価）

**提案書の想定:** 「朝5分 + 週末15分」

**Round 2 Pragmatist の Web 調査結果:**
- PKM 放棄の最大原因は **「システム構築が目的化する」** こと
- 「ノートを取ることに時間を使いすぎて、学びたいことを学ぶ時間がなくなった」（Reddit r/PKMS）
- 「最初の30日で毎日キャプチャする習慣が定着しなければ、システムは放棄される」

**Round 2 KM Expert の推奨:** **週1回10分** の Inbox 処理が心理的ハードルが最も低い（月1回30分より持続しやすい）。

**軽減策（Round 2 修正版）:**
1. /compound の Vault 還元自動化で手動転記を最小化
2. Vault の整理は **週1回10分**（月1回30分より持続しやすい）
3. docs/ が SSOT、Vault はビュー。**日常的には docs/ のみ意識**
4. 40_Inbox/ の放置を許容する設計（Inbox が溜まっても /brainstorm には影響しない）
5. **30_Daily/ は不採用**（デイリーノートは PKM 放棄の最大原因）

### 7.3 トークンコスト増大

**定量的見積もり:**

| 項目 | 追加トークン | 発生頻度 |
|---|---|---|
| MCP ツール定義（6ツール） | ~800 トークン | 毎リクエスト |
| Vault ファイル読み取り（1ノート） | ~500-2000 トークン | Vault 参照時 |
| MOC ナビゲーション | ~300-500 トークン | Vault 参照時 |
| Agent Team での増幅 | 上記 × Agent 数 | チーム実行時 |

**Round 2 Pragmatist の修正:**
- vault-knowledge-researcher を不採用にしたことで、/spec 実行時の追加コスト（~2000トークン）を削減
- /review での Vault 参照も不採用にしたことで、review 時の追加コストを削減
- Vault 参照を /brainstorm + /vault-search + /compound に限定したことで、全体への影響は **2-3%程度** に縮小

### 7.4 「Vault なし」代替案の再評価

**Forge の既存機能で代替可能な範囲:**

| Obsidian の提供価値 | Forge 既存での代替 | カバー率（定性的見積もり） |
|---|---|---|
| ドメイン知識蓄積 | docs/ + Skills | 85% |
| ADR 管理 | docs/compound/decisions/ | 80% |
| ゴッチャ管理 | docs/compound/learnings/ | 80% |
| パターン管理 | Skills | 90% |
| **案件横断知識** | **memory/（限定的）** | **30%** |
| **長期知識蓄積** | **docs/（プロジェクト閉じ）** | **40%** |
| **人間の知識整理体験** | **ファイルツリー（貧弱）** | **20%** |
| **知識グラフ・リンク** | **なし** | **0%** |

**結論：** 単一プロジェクト内の知識管理は 80-90% カバー済み。案件横断・長期蓄積・人間体験の3点で Obsidian に固有の価値がある。

### 7.5 双方向リンクの AI にとっての真の価値

**Native Plugin（Semantic MCP）の採用により、双方向リンクの価値は解決済み:**

1. `graph`（backlinks）ツールで任意ノートのバックリンクを直接取得可能
2. `graph`（traverse）ツールで multi-hop グラフ走査が可能（depth, maxNodes で制御）
3. `graph`（search-traverse）でキーワード付きグラフ走査が可能（scoreThreshold で関連度フィルタ）

> **ただし（Round 2 Architect の警告）:** graph.path が「No path found」を常に返すバグが GitHub Issue で報告されている。multi-hop グラフ走査の信頼性は PoC で必ず検証すること。

### 7.6 段階的統合の最適ポイント（コスト/価値マトリクス）

> **Round 2 Critic による修正:** 「ROI」は定量指標であるべきだが、以下は全て定性的評価のため「コスト/価値マトリクス」に名称変更。

| 統合レベル | 追加コスト | 追加価値 | 評価 |
|---|---|---|---|
| **Level 0: 統合なし** | 0 | 0 | — |
| **Level 1: docs/ を Obsidian で開く**（MCP なし） | 極低 | 中（人間体験） | ★★★★★ |
| **Level 2: MCP接続 + /brainstorm 参照** | 低〜中 | 高（提案品質向上） | ★★★★ |
| **Level 3: + /compound 還元** | 中 | 高（知識循環） | ★★★★ |
| ~~Level 4: + /review 参照~~ | ~~中〜高~~ | ~~中~~ | **不採用** |
| ~~Level 5: 全フェーズ統合~~ | ~~高~~ | ~~低~~ | **不採用** |

> **Round 2 Architect の重要な修正:** Level 1（docs/ を Obsidian で開く、MCP なし）が最も高評価。MCP を使わずに人間のブラウジング体験（グラフ、バックリンク、検索）を獲得でき、追加コストがほぼゼロ。

---

## 8. MCP 技術リスク評価（Round 2 Architect による新セクション）

### 8.1 aaronsb/obsidian-mcp-plugin の成熟度

| 項目 | 値 | 評価 |
|---|---|---|
| Stars | ~247 | 中規模（成長途上） |
| Forks | ~21 | アクティブなコミュニティは小さい |
| Open Issues | ~10 | 大半は依存関係更新。実質バグ2件 |
| 最終更新 | 2026-02-28 | 直近（活発） |
| リリース | 6 tags | 初期段階（v1.0 未到達の可能性） |
| Community Plugin 承認 | **未承認（BRAT 必要）** | 安定性の懸念 |

**注目すべきバグ:** `graph.path` が「No path found」を常に返す Issue が open。multi-hop グラフ走査のコア機能。

**競合:** jacksteamdev/obsidian-mcp-tools（612 stars, 91 forks）の方がコミュニティが大きい。Local REST API 依存でアーキテクチャが異なるが、代替候補として検討価値あり。

### 8.2 Claude Code MCP 接続の既知問題

| Issue | 深刻度 | 影響 |
|---|---|---|
| **mcp-remote 経由のツール非表示（#27159）** | **Critical** | 提案の接続方式そのものが動作しない可能性 |
| **MCP 2025-11-25 互換性問題（#25081）** | **High** | 新仕様フィールドを含むツールが silently drop |
| **SSE アイドルタイムアウト（5分）** | **Medium** | /brainstorm の長い思考中に接続切断 |
| **MCP サーバー再接続問題（#28178）** | **Medium** | セッション開始時の接続エラー |
| **セキュリティ脆弱性（CVE-2025-59536, CVE-2026-21852）** | **Medium** | MCP 統合がアタックサーフェスを増加 |

### 8.3 呼び出しチェーンの深さ

```
Main Agent → Sub Agent (spec-writer) → MCP Tool Call → mcp-remote → HTTP → Obsidian Plugin → Vault
```

**6段階の呼び出しチェーン**。各段階が障害点。mcp-remote を排除できれば1段階削減可能（Obsidian プラグインが stdio トランスポートをサポートする場合）。

### 8.4 Graceful Degradation の設計（Round 2 で追加）

discussion-report の初版では Obsidian 未起動時の振る舞いが未定義だった。

**必須設計:**
- 全ての Vault 参照ポイントで「MCP 接続不可時はスキップして続行」のフォールバックパスを実装
- /brainstorm: Vault 参照をスキップし、docs/ のみで proposal.md を生成
- /compound: Vault 還元をスキップし、docs/compound/ のみに記録
- /vault-search: エラーメッセージを表示し、docs/ 内の検索を代替提案

### 8.5 PoC（Proof of Concept）の必須実施

**Phase 2 の前に以下を検証:**

1. `claude mcp add` でツールが認識されるか（#27159, #25081 の影響確認）
2. `vault(list)` で Vault ファイル一覧が取得できるか
3. `vault(search)` でセマンティック検索が動作するか
4. `graph(traverse)` でグラフ走査が動作するか（graph.path バグの影響確認）
5. `graph(backlinks)` でバックリンクが取得できるか
6. 5分以上のアイドル後に接続が維持されているか

**PoC 失敗時:** Phase 1（docs/ Vault 化、MCP なし）の状態で運用継続。MCP の問題が解決されるまで待つ。

---

## 9. レポート構造の自己検証（Round 2 Critic による新セクション）

### 9.1 数値根拠の信頼性

本レポートで使用される全てのパーセンテージ（カバー率、ROI 等）は **定性的見積もり** であり、定量的な算出根拠はない。表形式にすることで客観的根拠があるかのような誤認を招く可能性があるため、本セクションで明示する。

### 9.2 効果測定基準の限界

Phase 0 の効果測定基準（セクション14）には以下の限界がある:

- 「同期漏れ発生率」はサンプルサイズ4件であり統計的に不十分
- 「知識検索ヒット率 80%以上」の「ヒット」定義と測定方法が曖昧
- 「案件横断知識が欲しかった場面」の記録はユーザーの主観に依存

これらの限界を認識した上で、**完璧な測定ではなく「方向性の判断材料」として使用する** ことを推奨。

### 9.3 撤退基準のサンクコスト対策

Round 1 の撤退基準には「有用」の定義が曖昧で、サンクコストバイアスへの対策がなかった。

**Round 2 改善:**
- Phase 開始前に撤退条件を明文化し、コミットする
- 各 Phase の完了時に「続行/撤退」を判断する明確なチェックポイントを設置
- 判断は「感覚」ではなく、Phase 0b で記録した定量データに基づく

---

## 10. PKM 理論からの評価（Round 2 KM Expert による新セクション）

### 10.1 Forge 9層の理論的評価

| Forge 層 | PKM 理論上の対応概念 | 評価 |
|---|---|---|
| Layer 0: Hooks | GTD の「トリガーリスト」/ 自動ガードレール | 独自層。自動品質担保として優秀 |
| Layer 1: CLAUDE.md | PARA の「Area」に相当するアイデンティティ定義 | 「認知的足場」として理論的に正しい |
| Layer 2: rules/reference | Zettelkasten の「構造ノート」 | オンデマンド参照は「必要十分」原則に合致 |
| Layer 3: Skills/docs | PARA の「Resources」+ LYT の「Evergreen Notes」 | 「実践知のコード化」として秀逸 |
| Layer 4: OpenSpec | GTD の「Projects」に対応 | プロジェクト志向PKMの好例 |
| memory/ | セッション間メモリ（PKM には直接対応なし） | AI 固有の層。**未使用は重大な機会損失** |

### 10.2 MOC 設計への改善提案

LYT フレームワークの原則に基づく改善:

1. **空の MOC を先に作らない**: ノートが10件蓄積してから MOC を自然発生的に作成
2. **MOC は「リンクリスト」ではなく「関係性の地図」**: アイデア間の関係を散文で記述
3. **3層 MOC**: Home → Domain → Topic の3層構造（現設計は2層のみ）

### 10.3 Emergence（創発）の設計不足

Forge の最大の弱点は「予期しない接続の発見」メカニズムの欠如。

**改善提案:** /brainstorm 時に、直接関連のないランダムな Vault ノートを1-2件提示する「セレンディピティモード」。graph(search-traverse) の scoreThreshold を意図的に低く設定し、「弱い関連」を探索。

### 10.4 アトミックノート原則

Vault ノートの粒度基準:
- 1ノート = 1つの独立した知見（Luhmann の原則）
- **200行以下** を推奨（Round 1 の500行は大きすぎる）
- タイトルが「そのノートの主張」を表現（例: `nextauth-prisma-adapter-requires-explicit-createdAt.md`）

### 10.5 PKM 理論の体系的適用（★Round 3 詳細分析）

Round 3 の KM Theorist による詳細な PKM 理論分析は、独立レポートとして別ファイルに記録されている:

- **[pkm-theory-analysis.md](./pkm-theory-analysis.md)**: プロジェクト固有ドメイン知識の最適配置に関する PKM 理論分析レポート
  - ドメイン知識の6類型分類（Taxonomy）と4軸評価
  - Zettelkasten、PARA、LYT、CODE の4フレームワークの体系的適用
  - 「知識の卒業」概念の定式化（3条件 + 4トリガー）
  - Single Vault vs Multi-Vault 戦略の理論的分析
  - AI + PKM の新パラダイム（「人間が書き、AI が読む」+ 「AI が書き、人間が整理する」）
  - Progressive Summarization の具体的適用例

---

## 11. 統合設計提案（修正版）

### 11.1 推奨アーキテクチャ：段階的統合

Round 2 の分析を踏まえ、**Phase 1 で MCP なしの最小統合を先行し、PoC 成功後に MCP 統合に進む** 設計に変更。

```
┌──────────────────────────────────────────────────────┐
│           Forge + Obsidian 段階的統合アーキテクチャ           │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐    │
│  │  Forge Core  │    │    Obsidian Vault        │    │
│  │              │    │    (~/vault/ or docs/)    │    │
│  │  CLAUDE.md   │    │                          │    │
│  │  rules/      │    │  00_MOC/ ←── AI入口      │    │
│  │  reference/  │    │  10_Projects/ ← 案件別   │    │
│  │  Skills      │    │  20_Tech/ ← 横断知識     │    │
│  │  docs/       │    │  40_Inbox/ ← 投入口      │    │
│  │  OpenSpec    │    │                          │    │
│  │  memory/     │    └──────────────────────────┘    │
│  │  Agents      │              │                      │
│  │  Hooks       │              │                      │
│  └──────┬───────┘              │                      │
│         │                      │                      │
│         │  Phase 1: ファイルシステム直接                 │
│         │  Phase 2+: MCP (読み取り専用)                 │
│         │◄─────────────────────┘                      │
│         │                                            │
│  ┌──────┴───────────────────────────────────┐        │
│  │     統合ポイント（2箇所 + 手動検索）         │        │
│  │                                          │        │
│  │  1. /brainstorm → Vault 参照              │        │
│  │     Sub Agent が Vault のドメイン知識を取得  │        │
│  │                                          │        │
│  │  2. /compound → Vault 還元                │        │
│  │     案件横断の学びを 40_Inbox/ にドラフト投入 │        │
│  │                                          │        │
│  │  3. /vault-search → 明示的 Vault 検索      │        │
│  │     ユーザーが任意タイミングで手動実行       │        │
│  │                                          │        │
│  └──────────────────────────────────────────┘        │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │              知識循環フロー                  │        │
│  │                                          │        │
│  │  作業中の学び                              │        │
│  │    → /compound で docs/ に蓄積（SSOT）     │        │
│  │    → 案件横断性判定（AI ヒューリスティック）  │        │
│  │    → Vault 40_Inbox/ にドラフト投入          │        │
│  │    → 人間が週1回10分で整理                  │        │
│  │    → 次回 /brainstorm で自動参照             │        │
│  │                                          │        │
│  └──────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────┘
```

### 11.2 CLAUDE.md 変更点

既存の CLAUDE.md に以下のセクションを **最小限** 追加:

```markdown
## Obsidian Vault参照（案件横断ナレッジ）
案件横断のドメイン知識・ADR・ゴッチャが必要な場合、
MCP 経由で ~/vault/ を参照可能。
- エントリポイント: `00_MOC/Home.md`
- 参照タイミング: /brainstorm, /compound, /vault-search 時のみ
- 原則: 読み取り専用。Vault への書き込みは 40_Inbox/ のみ
- SSOT: docs/compound/ が正。Vault はビュー
- 例外: 業界規制は Vault 20_Tech/regulations/ が SSOT

## プロジェクト固有ドメイン知識（★Round 3 追加）
- docs/domain/: ビジネスルール、ドメインモデル等の明示的配置場所
- docs/inbox/: 未分類知識の一時退避（/compound 時に自動スキャン）
- /brainstorm 時は docs/domain/ も参照対象に含める
```

### 11.3 Agent 定義の変更

**spec-writer Agent の拡張:**
- /brainstorm 実行時に Vault を参照するステップを追加（MCP 接続時のみ）
- 関連 Vault ノートのサマリーを proposal.md の「関連知見」セクションに含める

**compound Agent の拡張:**
- 学びの案件横断性をヒューリスティック判定するステップを追加
- 案件横断の学びを Vault 40_Inbox/ にドラフト生成（status: draft）
- **Learning Router にドメインルール分類を追加（★Round 3）**: ビジネスルール → docs/domain/business-rules.md、技術的制約 → docs/domain/tech-constraints.md 等にルーティング
- **docs/inbox/ スキャン機能（★Round 3）**: /compound 実行時に docs/inbox/ をスキャンし、分類可能な知識を docs/domain/ の適切なファイルに移動提案

**新規: /compound --close コマンド（★Round 3）:**
- プロジェクト完了時に docs/ 内の全ドメイン知識を走査
- 6類型に基づく分類と卒業候補の提示（3条件: 具体→抽象、固有→一般化、コンテキスト付き→コンテキストフリー）
- 卒業先の提案（Vault 20_Tech/ or 10_Projects/）
- 卒業しない知識の Archives 処理

**新規: vault-search コマンド:**
- Vault 内を MCP 経由で検索し、関連ノートのサマリーを表示
- フルテキストは返さない（Context Isolation 配慮）

**不採用:**
- ~~vault-knowledge-researcher Agent~~（4リサーチャーで十分）
- ~~spec コマンドへの Vault 参照追加~~（/brainstorm で十分）
- ~~review-aggregator への Vault 統合~~（ROI 不明確）

### 11.4 Vault 構造（Round 3 修正版）

```
~/vault/
├── 00_MOC/                  ← AI ナビゲーション入口
│   ├── Home.md              ← エントリポイント（10ノート蓄積後に作成）
│   ├── Next.js.md           ← 技術別MOC（必要に応じて段階的に作成）
│   ├── Prisma.md
│   └── Security.md
├── 10_Projects/             ← 卒業済み知識のアーカイブ兼インデックス（★Round 3 で再定義）
│   ├── ProjectA/
│   │   ├── index.md         ← docs/ へのポインタ（アクティブ時）/ 卒業知識の目録（完了後）
│   │   ├── domain/          ← プロジェクト完了後に卒業したドメイン知識
│   │   └── gotchas/         ← 案件固有ゴッチャ
│   └── ProjectB/
├── 20_Tech/                 ← 案件横断（★Forge 最大の追加価値）
│   ├── index.md
│   ├── patterns/            ← Skills 化前のパターン候補
│   ├── gotchas/             ← 案件横断ゴッチャ
│   ├── adr/                 ← 案件横断ADR
│   └── regulations/         ← 業界規制（★Round 3 追加、Vault が SSOT）
├── 40_Inbox/                ← Forge /compound からのドラフト投入先
└── 90_Templates/            ← gotcha/adr の2テンプレートのみ（最小化）
```

**Round 3 で追加された改訂版 docs/ 構造:**

```
docs/
├── compound/                ← /compound 自動蓄積（既存、変更なし）
│   ├── learnings/
│   ├── decisions/
│   └── metrics/
├── domain/                  ← ★新設: プロジェクト固有ドメイン知識
│   ├── README.md            ← 配置ガイド（6類型の説明と配置先）
│   ├── business-rules.md    ← ビジネスルール
│   ├── domain-model.md      ← ドメインモデル・ユビキタス言語
│   ├── stakeholders.md      ← ステークホルダー要件
│   ├── tech-constraints.md  ← 技術的制約
│   └── runbooks/            ← 運用知識
├── inbox/                   ← ★新設: 未分類知識の一時退避場所
│   └── README.md            ← 使い方ガイド
└── (既存ファイル)
```

> **Round 3 の設計原則:**
> - アクティブプロジェクトのドメイン知識は **docs/domain/ が SSOT**
> - Vault 10_Projects/ にはアクティブ時は index.md（ポインタ）のみ配置
> - プロジェクト完了時に /compound --close で卒業判定 → 卒業した知識のみ 10_Projects/ に移動
> - **業界規制は例外**: Vault 20_Tech/regulations/ が SSOT。docs/ からはポインタで参照

**Round 1 からの削除:**
- ~~30_Daily/~~（デイリーノート不採用、PKM 放棄リスク）
- ~~GCP.md, Terraform.md~~ 等の MOC（ノート蓄積前の空 MOC は LYT に反する。必要になってから作成）

**ファイル命名規約:**
```
[type]-[primary-tech]-[topic-as-claim].md

例:
gotcha-prisma-adapter-v5-requires-explicit-createdAt.md
adr-auth-nextauth-chosen-over-clerk.md
pattern-nextjs-error-boundary-with-sentry.md
```

> **Round 2 KM Expert:** タイトルは「そのノートの主張」を表現する命名を推奨。

---

## 12. 段階的導入計画（修正版）

### Phase 0a: Forge 内部修復（1-3日）★最優先

**目標:** Obsidian 導入前に、Forge 既存機能の未活用部分を修復する

**判断基準: 着手前に確認不要。即時実行。**

- [ ] **同期チェックフック実装**: プロジェクト/グローバル間の diff 検出・警告フック（45分）
- [ ] **memory/ の活用開始**: MEMORY.md にプロジェクト基本情報を記載（5分）
- [ ] **docs/compound/ の防止策棚卸し**: 未実施の防止策チェックボックスを消化（2時間）
- [ ] **docs/domain/ ディレクトリ新設**: プロジェクト固有ドメイン知識の明示的配置場所（5分）
- [ ] **docs/inbox/ ディレクトリ新設**: 未分類知識の一時退避場所（5分）
- [ ] **Learning Router にドメインルール分類追加**: compound コマンドの判定ロジックにビジネスルール・規制等を追加（30分）
- [ ] **/brainstorm に docs/domain/ 参照ステップ追加**: brainstorm Agent が docs/domain/ を参照するよう拡張（15分）
- [ ] **/forge-init コマンド作成**: ソクラテス式質問によるAIへの知識移転コマンド（5フェーズ: 自動分析→ソース提供→コア質問→深掘り質問→ドキュメント生成）（★Round 4 追加）（4時間）

**完了基準:** 同期フックが動作し、memory/ が非空、docs/domain/ と docs/inbox/ が存在し、/forge-init が実行可能

### Phase 0b: 効果測定期間（2週間）

**目標:** データに基づいて Vault 統合の必要性を判断する

**判断基準: Phase 0a 完了後に自動開始。**

- [ ] memory/ のセッション間効果を体感で評価
- [ ] 同期フックが実際に diff を検出するか確認
- [ ] **通常の開発作業中に「案件横断知識が欲しかった場面」をメモする（memory/ に記録）**
- [ ] 同期漏れがゼロであることを確認

**完了基準と判断ポイント:**
- 「案件横断知識が欲しかった場面」の記録が **0件 → Vault 統合は不要。終了。**
- 記録が **3件以上 → Phase 1 に進む。**
- 同期漏れが **1件でも発生 → Phase 1 に進まない。フック改善を先に実施。**

### Phase 1: Obsidian 最小導入 ★MCP なし（1日）

**目標:** MCP を使わず、docs/ を Obsidian で開く体験を確認する

**判断基準: Phase 0b で「案件横断知識が欲しかった場面」が3件以上。**

- [ ] Obsidian インストール（10分）
- [ ] ~/vault/ に最小構造を作成: `00_MOC/`, `20_Tech/`, `40_Inbox/`（10分）
- [ ] Phase 0b で記録した「欲しかった知識」を 20_Tech/ に3-5件書く（30分）
- [ ] **MCP 接続はしない**。人間が Obsidian 単体で Vault を使う習慣を2週間試す

**完了基準:** Vault に5件以上のノートがあり、人間が週1回以上参照している

**撤退基準:** 2週間で Obsidian を開いた回数が3回未満 → Vault は向いていない。終了。

### Phase 2: MCP PoC + /brainstorm 統合（Phase 1 の2週間後）

**目標:** MCP 接続の技術的実現可能性を検証し、/brainstorm 統合を実装する

**判断基準: Phase 1 で Obsidian を週1回以上使っている。**

**PoC（必須、設計の前に実施）:**
- [ ] Semantic MCP プラグインインストール + MCP 接続設定（20分）
- [ ] PoC チェックリスト:
  - [ ] `vault(list)` で Vault ファイル一覧が取得できるか
  - [ ] `vault(search)` でセマンティック検索が動作するか
  - [ ] `graph(traverse)` でグラフ走査が動作するか
  - [ ] `graph(backlinks)` でバックリンクが取得できるか
  - [ ] 5分以上のアイドル後に接続が維持されているか
- **PoC 失敗 → Phase 1 の状態で運用継続。MCP の問題が解決されるまで待つ。**

**PoC 成功後:**
- [ ] /vault-search コマンド作成（30分）
- [ ] /brainstorm に Vault 参照ステップ追加（Sub Agent 経由）（1時間）
- [ ] Graceful Degradation 実装（Vault 接続不可時のスキップ処理）（30分）
- [ ] 3回の /brainstorm で効果測定

**完了基準:** /brainstorm の proposal.md に Vault 由来の知見が1件以上含まれる

**撤退基準:** 3回連続で Vault 参照が proposal.md に有用な情報を追加しなかった → MCP 接続を削除。Phase 1 に戻る。

### Phase 3: /compound 還元（Phase 2 の1ヶ月後）

**目標:** /compound 実行時に Vault にドラフトを自動投入する機能を実装する

**判断基準: Phase 2 で /brainstorm の品質向上を3回以上確認。**

- [ ] compound コマンドに案件横断性ヒューリスティック判定ロジックを追加（1時間）
- [ ] 40_Inbox/ へのドラフト投入機能を実装（30分）
- [ ] 週1回10分の Inbox 整理ルーティン確立
- [ ] 知識循環（compound → Vault → brainstorm）が1サイクル完了することを確認
- [ ] **/compound --close（プロジェクト完了モード）の設計・実装**（2時間）
  - docs/ 内の全ドメイン知識を走査し、卒業候補を提示
  - 6類型に基づく分類と卒業先の提案
  - Vault 10_Projects/ への知識アーカイブ

**完了基準:** /compound から Vault にドラフトが自動投入され、次回 /brainstorm で参照される。/compound --close でプロジェクト完了時の知識棚卸しが実行可能

---

## 13. 具体的実装タスクリスト

### 13.1 Phase 0a: Forge 内部修復

| # | タスク | 工数 |
|---|---|---|
| 1 | 同期チェックフック実装（プロジェクト/グローバル diff 検出） | 45分 |
| 2 | memory/MEMORY.md にプロジェクト基本情報記載 | 5分 |
| 3 | docs/compound/ 防止策棚卸し・実施 | 2時間 |
| 4 | docs/domain/ ディレクトリ新設 + README.md（配置ガイド） | 5分 |
| 5 | docs/inbox/ ディレクトリ新設 + README.md（使い方ガイド） | 5分 |
| 6 | Learning Router にドメインルール分類追加（compound コマンド拡張） | 30分 |
| 7 | /brainstorm に docs/domain/ 参照ステップ追加 | 15分 |
| 8 | /forge-init コマンド作成（ソクラテス式質問によるAIへの知識移転）（★Round 4） | 4時間 |

### 13.2 Phase 1: Obsidian 最小導入

| # | タスク | 工数 |
|---|---|---|
| 9 | Obsidian インストール + ~/vault/ 最小構造作成 | 20分 |
| 10 | Phase 0b の記録を基に 20_Tech/ にノート3-5件作成 | 30分 |

### 13.3 Phase 2: MCP PoC + /brainstorm 統合

| # | タスク | 工数 |
|---|---|---|
| 11 | Semantic MCP プラグイン設定 + MCP 接続 | 20分 |
| 12 | PoC チェックリスト実行 | 30分 |
| 13 | /vault-search コマンド作成 | 30分 |
| 14 | brainstorm コマンド/Agent に Vault 参照ステップ追加 | 1時間 |
| 15 | Graceful Degradation 実装 | 30分 |
| 16 | CLAUDE.md に Vault 参照セクション追加 | 5分 |

### 13.4 Phase 3: /compound 還元

| # | タスク | 工数 |
|---|---|---|
| 17 | compound コマンドに案件横断性判定ロジック追加 | 1時間 |
| 18 | 40_Inbox/ ドラフト投入機能実装 | 30分 |
| 19 | /compound --close（プロジェクト完了モード）設計・実装 | 2時間 |

### 不採用タスク（Round 1 から削除）

| タスク | 不採用理由 |
|---|---|
| ~~vault-knowledge-researcher Agent 定義作成~~ | 4リサーチャーで十分 |
| ~~spec コマンドに vault-knowledge-researcher 追加~~ | /brainstorm での参照で十分 |
| ~~review-aggregator の Vault 統合~~ | ROI 不明確 |
| ~~90_Templates/ に多数のテンプレート配置~~ | gotcha/adr の2種のみで十分 |
| ~~reference/vault-integration.md 作成~~ | CLAUDE.md の最小セクションで十分 |

---

## 14. KPIと効果測定

### 14.0 Phase 0 の効果測定（最優先）

| 指標 | Phase 0 前 | Phase 0 後目標 | 測定方法 | Phase 1 に進む条件 |
|---|---|---|---|---|
| 同期漏れ発生 | 4件中3件で言及 | 0件 | 同期フックの diff 検出回数 | 0件が2週間維持 |
| 「案件横断知識が欲しかった場面」 | 未計測 | 計測開始 | memory/ に手動記録 | 3件以上 |
| memory/ の有用性 | 未使用 | 効果検証 | セッション開始時の再構築時間 | — |

> **Round 2 Critic の注意:** これらの測定は完璧な定量評価ではなく「方向性の判断材料」として使用する。主観バイアスのリスクを認識した上で判断すること。

### 14.1 Phase 2 以降の KPI

| 指標 | 目標 | 測定方法 |
|---|---|---|
| /brainstorm での「過去知見反映」率 | 50%以上 | proposal.md に Vault 参照が含まれる割合 |
| Vault ノート数（累積） | 20+ | ノート数カウント |
| Vault ノートの参照頻度 | 週2回以上 | 手動記録 |
| /compound → Vault 還元率 | 30%以上 | 案件横断学びの Vault 投入率 |

### 14.2 定性的KPI

- /brainstorm の提案に「過去の失敗を踏まえた考慮事項」が含まれるようになったか
- 案件切替時に「前の案件でやったあのパターン」を思い出す手間が減ったか
- Vault の手入れが「負担」ではなく「習慣」として定着しているか

### 14.3 撤退基準（Round 2 で強化）

**Phase 1 撤退:** 2週間で Obsidian を開いた回数が3回未満 → Vault は向いていない。終了。

**Phase 2 撤退:**
- PoC 失敗 → Phase 1 に戻る
- /brainstorm で3回連続 Vault 参照が有用でなかった → MCP 接続削除、Phase 1 に戻る

**Phase 3 撤退:**
- Vault メンテナンスが週10分を超え、かつ効果を実感できない場合
- トークンコスト増加が全体の5%を超える場合

**サンクコスト対策:**
- 各 Phase の撤退条件を **開始前に明文化** し、コミットする
- 判断は「感覚」ではなく、記録したデータに基づく
- Vault ノート数が多くなっても、データが撤退基準に該当すれば撤退する

---

## 15. /forge-init 設計：既存プロジェクトへの知識導入戦略（★Round 4 新セクション）

Round 4 の2チーム計7エージェントが設計した、既存プロジェクトへの Forge 導入時にAIへ体系的に知識を移転するためのコマンド設計。

### 15.1 根本的洞察：AIへの知識移転の必要性

**ユーザーからの重要フィードバック:**

> 「実装はAIが行うので、人間が知っているだけだと意味がない」

Round 3 で docs/domain/ を新設し、プロジェクト固有ドメイン知識の配置場所を明確化した。しかし、ディレクトリが存在するだけではファイルは空のまま残り、AIは活用できない。既存プロジェクトへの Forge 導入時には、人間の頭の中にある暗黙知をAIが参照可能なドキュメントとして体系的に初期生成する必要がある。

**Round 4 Team 1 の分析結果:**
- knowledge-architecture-analyst が Layer 0-5 の知識保管経路を分析し、「暗黙知→ドキュメント」への変換経路が不足していることを特定
- onboarding-strategist が MVK（Minimum Viable Knowledge）の概念を提案し、初回導入時に最小限必要な知識セットを定義
- pragmatic-critic は当初「/forge-init は不要、自然蓄積で十分」と主張したが、「AIが実装する以上、初期知識がなければ /brainstorm の品質が低下する」という論点で合意に転換

### 15.2 AIが必要とする15の知識領域（K1-K15）

Round 4 Team 2 の knowledge-requirements-analyst が、Forge の各フェーズでAIが必要とする知識を15領域に体系化:

| ID | 知識領域 | 重要度 | 主な利用フェーズ | 自動抽出可能性 |
|---|---|---|---|---|
| K1 | ビジネスルール・業務ロジック | 必須 | /brainstorm, /spec | 低（暗黙知） |
| K2 | ドメインモデル・ユビキタス言語 | 必須 | /spec, /implement | 中（コードから部分推定可） |
| K3 | ステークホルダー要件・優先度 | 必須 | /brainstorm | 低 |
| K4 | 業界規制・コンプライアンス | 条件付 | /spec, /review | 低 |
| K5 | 技術スタック・アーキテクチャ決定 | 必須 | 全フェーズ | 高（コード・設定から） |
| K6 | APIの外部依存・統合先 | 必須 | /spec, /implement | 高（コードから） |
| K7 | データモデル・DB設計 | 必須 | /spec, /implement | 高（スキーマから） |
| K8 | 認証・認可設計 | 重要 | /implement, /review | 高（コードから） |
| K9 | テスト戦略・カバレッジ基準 | 重要 | /test | 中（設定から部分推定） |
| K10 | デプロイ・インフラ構成 | 重要 | /implement | 高（IaCから） |
| K11 | パフォーマンス要件・SLA | 条件付 | /review | 低 |
| K12 | エラーハンドリング方針 | 重要 | /implement | 中（コードから部分推定） |
| K13 | UI/UXガイドライン・デザインシステム | 条件付 | /implement | 中（コードから部分推定） |
| K14 | 過去の技術的負債・既知の課題 | 重要 | /brainstorm | 低 |
| K15 | チーム規約・コーディング規約 | 必須 | /implement, /review | 高（設定・lintから） |

**自動抽出可能性の分布:** K5-K8, K10, K15 は高精度で自動抽出可能（codebase-analyzer で対応）。K1, K3, K4, K11, K14 は暗黙知であり、人間への質問が不可欠。K2, K9, K12, K13 は部分的にコードから推定可能だが、人間の補完が必要。

### 15.3 /forge-init コマンド設計

**5フェーズ設計:**

```
Phase 1: 自動分析           Phase 2: ソース提供         Phase 3: コア5質問
codebase-analyzer           既存ドキュメント入力        ソクラテス式対話
  ↓                           ↓                         ↓
K5-K8,K10,K15 自動生成     不足領域を特定              K1,K3,K14 等を収集
  ↓                           ↓                         ↓
カバレッジ: ~40%            カバレッジ: ~55%            カバレッジ: ~75%

Phase 4: 深掘り質問（オプション）    Phase 5: ドキュメント生成
60%未満の領域のみ追加質問            収集情報からドキュメント自動生成
  ↓                                    ↓
カバレッジ: ~85%                     docs/ 配下にファイル群を配置
```

**Phase 1: 自動分析**（codebase-analyzer による自動抽出）
- コードベース構造、技術スタック、依存関係、DBスキーマ、認証設定、IaC 等を自動解析
- K5-K8, K10, K15 は高い精度で自動生成可能
- 既存の codebase-analyzer Agent を再利用

**Phase 2: ソース提供**（ユーザーが既存ドキュメントを提供）
- 既存 README、Wiki、仕様書、Swagger/OpenAPI 等を入力として受け取る
- AI がソースを解析し、不足知識領域を特定
- 「ドキュメントがない」場合はスキップして Phase 3 に進む

**Phase 3: コア5質問**（ソクラテス式対話の核心）
1. **ビジネスルールの核心**: 「このプロジェクトで最も重要なビジネスルールは何ですか?」
2. **ドメインモデルの主要概念**: 「このプロジェクトのドメインで、チーム内で特別な意味を持つ用語はありますか?」
3. **ステークホルダーの優先度**: 「主要なステークホルダーは誰で、それぞれ何を最も重視していますか?」
4. **既知の技術的負債**: 「現在のコードベースで、特に注意が必要な部分や既知の問題はありますか?」
5. **運用上の制約**: 「デプロイやインフラに関して、特別な制約や手順はありますか?」

**Phase 4: 深掘り質問**（オプショナル、不足領域のみ）
- カバレッジマトリクスで 60% 未満の領域について追加質問
- ユーザーが「十分」と判断した時点で終了
- 質問はドメインに応じて動的に生成（7ドメインカテゴリ: ビジネス、技術、運用、品質、セキュリティ、UI/UX、チーム）

**Phase 5: ドキュメント生成 + カバレッジチェック**
- 収集した情報から docs/ 配下にドキュメント群を自動生成
- 情報が収集された領域のみファイル生成（**空ファイル禁止**）
- 最終カバレッジレポートを提示

**生成対象ドキュメント:**
- `openspec/project.md`（プロジェクトコンテキスト）
- `docs/domain/business-rules.md`（K1 から生成）
- `docs/domain/domain-model.md`（K2 から生成）
- `docs/domain/stakeholders.md`（K3 から生成）
- `docs/domain/tech-constraints.md`（K6, K11 等から生成）
- `docs/domain/runbooks/`（K10 等から生成）

**設計原則（Pragmatic Reviewer の指摘を反映）:**
- 情報が収集された知識領域のみファイル生成（空ファイル禁止）
- /brainstorm のプロジェクト分析機能との重複を最小化（/forge-init は初回導入時のみ、/brainstorm は各変更の提案時）
- 過剰なドキュメント生成を避ける（MVK = Minimum Viable Knowledge）

### 15.4 Agent 設計

**codebase-analyzer（既存再利用）:**
- Phase 1 の自動分析フェーズで K5-K8, K10, K15 を抽出
- 既に Forge に定義済みの Agent をそのまま活用

**project-knowledge-writer（新規提案）:**
- 対話結果からドキュメントを生成する専用エージェント
- 既存の spec-writer のパターンを踏襲（入力→解析→ドキュメント生成）
- docs/domain/ 配下のファイル群を生成
- カバレッジマトリクスの管理（どの知識領域がどの程度カバーされたかを追跡）
- 生成するドキュメントは /brainstorm や /spec が参照しやすい構造にする

### 15.5 /brainstorm との境界整理

| 観点 | /forge-init | /brainstorm |
|---|---|---|
| **実行タイミング** | プロジェクト導入時の1回きり | 各変更の提案時（繰り返し） |
| **目的** | AIへの体系的な知識移転 | 変更提案の生成 |
| **対象範囲** | プロジェクト全体の知識（K1-K15） | 特定変更に関連する知識 |
| **入力** | コードベース + 既存ドキュメント + 人間の回答 | ユーザーの変更指示 + docs/ + openspec/ |
| **出力** | docs/domain/ + openspec/project.md | proposal.md |
| **知識の方向** | 人間 → AI（知識移転） | AI → 人間（提案） |
| **プロジェクト知識の前提** | なし（これから構築） | あり（/forge-init で構築済み） |

/forge-init が生成した docs/ は /brainstorm の入力として活用される。つまり、/forge-init の品質が /brainstorm の品質に直結する。

---

## 付録A: Round 1 各エージェントの主要論点サマリー

### architecture-analyst の主要論点

1. **Forge は既に5層の知識管理を実現** しており、Obsidian は「第6層」として位置づけるべき
2. **Context Isolation Policy との整合性** が最大の設計課題
3. **MCP 接続は読み取り専用** を厳守
4. OpenSpec の `project.md` と Vault の `10_Projects/index.md` は **補完関係**

### workflow-analyst の主要論点

1. **/brainstorm が最大の統合価値** を持つ
2. **/implement では Vault 直接参照は不要**
3. **提案書の /learn と /wrapup は /compound に統合**
4. 認証機能実装シナリオで各フェーズの Vault 活用を検証

### knowledge-analyst の主要論点

1. **Single Source of Truth の設計** が最重要
2. **Compound Learning の拡張** が Vault 統合の鍵
3. **知識の配置基準** として「頻度×深さマトリクス」を提案
4. **陳腐化管理** では docs/ にも last_validated を導入すべき

### critical-analyst の主要論点（★Round 1 で最も鋭い反論を提供）

1. **Forge は既に 260 ファイル・9層の知識管理** を実現。「追加すべきは新しい層ではなく、既存層の活用最大化」
2. **Compound Learning の同期漏れ問題**: 4件中3件で言及。新たな同期対象の追加は危険
3. **memory/ が未使用**: Obsidian 追加前にこちらを先に検証すべき
4. **Native Plugin 採用により双方向リンクの価値は回復**
5. **「Vault なし」代替案**: 既存機能で提案価値の 80-90% をカバー可能
6. **提案書の参照情報は Forge コンテキストに適用不可**

---

## 付録B: Round 2 各エージェントの主要論点サマリー

### Pragmatist の主要論点

1. **Web 調査結果**: 成功している個人開発者は「シンプルな統合」を選んでいる。MCP + Native Plugin + mcp-remote の3段構成は成功パターンと逆方向
2. **PKM 放棄リスクが最大の運用懸念**: 30_Daily/ 廃止、テンプレート最小化、週1回10分の整理を推奨
3. **「やめるべきこと」リスト**: vault-knowledge-researcher, /spec Vault 参照, /review Vault 参照, Vault → Skill 自動パイプライン, 陳腐化自動管理を不採用
4. **Phase 0 を 0a（修復）と 0b（測定）に分解** し、各ステップに明確な判断基準を設定
5. **「Obsidian 統合の前に、Forge 自身の足元を固めよ」**

### Architect の主要論点

1. **MCP 接続に Critical な既知バグ**: mcp-remote 経由のツール非表示（#27159）、graph.path バグ
2. **6段階呼び出しチェーン** は脆すぎる。各段階が障害点
3. **代替案A（docs/ を Obsidian で直接開く）** が MCP 統合より低リスク・高リターン
4. **SSOT 破綻シナリオ**: 案件横断性の判定ミス、同期ずれ、陳腐化が高確率で発生
5. **PoC を設計の前に実施すべき**: 接続可能性の技術調査なしで設計を進めるべきではない

### Critic の主要論点

1. **カバー率の数値は全て定性的見積もり**: 定量的裏付けなし。表形式が客観性の錯覚を招く
2. **推進派3:懐疑派1の構造的バイアス**: Round 1 の議論体制に偏りがあり、未開示
3. **効果測定基準が測定不能**: Phase 0 の KPI の大半は定義が曖昧
4. **撤退基準にサンクコストバイアス対策なし**: 事前コミットメントが必要
5. **「案件横断」の価値は案件数に依存**: 閾値分析が未実施
6. **レポート全体の評価: B+**: 網羅性は高いが、意思決定文書としては数値根拠の弱さが致命的

### KM Expert の主要論点

1. **Forge 9層の PKM 理論評価: A-**: Zettelkasten の「外部化された思考パートナー」を AI で部分的に実現
2. **「人間が書き、AIが読む」原則は PKM 全フレームワークと整合**: Zettelkasten, PARA, GTD, LYT
3. **Emergence（創発）の設計不足**: 予期しない接続の発見メカニズムがない
4. **MOC は段階的に成長させるべき**: 空の MOC テンプレートを先に作るのは LYT に反する
5. **アトミックノート原則**: 200行以下、タイトル=主張
6. **陳腐化閾値は knowledge_type 別に設定**: gotcha 3ヶ月、ADR 6ヶ月、pattern 6-12ヶ月

---

## 付録C: 代替アーキテクチャ比較（Round 2 Architect）

| 基準 | MCP 統合 (Round 1) | 代替案A (docs/ Vault化) | 代替案B (Git submodule) | 代替案C (Phase 0 徹底) |
|---|---|---|---|---|
| 追加複雑性 | 高（MCP, mcp-remote, Plugin） | 低（.obsidian/ のみ） | 中（submodule 管理） | ゼロ |
| 同期コスト | 高（3経路の同期） | 低（単一ソース） | 中（submodule update） | ゼロ |
| 案件横断知識 | 強 | 中（別策要） | 強（Git で共有） | 弱 |
| 障害点 | 6段階チェーン | 0（FS 直接） | 0（Git のみ） | 0 |
| グラフナビゲーション | あり（MCP経由） | あり（人間のみ） | なし | なし |
| AI による Vault 活用 | 高 | 中（FS MCP） | 中（直接 Read） | 低 |
| 導入リスク | 高 | 低 | 低 | ゼロ |

---

## 付録D: 今後の検討事項

1. **チーム展開**: 複数人での Vault 共有時の Conflict 解決戦略
2. **AI による Vault 直接編集の緩和**: `last_validated` 更新のみ AI に許可する等の段階的緩和
3. **Vault → Skill 昇格パイプライン**: 頻繁参照される Vault ノートを手動で Skill 化する判定基準（3回以上参照されたらフラグ）
4. **RAG (Retrieval-Augmented Generation) の導入**: Vault が大規模化した際のベクトル検索統合
5. **jacksteamdev/obsidian-mcp-tools の評価**: aaronsb プラグインの代替候補（612 stars, より成熟）
6. **セレンディピティモード**: /brainstorm 時にランダムな弱い関連ノートを提示する機能

---

## 付録E: Round 3 各エージェントの主要論点サマリー

### Architecture Analyst の主要論点

1. **パターンD（ハイブリッド段階モデル）を提案**: Internal Layers（docs/domain/ + docs/inbox/）で Phase 0 を強化し、External Layer（Vault）は Phase 1 以降に段階導入
2. **SSOT の時間軸分離**: 「今のプロジェクト」は docs/ が SSOT、「卒業済み知識」は Vault が SSOT。時間軸で分離することで二重管理を回避
3. **implementer は Vault 非参照を堅持**: Context Isolation の原則に加え、implementer のスコープ拡大はバグの温床
4. **業界規制は Vault を SSOT とする例外**: 案件横断で不変性が高い知識は初期から Vault に直接配置

### Workflow Analyst の主要論点

1. **Learning Router のドメインルール分類ギャップ**: 現行の /compound は技術的学び（gotcha, pattern）のルーティングのみ。ドメインルール（ビジネスルール、規制）の分類が欠落
2. **docs/domain/ + docs/inbox/ の新設提案**: domain/ はプロジェクト固有ドメイン知識の明示的な置き場、inbox/ は「まだ分類できない知識」の一時退避場所
3. **/compound --close（プロジェクト完了モード）の設計**: プロジェクトクローズ時に docs/ 内の全ドメイン知識を走査し、卒業候補を提示
4. **摩擦ポイントの特定**: 開発中に「これはドメイン知識だ」と認識するタイミングが不明確。docs/inbox/ がこの摩擦を吸収

### KM Theorist の主要論点

1. **ドメイン知識の6類型分類**: ビジネスルール、ドメインモデル、ステークホルダー要件、業界規制、技術的制約、運用知識の4軸評価（半減期、移植可能性、抽象化可能性、暗黙知度）
2. **「知識の卒業」概念の定式化**: 3条件（具体→抽象、固有→一般化、コンテキスト付き→コンテキストフリー）と4トリガー（プロジェクト完了、2回目の遭遇、反復的参照、技術ブログ化）
3. **Progressive Summarization の具体的適用**: Layer 0（原体験）→ Layer 4（エグゼクティブサマリー）の5段階を Forge のワークフローにマッピング
4. **PKM 理論の体系的適用**: Zettelkasten、PARA、LYT、CODE の4フレームワークをプロジェクト固有ドメイン知識に適用した詳細分析（pkm-theory-analysis.md として独立レポート化）

### Pragmatic Skeptic の主要論点

1. **Forge の実態データ分析**: docs/ 配下のドメイン知識ファイルの実数（domain-rules.md 等）と compound learnings 内のドメイン関連記述の棚卸し
2. **PKM 失敗パターンの適用**: 「過剰分類症候群」「空ディレクトリ地獄」「卒業式ごっこ」の3大失敗パターンを警告
3. **撤退基準の具体化**: docs/domain/ が3ヶ月間で更新0件なら廃止、docs/inbox/ が常時5件以上滞留なら運用見直し
4. **「プロジェクト1件のみ」指摘**: Forge リポジトリ1つでの議論に閉じている点を指摘（※ユーザーは別PCで複数プロジェクト開発中のため、この指摘は議論の前提として不採用）

---

## 付録F: Round 4 各エージェントの主要論点サマリー

### Team 1: 知識保管アーキテクチャ分析

#### knowledge-architecture-analyst の主要論点

1. **Layer 0-5 の知識保管経路を体系的に分析**: 各知識領域（K1-K15）がどの Layer に保管され、どのフェーズで参照されるかをフロー図化
2. **「暗黙知→ドキュメント」変換経路の不足を特定**: 既存の Forge はドキュメントが存在することを前提としているが、初期生成メカニズムがない
3. **自動抽出可能な知識（K5-K8, K10, K15）と人間への質問が不可欠な知識（K1, K3, K4, K11, K14）の分離**: codebase-analyzer で対応可能な範囲を明確化

#### onboarding-strategist の主要論点

1. **MVK（Minimum Viable Knowledge）の概念を提案**: 全知識領域を完璧にカバーする必要はなく、/brainstorm の品質を確保できる最小限の知識セットを初期目標とする
2. **/forge-init の初期設計**: 自動分析→対話→ドキュメント生成の基本フローを提案
3. **段階的知識準備**: 初回は MVK でスタートし、/brainstorm や /compound を通じて知識が自然に成長する設計

#### pragmatic-critic の主要論点

1. **当初は「/forge-init は不要」と主張**: 知識は開発を通じて自然に蓄積されるべきであり、事前の体系的準備は過剰投資
2. **「AIが実装する」という論点で合意に転換**: 人間の開発者であれば暗黙知を活用できるが、AIは明示的なドキュメントがなければ参照できない。初期知識がなければ /brainstorm の品質が低下する
3. **過剰準備リスクの警告**: /forge-init で大量のドキュメントを生成しても、実際に参照されなければ意味がない。MVK を超える情報収集は避けるべき

### Team 2: /forge-init コマンド設計

#### knowledge-requirements-analyst の主要論点

1. **15知識領域（K1-K15）の体系的マッピング**: Forge の各フェーズ（/brainstorm, /spec, /implement, /review, /test）でAIが必要とする知識を網羅的に分類
2. **フェーズ別必要度の分析**: /brainstorm に最も多くの知識領域が必要（K1, K3, K14 等）であり、/implement は /spec の出力に依存するため直接必要な知識は限定的
3. **自動抽出可能性の評価**: 高（K5-K8, K10, K15）、中（K2, K9, K12, K13）、低（K1, K3, K4, K11, K14）の3段階で分類

#### interaction-designer の主要論点

1. **ソクラテス式対話の5フェーズフロー設計**: 自動分析→ソース提供→コア質問→深掘り質問→ドキュメント生成。各フェーズでカバレッジが段階的に向上
2. **コア5質問の設計**: ビジネスルール、ドメインモデル、ステークホルダー、技術的負債、運用制約の5軸で最小限の質問から最大限の知識を引き出す
3. **収束判定基準**: カバレッジマトリクスで全「必須」領域が 60% 以上、全「重要」領域が 40% 以上で「十分」と判定。ユーザーが「十分」と判断した時点でいつでも終了可能

#### technical-architect の主要論点

1. **コマンド定義**: /forge-init を .claude/commands/ に配置。既存のコマンド定義パターンに従い、forge-init Agent を呼び出す設計
2. **Agent 設計**: codebase-analyzer（既存再利用）+ project-knowledge-writer（新規）の2Agent 構成。spec-writer のパターンを踏襲
3. **ドキュメントテンプレート**: 各知識領域に対応するドキュメントテンプレートを定義。ただし空ファイルは生成せず、情報が収集された領域のみファイルを作成

#### pragmatic-reviewer の主要論点

1. **/brainstorm との境界の明確化**: /forge-init は導入時1回きりの体系的知識収集、/brainstorm は各変更の提案時のプロジェクト知識活用。重複を最小化
2. **空ファイル禁止の原則**: Round 3 の docs/domain/ 新設で「ディレクトリだけ作って中身が空」のリスクを指摘。/forge-init は情報が収集された領域のみファイルを生成すべき
3. **段階的生成**: 初回は MVK に絞り、/brainstorm や /compound を通じて知識が成長するにつれて docs/domain/ のファイルが自然に充実する設計を推奨

---

*— 以上 —*
