import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { colors } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SessionsStackParamList } from '../../navigation/stacks/SessionsStack';

type Nav = NativeStackNavigationProp<SessionsStackParamList>;

export function SessionsHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.h1}>
          Sessions
        </Text>
        <Text style={styles.sub}>Live classes and your workout history.</Text>

        <Card style={styles.card}>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleLarge" style={{ fontWeight: '900' }}>
              Live Sessions
            </Text>
            <Text style={styles.muted}>Browse upcoming sessions and request a seat.</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('LiveSessions')}>
              Open
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleLarge" style={{ fontWeight: '900' }}>
              Progress
            </Text>
            <Text style={styles.muted}>Exercise + yoga sessions saved to your account.</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('Progress')}>
              View history
            </Button>
          </Card.Actions>
        </Card>

        <Card style={[styles.card, { borderColor: colors.primary2 }]}>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleLarge" style={{ fontWeight: '900', color: colors.primary2 }}>
              Posture Correction
            </Text>
            <Text style={styles.muted}>Real-time AI feedback for your exercises and yoga.</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" buttonColor={colors.primary2} textColor="#111" onPress={() => navigation.navigate('PostureSelection')}>
              Start Session
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingTop: 54, paddingBottom: 40, gap: 12 },
  h1: { fontWeight: '900' },
  sub: { color: 'rgba(245,247,255,0.75)', marginBottom: 6 },
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
  muted: { color: 'rgba(245,247,255,0.72)' },
});

