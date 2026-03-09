import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { useAuth } from '../../auth/AuthProvider';
import { http, getApiErrorMessage } from '../../api/http';

type ProgressKind = 'exercise' | 'yoga';

type SessionItem = {
  _id: string;
  exerciseName?: string;
  poseName?: string;
  caloriesBurned?: number;
  totalTime?: number;
  totalReps?: number;
  sets?: number;
  date?: string;
  timestamp?: string;
};

export function ProgressScreen({ navigation }: any) {
  const { state } = useAuth();
  const [kind, setKind] = useState<ProgressKind>('exercise');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [stats, setStats] = useState<any>(null);

  const endpoint = useMemo(() => (kind === 'exercise' ? '/exercise-progress' : '/yoga-progress'), [kind]);

  const load = useCallback(async () => {
    setError(null);
    if (state.status !== 'authed') {
      setItems([]);
      setStats(null);
      return;
    }
    const res = await http.get(endpoint, { params: { limit: 50 } });
    if (!res.data?.ok) throw new Error(res.data?.error || 'Failed to load progress');
    setItems(res.data.data || []);
    setStats(res.data.stats || null);
  }, [endpoint, state]);

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

  const remove = async (id: string) => {
    try {
      await http.delete(`${endpoint}/${id}`);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <GradientBackground>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ fontWeight: '900' }}>
          Progress
        </Text>
        <IconButton icon="refresh" onPress={() => load().catch(() => {})} />
      </View>

      <View style={styles.container}>
        <SegmentedButtons
          value={kind}
          onValueChange={(v) => setKind(v as ProgressKind)}
          buttons={[
            { value: 'exercise', label: 'Exercise' },
            { value: 'yoga', label: 'Yoga' },
          ]}
        />

        {!!error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button onPress={() => load().catch(() => {})}>Retry</Button>
            </Card.Content>
          </Card>
        )}

        {!!stats && (
          <Card style={styles.card}>
            <Card.Content style={{ gap: 6 }}>
              <Text style={{ fontWeight: '900' }}>Stats</Text>
              <Text style={styles.muted}>Sessions: {stats.totalSessions}</Text>
              <Text style={styles.muted}>Calories: {stats.totalCaloriesBurned}</Text>
              <Text style={styles.muted}>Time: {stats.totalTimeMinutes} min</Text>
            </Card.Content>
          </Card>
        )}

        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          contentContainerStyle={{ paddingVertical: 10, gap: 12, paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={() => load().catch(() => {})}
          renderItem={({ item }) => {
            const title = kind === 'exercise' ? item.exerciseName || 'Exercise' : item.poseName || 'Yoga';
            const timeMin = Math.round((item.totalTime || 0) / 60);
            return (
              <Card style={styles.card}>
                <Card.Content style={{ gap: 6 }}>
                  <Text style={{ fontWeight: '900' }}>{title}</Text>
                  <Text style={styles.muted}>Date: {item.date || item.timestamp || '—'}</Text>
                  <Text style={styles.muted}>
                    Sets: {item.sets || 0} • Reps: {item.totalReps || 0} • Time: {timeMin} min • Calories:{' '}
                    {item.caloriesBurned || 0}
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => remove(item._id)} textColor="rgba(255,200,200,0.95)">
                    Delete
                  </Button>
                </Card.Actions>
              </Card>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={{ fontWeight: '800' }}>No sessions yet.</Text>
                  <Text style={styles.muted}>Complete workouts in the web app or add logging next.</Text>
                </Card.Content>
              </Card>
            )
          }
        />
      </View>
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
  container: { flex: 1, padding: 18, paddingTop: 8, gap: 10 },
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
  muted: { color: 'rgba(245,247,255,0.72)' },
  errorCard: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderColor: 'rgba(255,77,77,0.25)',
    borderWidth: 1,
    borderRadius: 18,
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
});

