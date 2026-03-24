# W-Model 左辺レビュー デルタスペック

## ADDED Requirements

### Requirement: REQ-001 テスタビリティレビューの追加

commands/brainstorm.md にステップ5.8「テスタビリティレビュー」を追加する。各ユーザーストーリーに対して「どう検証するか」の観点を brainstorm 段階で確認し、検証不可能な要件の早期検出を可能にする。このチェックは非ブロッキングとする。

#### Happy Path Scenarios

- **GIVEN** brainstorm.md にステップ5.8 が定義されている **WHEN** ステップ5.8 の内容を確認する **THEN** 各ユーザーストーリーに「このストーリーはどう検証しますか？」と問いかけるワークフローが記述されている
- **GIVEN** ステップ5.8 でユーザーが検証観点を回答した **WHEN** proposal.md のユーザーストーリーを確認する **THEN** 各ストーリーの下に「検証観点: [回答]」が追記されている
- **GIVEN** ステップ5.8 でユーザーが曖昧な検証観点を回答した **WHEN** ステップの記述を確認する **THEN** より具体的な検証方法を追加質問するよう指示されている

#### Error Scenarios

- **GIVEN** ステップ5.8 でユーザーが「このまま進める」と判断した **WHEN** 検証観点が不十分なストーリーがある **THEN** ステップは非ブロッキングであり、そのまま次のステップに進む（提案書生成を妨げない）
- **GIVEN** ステップ5.8 が実行される **WHEN** proposal.md にユーザーストーリーが0件である **THEN** テスタビリティレビューをスキップし、次のステップに進む

#### Boundary Scenarios

- **GIVEN** ステップ5.8 が実行される **WHEN** ユーザーストーリーが1件のみ存在する **THEN** その1件に対して検証観点を問いかける

#### Non-Functional Requirements

- **COMPATIBILITY**: テスタビリティレビューの追加は、既存のステップ5.7（story-quality-gate）の動作・出力を変更しない。ステップ5.7 の後に独立したステップとして追加される

### Requirement: REQ-002 フェーズゲートの定義

.claude/rules/core-rules.md の Verification Gates セクションの直後に Phase Gates セクションを新設する。brainstorm→spec, spec→implement, implement→review の各遷移にエントリー/エグジット基準を定義する。

#### Happy Path Scenarios

- **GIVEN** core-rules.md に Phase Gates セクションが存在する **WHEN** セクションの構造を確認する **THEN** Verification Gates の直後に配置され、独立したセクションとして定義されている
- **GIVEN** Phase Gates に brainstorm→spec の遷移が定義されている **WHEN** エントリー基準を確認する **THEN** 「proposal.md の必須セクション（Intent, User Stories, Scope, Out of Scope）完備」「ユーザー承認済み」が含まれている
- **GIVEN** Phase Gates に brainstorm→spec の遷移が定義されている **WHEN** エグジット基準を確認する **THEN** 「spec-validator PASS」「ユーザー承認済み」が含まれている
- **GIVEN** Phase Gates に spec→implement の遷移が定義されている **WHEN** エントリー基準を確認する **THEN** 「design.md + tasks.md + delta-spec.md + traceability.md が存在」が含まれている
- **GIVEN** Phase Gates に spec→implement の遷移が定義されている **WHEN** エグジット基準を確認する **THEN** 「全タスク完了」「テスト合格」が含まれている
- **GIVEN** Phase Gates に implement→review の遷移が定義されている **WHEN** エントリー基準を確認する **THEN** 「全テスト合格」「型チェック合格」が含まれている
- **GIVEN** Phase Gates に implement→review の遷移が定義されている **WHEN** エグジット基準を確認する **THEN** 「レビュー指摘の P1/P2 が解消済み」が含まれている

#### Error Scenarios

- **GIVEN** Phase Gates が定義されている **WHEN** Verification Gates セクションの内容を確認する **THEN** Verification Gates の内容は変更されておらず、Phase Gates とは独立したセクションとして維持されている（既存機能への副作用なし）

#### Non-Functional Requirements

- **COMPATIBILITY**: Phase Gates セクションの追加は、既存の Verification Gates セクションの内容・位置・参照を変更しない

### Requirement: REQ-003 /spec のフェーズゲート参照

commands/spec.md のワークフローにフェーズゲートへの参照を追加する。エントリー基準を Phase 1 冒頭で、エグジット基準を Phase 5 で参照する。

#### Happy Path Scenarios

- **GIVEN** spec.md の Phase 1a/1b の前に新しいステップが存在する **WHEN** その内容を確認する **THEN** 「Phase Gate: brainstorm → spec のエントリー基準を確認する（.claude/rules/core-rules.md 参照）」と記述されている
- **GIVEN** spec.md の Phase 5 にエグジット基準参照が追加されている **WHEN** その内容を確認する **THEN** 「Phase Gate: spec → implement のエグジット基準を満たしていることを確認する（.claude/rules/core-rules.md 参照）」と記述されている

#### Error Scenarios

- **GIVEN** spec.md にフェーズゲート参照が追加されている **WHEN** 既存の Phase 番号を確認する **THEN** Phase 1a/1b/1.5/1.7/2/3/4/5 の番号体系は維持されている（ゲート参照は既存 Phase の先頭/末尾に追記する形であり、新 Phase を追加しない）

