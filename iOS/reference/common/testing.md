# テスト規約

## テストフレームワーク
- ユニットテスト: Vitest
- E2Eテスト: Playwright
- コンポーネントテスト: Vitest + Testing Library

## テストファイル配置
- `__tests__/` ディレクトリにまとめる、または
- 対象ファイルと同階層に `.test.ts` / `.spec.ts`

## テスト命名
- `describe('[対象]', () => { ... })`
- `it('should [期待する動作] when [条件]', () => { ... })`

## テストの原則
- Arrange → Act → Assert パターン
- モックは最小限に
- テストデータはファクトリ関数で生成
- E2Eテストはユーザー視点で記述
