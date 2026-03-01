# project-config デルタスペック

## ADDED Requirements

### Requirement: REQ-001 汎用グローバル CLAUDE.md テンプレート

`templates/global-claude.md` SHALL 技術スタック非依存のコンテンツのみを含む。

#### Happy Path Scenarios

- **GIVEN** Forge リポジトリに `templates/global-claude.md` が存在する **WHEN** ファイルの内容を確認する **THEN** Core Philosophy, Forge ワークフロー, OpenSpec 構造, 共通 Rules テーブル, 共通 Available Agents, 方法論 Available Skills, Hooks, Compound Learning のセクションが含まれる
- **GIVEN** `templates/global-claude.md` が存在する **WHEN** ファイルの内容を確認する **THEN** ドメイン固有のスキル名（prisma-expert, terraform-gcp-expert, next-best-practices 等）、ドメイン固有のエージェント名（prisma-guardian, terraform-reviewer）、ドメイン固有のリファレンス（nextjs/conventions.md, prisma/conventions.md, terraform/conventions.md）が含まれていない

#### Error Scenarios

- **GIVEN** `templates/global-claude.md` が存在しない **WHEN** `install.sh` を実行する **THEN** テンプレートが見つからない旨のエラーメッセージを表示し、インストールを中断する
- **GIVEN** `~/.claude/` ディレクトリに書き込み権限がない **WHEN** `install.sh` を実行する **THEN** `set -euo pipefail` により権限エラーで即座に終了する

#### Boundary Scenarios

- **GIVEN** `templates/global-claude.md` の Available Agents テーブル **WHEN** エージェント一覧を確認する **THEN** 共通エージェント（research, spec, orchestration, implementation, 汎用レビュー）のみが記載され、ドメイン特化レビュアー（prisma-guardian, terraform-reviewer）は記載されない

#### Non-Functional Requirements

- **CONSISTENCY**: `templates/global-claude.md` の H2 セクション構成は現在の `USER-CLAUDE.md` と同一であること（ドメイン固有項目の除去のみで、セクション構造は維持）

---

### Requirement: REQ-002 プロジェクト固有 CLAUDE.md テンプレート

`templates/project-claude.md` SHALL プロジェクト固有のスキル・エージェント・リファレンスを宣言するカスタマイズ可能なテンプレートとする。

#### Happy Path Scenarios

- **GIVEN** Forge リポジトリに `templates/project-claude.md` が存在する **WHEN** ファイルの内容を確認する **THEN** プロジェクトコンテキスト、ドメイン固有 Available Agents、ドメイン固有 Available Skills、ドメイン固有 Reference テーブルのセクションが含まれる
- **GIVEN** `templates/project-claude.md` が存在する **WHEN** 各セクションを確認する **THEN** カスタマイズ方法を示すコメント（編集ガイド）が含まれる
- **GIVEN** `templates/project-claude.md` が存在する **WHEN** テンプレート内容を確認する **THEN** 現在の Next.js/Prisma/Terraform スタックが完全な使用例として記載されている

#### Error Scenarios

- **GIVEN** `templates/project-claude.md` が存在しない **WHEN** `install.sh register <path>` を実行する **THEN** テンプレートが見つからない旨のエラーメッセージを表示し、登録を中断する

#### Boundary Scenarios

- **GIVEN** `templates/project-claude.md` の Available Agents セクション **WHEN** エージェント一覧を確認する **THEN** ドメイン固有エージェント（prisma-guardian, terraform-reviewer 等）のみが記載され、共通エージェント（spec-writer, implementer 等）は重複記載されない
- **GIVEN** `templates/project-claude.md` の Available Skills セクション **WHEN** スキル一覧を確認する **THEN** ドメイン固有スキルのみが記載され、方法論スキル（test-driven-development 等）は重複記載されない

---

### Requirement: REQ-003 install.sh register サブコマンド

`install.sh` SHALL `register <project-path>` サブコマンドをサポートし、プロジェクト固有の CLAUDE.md を生成する。

#### Happy Path Scenarios

- **GIVEN** 有効なプロジェクトディレクトリパス **WHEN** `install.sh register /path/to/project` を実行する **THEN** パスエンコーディング（`/` と `.` を `-` に置換）でディレクトリ名を生成し、`~/.claude/projects/<hash>/CLAUDE.md` に `templates/project-claude.md` をコピーする
- **GIVEN** `install.sh register /Users/kaneshiro/Projects/github.com/kanecro/forge` を実行する **WHEN** 生成されたディレクトリを確認する **THEN** `~/.claude/projects/-Users-kaneshiro-Projects-github-com-kanecro-forge/CLAUDE.md` が作成されている
- **GIVEN** register コマンドが正常完了する **WHEN** 出力を確認する **THEN** 作成されたファイルのパスと、編集を促すメッセージが表示される

#### Error Scenarios

- **GIVEN** 存在しないディレクトリパス **WHEN** `install.sh register /nonexistent/path` を実行する **THEN** ディレクトリが存在しない旨のエラーメッセージを表示し、終了コード1で終了する
- **GIVEN** 既に `~/.claude/projects/<hash>/CLAUDE.md` が存在する **WHEN** 同じパスで `install.sh register` を実行する **THEN** 既存ファイルを上書きせず、既に登録済みである旨の警告を表示する
- **GIVEN** 引数なし **WHEN** `install.sh register` を実行する **THEN** register サブコマンドの使用方法を表示する

#### Boundary Scenarios

