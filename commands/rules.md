---
description: "プロジェクトのコードベースを分析し、Webベストプラクティスを参照して厳格なルールを対話的に生成する"
disable-model-invocation: true
argument-hint: "[category|--global]"
---

# /rules コマンド

## 目的

プロジェクトのコードベースを深く分析し、Web上のベストプラクティスを参照しながら、ユーザーと対話的にプロジェクト固有の規約をルールファイルとして明文化する。ズレが起きる前に予防するプロアクティブなアプローチ。

## What This Command Does

1. **既存ルールをスキャン**: `.claude/rules/` と `CLAUDE.md` を確認し、重複を防止する
2. **技術スタックを検出**: `package.json`, `tsconfig.json` 等からフレームワーク・ツールを特定する
3. **コードパターンを分析**: 実際のソースコードから命名・構造・テストパターンを抽出する
4. **Webベストプラクティスと照合**: 最新の推奨事項とプロジェクト既存パターンの差分を表示する
5. **対話的にルールを確定**: 各ルール項目についてユーザーが採用/修正/却下を選択する
6. **ルールファイルを生成**: ユーザー承認後、`.claude/rules/` に書き出す
7. **サマリーを報告**: 生成結果とコンテキスト予算を表示する

## Usage

```bash
# 全カテゴリを順に分析（フルモード）
/rules

# 特定カテゴリのみ分析・生成
/rules typescript
/rules testing

# グローバルルールの生成
/rules --global
```

## 前提知識

### Claude Code の rules 仕様

- ルールファイルは `.claude/rules/` ディレクトリに Markdown 形式で配置する
- YAML frontmatter の `paths:` でスコープを制御できる（指定パターンのファイルを操作する時のみロードされる）
- `paths:` を省略するとセッション開始時に常にロードされる（always-on rule）
- プロジェクト用: `<project>/.claude/rules/`
- グローバル用: `~/.claude/rules/`
- ルールの推奨トークン数: 常時ロードルールは全体で150行以内を目標、path-scoped ルールはファイル毎に適切な長さ

### ルールの品質基準（Web ベストプラクティスより）

1. **理由を説明する**: 「Xせよ」ではなく「Xする。理由は[理由]」と書く。理由があるルールはモデルがより一貫して守る
2. **具体的にする**: 「適切な命名」ではなく「DBカラムは snake_case、TypeScript 変数は camelCase」
3. **例を含める**: 具体的な Good/Bad の例1つは、何段落もの説明に勝る
4. **浅い見出し階層**: h1（ファイルタイトル）、h2（セクション）、h3（サブセクション）の3レベルまで
5. **Claude が推論できることは書かない**: コードを読めば分かることは省略。Claude が間違えることだけを書く
6. **禁止には代替を示す**: 「--foo-bar を使うな」→「--foo-bar を使わない。代わりに --baz を使う」
7. **path-scoped でコンテキスト効率を保つ**: 全てのルールを always-on にしない。関連ファイル操作時のみロードする

---

## ワークフロー

### 進捗管理

全ステップを通じて TodoWrite で進捗を追跡する:

```
- [ ] Step 1: 既存ルールスキャン
- [ ] Step 2: 技術スタック検出
- [ ] Step 3-5: {category} ルール分析・対話・確定（カテゴリごとに1行）
- [ ] Step 6: ファイル生成
- [ ] Step 7: サマリー報告
```

各ステップ完了時に即座に `completed` にマークする。バッチで完了にしない。

---

### ステップ0: 引数の解析

`$ARGUMENTS` を解析する:

| 入力 | 動作 |
|---|---|
| 未指定 | 全カテゴリを順に分析（フルモード） |
| `--global` | グローバルルール（`~/.claude/rules/`）の生成モード |
| カテゴリ名（例: `typescript`, `testing`） | 指定カテゴリのみを分析・生成する |

未知のカテゴリ名が指定された場合:
- 「'{category}' は定義済みカテゴリではありません。このキーワードで Web 検索してルールを生成しますか？」と確認する
- ユーザーが辞退した場合、定義済みカテゴリの一覧を表示して選択を促す

### ステップ1: 既存ルールのスキャン

