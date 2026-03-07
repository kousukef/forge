# test-multilayer スペック

## Requirements

### Requirement: REQ-001 design.md への受入テスト計画セクション追加

`/spec` コマンドで生成される design.md は、「技術的アプローチ」セクションと「リスクと注意点」セクションの間に「受入テスト計画」セクションを含まなければならない (SHALL)。受入テスト計画は proposal.md の各ユーザーストーリー（US-xxx）に対して、GIVEN/WHEN/THEN 形式の検証シナリオとテストレベル指定（L1/L2/L3）を記述する。

#### Happy Path Scenarios

- **GIVEN** proposal.md に US-001, US-002, US-003 の3つのユーザーストーリーが記載されている **WHEN** spec-writer が design.md を生成する **THEN** design.md の「受入テスト計画」セクションに US-001, US-002, US-003 それぞれの検証シナリオが GIVEN/WHEN/THEN 形式で記述され、各シナリオに L1/L2/L3 のいずれかのテストレベルが指定されている
- **GIVEN** design.md が生成された **WHEN** 「受入テスト計画」セクションの位置を確認する **THEN** 「技術的アプローチ」セクションの後、「リスクと注意点」セクションの前に配置されている

#### Error Scenarios

- **GIVEN** proposal.md にユーザーストーリーが US-xxx 形式で記載されていない（自由形式の箇条書き） **WHEN** spec-writer が受入テスト計画を生成する **THEN** 箇条書き項目を出現順に US-001, US-002, ... として自動付番し、各 US に対応する検証シナリオを生成する
- **GIVEN** proposal.md が存在しない **WHEN** spec-writer が design.md を生成する **THEN** 「受入テスト計画」セクションに「proposal.md が存在しないため受入テスト計画は生成できません」と記載し、design.md の生成は正常に続行する

#### Boundary Scenarios

- **GIVEN** proposal.md にユーザーストーリーが1件のみ記載されている **WHEN** spec-writer が受入テスト計画を生成する **THEN** 1件の US に対する検証シナリオのみが記載された受入テスト計画が生成される

#### Non-Functional Requirements

- **COMPATIBILITY**: 受入テスト計画セクションの追加は、design.md の既存セクション（概要、リサーチサマリー、技術的アプローチ、リスクと注意点）の内容・形式を変更しない

---

### Requirement: REQ-002 /test コマンドの多層テスト実行ワークフロー

`/test` コマンドは L1（Unit）→ L2（Integration）→ L3（Acceptance）の3層構造でテストを実行しなければならない (SHALL)。各レベルは前レベルの合格を Entry Criteria とし、テーラリングルールに基づきスキップ可能とする。

テストレベル定義:

| レベル | 名称 | テスト対象 | V-Model 左辺対応 | フィードバック |
|---|---|---|---|---|
| L1 | Unit | 個別モジュール（ユニットテスト + 静的解析 + ビルド） | 詳細設計 (tasks.md) | 秒〜分 |
| L2 | Integration | モジュール間連携（結合テスト + E2E） | アーキテクチャ設計 (design.md) | 分〜10分 |
| L3 | Acceptance | ユーザーストーリー充足（受入テスト計画の検証） | 要件定義 (proposal.md) | 手動含む |

#### Happy Path Scenarios

- **GIVEN** プロジェクトにユニットテスト、結合テスト、受入テスト計画が全て定義されている **WHEN** `/test` コマンドを引数なしで実行する **THEN** L1 → L2 → L3 の順に実行され、各レベルの結果がレベル別セクションで結果レポートに出力される
- **GIVEN** L1 が全て合格した **WHEN** L2 の実行判定を行う **THEN** L2 の Entry Criteria を満たすため L2 が実行される
- **GIVEN** L1, L2 が全て合格した **WHEN** L3 の実行判定を行う **THEN** L3 の Entry Criteria を満たすため L3 が実行される

#### Error Scenarios

- **GIVEN** L1 にテスト失敗がある **WHEN** L2 の実行判定を行う **THEN** L2 をスキップし、結果レポートに「L2 スキップ: L1 の合格が Entry Criteria を満たしていません」と記載する。L3 も同様にスキップする
- **GIVEN** L2 にテスト失敗がある **WHEN** L3 の実行判定を行う **THEN** L3 をスキップし、結果レポートに「L3 スキップ: L2 の合格が Entry Criteria を満たしていません」と記載する
- **GIVEN** `/test --level L4` の無効なレベル指定がある **WHEN** `/test` コマンドを実行する **THEN** 「無効なレベル指定: L4。有効な値は L1, L2, L3 です」とエラーメッセージを出力し、テストは実行しない

