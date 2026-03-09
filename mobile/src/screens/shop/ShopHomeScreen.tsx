import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, Searchbar, Text } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { http, getApiErrorMessage } from '../../api/http';
import type { ShopProduct } from '../../shop/types';
import { resolveApiUrl, formatINR } from '../../shop/shopUtils';
import { useShop } from '../../shop/ShopProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/stacks/ShopStack';
import { colors } from '../../theme';

type Nav = NativeStackNavigationProp<ShopStackParamList>;

type ProductsResponse = {
  success: boolean;
  products: ShopProduct[];
};

export function ShopHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { addToCart, cartCount } = useShop();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string }>>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  const load = useCallback(async () => {
    setError(null);
    const params: Record<string, any> = { limit: 30, sort_by: 'featured' };
    if (category && category !== 'All') params.category = category;
    if (search.trim()) params.search = search.trim();
    const [prodRes, catRes] = await Promise.all([
      http.get<ProductsResponse>('/shop/api/products', { params }),
      http.get('/shop/api/categories'),
    ]);
    if (prodRes.data?.success) setProducts(prodRes.data.products || []);
    const catData = catRes.data;
    if (catData?.success) setCategories(catData.categories || []);
  }, [category, search]);

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

  const categoryChips = useMemo(() => {
    const names = ['All', ...categories.map((c) => c.name).filter(Boolean)];
    // Deduplicate while preserving order
    return names.filter((n, idx) => names.indexOf(n) === idx);
  }, [categories]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineMedium" style={styles.h1}>
              Shop
            </Text>
            <Text style={styles.sub}>Fitness gear, yoga, supplements and more.</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton icon="heart" onPress={() => navigation.navigate('Wishlist')} />
            <IconButton
              icon="cart"
              onPress={() => navigation.navigate('Cart')}
              mode={cartCount > 0 ? 'contained' : undefined}
              containerColor={cartCount > 0 ? colors.primary : undefined}
              iconColor={cartCount > 0 ? '#101010' : undefined}
            />
          </View>
        </View>

        <Searchbar
          placeholder="Search products"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load().catch(() => {})}
          style={styles.search}
        />

        <FlatList
          data={categoryChips}
          keyExtractor={(it) => it}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 6, gap: 8 }}
          renderItem={({ item }) => (
            <Chip selected={category === item} onPress={() => setCategory(item)} style={styles.chip}>
              {item}
            </Chip>
          )}
        />

        {!!error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button onPress={() => load().catch(() => {})}>Retry</Button>
            </Card.Content>
          </Card>
        )}

        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingVertical: 12, gap: 12, paddingBottom: 30 }}
          refreshing={loading}
          onRefresh={() => load().catch(() => {})}
          renderItem={({ item }) => {
            const img = resolveApiUrl(item.images?.[0]) || 'https://via.placeholder.com/300x300.png?text=FitHub';
            return (
              <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Product', { productId: item._id })}>
                <Card style={styles.productCard}>
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: img }} style={styles.image} />
                  </View>
                  <Card.Content style={{ gap: 4 }}>
                    <Text numberOfLines={2} style={styles.productName}>
                      {item.name}
                    </Text>
                    <Text style={styles.brand} numberOfLines={1}>
                      {item.brand || item.category || 'FitHub'}
                    </Text>
                    <Text style={styles.price}>{formatINR(item.price)}</Text>
                  </Card.Content>
                  <Card.Actions style={{ justifyContent: 'space-between' }}>
                    <Button compact onPress={() => navigation.navigate('Product', { productId: item._id })}>
                      View
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => addToCart(item)}
                      disabled={item.in_stock === false}
                    >
                      Add
                    </Button>
                  </Card.Actions>
                </Card>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.sub}>No products found.</Text>
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
  container: { flex: 1, padding: 18, paddingTop: 54 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontWeight: '900' },
  sub: { color: 'rgba(245,247,255,0.75)' },
  search: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  chip: { backgroundColor: 'rgba(255,255,255,0.06)' },
  productCard: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  imageWrap: { height: 130, backgroundColor: 'rgba(255,255,255,0.04)' },
  image: { width: '100%', height: '100%' },
  productName: { fontWeight: '800' },
  brand: { color: 'rgba(245,247,255,0.65)', fontSize: 12 },
  price: { fontWeight: '900', marginTop: 2 },
  errorCard: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderColor: 'rgba(255,77,77,0.25)',
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 10,
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
  emptyCard: {
    backgroundColor: 'rgba(17,28,47,0.55)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
});

