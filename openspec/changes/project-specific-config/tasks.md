# project-specific-config タスクリスト

## テスト戦略

- ユニットテスト: シェルスクリプトの動作確認（install.sh register サブコマンド、パスエンコーディング）
- 統合テスト: 実際のパスでの登録→CLAUDE.md 生成→内容確認
- E2Eテスト: 該当なし（UI なし）

## タスク

### Task 1: templates/ ディレクトリを作成（推定: 2分）
- **対象ファイル**: `templates/` ディレクトリ（新規）
- **やること**: `templates/` ディレクトリを作成する
- **検証方法**: `ls templates/`
- **関連要件**: REQ-001, REQ-002
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-001`
- **依存**: なし

### Task 2: templates/global-claude.md を作成（推定: 5分）
- **対象ファイル**: `templates/global-claude.md`（新規）
- **やること**: 現在の `USER-CLAUDE.md` から技術スタック非依存のコンテンツを抽出してテンプレートを作成する。以下のセクションのみ含める:
  - Core Philosophy
  - Forge ワークフロー + OpenSpec 構造
  - Rules（共通 reference テーブル: typescript-rules, coding-standards, core-rules, workflow-rules, common/* のみ。nextjs/, prisma/, terraform/ は除外）
  - Available Agents（共通のみ: research, spec, orchestration, implementation, 汎用レビュー。ドメイン特化レビュアー prisma-guardian, terraform-reviewer は除外）
  - Available Skills（方法論のみ: test-driven-development, systematic-debugging, verification-before-completion, iterative-retrieval, strategic-compact。ドメインスキルは全て除外）
  - Hooks
  - Compound Learning
  - H2 セクション構成は `USER-CLAUDE.md` と同一に維持する
- **検証方法**: ファイル内に prisma-expert, terraform-gcp-expert, next-best-practices, prisma-guardian, terraform-reviewer, nextjs/conventions, prisma/conventions, terraform/conventions が含まれていないことを grep で確認
- **関連要件**: REQ-001
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-001`
- **依存**: Task 1

### Task 3: templates/project-claude.md を作成（推定: 5分）
- **対象ファイル**: `templates/project-claude.md`（新規）
- **やること**: プロジェクト固有の CLAUDE.md テンプレートを作成する。以下のセクションを含める:
  - プロジェクトコンテキスト（技術スタック宣言。カスタマイズ用コメント付き）
  - Available Agents（ドメイン固有の追加分。現在の Next.js/Prisma/Terraform 例を記載。共通エージェントは重複記載しない）
  - Available Skills（ドメイン固有の追加分。現在のドメインスキル一覧を例として記載。方法論スキルは重複記載しない）
  - Reference（ドメイン固有の追加分。nextjs/, prisma/, terraform/ conventions を例として記載）
  - 各セクションにカスタマイズ方法のコメントを含める
- **検証方法**: テンプレート内にカスタマイズコメントが存在し、ドメイン固有のスキル・エージェント・リファレンスが含まれ、方法論スキル・共通エージェントが重複記載されていないことを確認
- **関連要件**: REQ-002
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-002`
- **依存**: Task 1

### Task 4: install.sh にグローバル CLAUDE.md 配置処理を追加（推定: 3分）
- **対象ファイル**: `install.sh`（既存）
- **やること**: settings.json の処理と同様に、`templates/global-claude.md` を `~/.claude/CLAUDE.md` にコピーする処理を追加。存在する場合は上書きせず、テンプレートとの差分確認を促す警告を表示
- **検証方法**: `~/.claude/CLAUDE.md` を削除した状態で `install.sh` を実行し、テンプレートがコピーされることを確認。再度実行して上書きされないことを確認
- **関連要件**: REQ-004
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-004`
- **依存**: Task 2

### Task 5: install.sh にサブコマンド分岐を追加（推定: 3分）
- **対象ファイル**: `install.sh`（既存）
- **やること**:
  - 引数パース部分を拡張し、第1引数が `register` の場合はサブコマンド処理にルーティング
  - `register` サブコマンドの usage ヘルプを追加
  - 引数なしの `install.sh register` 時に使用方法を表示
  - 既存の `-y`/`--yes`/`-h`/`--help` オプションの動作は維持
