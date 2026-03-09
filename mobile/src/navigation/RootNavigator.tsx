import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { AuthStack } from './stacks/AuthStack';
import { AppTabs } from './tabs/AppTabs';
import { colors } from '../theme';

export function RootNavigator() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg0 }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.status === 'authed') {
    return <AppTabs />;
  }

  return <AuthStack />;
}

