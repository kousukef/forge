# architecture-patterns: 技術的制約

- 依存の方向: domain/ ← application/ ← infrastructure/（逆方向の依存は禁止）
- ドメイン層はフレームワーク非依存（純粋なビジネスロジック）
- Aggregate Root 経由でのみ内部状態を変更する
- Aggregate 間の参照は ID のみ（オブジェクト参照禁止）
- 1トランザクション = 1 Aggregate の更新
- モジュール外からの import は必ず index.ts 経由。内部パスへの直接アクセスは禁止
- Bounded Context 間は直接 import せず、イベントまたは Anti-Corruption Layer を使う
- 依存の組み立て（new の呼び出し）は Composition Root に集約する
- ドメイン層やアプリケーション層では具象クラスを new しない
- Premature Abstraction 禁止: 2つ目の実装が必要になってから抽象化する
- Anemic Domain Model 禁止: ビジネスロジックをドメインオブジェクトに配置する