#### Boundary Scenarios

- **GIVEN** `/test --level L1` の引数でレベル指定がある **WHEN** `/test` コマンドを実行する **THEN** 指定された L1 レベルのテストのみを実行し、L2 と L3 はスキップする
- **GIVEN** `/test --level L2` の引数でレベル指定がある **WHEN** `/test` コマンドを実行する **THEN** L1 と L2 を順に実行し、L3 はスキップする（L1 は L2 の Entry Criteria のため常に実行される）
- **GIVEN** `/test --level L3` の引数でレベル指定がある **WHEN** `/test` コマンドを実行する **THEN** L1, L2, L3 を順に実行する（全レベル実行と同等の動作）

#### Non-Functional Requirements

- **COMPATIBILITY**: L1 セクションの内容は現行の Step 1 から E2E テストを除いた検証（ユニットテスト + 静的解析 + ビルド + カバレッジ）と同等の検証を維持する。E2E テストは L2 に配置する
- **ERROR_UX**: 各テストレベルのスキップ理由が結果レポートに明記され、ユーザーが次に修正すべき箇所を判断できる

---

### Requirement: REQ-003 テストレベルのテーラリングルール

`/test` コマンドは以下のテーラリングルールに基づき、テストレベルのスキップ判定を行わなければならない (SHALL):

- L1 は全プロジェクトで必須（スキップ不可）
- L2 はプロジェクトに結合テストまたは E2E テストが存在する場合に実行する。存在しない場合は「L2 スキップ: 結合テスト/E2E テストが定義されていません」と記載してスキップする
- L3 は design.md に「受入テスト計画」セクションが存在する場合に実行する。存在しない場合は「L3 スキップ: 受入テスト計画が design.md に定義されていません」と記載してスキップする

#### Happy Path Scenarios

- **GIVEN** プロジェクトにユニットテストのみが存在し、E2E テストも受入テスト計画もない **WHEN** `/test` コマンドを実行する **THEN** L1 のみ実行され、L2 と L3 はスキップ理由付きで結果レポートに記載される
- **GIVEN** プロジェクトにユニットテストと E2E テストが存在するが受入テスト計画がない **WHEN** `/test` コマンドを実行する **THEN** L1 と L2 が実行され、L3 はスキップ理由付きで結果レポートに記載される

#### Error Scenarios

- **GIVEN** `/test --level L3` が指定されたが受入テスト計画が存在しない **WHEN** `/test` コマンドを実行する **THEN** L1 を実行後、「L3 スキップ: 受入テスト計画が design.md に定義されていません。`/spec` で受入テスト計画を生成してください」と記載する。コマンドはエラー終了しない

---

### Requirement: REQ-004 テストレベルの Entry/Exit Criteria

各テストレベルの Entry Criteria（実行開始条件）と Exit Criteria（合格判定基準）を定義する (SHALL)。

| レベル | Entry Criteria | Exit Criteria |
|---|---|---|
| L1 | なし（常に実行可能） | 全ユニットテスト合格、静的解析エラーゼロ、ビルド成功 |
| L2 | L1 の Exit Criteria 達成 | 全結合テスト/E2E テスト合格 |
| L3 | L2 の Exit Criteria 達成（L2 スキップ時は L1 の Exit Criteria 達成） | 全ユーザーストーリーの受入テストシナリオが検証済み |

#### Happy Path Scenarios

- **GIVEN** L1 のユニットテストが全て合格、静的解析エラーゼロ、ビルド成功 **WHEN** L1 の Exit Criteria を評価する **THEN** L1 は PASS と判定される
- **GIVEN** L2 の結合テスト/E2E テストが全て合格 **WHEN** L2 の Exit Criteria を評価する **THEN** L2 は PASS と判定される
- **GIVEN** 受入テスト計画の全シナリオが検証済み **WHEN** L3 の Exit Criteria を評価する **THEN** L3 は PASS と判定される

#### Error Scenarios