- **検証方法**: `install.sh --help` が更新された usage を表示すること。`install.sh register` が register の usage を表示すること
- **関連要件**: REQ-003
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-003`
- **依存**: なし

### Task 6: install.sh register のコア処理を実装（推定: 5分）
- **対象ファイル**: `install.sh`（既存）
- **やること**:
  - パスエンコーディング関数（`/` `.` → `-`、`pwd -P` で実パス解決）を実装
  - `~/.claude/projects/<hash>/` ディレクトリの作成
  - `templates/project-claude.md` → `~/.claude/projects/<hash>/CLAUDE.md` へのコピー
  - 存在チェック（上書き防止、警告表示）
  - エラーハンドリング（存在しないパス、テンプレート不在）
  - 成功時にファイルパスと編集を促すメッセージを表示
- **検証方法**:
  - テスト用ディレクトリで `install.sh register /tmp/test-project` を実行し、正しいパスに CLAUDE.md が生成されることを確認
  - 同じパスで再実行し、上書きされないことを確認
  - 存在しないパスで実行し、エラーになることを確認
  - 相対パスで実行し、正しくエンコードされることを確認
- **関連要件**: REQ-003
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-003`
- **依存**: Task 3, Task 5

### Task 7: install.sh のテンプレート検証を追加（推定: 2分）
- **対象ファイル**: `install.sh`（既存）
- **やること**: Forge リポジトリ検証ステップに `templates/global-claude.md` と `templates/project-claude.md` の存在チェックを追加
- **検証方法**: テンプレートが存在しない状態で `install.sh` を実行し、エラーメッセージが表示されることを確認
- **関連要件**: REQ-001, REQ-002
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-001`, `specs/project-config/delta-spec.md#REQ-002`
- **依存**: Task 4, Task 6

### Task 8: USER-CLAUDE.md を削除（推定: 2分）
- **対象ファイル**: `USER-CLAUDE.md`（既存、削除）
- **やること**: `USER-CLAUDE.md` を削除する。H2 セクション単位で `templates/global-claude.md` + `templates/project-claude.md` と比較し、全セクションがカバーされていることを確認してから削除
- **検証方法**: `USER-CLAUDE.md` が存在しないことを確認。H2 セクション一覧の diff で情報欠落がないことを確認
- **関連要件**: REQ-005
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-005`
- **依存**: Task 2, Task 3

### Task 9: CLAUDE.md を更新（推定: 3分）
- **対象ファイル**: `CLAUDE.md`（既存）
- **やること**: Forge リポジトリの CLAUDE.md に以下を追加:
  - `templates/` ディレクトリの説明と各テンプレートの用途
  - `install.sh register <project-path>` の使用方法
  - 3層 CLAUDE.md アーキテクチャの説明（グローバル汎用、プロジェクト固有、リポジトリ内の各レイヤーの役割と加算方式の動作）
- **検証方法**: CLAUDE.md に templates/、register コマンド、3層アーキテクチャの記述が含まれていることを確認
- **関連要件**: REQ-006, MOD-WORKFLOW
- **関連スペック**: `specs/project-config/delta-spec.md#REQ-006`, `specs/project-config/delta-spec.md#MOD-WORKFLOW`
- **依存**: Task 2, Task 3, Task 6

### Task 10: 累積スペックとの整合性確認（推定: 2分）
- **対象ファイル**: 確認のみ（既存スペックの変更は /compound で実施）
- **やること**: 以下の既存スペックとの矛盾を確認し、変更が必要な箇所を記録する:
  - `openspec/specs/domain-skills/spec.md` REQ-005「同期確認」→ MOD-REQ-005 で分離構造に変更
  - `openspec/specs/workflow-redesign/spec.md`「2層アーキテクチャ」→ MOD-WORKFLOW で3層に変更
- **検証方法**: 上記2箇所の矛盾が明示的にデルタスペックの MODIFIED Requirements で記載されていることを確認
- **関連要件**: MOD-REQ-005, MOD-WORKFLOW
- **関連スペック**: `specs/project-config/delta-spec.md#MOD-REQ-005`, `specs/project-config/delta-spec.md#MOD-WORKFLOW`
- **依存**: なし