ルールの重複を防ぐため、既存の設定を把握する。

**スキャン対象:**
1. `<project>/.claude/rules/` 配下の全 `.md` ファイル
2. `~/.claude/rules/` 配下の全 `.md` ファイル（`--global` 時、またはフルモード時）
3. `<project>/CLAUDE.md`
4. `~/.claude/CLAUDE.md`
5. `<project>/reference/` 配下（存在する場合のみ）

Glob ツールで `.claude/rules/*.md` を検索し、Read ツールで各ファイルの見出しと主要ルールを把握する。

**ユーザーへの表示:**
```
既存ルール:
- .claude/rules/core-essentials.md (always-on, 85行)
- .claude/rules/typescript.md (paths: *.ts,*.tsx, 120行)
- CLAUDE.md 内のルール: 15項目

新規ルールはこれらと重複しないように生成します。
```

**エラー時:** スキャン対象のディレクトリが存在しない場合は無視して次へ進む。既存ルールが0件でも問題なく続行する。

### ステップ2: 技術スタック検出

以下のファイルパターンマッチングで技術スタックを検出する。Glob ツールでファイルの存在を確認する。

| ファイルパターン | 技術スタック |
|---|---|
| `package.json` (next) | Next.js |
| `package.json` (react) | React |
| `tsconfig.json` | TypeScript |
| `prisma/schema.prisma` | Prisma |
| `*.tf` | Terraform |
| `go.mod` | Go |
| `requirements.txt` / `pyproject.toml` | Python |
| `Cargo.toml` | Rust |
| `.eslintrc*` / `eslint.config*` | ESLint |
| `prettier.config*` / `.prettierrc*` | Prettier |
| `vitest.config*` / `jest.config*` | テストフレームワーク |
| `tailwind.config*` | Tailwind CSS |
| `docker-compose*` / `Dockerfile` | Docker |

検出結果をユーザーに表示し、分析対象とするカテゴリを確認する。

**エラー時:** 技術スタックが1つも検出できない場合、ユーザーに手動で技術スタックを入力するよう促す。入力がなければコマンドを終了する。

### ステップ3: コードベース深層分析

**検出した技術スタックごとに、以下のカテゴリでコードパターンを分析する。**

分析は Task ツールで codebase-analyzer エージェントに委譲する:

```
Task ツール呼び出し:
- subagent_type: "subagent"
- prompt: 以下のコンテキストを含める
  - 分析対象カテゴリ（例: "TypeScript の命名規約・コードパターン"）
  - 対象ファイルの Glob パターン（例: "src/**/*.ts", "src/**/*.tsx"）
  - 分析観点（下記 3a-3d から該当するもの）
- 期待する出力形式: 下記「分析結果フォーマット」に準拠
```

#### 分析観点

##### 3a. 命名規約の検出

実際のソースコードから命名パターンを抽出する:
- ファイル名のパターン（PascalCase / camelCase / kebab-case）
- コンポーネント名、関数名、変数名、定数名の命名規則
- ディレクトリ構造の命名パターン
- テストファイルの命名パターン（`*.test.ts` / `*.spec.ts`）

##### 3b. コードパターンの検出

- インポートスタイル（named import / default import / barrel export）
- エラーハンドリングパターン（try-catch / Result 型 / Error boundary）
- 非同期パターン（async/await / Promise chain）
- 状態管理パターン
- コンポーネント構成パターン（関数 / クラス / hooks の使い方）

##### 3c. テストパターンの検出

- テストフレームワークと設定
- テストの構造（describe/it / test）
- モックの方法
- テストファイルの配置（co-located / 別ディレクトリ）

##### 3d. プロジェクト固有のパターン

- 環境変数の管理方法
- API のパターン（REST / GraphQL / tRPC）
- 認証パターン
- デプロイ・CI/CD の設定

#### 分析結果フォーマット

エージェントは以下の形式で結果を返す:

