import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../screens/app/HomeScreen';
import { ProfileScreen } from '../../screens/app/ProfileScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { ShopStack } from '../stacks/ShopStack';
import { SessionsStack } from '../stacks/SessionsStack';
import { useShop } from '../../shop/ShopProvider';

export type AppTabsParamList = {
  Home: undefined;
  Sessions: undefined;
  Shop: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { cartCount } = useShop();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg1,
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor: colors.primary2,
        tabBarInactiveTintColor: 'rgba(245,247,255,0.55)',
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Home'
              ? 'home-variant'
              : route.name === 'Sessions'
                ? 'calendar-clock'
                : route.name === 'Shop'
                  ? 'shopping'
                  : 'account-circle';
          return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sessions" component={SessionsStack} />
      <Tab.Screen
        name="Shop"
        component={ShopStack}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#101010' },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

