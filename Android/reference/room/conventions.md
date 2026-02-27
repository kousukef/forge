# Room Database Conventions

## 命名規則

- Entity クラス: `*Entity`（例: `UserEntity`）
- DAO インターフェース: `*Dao`（例: `UserDao`）
- Database クラス: `*Database`（例: `AppDatabase`）
- テーブル名: `snake_case` の複数形（例: `users`, `blog_posts`）

## Entity テンプレート

```kotlin
@Entity(
    tableName = "users",
    indices = [Index(value = ["email"], unique = true)]
)
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "display_name") val displayName: String,
    @ColumnInfo(name = "email") val email: String,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis()
)
```

## DAO テンプレート

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY created_at DESC")
    fun getAllUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserById(userId: String): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Update
    suspend fun updateUser(user: UserEntity)

    @Delete
    suspend fun deleteUser(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun deleteAllUsers()
}
```

## マイグレーションルール

- バージョンアップ時は必ず Migration オブジェクトを実装
- `fallbackToDestructiveMigration()` は開発中のみ（本番禁止）
- マイグレーションは `MigrationTestHelper` でテスト必須

## Database 定義

```kotlin
@Database(
    entities = [UserEntity::class],
    version = 2,
    exportSchema = true  // schema/フォルダにバージョン履歴を保存
)
@TypeConverters(DateConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```
