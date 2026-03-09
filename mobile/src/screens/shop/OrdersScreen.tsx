import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { useAuth } from '../../auth/AuthProvider';
import { http, getApiErrorMessage } from '../../api/http';
import type { Order } from '../../shop/types';
import { formatINR } from '../../shop/shopUtils';

export function OrdersScreen({ navigation }: any) {
  const { state } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    if (state.status !== 'authed') {
      setOrders([]);
      return;
    }
    const res = await http.get(`/shop/api/orders/${encodeURIComponent(state.user.email)}`);
    if (!res.data?.success) throw new Error(res.data?.error || 'Failed to load orders');
    setOrders(res.data.orders || []);
  }, [state]);

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

  return (
    <GradientBackground>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ fontWeight: '900' }}>
          Orders
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
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ paddingVertical: 10, gap: 12, paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={() => load().catch(() => {})}
          renderItem={({ item }) => {
            const status = item.orderStatus || item.status || 'Pending';
            const pay = item.paymentStatus || 'Pending';
            const number = item.order_id || item._id.slice(-8);
            return (
              <Card style={styles.card}>
                <Card.Content style={{ gap: 6 }}>
                  <View style={styles.row}>
                    <Text style={{ fontWeight: '900' }}>Order #{number}</Text>
                    <Text style={{ fontWeight: '900' }}>{formatINR(item.total || 0)}</Text>
                  </View>
                  <Text style={styles.muted}>Status: {status}</Text>
                  <Text style={styles.muted}>Payment: {pay}</Text>
                  <Text style={styles.muted}>Items: {item.items?.length || 0}</Text>
                </Card.Content>
              </Card>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={{ fontWeight: '800' }}>No orders yet.</Text>
                  <Text style={styles.muted}>Place an order from your cart.</Text>
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
  container: { flex: 1, padding: 18, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
  muted: { color: 'rgba(245,247,255,0.70)' },
  errorCard: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderColor: 'rgba(255,77,77,0.25)',
    borderWidth: 1,
    borderRadius: 18,
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
});

