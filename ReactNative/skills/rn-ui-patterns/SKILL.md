---
name: rn-ui-patterns
description: "React Native UIコンポーネント・StyleSheet・FlatList最適化・アクセシビリティ・プラットフォーム対応の実装ガイド"
---

# RN UI Patterns

## コンポーネント最適化の基本

### React.memo の使用

```typescript
// 純粋コンポーネントは React.memo でラップ
const UserCard = React.memo(({ user, onPress }: UserCardProps): React.JSX.Element => {
  return (
    <TouchableOpacity onPress={() => onPress(user.id)}>
      <Text>{user.name}</Text>
    </TouchableOpacity>
  );
});

// NG: インライン関数を子コンポーネントに渡す
<UserCard onPress={(id) => handlePress(id)} />

// OK: useCallback で安定した参照を作る
const handlePress = useCallback((id: string) => {
  navigation.navigate('UserDetail', { userId: id });
}, [navigation]);
<UserCard onPress={handlePress} />
```

## FlatList の最適化

```typescript
const UserList = ({ users }: { users: User[] }): React.JSX.Element => {
  const renderItem = useCallback(
    ({ item }: { item: User }) => <UserCard user={item} onPress={handlePress} />,
    [handlePress]
  );

  const keyExtractor = useCallback((item: User) => item.id, []);

  const getItemLayout = useCallback(
    (_data: User[] | null | undefined, index: number) => ({
      length: USER_CARD_HEIGHT,
      offset: USER_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={users}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews
    />
  );
};
```

## StyleSheet の規約

```typescript
// StyleSheet.create でスタイルを定義（パフォーマンス最適化）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // マジックナンバー禁止
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

// プラットフォーム固有スタイル
const shadowStyle = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

## アクセシビリティの必須実装

```typescript
// タッチ可能要素の必須属性
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="プロフィールを編集"
  accessibilityHint="タップするとプロフィール編集画面を開きます"
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  disabled={isLoading}
  accessibilityState={{ disabled: isLoading }}
>

// 画像のアクセシビリティ
<Image
  source={avatarSource}
  accessibilityLabel={`${user.name}のプロフィール画像`}
  style={styles.avatar}
/>
```

## UI パターンチェックリスト

実装前に確認:
- [ ] `FlatList` の `keyExtractor` でアイテムの一意IDを使用しているか
- [ ] `renderItem` を `useCallback` でラップしているか
- [ ] インラインスタイルを `StyleSheet.create` に移行しているか
- [ ] タッチ可能要素に `accessibilityLabel` / `accessibilityRole` を設定しているか
- [ ] マジックナンバーをデザイントークン（定数）に置き換えているか
- [ ] タッチターゲットが 44x44 pt 以上か