```markdown
## {カテゴリ名} 分析結果

### 検出パターン
- パターン名: 具体的な内容（例: "ファイル名: PascalCase（コンポーネント）、camelCase（ユーティリティ）"）
- 検出根拠: file_path:line_number の参照（最低2箇所）

### 一貫性スコア
- 高（90%以上が同一パターン） / 中（60-90%） / 低（60%未満）

### 特記事項
- パターンの例外や不整合があれば記載
```

**エラー時:** エージェントがタイムアウトまたはエラーを返した場合、該当カテゴリをスキップしてユーザーに報告する。手動でパターンを入力するか、スキップするかを確認する。

### ステップ4: Web ベストプラクティス参照

検出した技術スタックごとに、最新のベストプラクティスを収集する。

Web 検索は Task ツールで web-researcher エージェントに委譲する:

```
Task ツール呼び出し:
- subagent_type: "subagent"
- prompt: 以下のコンテキストを含める
  - 対象技術スタック（例: "TypeScript 5.x"）
  - 検索クエリ例:
    - "{tech} best practices coding standards 2025"
    - "{tech} common mistakes anti-patterns"
    - "{tech} Claude Code rules conventions"
  - ステップ3の検出パターン（照合用に渡す）
- 期待する出力形式: 下記「照合結果フォーマット」に準拠
```

#### 照合結果フォーマット

```markdown
## {技術スタック} ベストプラクティス照合

### 一致
- [一致] パターン名: プロジェクトの既存パターンがベストプラクティスと合致

### 推奨変更
- [推奨] パターン名: ベストプラクティスの内容（出典URL）
  - 現状: プロジェクトの現在のパターン
  - 推奨: ベストプラクティスのパターン

### 情報なし
- 検索で該当情報が見つからなかったパターン
```

**重要:** 既存パターンと矛盾するベストプラクティスがある場合、ユーザーに選択肢を提示する（既存パターンを維持 vs ベストプラクティスに移行）。DO NOT 自動的にベストプラクティスを採用しない。

**エラー時:** Web 検索が失敗した場合、ステップ3の分析結果のみでルール提案を行う。ユーザーに「Web 検索が利用できなかったため、コードベース分析のみに基づいて提案します」と報告する。

### ステップ5: 対話的ルール生成

**カテゴリごとにユーザーと対話しながらルールを確定する。**

1つのカテゴリについて以下を繰り返す:

#### 5a. 分析結果の提示

各ルール項目に「このルールがないと Claude は何を間違えるか」を必ず付記する。根拠が弱いルールは提案に含めない。「念のため入れておく」は DO NOT。

```
## TypeScript ルール

### コードベースから検出したパターン:
- ファイル名: PascalCase（コンポーネント）、camelCase（ユーティリティ）
- 関数: 全て arrow function を使用
- インポート: named import を優先、barrel export なし
- 型: interface を優先（type は union/intersection のみ）

### Web ベストプラクティスとの差分:
- [一致] strict モードが有効
- [推奨] as 型アサーションの代わりに satisfies を使用（プロジェクトで一部 as を使用中）
- [推奨] enum の代わりに const object + typeof を使用

### 提案するルール:

1. interface を優先し、type は union/intersection のみ
   → **このルールがないと**: Claude はデフォルトで type を使うことがあり、プロジェクトの既存コードと不整合になる

2. as の代わりに satisfies を使う
   → **このルールがないと**: Claude は型アサーションに as を使い、ランタイムエラーを見逃す可能性がある

3. enum の代わりに const object + typeof を使う
   → **このルールがないと**: Claude は enum を生成するが、Tree-shaking が効かずバンドルサイズに影響する
```

#### 5b. ユーザー選択

AskUserQuestion ツールで各ルール項目について確認する:
- **採用**: そのまま採用
- **修正**: ユーザーがカスタマイズして採用
- **却下**: このルールは不要
- **保留**: 今は決めない（後で /rules を再実行可能）

#### 5c. path スコープの決定

生成するルールファイルに paths: frontmatter を設定する。AskUserQuestion ツールで確認:

```
このルールの適用範囲を選択してください:
(1) paths: ["*.ts", "*.tsx"] -- TypeScript ファイル操作時のみ [推奨]
(2) 常時ロード（paths なし）
(3) カスタムパスパターンを指定
```

### ステップ6: ルールファイルの生成