- **GIVEN** L1 のユニットテストに1件以上の失敗がある **WHEN** L1 の Exit Criteria を評価する **THEN** L1 は FAIL と判定され、失敗テストの一覧と根本原因分析が結果レポートに出力される
- **GIVEN** L2 の結合テストに1件以上の失敗がある **WHEN** L2 の Exit Criteria を評価する **THEN** L2 は FAIL と判定され、失敗テストの一覧と根本原因分析が結果レポートに出力される
- **GIVEN** L3 の受入テストシナリオに1件以上の未検証または失敗がある **WHEN** L3 の Exit Criteria を評価する **THEN** L3 は FAIL と判定され、未検証/失敗シナリオの一覧が結果レポートに出力される

---

### Requirement: REQ-005 結果レポートの多層構造化

`/test` コマンドの結果レポートは、テストレベル別セクションとユーザーストーリー別受入テスト結果集計を含まなければならない (SHALL)。

結果レポート形式:
```
# テスト結果レポート

## サマリー
- L1 (Unit): PASS / FAIL
- L2 (Integration): PASS / FAIL / SKIPPED
- L3 (Acceptance): PASS / FAIL / SKIPPED

## L1: Unit テスト結果
### ユニットテスト
[実行結果]
### 静的解析
[実行結果]
### ビルド
[実行結果]
### カバレッジ
[カバレッジ結果]

## L2: Integration テスト結果
### 結合テスト
[実行結果]
### E2E テスト
[実行結果]

## L3: Acceptance テスト結果
### US 別受入テスト結果
| US | ストーリー | シナリオ数 | 合格数 | 結果 |
|---|---|---|---|---|
| US-001 | ... | N | N | PASS/FAIL |

### 受入テストシナリオ詳細
[各シナリオの検証結果]

## 失敗分析（該当する場合）
### [テスト名]
- **レベル**: L1/L2/L3
- **原因**: [根本原因]
- **修正**: [修正内容]
```

#### Happy Path Scenarios

- **GIVEN** L1, L2, L3 が全て実行され合格した **WHEN** 結果レポートを出力する **THEN** サマリーに全レベル PASS が記載され、L1/L2/L3 の各セクションに実行結果が記載される
- **GIVEN** proposal.md に US-001, US-002 の2件のユーザーストーリーがあり、受入テスト計画に各 US に対して2件ずつシナリオが定義されている **WHEN** L3 受入テスト結果を出力する **THEN** US 別受入テスト結果テーブルに US-001（2/2 PASS）、US-002（2/2 PASS）が集計される

#### Error Scenarios

- **GIVEN** L2 がスキップされた **WHEN** 結果レポートを出力する **THEN** サマリーの L2 が「SKIPPED」と記載され、L2 セクションにスキップ理由が記載される。L3 セクションも同様にスキップ情報が記載される
- **GIVEN** L3 の受入テストで US-001 の1件のシナリオが失敗した **WHEN** 結果レポートを出力する **THEN** US 別受入テスト結果テーブルに US-001（1/2 FAIL）が記載され、失敗分析セクションに失敗シナリオの詳細が出力される

#### Non-Functional Requirements

- **COMPATIBILITY**: L1 セクションの内容は現行の結果レポート形式（サマリー + 実行結果）と同等の情報を含む。既存の結果レポートを読み慣れたユーザーが L1 セクションで同等の情報を取得できる

---

### Requirement: REQ-006 受入テスト結果の US 別集計

L3（Acceptance）テスト結果は、traceability.md の US → TP マッピングを Source of Truth としてユーザーストーリー単位で集計しなければならない (SHALL)。design.md の受入テスト計画はシナリオの定義元であり、各シナリオは TP として traceability.md に登録される。L3 実行時の集計・判定は traceability.md の TP マッピングに基づいて行う。

#### Happy Path Scenarios

- **GIVEN** traceability.md に US-001 → TP-001, TP-002, TP-003 のマッピングがある **WHEN** L3 受入テスト結果を集計する **THEN** US-001 に対して TP-001, TP-002, TP-003 の合格/失敗を集計し、「US-001: 3/3 PASS」と出力する
- **GIVEN** traceability.md に US-001 → TP-001, TP-002 と US-002 → TP-003 のマッピングがある **WHEN** L3 受入テスト結果を集計する **THEN** US 別テーブルに US-001 と US-002 がそれぞれ独立して集計される

