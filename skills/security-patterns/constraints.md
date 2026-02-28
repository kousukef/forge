# security-patterns: 技術的制約

- `dangerouslySetInnerHTML` は原則禁止。やむを得ない場合は DOMPurify でサニタイズ
- `eval()` / `new Function()` 使用禁止
- `href` に `javascript:` プロトコルを許可しない
- `$queryRawUnsafe` で文字列連結は禁止（SQL インジェクション）
- `Access-Control-Allow-Origin: *` は認証付き API で禁止
- トークン保存先は httpOnly Cookie のみ（localStorage / sessionStorage 禁止）
- パスワードは bcrypt / argon2 でハッシュ化。平文保存は禁止
- シークレット（API キー・パスワード・トークン）のハードコード禁止
- `NEXT_PUBLIC_` プレフィックスにシークレットを含めない
- シークレットを console.log / エラーメッセージに含めない
- Cookie 必須属性: httpOnly=true, secure=true（本番）, sameSite=strict|lax
- Route Handlers の POST には CSRF 対策（Origin 検証）が必要
- ファイルアップロードにはサイズ上限と MIME タイプホワイトリスト必須
- セキュリティ防御策に YAGNI を適用しない。防御は常に先手で実装
