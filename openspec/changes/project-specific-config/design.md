# project-specific-config 技術設計

## 概要

Forge の共通部分とプロジェクト固有部分を CLAUDE.md の多層構造で分離する。全スキル・エージェントはグローバル配置のまま、プロジェクト固有の CLAUDE.md で有効なスキル・エージェント・リファレンスを制御する。

## リサーチサマリー

### 公式ドキュメントからの知見

- Claude Code の CLAUDE.md は**加算方式**で全レイヤーが結合される（上書きではなく追加）
- 読み込み順序: `~/.claude/CLAUDE.md` → `~/.claude/projects/<hash>/CLAUDE.md` → `<project>/CLAUDE.md` → サブディレクトリ
- `~/.claude/projects/<hash>/CLAUDE.md` はプロジェクト固有のプライベート設定として公式サポート
- **インクルード機構は存在しない**（テンプレートからの生成方式で対応）
- パスエンコーディング: 絶対パスの `/` と `.` を `-` に置換

### Web検索からの知見

- **`~/.claude/projects/<hash>/skills/` はスキル自動読み込みに非対応**
- スキルの解決パスは `~/.claude/skills/`（グローバル）と `<project>/.claude/skills/`（プロジェクト内）の2箇所のみ
- エージェントも同様（`~/.claude/agents/` と `<project>/.claude/agents/`）
- プロジェクト内に AI ファイル配置不可の制約下では、グローバル配置 + CLAUDE.md での制御が事実上の標準パターン

### コードベース分析

- 現在の `USER-CLAUDE.md` は共通とドメイン固有が混在（Available Agents/Skills テーブルにドメイン固有項目、Reference テーブルに技術固有エントリ）
- `install.sh` は7ディレクトリの個別要素をシンボリックリンク、`settings.json` は初回のみコピー
- コマンド内（review.md, spec.md 等）のドメイン検出テーブルにドメイン固有ロジックがハードコードされているが、これらはファイルパターンベースのトリガーのため、該当ファイルがないプロジェクトでは発火しない → 今回のスコープ外（YAGNI）

### 過去の学び

- **同期漏れが2回再発（確定パターン）**: プロジェクト/グローバルの二重管理は手動同期で必ず漏れる → テンプレートからの生成方式で単一ソースを維持
- **ドキュメント分散による整合性破綻**: CLAUDE.md 分割時、共通/固有の責務境界を明確にし、重複を最小化する
- **スキル分類の明文化**: Dual-Path 設計（Auto-Discovery + ガイダンステーブル）を維持。ガイダンステーブルのプロジェクト固有部分のみ分離

## 技術的アプローチ

### 3層 CLAUDE.md アーキテクチャ

```
レイヤー1: ~/.claude/CLAUDE.md（グローバル、汎用）
  ├── Core Philosophy
  ├── Forge ワークフロー + OpenSpec 構造
  ├── Rules（共通 reference テーブルのみ）
  ├── Available Agents（共通エージェントのみ）
  ├── Available Skills（方法論スキルのみ）
  ├── Hooks
  └── Compound Learning

レイヤー2: ~/.claude/projects/<hash>/CLAUDE.md（プロジェクト固有、プライベート）
  ├── プロジェクトコンテキスト（技術スタック宣言）
  ├── Available Agents（ドメイン固有の追加分）
  ├── Available Skills（ドメイン固有の追加分）
  └── Reference（ドメイン固有の追加分）

レイヤー3: <project>/CLAUDE.md（任意、プロジェクトリポジトリ内）
  └── リポジトリ配置可能なプロジェクトのみ使用
```

- 任意のディレクトリでの `claude` 起動時: レイヤー1のみ適用（完全に汎用）
- 登録済みプロジェクトディレクトリでの起動時: レイヤー1 + レイヤー2が加算適用

### Forge リポジトリのディレクトリ変更

```
forge/
├── templates/                     # NEW: テンプレートディレクトリ
│   ├── global-claude.md           # ~/.claude/CLAUDE.md テンプレート（汎用）
│   └── project-claude.md          # プロジェクト固有 CLAUDE.md テンプレート
├── CLAUDE.md                      # Forge リポジトリ自身のプロジェクト設定（既存、更新）
├── install.sh                     # register サブコマンド追加
├── uninstall.sh                   # 変更なし
└── USER-CLAUDE.md                 # 削除（templates/global-claude.md に移行）
```

### install.sh の変更

既存の動作（シンボリックリンク作成）は完全に維持。以下を追加:

1. **グローバル CLAUDE.md の自動配置**: `templates/global-claude.md` → `~/.claude/CLAUDE.md`（存在しない場合のみコピー）
2. **register サブコマンド**: `install.sh register <project-path>` で:
   - 絶対パスを解決
   - パスエンコーディング（`/` `.` → `-`）でハッシュを生成
   - `~/.claude/projects/<hash>/` ディレクトリを作成
   - `templates/project-claude.md` を `~/.claude/projects/<hash>/CLAUDE.md` にコピー
   - 既存の場合は上書きせず警告
   - 編集を促すメッセージを表示

### パスエンコーディング関数

```bash
encode_project_path() {
  local path="$1"
  path="$(cd "$path" && pwd -P)"
  echo "$path" | tr '/.' '--'
}
```

検証: `/Users/kaneshiro/Projects/github.com/kanecro/forge` → `-Users-kaneshiro-Projects-github-com-kanecro-forge` ✓

## リスクと注意点

- **既存ユーザーの移行**: `~/.claude/CLAUDE.md` が既に存在する場合、install.sh は上書きしない。手動で `templates/global-claude.md` の内容に更新する必要がある
- **Auto-Discovery のノイズ**: 全スキルがグローバルに存在するため、プロジェクト CLAUDE.md で指定していないドメインスキルも Auto-Discovery で検出される可能性がある。ただし、ファイルパターンベースのトリガーにより、該当ファイルがないプロジェクトでは実質的に発火しない
- **コマンド内のドメイン固有ロジック**: review.md, spec.md 等にハードコードされたドメイン検出テーブルは今回スコープ外。将来的に外部化する場合は別変更で対応
