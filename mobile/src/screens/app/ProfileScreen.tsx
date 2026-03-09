import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { useAuth } from '../../auth/AuthProvider';
import { API_BASE_URL } from '../../config';

export function ProfileScreen() {
  const { state, signOut } = useAuth();

  if (state.status !== 'authed') return null;

  const initials = (state.user.firstName?.[0] || state.user.name?.[0] || 'U').toUpperCase();

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.h1}>
          Profile
        </Text>

        <Card style={styles.card}>
          <Card.Content style={{ gap: 10 }}>
            <View style={styles.row}>
              <Avatar.Text size={54} label={initials} />
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={{ fontWeight: '900' }}>
                  {state.user.name}
                </Text>
                <Text style={styles.muted}>{state.user.email}</Text>
                <Text style={styles.muted}>Role: {String(state.user.role)}</Text>
              </View>
            </View>

            <Divider />

            <Text style={styles.muted}>API: {API_BASE_URL}</Text>
            <Text style={styles.muted}>User ID: {state.user.id}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => signOut()}>
              Log out
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
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  muted: { color: 'rgba(245,247,255,0.72)' },
});

