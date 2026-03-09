import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { RegisterScreen } from '../../screens/auth/RegisterScreen';
import { VerifyOtpScreen } from '../../screens/auth/VerifyOtpScreen';
import { ForgotPasswordScreen } from '../../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../../screens/auth/ResetPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOtp: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