#### Error Scenarios

- **GIVEN** traceability.md が存在しない **WHEN** L3 受入テスト結果を集計する **THEN** US 別集計をスキップし、「traceability.md が存在しないため US 別集計を行えません。シナリオ単位の結果のみ出力します」と記載する
- **GIVEN** traceability.md の US-002 に対応する TP が1件も存在しない **WHEN** L3 受入テスト結果を集計する **THEN** US-002 の結果を「N/A（テスト観点未割当）」と記載し、警告を出力する

---

### Requirement: REQ-007 spec-writer の受入テスト計画生成ロジック追加

spec-writer エージェント定義（`agents/spec/spec-writer.md`）の Step 4 に受入テスト計画の生成ロジックを追加し、design.md 出力形式に「受入テスト計画」セクションテンプレートを追加する (SHALL)。

#### Happy Path Scenarios

- **GIVEN** spec-writer エージェント定義を確認する **WHEN** Step 4 の生成ロジックを読む **THEN** design.md 生成時に「受入テスト計画」セクションを生成する手順が記載されている
- **GIVEN** spec-writer エージェント定義を確認する **WHEN** design.md 出力形式テンプレートを読む **THEN** 「技術的アプローチ」と「リスクと注意点」の間に「受入テスト計画」セクションテンプレートが定義されている

#### Error Scenarios

- **GIVEN** spec-writer が受入テスト計画を生成する **WHEN** proposal.md にユーザーストーリーが存在しない **THEN** 「受入テスト計画」セクションに「ユーザーストーリーが定義されていないため受入テスト計画を生成できません」と記載する

---

### Requirement: REQ-008 spec-writer の tasks.md テスト戦略テンプレート多層化

spec-writer エージェント定義（`agents/spec/spec-writer.md`）の tasks.md 出力形式テンプレートの「テスト戦略」セクションを L1/L2/L3 の多層構造に拡張する (SHALL)。

tasks.md テスト戦略テンプレート:
```
## テスト戦略
### L1: Unit テスト
- ユニットテスト: [対象と方針]
- 静的解析: [対象と方針]
- ビルド検証: [対象と方針]

### L2: Integration テスト
- 結合テスト: [対象と方針]（該当しない場合: 「L2 対象なし」）
- E2E テスト: [対象と方針]（該当しない場合: 「L2 対象なし」）

### L3: Acceptance テスト
- 受入テスト: [検証対象の US と方針]（該当しない場合: 「L3 対象なし」）
```

#### Happy Path Scenarios

- **GIVEN** spec-writer エージェント定義を確認する **WHEN** tasks.md 出力形式テンプレートを読む **THEN** テスト戦略セクションが L1/L2/L3 の3層構造で定義されている

#### Error Scenarios

- **GIVEN** spec-writer が tasks.md を生成する **WHEN** 対象プロジェクトに結合テストも E2E テストも存在しない **THEN** L2 セクションに「L2 対象なし」と記載する

---

### Requirement: REQ-009 spec-validator の受入テスト計画検証項目追加

spec-validator エージェント定義（`agents/spec/spec-validator.md`）の検証項目に「11. 受入テスト計画の網羅性チェック」を追加する (SHALL)。検証項目数の見出しを「10 の検証項目」から「11 の検証項目」に更新する。

検証内容:
- design.md に「受入テスト計画」セクションが存在するか
- 全ユーザーストーリー（US-xxx）に対応する検証シナリオが定義されているか
- 各検証シナリオに GIVEN/WHEN/THEN 形式が使用されているか
- 各検証シナリオにテストレベル指定（L1/L2/L3）が付与されているか

#### Happy Path Scenarios

- **GIVEN** spec-validator エージェント定義を確認する **WHEN** 検証項目リストを読む **THEN** 「11. 受入テスト計画の網羅性チェック」が追加されている
- **GIVEN** spec-validator エージェント定義を確認する **WHEN** 検証項目数の見出しを読む **THEN** 「11 の検証項目」と記載されている
- **GIVEN** design.md に受入テスト計画があり、全 US に GIVEN/WHEN/THEN 形式のシナリオとテストレベル指定がある **WHEN** spec-validator が検証する **THEN** 「受入テスト計画: 全 US カバー済み」と Spec Validation Report に記載する

#### Error Scenarios

