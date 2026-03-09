import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShopHomeScreen } from '../../screens/shop/ShopHomeScreen';
import { ProductDetailsScreen } from '../../screens/shop/ProductDetailsScreen';
import { CartScreen } from '../../screens/shop/CartScreen';
import { WishlistScreen } from '../../screens/shop/WishlistScreen';
import { OrdersScreen } from '../../screens/shop/OrdersScreen';

export type ShopStackParamList = {
  ShopHome: undefined;
  Product: { productId: string };
  Cart: undefined;
  Wishlist: undefined;
  Orders: undefined;
};

const Stack = createNativeStackNavigator<ShopStackParamList>();

export function ShopStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ShopHome" component={ShopHomeScreen} />
      <Stack.Screen name="Product" component={ProductDetailsScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  );
}

