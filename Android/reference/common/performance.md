# パフォーマンス規約

- Server Componentsをデフォルトとし、`use client`は必要な場合のみ
- 画像は`next/image`を使用
- 動的インポートで初期バンドルサイズを削減
- Prismaクエリは`select`で必要なフィールドのみ取得
- N+1クエリの防止: `include`より`select`で明示的にリレーション取得
- キャッシュ戦略を明示的に設定（`revalidate`, `unstable_cache`）
- Web Vitals目標: LCP < 2.5s, FID < 100ms, CLS < 0.1