確定したルールを `.claude/rules/` に書き出す。

#### ファイル命名規則

```
.claude/rules/<category>.md
```

例:
- `.claude/rules/typescript.md`
- `.claude/rules/testing.md`
- `.claude/rules/naming-conventions.md`
- `.claude/rules/api-patterns.md`
- `~/.claude/rules/personal-style.md`（グローバル）

#### ファイル構造

```markdown
---
paths:
  - "*.ts"
  - "*.tsx"
---

# TypeScript Rules

このプロジェクトの TypeScript コーディング規約。

## 型定義

interface を優先し、type は union/intersection 型にのみ使用する。
interface は拡張性が高く、エラーメッセージが読みやすいため。

```typescript
// Good
interface UserProps {
  name: string;
  email: string;
}

// Bad
type UserProps = {
  name: string;
  email: string;
};
```

## 型アサーション

`as` を使わず `satisfies` を使う。satisfies はランタイムの型安全性を保ちつつ、型の推論を維持するため。

```typescript
// Good
const config = { port: 3000 } satisfies Config;

// Bad
const config = { port: 3000 } as Config;
```
```

#### 冪等性: 既存ファイルとの衝突処理

NEVER 既存ルールファイルを無断で上書きしない。同名ファイルが存在する場合:

1. **差分を検出**: 既存ルールと新規提案を比較する
2. **差分を明示**: diff 形式でユーザーに表示する
3. **マージ方法を確認**: AskUserQuestion ツールで以下を確認する
   - 上書き（既存を新規で置換）
   - マージ（既存に新規セクションを追加）
   - キャンセル（既存を維持）

#### コンテキスト予算チェック

ファイル書き出し前に、ルールの合計がコンテキスト効率を圧迫しないか計測する:

```
コンテキスト予算:
- always-on ルール合計: 45行 / 150行目標 [OK]
- 既存 CLAUDE.md: 40行
- 既存 always-on rules/: 85行
- 新規追加分: 20行
- 合計 always-on: 145行 [OK]
```

**予算超過時の対処（AskUserQuestion で確認）:**
- always-on ルールを path-scoped に変換する提案
- 冗長な記述の圧縮提案
- 既存ルールとのマージ提案

DO NOT 予算超過のまま生成を進めない。

#### 生成前のユーザー確認

**NEVER ユーザー承認なしにルールファイルを書き出さない。** AskUserQuestion ツールで確認:

```
以下のルールファイルを生成します:

1. .claude/rules/typescript.md (paths: *.ts,*.tsx, 45行)
   - 型定義規約、インポートスタイル、エラーハンドリング
2. .claude/rules/testing.md (paths: *.test.ts,*.spec.ts, 30行)
   - テスト構造、モック規約
3. .claude/rules/naming.md (always-on, 20行)
   - ファイル・ディレクトリ命名規約

コンテキスト予算: always-on 合計 145行 / 150行目標 [OK]

生成を実行しますか？
```

承認後、Write ツールでファイルを書き出す。

### ステップ7: サマリーと次のステップ

```
ルール生成完了:
- .claude/rules/typescript.md (paths: *.ts,*.tsx)
- .claude/rules/testing.md (paths: *.test.ts,*.spec.ts)
- .claude/rules/naming.md (always-on)

合計: 3ファイル、95行
コンテキスト予算: always-on 145行 / 150行目標

次のステップ:
- ルールの微調整: 直接ファイルを編集
- 追加カテゴリ: `/rules testing` で特定カテゴリのみ再実行
- グローバルルール: `/rules --global` で個人設定を生成
```

---

## --global モード

`$ARGUMENTS` に `--global` が含まれる場合、グローバルルール生成モードで動作する。

### グローバルルールの対象

プロジェクト横断で適用される個人のプリファレンス:

| カテゴリ | 例 |
|---|---|
| コーディングスタイル | 早期リターン、const 優先、arrow function |
| コミュニケーション | 日本語で応答、簡潔に、コードコメントは英語 |
| ワークフロー | コミットメッセージ形式、PR テンプレート |
| セキュリティ | .env を絶対コミットしない、console.log を残さない |

