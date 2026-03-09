import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { useAuth } from '../../auth/AuthProvider';
import { http, getApiErrorMessage } from '../../api/http';
import type { WishlistItem } from '../../shop/types';
import { resolveApiUrl } from '../../shop/shopUtils';

export function WishlistScreen({ navigation }: any) {
  const { state } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    if (state.status !== 'authed') {
      setItems([]);
      return;
    }
    const res = await http.get(`/shop/api/wishlist/${encodeURIComponent(state.user.email)}`);
    const raw = res.data?.wishlist?.items || [];
    const normalized: WishlistItem[] = raw.map((it: any) => ({
      id: it.product_id,
      name: it.product?.name,
      price: it.product?.price,
      image: it.product?.image,
      brand: it.product?.brand,
    }));
    setItems(normalized);
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

  const toggle = async (productId: string) => {
    if (state.status !== 'authed') return;
    // optimistic
    setItems((prev) => prev.filter((x) => x.id !== productId));
    try {
      await http.post(`/shop/api/wishlist/${encodeURIComponent(state.user.email)}/toggle`, { product_id: productId });
    } catch (e) {
      setError(getApiErrorMessage(e));
      await load();
    }
  };

  return (
    <GradientBackground>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ fontWeight: '900' }}>
          Wishlist
        </Text>
        <View style={{ width: 40 }} />
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
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingVertical: 10, gap: 12, paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={() => load().catch(() => {})}
          renderItem={({ item }) => {
            const img = resolveApiUrl(item.image) || 'https://via.placeholder.com/200x200.png?text=FitHub';
            return (
              <Card style={styles.card}>
                <Card.Content style={styles.row}>
                  <Image source={{ uri: img }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900' }} numberOfLines={2}>
                      {item.name || 'Product'}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      {item.brand || ''}
                    </Text>
                  </View>
                  <IconButton icon="trash-can-outline" onPress={() => toggle(item.id)} />
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => navigation.navigate('Product', { productId: item.id })}>View</Button>
                </Card.Actions>
              </Card>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={{ fontWeight: '800' }}>No wishlist items.</Text>
                  <Text style={styles.muted}>Tap the heart on a product to save it.</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
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

