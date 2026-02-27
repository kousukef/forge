# コーディングスタイル

## ファイルサイズ
- 推奨: 200〜400行
- 上限: 800行
- 超える場合は分割を検討

## 命名規約
- コンポーネント: PascalCase（`UserProfile.tsx`）
- ユーティリティ: camelCase（`formatDate.ts`）
- 定数: UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- 型: PascalCase + suffix（`UserResponse`, `CreateUserInput`）
- ファイル: kebab-case（`user-profile.tsx`）※コンポーネントファイルはPascalCaseも可

## インポート順序
1. React/Next.js
2. 外部ライブラリ
3. 内部モジュール（`@/`パス）
4. 型インポート（`type`）
5. スタイル

## コメント
- 「何をしているか」ではなく「なぜそうしているか」を書く
- TODOコメントには担当者と日付を含める: `// TODO(kosuke 2025-01-01): 理由`
- JSDocはパブリックAPIにのみ
