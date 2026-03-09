import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionsHomeScreen } from '../../screens/sessions/SessionsHomeScreen';
import { LiveSessionsScreen } from '../../screens/sessions/LiveSessionsScreen';
import { ProgressScreen } from '../../screens/sessions/ProgressScreen';
import { PostureSelectionScreen } from '../../screens/app/PostureSelectionScreen';
import { PostureCorrectionScreen } from '../../screens/app/PostureCorrectionScreen';
import { ServicesScreen } from '../../screens/app/ServicesScreen';
import { ExerciseExplorerScreen } from '../../screens/app/ExerciseExplorerScreen';
import { YogaExplorerScreen } from '../../screens/app/YogaExplorerScreen';
import { BMICalculatorScreen } from '../../screens/app/BMICalculatorScreen';
import { CalorieDetectorScreen } from '../../screens/app/CalorieDetectorScreen';

export type SessionsStackParamList = {
  Services: undefined;
  LiveSessions: undefined;
  Progress: undefined;
  PostureSelection: undefined;
  PostureCorrection: { type: string; name: string; mode: 'exercise' | 'yoga' };
  ExerciseExplorer: undefined;
  YogaExplorer: undefined;
  BMICalculator: undefined;
  CalorieDetector: undefined;
};

const Stack = createNativeStackNavigator<SessionsStackParamList>();

export function SessionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="LiveSessions" component={LiveSessionsScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="PostureSelection" component={PostureSelectionScreen} />
      <Stack.Screen name="PostureCorrection" component={PostureCorrectionScreen} />
      <Stack.Screen name="ExerciseExplorer" component={ExerciseExplorerScreen} />
      <Stack.Screen name="YogaExplorer" component={YogaExplorerScreen} />
      <Stack.Screen name="BMICalculator" component={BMICalculatorScreen} />
      <Stack.Screen name="CalorieDetector" component={CalorieDetectorScreen} />
    </Stack.Navigator>
  );
}

