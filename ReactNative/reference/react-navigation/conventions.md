# React Navigation Conventions

React Navigation v6 の型安全な実装規約。

---

## 型定義

```typescript
// navigation/types.ts
export type RootStackParamList = {
  HomeTab: undefined;
  Modal: { message: string };
};

export type HomeTabParamList = {
  Home: undefined;
  UserProfile: { userId: string };
  Settings: undefined;
};

// ルートスタックの型を宣言（型チェックの強化）
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

---

## ナビゲーターの設定

```typescript
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeTab" component={HomeTabNavigator} />
      <Stack.Screen
        name="Modal"
        component={ModalScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
};
```

---

## 型安全なナビゲーション

```typescript
// useNavigation の型指定
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeTab'>;

const UserProfileScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = useCallback(() => {
    navigation.navigate('Modal', { message: '確認しますか？' }); // 型チェック
  }, [navigation]);
};

// useRoute の型指定
import { useRoute, RouteProp } from '@react-navigation/native';

type RoutePropType = RouteProp<RootStackParamList, 'UserProfile'>;

const UserProfileScreen = (): React.JSX.Element => {
  const route = useRoute<RoutePropType>();
  const { userId } = route.params; // 型安全
};
```

---

## Deep Link の設定

```typescript
// navigation/linking.ts
import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://myapp.example.com'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          UserProfile: 'users/:userId',
        },
      },
    },
  },
};

// Deep Link パラメータのバリデーション（必須）
const userIdSchema = z.string().uuid();

const UserProfileScreen = (): React.JSX.Element => {
  const route = useRoute<RoutePropType>();

  // Deep Link から来たパラメータは必ずバリデーション
  const parseResult = userIdSchema.safeParse(route.params.userId);
  if (!parseResult.success) {
    return <ErrorScreen message="無効なユーザーIDです" />;
  }

  const userId = parseResult.data;
};
```

---

## バックスタック管理

```typescript
// 戻るボタンの制御
navigation.goBack();        // 1つ前に戻る
navigation.popToTop();      // スタックのトップに戻る
navigation.replace('Home'); // 現在の画面を置き換え

// 特定画面まで戻る
navigation.navigate('HomeTab', {
  screen: 'Home',
});

// ナビゲーション前の確認
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (event) => {
    if (!hasUnsavedChanges) {
      return; // 変更なし → そのまま戻る
    }
    event.preventDefault(); // デフォルト動作を防ぐ
    Alert.alert('変更が保存されていません', '変更を破棄して戻りますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '破棄', style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
    ]);
  });

  return unsubscribe;
}, [navigation, hasUnsavedChanges]);
```