### Requirement: REQ-004 /implement の中間レビューポイント

commands/implement.md の Step 4a（Teams モード）と Step 4b（Sub Agents モード）に、タスク数50%完了時の中間レビューチェックポイントを追加する。タスク総数が4以下の場合はスキップする。

#### Happy Path Scenarios

- **GIVEN** implement.md の Step 4b に中間レビューが定義されている **WHEN** トリガー条件を確認する **THEN** 「tasks.md のタスク総数の50%（切り上げ）が完了した時点」と記述されている
- **GIVEN** 中間レビューが定義されている **WHEN** 実行内容を確認する **THEN** spec-compliance-reviewer を「事後検証モード」で起動し、完了済みタスクのみを対象とすることが記述されている
- **GIVEN** 中間レビューの結果処理が定義されている **WHEN** 逸脱なしの場合を確認する **THEN** 残タスクの実装を継続する
- **GIVEN** 中間レビューの結果処理が定義されている **WHEN** 逸脱ありの場合を確認する **THEN** 逸脱を修正してから残タスクの実装を継続する
- **GIVEN** implement.md の Step 4a に中間レビューが定義されている **WHEN** Teams モードの記述を確認する **THEN** Sub Agents モードと同等の中間レビューロジックが記述されている

#### Error Scenarios

- **GIVEN** 中間レビューが定義されている **WHEN** タスク総数が4以下の場合を確認する **THEN** 「タスク総数が4以下の場合は中間レビューをスキップする」と明記されている
- **GIVEN** 中間レビューで仕様エスカレーションが発生した **WHEN** 結果処理を確認する **THEN** AskUserQuestion でユーザーに確認する旨が記述されている

#### Boundary Scenarios

- **GIVEN** タスク総数が5の場合 **WHEN** 中間レビューのトリガーを確認する **THEN** 3タスク完了時（50%切り上げ = ceil(5/2) = 3）に中間レビューが実行される
- **GIVEN** タスク総数が4の場合 **WHEN** 中間レビューのスキップ条件を確認する **THEN** 中間レビューはスキップされる
- **GIVEN** 中間レビューが1回実行済みの状態で残タスクの実装を継続している **WHEN** 追加のタスクが完了する **THEN** 2回目の中間レビューは実行されない（中間レビューは変更セッションあたり1回のみ）

### Requirement: REQ-005 spec-validator のエントリー基準プレチェック

agents/spec/spec-validator.md の Step 1 の前に Step 0「エントリー基準プレチェック」を追加する。このプレチェックは「11 の検証項目」とは独立した前提条件チェックであり、検証項目数には含めない。

#### Happy Path Scenarios

- **GIVEN** spec-validator.md に Step 0 が定義されている **WHEN** Step 0 の内容を確認する **THEN** proposal.md の存在チェック、必須セクション（Intent, User Stories/Scope, Out of Scope）の存在チェック、ユーザーストーリーの最低1つの存在チェックが含まれている
- **GIVEN** Step 0 の全条件が PASS した **WHEN** 次のステップを確認する **THEN** Step 1（対象ファイルの読み込み）に進む

#### Error Scenarios

- **GIVEN** Step 0 で proposal.md が存在しない **WHEN** 結果を確認する **THEN** 「エントリー基準未達: proposal.md が存在しません。/brainstorm で作成してください」とエラーを出力し、検証を中止する（ブロッキング）
- **GIVEN** Step 0 で必須セクションが不足している **WHEN** 結果を確認する **THEN** 「エントリー基準未達: [不足セクション名] が proposal.md に存在しません。/brainstorm で補完してください」とエラーを出力し、検証を中止する（ブロッキング）

#### Boundary Scenarios

- **GIVEN** Step 0 で proposal.md に必須セクションの見出しは存在するが内容が空の場合 **WHEN** エントリー基準を評価する **THEN** 見出しのみの存在は条件を満たすが、ユーザーストーリーの最低1つ存在チェックで FAIL する（ストーリーが0件のため）

> **補足**: Step 0 は Phase Gates の「brainstorm → spec」エントリー基準のうち、自動検証可能なサブセット（ファイル存在・セクション存在・ストーリー存在）のみをチェックする。「ユーザー承認済み」は /spec のワークフロー（/brainstorm 後のユーザー承認 → /spec 起動）で保証されるため、Step 0 のチェック対象外とする。

## ファイル間整合性テーブル

以下の概念が複数ファイルで参照されるため、整合性を維持する必要がある:

| 概念 | 参照元ファイル | 整合性ポイント |
|---|---|---|
| Phase Gates（フェーズゲート） | .claude/rules/core-rules.md（定義）、commands/spec.md（参照）、commands/implement.md（参照） | ゲート名と遷移名が一致していること |
| brainstorm→spec エントリー基準 | .claude/rules/core-rules.md（定義）、agents/spec/spec-validator.md Step 0（チェック実装） | チェック条件が一致していること |
| 11 の検証項目 | agents/spec/spec-validator.md（行49, 233）、commands/spec.md（行151） | Step 0 追加後も「11 の検証項目」の記述が変更されていないこと |
| テスタビリティレビュー | commands/brainstorm.md（ステップ5.8）、提案書テンプレート（検証観点の追記） | ステップ5.8 の出力形式と提案書テンプレートが整合していること |

## REMOVED Requirements

なし