- **GIVEN** 相対パス **WHEN** `install.sh register ./my-project` を実行する **THEN** 絶対パスに解決してからエンコーディングを行い、正しいハッシュを生成する
- **GIVEN** シンボリックリンクを含むパス **WHEN** `install.sh register /symlink/to/project` を実行する **THEN** `pwd -P` で実パスに解決してからエンコーディングを行う
- **GIVEN** スペースを含むパス **WHEN** `install.sh register "/Users/kaneshiro/My Projects/app"` を実行する **THEN** パスエンコーディングが正しく動作し、`~/.claude/projects/-Users-kaneshiro-My Projects-app/CLAUDE.md` が作成される

---

### Requirement: REQ-004 install.sh グローバル CLAUDE.md 自動配置

`install.sh` SHALL `templates/global-claude.md` を `~/.claude/CLAUDE.md` として配置する（存在しない場合のみ）。

#### Happy Path Scenarios

- **GIVEN** `~/.claude/CLAUDE.md` が存在しない **WHEN** `install.sh` を実行する **THEN** `templates/global-claude.md` が `~/.claude/CLAUDE.md` にコピーされる
- **GIVEN** `~/.claude/CLAUDE.md` が既に存在する **WHEN** `install.sh` を実行する **THEN** 既存ファイルを上書きせず、`templates/global-claude.md` との差分確認を促す警告メッセージを表示する

#### Error Scenarios

- **GIVEN** `templates/global-claude.md` が存在しない **WHEN** `install.sh` を実行する **THEN** テンプレートが見つからない旨のエラーメッセージを表示し、インストールを中断する

---

### Requirement: REQ-005 USER-CLAUDE.md の移行

`USER-CLAUDE.md` SHALL `templates/global-claude.md` に置き換えられる。

#### Happy Path Scenarios

- **GIVEN** Forge リポジトリ **WHEN** ファイル構成を確認する **THEN** `USER-CLAUDE.md` は存在せず、`templates/global-claude.md` が存在する
- **GIVEN** `USER-CLAUDE.md` の H2 セクション（`##`）一覧と `templates/global-claude.md` + `templates/project-claude.md` の H2 セクション一覧 **WHEN** 比較する **THEN** `USER-CLAUDE.md` の全 H2 セクションがいずれかのテンプレートに含まれている（情報の欠落がない）

#### Error Scenarios

- **GIVEN** `USER-CLAUDE.md` の内容と `templates/global-claude.md` + `templates/project-claude.md` の結合内容 **WHEN** H2 セクション単位で比較する **THEN** USER-CLAUDE.md にのみ存在するセクションがある場合、移行漏れとして検出する

---

### Requirement: REQ-006 Forge リポジトリ CLAUDE.md 更新

Forge リポジトリの `CLAUDE.md` SHALL テンプレート構造、`register` サブコマンド、3層 CLAUDE.md アーキテクチャを文書化する。

#### Happy Path Scenarios

- **GIVEN** Forge リポジトリの `CLAUDE.md` **WHEN** 内容を確認する **THEN** `templates/` ディレクトリの存在と各テンプレートの用途が記載されている
- **GIVEN** Forge リポジトリの `CLAUDE.md` **WHEN** 内容を確認する **THEN** `install.sh register <project-path>` の使用方法が記載されている
- **GIVEN** Forge リポジトリの `CLAUDE.md` **WHEN** 内容を確認する **THEN** 3層 CLAUDE.md アーキテクチャ（レイヤー1: グローバル汎用、レイヤー2: プロジェクト固有、レイヤー3: リポジトリ内）の各レイヤーの役割と加算方式の動作が記載されている

---

## MODIFIED Requirements

### Requirement: MOD-REQ-005（domain-skills スペック）Available Skills テーブル同期要件

**変更前**: グローバル CLAUDE.md とプロジェクト CLAUDE.md の Available Skills テーブルが同一内容であること。
**変更後**: グローバル CLAUDE.md には方法論スキルのみ、プロジェクト固有 CLAUDE.md にはドメインスキルを記載する。両者の結合が全スキル一覧となる。
**変更理由**: 共通/固有の分離により、単一 CLAUDE.md での同一テーブル維持は不要になる。domain-skills スペック REQ-005 の「同期確認」シナリオもこの分離構造に合わせて更新する。

#### Happy Path Scenarios

- **GIVEN** `~/.claude/CLAUDE.md` の Available Skills テーブルに方法論スキルが記載されている **WHEN** 登録済みプロジェクトのディレクトリで claude を起動する **THEN** グローバルの方法論スキル + プロジェクト固有 CLAUDE.md のドメインスキルが両方テキストとして表示される

#### Error Scenarios

- **GIVEN** プロジェクト固有 CLAUDE.md にグローバルと同一の方法論スキルを重複記載した場合 **WHEN** claude を起動する **THEN** 加算方式により重複表示となるが、動作に影響はない（許容）

#### Boundary Scenarios

- **GIVEN** 未登録のプロジェクトディレクトリで claude を起動する **WHEN** Available Skills を確認する **THEN** グローバルの方法論スキルのみがガイダンステーブルに表示され、ドメイン固有スキルは表示されない

---

### Requirement: MOD-WORKFLOW（workflow-redesign スペック）CLAUDE.md 整合性要件

**変更前**: CLAUDE.md（プロジェクト + グローバル）の Context Isolation Policy、Available Agents、2層アーキテクチャの記載は実際の設計と整合している。
**変更後**: 3層 CLAUDE.md アーキテクチャ（グローバル汎用 + プロジェクト固有 + リポジトリ内）の記載が実際の設計と整合している。
**変更理由**: 2層から3層への拡張に伴い、ドキュメントの整合性要件も更新する。

#### Happy Path Scenarios

- **GIVEN** Forge リポジトリの CLAUDE.md **WHEN** アーキテクチャの説明を確認する **THEN** 3層構造（グローバル、プロジェクト固有、リポジトリ内）が記載されており、各レイヤーの責務が明確に定義されている
