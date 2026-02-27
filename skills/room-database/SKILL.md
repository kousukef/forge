---
name: room-database
description: "Room DAO/Entity・TypeConverter・マイグレーション戦略・クエリ最適化のベストプラクティス"
---

# Room Database

## Entity 設計

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_name") val name: String,
    @ColumnInfo(name = "created_at") val createdAt: Long
)
```

- テーブル名は `snake_case`
- `@ColumnInfo(name = "...")` でカラム名を明示
- ドメインモデルと Entity は別クラスで定義（変換は DataSource 層で）

## DAO

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserById(userId: String): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Delete
    suspend fun deleteUser(user: UserEntity)
}
```

- `Flow<T>` を返すクエリは変更を自動通知（`suspend` 不要）
- 書き込み操作は `suspend fun` にする
- `@Transaction` で複数操作をアトミックに

## TypeConverter

```kotlin
class DateConverters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? = date?.time
}
```

## マイグレーション

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''")
    }
}
```

- `fallbackToDestructiveMigration()` は開発中のみ使用（本番禁止）
- マイグレーションは必ずテストで検証（`MigrationTestHelper`）

## パフォーマンス

- `@Index` で頻繁にクエリされるカラムにインデックスを追加
- `LIMIT` 句でページネーション実装（`Paging 3` ライブラリ推奨）
- N+1 クエリ防止: 関連テーブルは `@Relation` で JOIN
