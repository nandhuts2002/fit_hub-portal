import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootNavigator } from './src/navigation/RootNavigator';
import { appTheme } from './src/theme';
import { AuthProvider } from './src/auth/AuthProvider';
import { ShopProvider } from './src/shop/ShopProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider
        theme={appTheme}
        settings={{
          icon: (props) => <MaterialCommunityIcons {...props} />,
        }}
      >
        <AuthProvider>
          <ShopProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </ShopProvider>
          <StatusBar style="light" />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
