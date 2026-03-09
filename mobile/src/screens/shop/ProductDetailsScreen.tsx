import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientBackground } from '../../components/GradientBackground';
import type { ShopStackParamList } from '../../navigation/stacks/ShopStack';
import { http, getApiErrorMessage } from '../../api/http';
import type { ShopProduct } from '../../shop/types';
import { resolveApiUrl, formatINR } from '../../shop/shopUtils';
import { useShop } from '../../shop/ShopProvider';
import { useAuth } from '../../auth/AuthProvider';

type Props = NativeStackScreenProps<ShopStackParamList, 'Product'>;

export function ProductDetailsScreen({ route, navigation }: Props) {
  const { state } = useAuth();
  const { addToCart } = useShop();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ShopProduct | null>(null);

  const productId = route.params.productId;

  const load = useCallback(async () => {
    setError(null);
    const res = await http.get(`/shop/api/products/${productId}`);
    if (!res.data?.success) throw new Error(res.data?.error || 'Failed to load product');
    setProduct(res.data.product as ShopProduct);
  }, [productId]);

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

  const mainImg = useMemo(() => resolveApiUrl(product?.images?.[0]) || 'https://via.placeholder.com/600x400.png?text=FitHub', [product]);

  const toggleWishlist = async () => {
    if (state.status !== 'authed' || !product) return;
    try {
      await http.post(`/shop/api/wishlist/${encodeURIComponent(state.user.email)}/toggle`, { product_id: product._id });
    } catch {
      // non-blocking
    }
  };

  return (
    <GradientBackground>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton icon="heart" onPress={toggleWishlist} />
          <IconButton icon="cart" onPress={() => navigation.navigate('Cart')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {!!error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button onPress={() => load().catch(() => {})}>Retry</Button>
            </Card.Content>
          </Card>
        )}

        {loading || !product ? null : (
          <>
            <Card style={styles.card}>
              <Image source={{ uri: mainImg }} style={styles.heroImg} />
              <Card.Content style={{ gap: 8 }}>
                <Text variant="headlineSmall" style={styles.title}>
                  {product.name}
                </Text>
                <Text style={styles.muted}>
                  {product.brand || ''} {product.category ? `• ${product.category}` : ''}
                </Text>
                <Text style={styles.price}>{formatINR(product.price)}</Text>
                {!!product.original_price && product.original_price > product.price && (
                  <Text style={styles.strike}>MRP {formatINR(product.original_price)}</Text>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(product.tags || []).slice(0, 4).map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                  {product.in_stock === false && <Chip icon="alert">Out of stock</Chip>}
                </View>

                {!!product.description && <Text style={styles.desc}>{product.description}</Text>}
              </Card.Content>
              <Card.Actions style={{ justifyContent: 'space-between', paddingBottom: 14 }}>
                <Button mode="contained" onPress={() => addToCart(product)} disabled={product.in_stock === false}>
                  Add to cart
                </Button>
                <Button mode="outlined" onPress={() => navigation.navigate('Orders')}>
                  My orders
                </Button>
              </Card.Actions>
            </Card>

            <Card style={styles.card}>
              <Card.Content style={{ gap: 8 }}>
                <Text variant="titleMedium" style={{ fontWeight: '800' }}>
                  Quick actions
                </Text>
                <Button
                  icon="open-in-new"
                  mode="outlined"
                  onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(product.name)}`)}
                >
                  Search on web
                </Button>
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
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
  container: { padding: 18, paddingTop: 8, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  heroImg: { width: '100%', height: 240, backgroundColor: 'rgba(255,255,255,0.04)' },
  title: { fontWeight: '900' },
  muted: { color: 'rgba(245,247,255,0.70)' },
  price: { fontWeight: '900', fontSize: 20 },
  strike: { color: 'rgba(245,247,255,0.55)', textDecorationLine: 'line-through' },
  desc: { color: 'rgba(245,247,255,0.78)', marginTop: 4, lineHeight: 20 },
  errorCard: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderColor: 'rgba(255,77,77,0.25)',
    borderWidth: 1,
    borderRadius: 18,
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
});

