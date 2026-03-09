import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { http, getApiErrorMessage } from '../../api/http';
import { useAuth } from '../../auth/AuthProvider';

type LiveSession = {
  id: string;
  title: string;
  description?: string;
  trainerName?: string;
  startTime?: string;
  duration?: number;
  capacity?: number;
  price?: number;
  level?: string;
  style?: string;
  platform?: string;
  meetingUrl?: string;
};

export function LiveSessionsScreen({ navigation }: any) {
  const { state } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const me = useMemo(() => {
    if (state.status !== 'authed') return null;
    return { email: state.user.email, name: state.user.name };
  }, [state]);

  const load = useCallback(async () => {
    setError(null);
    const res = await http.get('/live/sessions');
    if (!res.data?.ok) throw new Error(res.data?.error || 'Failed to load sessions');
    setSessions(res.data.data || []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const requestSeat = async (sid: string) => {
    if (!me) {
      setSnack('Please log in to request a seat.');
      return;
    }
    try {
      const res = await http.post(`/live/sessions/${sid}/request`, { email: me.email, name: me.name });
      if (!res.data?.ok) throw new Error(res.data?.error || 'Request failed');
      setSnack('Seat request submitted. You’ll be emailed after approval.');
    } catch (e) {
      setSnack(getApiErrorMessage(e));
    }
  };

  return (
    <GradientBackground>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ fontWeight: '900' }}>
          Live Sessions
        </Text>
        <IconButton icon="refresh" onPress={() => load().catch(() => {})} />
      </View>

      <View style={styles.container}>
        {!!error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button onPress={() => load().catch(() => {})}>Retry</Button>
            </Card.Content>
          </Card>
        )}

        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingVertical: 10, gap: 12, paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={() => load().catch(() => {})}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={{ gap: 6 }}>
                <Text variant="titleLarge" style={{ fontWeight: '900' }}>
                  {item.title}
                </Text>
                {!!item.trainerName && <Text style={styles.muted}>Trainer: {item.trainerName}</Text>}
                {!!item.startTime && <Text style={styles.muted}>Starts: {item.startTime}</Text>}
                {!!item.duration && <Text style={styles.muted}>Duration: {item.duration} min</Text>}
                {!!item.level && <Text style={styles.muted}>Level: {item.level}</Text>}
                {!!item.style && <Text style={styles.muted}>Style: {item.style}</Text>}
                {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
              </Card.Content>
              <Card.Actions style={{ justifyContent: 'space-between' }}>
                <Button mode="contained" onPress={() => requestSeat(item.id)}>
                  Request seat
                </Button>
                {!!item.meetingUrl && (
                  <Button
                    mode="outlined"
                    onPress={() => Linking.openURL(item.meetingUrl!)}
                    icon={item.platform === 'zoom' ? 'video' : 'google-classroom'}
                  >
                    Open link
                  </Button>
                )}
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={
            loading ? null : (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={{ fontWeight: '800' }}>No upcoming sessions.</Text>
                  <Text style={styles.muted}>Check back later.</Text>
                </Card.Content>
              </Card>
            )
          }
        />
      </View>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={3500}>
        {snack}
      </Snackbar>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 44,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: { flex: 1, padding: 18, paddingTop: 8 },
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
  muted: { color: 'rgba(245,247,255,0.72)' },
  desc: { color: 'rgba(245,247,255,0.80)', marginTop: 4, lineHeight: 20 },
  errorCard: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderColor: 'rgba(255,77,77,0.25)',
    borderWidth: 1,
    borderRadius: 18,
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
});