### グローバルルールの生成先

`~/.claude/rules/<category>.md`

### ワークフロー

1. 既存のグローバルルール（`~/.claude/rules/`）と `~/.claude/CLAUDE.md` を Glob + Read ツールでスキャンする
2. AskUserQuestion ツールでユーザーに「どのような個人プリファレンスを記録しますか？」と対話形式で質問する
3. 各プリファレンスを適切なカテゴリにグループ化する
4. ルールファイルを生成する（ユーザー承認後、Write ツールで書き出す）

---

## カテゴリ指定モード

`$ARGUMENTS` にカテゴリ名が指定された場合、そのカテゴリのみを分析・生成する。

### 対応カテゴリ

| カテゴリ名 | 分析対象 |
|---|---|
| `typescript` / `ts` | TypeScript の型、インポート、パターン |
| `react` | コンポーネント、hooks、状態管理 |
| `nextjs` | App Router、RSC、データフェッチ |
| `testing` / `test` | テスト構造、モック、カバレッジ |
| `naming` | 命名規約全般 |
| `api` | API パターン、バリデーション |
| `security` / `sec` | セキュリティ規約 |
| `prisma` / `db` | DB アクセス、マイグレーション |
| `terraform` / `tf` | IaC パターン |
| `css` / `styling` | CSS / Tailwind 規約 |
| `git` | Git ワークフロー、コミット規約 |

---

## エラーハンドリング

各ステップでエラーが発生した場合の対処:

| ステップ | エラー条件 | 対処 |
|---|---|---|
| Step 1 | ディレクトリが存在しない | 無視して続行 |
| Step 2 | 技術スタックが0件 | ユーザーに手動入力を促す。入力なければ終了 |
| Step 3 | codebase-analyzer がエラー/タイムアウト | 該当カテゴリをスキップし報告。手動入力 or スキップを確認 |
| Step 4 | Web 検索失敗 | コードベース分析のみで提案。ユーザーに報告 |
| Step 5 | ユーザーが全ルールを却下 | 該当カテゴリをスキップし、次のカテゴリへ進む |
| Step 6 | ファイル書き出し失敗（hook ブロック等） | エラーメッセージを表示し、代替パスを提案 |
| Step 6 | ユーザーが生成を拒否 | 生成をキャンセルし、サマリーのみ表示 |

エラー発生時は必ず:
1. 失敗したステップと具体的なエラー内容を報告する
2. DO NOT 自動リトライしない。ユーザーに次のアクションを確認する

---

## 成功・終了条件

**SUCCESS**: 以下の全てを満たした場合:
- 対象カテゴリの分析が完了した
- ユーザーが確定したルールがファイルに書き出された
- コンテキスト予算が目標内に収まっている
- ステップ7のサマリーを表示した

**PARTIAL SUCCESS**: 以下の場合:
- 一部カテゴリのみ処理完了（ユーザーが途中で停止、またはエラーでスキップ）
- 処理済み・未処理のカテゴリをサマリーで明示する

**ABORT**: 以下の場合、コマンドを終了する:
- 技術スタックが検出できず、ユーザーが手動入力も辞退した
- ユーザーが明示的にキャンセルした

---

## 重要なルール

- **NEVER ユーザー承認なしにルールファイルを書き出さない**: 全ての生成は承認ゲートを通過する
- **NEVER 既存ルールファイルを無断で上書きしない**: 差分提案 → ユーザー確認 → 書き出しの順序を厳守する
- **DO NOT 既存コードパターンを無視しない**: ベストプラクティスが既存パターンと矛盾する場合は、ユーザーに選択させる
- **DO NOT 過剰なルールを提案しない**: 「Claude が実際に間違えること」のみをルール化する。根拠が弱いルールは提案に含めない
- **DO NOT 全ルールを always-on にしない**: path スコープを積極的に使い、関連ファイル操作時のみロードする
- **DO NOT コンテキスト予算を超過したまま生成しない**: always-on ルールの合計は150行以内を目標とする
- **DO NOT 既存の reference/ や CLAUDE.md と競合するルールを作らない**: 重複する内容を rules/ に再記述しない
