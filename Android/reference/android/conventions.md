# Android Conventions

## プロジェクト構成

```
app/
  src/
    main/
      java/com/example/app/
        core/          # 共通ユーティリティ・拡張関数
        di/            # Hilt モジュール
        feature/       # 機能モジュール（機能ベース分割）
          user/
            presentation/
            domain/
            data/
        ui/            # 共通 UI コンポーネント・テーマ
      res/
        values/        # strings.xml（機密情報禁止）
        xml/           # network_security_config.xml 等
    androidTest/       # インストルメンテーションテスト
    test/              # ユニットテスト
```

## Gradle

- バージョン管理は `libs.versions.toml`（バージョンカタログ）に統一
- `buildSrc` は廃止傾向、`build-logic` モジュールを推奨
- ビルドバリアント: `debug`（開発）/ `release`（本番）最低 2 つ
- `BuildConfig` への機密情報埋め込みは `local.properties` + `buildConfigField` で

## リソース命名

- レイアウト: `activity_main.xml`, `fragment_user.xml`, `item_post.xml`
- 画像: `ic_` (アイコン)、`img_` (画像)、`bg_` (背景)
- 色: `color_primary`, `color_on_surface`（Material You に合わせる）
- dimen: `spacing_sm`, `spacing_md`, `spacing_lg`

## ライフサイクル

- `onCreate` はビュー初期化のみ（重い処理は ViewModel に移譲）
- `onResume` / `onPause` でセンサー・GPS の登録解除
- `Fragment.onDestroyView` で View バインディングを null に設定
- `Activity.onSaveInstanceState` でプロセス再起動に備えた状態保存

## Manifest

- 最低限の `uses-permission` のみ宣言（不要なパーミッション削除）
- `android:exported` を全コンポーネントに明示（Android 12+）
- `android:allowBackup="false"` または Backup ルールを設定
