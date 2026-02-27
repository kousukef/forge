# React Native Conventions

React Native コンポーネント・スタイリング・プラットフォーム対応の規約。

---

## コンポーネント設計

### 関数コンポーネントの標準形

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';

type UserCardProps = {
  userId: string;
  name: string;
  onPress: (userId: string) => void;
};

const UserCard = ({ userId, name, onPress }: UserCardProps): React.JSX.Element => {
  const handlePress = useCallback(() => {
    onPress(userId);
  }, [onPress, userId]);

  return (
    <View style={styles.container} accessible accessibilityRole="button">
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

export default React.memo(UserCard);
```

### StyleSheet 規約

```typescript
// 定数からカラー・スペーシングを参照
import { colors, spacing, typography } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
});
```

---

## FlatList の使用規約

```typescript
// FlatList の必須設定
<FlatList
  data={items}
  keyExtractor={(item) => item.id}  // 必須: 一意のキー
  renderItem={renderItem}           // useCallback でラップ
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={<EmptyState />}
  ListHeaderComponent={<Header />}
/>
```

---

## アクセシビリティ規約

```typescript
// タッチ可能な要素
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="ユーザープロフィールを開く"
  accessibilityHint="タップするとプロフィール画面に移動します"
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>

// 画像
<Image
  source={avatarSource}
  accessibilityLabel={`${userName}のアバター`}
/>

// 装飾的な画像
<Image
  source={decorativeSource}
  accessible={false}
/>
```

---

## Platform 対応

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  shadow: {
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

---

## テキスト・フォント

```typescript
// NG: ネストした View 内にテキストを直接記述
<View>
  これはエラー
</View>

// OK: Text コンポーネントで包む
<View>
  <Text>これは正しい</Text>
</View>

// テキストの切り捨て
<Text numberOfLines={2} ellipsizeMode="tail">
  長いテキスト...
</Text>
```