- **GIVEN** design.md に「受入テスト計画」セクションが存在しない **WHEN** spec-validator が検証する **THEN** 「要修正: 受入テスト計画セクションが design.md に存在しません」とフラグする
- **GIVEN** 受入テスト計画に US-002 に対応するシナリオが存在しない **WHEN** spec-validator が検証する **THEN** 「要修正: US-002 に対応する受入テストシナリオが定義されていません」とフラグする

---

### Requirement: REQ-010 commands/spec.md のテンプレート更新

`commands/spec.md` の design.md テンプレートに「受入テスト計画」セクションを追加し、tasks.md テンプレートの「テスト戦略」セクションを L1/L2/L3 多層構造に拡張する (SHALL)。

#### Happy Path Scenarios

- **GIVEN** commands/spec.md を確認する **WHEN** 設計ドキュメント形式テンプレートを読む **THEN** 「技術的アプローチ」と「リスクと注意点」の間に「受入テスト計画」セクションが含まれている
- **GIVEN** commands/spec.md を確認する **WHEN** タスクリスト形式テンプレートを読む **THEN** テスト戦略セクションが L1/L2/L3 の3層構造で定義されている

#### Error Scenarios

- **GIVEN** commands/spec.md と agents/spec/spec-writer.md のテンプレートを比較する **WHEN** 「受入テスト計画」セクションの位置を確認する **THEN** 両方のテンプレートで「技術的アプローチ」と「リスクと注意点」の間に同一の位置で定義されている（不整合がない）

#### Non-Functional Requirements

- **COMPATIBILITY**: テンプレートの変更は既存の design.md / tasks.md の形式に追加する形で実装し、既存セクションの名称・構造を変更しない

---

### Requirement: REQ-011 /test コマンドの Step 構造（現行のフラット構造を多層構造に変更）

現行の /test コマンドの Step 1〜3（テスト実行 → 結果分析 → 失敗時修正）を多層テスト構造に変更する。

#### Happy Path Scenarios

- **GIVEN** /test コマンド定義を確認する **WHEN** ワークフローを読む **THEN** Step 1 がテーラリング判定、Step 2 が L1 実行、Step 3 が L2 実行（該当時）、Step 4 が L3 実行（該当時）、Step 5 が結果分析、Step 6 が失敗時修正のフローになっている

#### Error Scenarios

- **GIVEN** /test コマンドの Step 6 で修正を適用した **WHEN** 再テストを実行する **THEN** 修正されたファイルがユニットテスト対象の場合は L1 から、結合テスト/E2E テスト対象の場合は L2 から再実行する。判定が困難な場合は L1 から再実行する（安全側に倒す）

#### Non-Functional Requirements

- **COMPATIBILITY**: /test コマンドの結果レポート形式は REQ-005 で定義された新形式に変更する。ただし L1 セクション内の情報は現行レポート形式と同等の内容を維持する

---

### Requirement: REQ-012 spec-validator の検証項目数更新

spec-validator の検証項目数を 10 から 11 に更新する。

#### Happy Path Scenarios

- **GIVEN** spec-validator エージェント定義を確認する **WHEN** 検証項目数の見出しを読む **THEN** 「11 の検証項目」と記載されている
- **GIVEN** /spec コマンド定義（commands/spec.md）を確認する **WHEN** Phase 3 の検証項目記述を読む **THEN** 「11 の検証項目」と記載されている

#### Error Scenarios

- **GIVEN** spec-validator の検証項目見出しが「10 の検証項目」のまま **WHEN** 検証項目リストに 11 番目の項目がある **THEN** 見出しとリスト件数の不整合が発生する（これを防止するため全箇所を同期更新する）

---

## ファイル間整合性テーブル

以下のファイル間で同一概念の記述が存在し、同期更新が必要:

| 概念 | commands/spec.md | agents/spec/spec-writer.md | agents/spec/spec-validator.md | commands/test.md |
|---|---|---|---|---|
| design.md テンプレート（受入テスト計画セクション位置） | L246-274 相当 | 出力形式テンプレート | - | - |
| tasks.md テスト戦略テンプレート（L1/L2/L3） | L280-297 相当 | 出力形式テンプレート | - | - |
| spec-validator 検証項目数（10→11） | Phase 3 記述 | - | 見出し + リスト | - |
| 結果レポート形式 | - | - | - | 結果レポート形式セクション |
