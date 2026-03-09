import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { useShop } from '../../shop/ShopProvider';
import { formatINR, resolveApiUrl } from '../../shop/shopUtils';
import { useAuth } from '../../auth/AuthProvider';
import { http, getApiErrorMessage } from '../../api/http';

export function CartScreen({ navigation }: any) {
  const { state } = useAuth();
  const { cart, updateQty, removeFromCart, clearCart } = useShop();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + (it.productSnapshot?.price || 0) * it.quantity, 0);
  }, [cart]);

  const placeOrder = async () => {
    setError(null);
    if (state.status !== 'authed') {
      setError('Please log in to place an order.');
      return;
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      // Minimal address (backend accepts missing fields but UI should collect later)
      const orderData = {
        items: cart.map((it) => ({ product_id: it.productId, quantity: it.quantity, variant: it.variant || {} })),
        shipping_address: {
          name: state.user.name,
          email: state.user.email,
          phone: state.user.phone || '',
          address: '',
          city: '',
          state: '',
          pincode: '',
        },
        payment_method: { type: 'cod', status: 'cod_pending' },
        coupon_code: '',
      };
      const res = await http.post('/shop/api/orders', orderData);
      if (!res.data?.success) throw new Error(res.data?.error || 'Order failed');
      clearCart();
      navigation.navigate('Orders');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ fontWeight: '900' }}>
          Cart
        </Text>
        <IconButton icon="delete" onPress={() => clearCart()} disabled={cart.length === 0} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {!!error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        {cart.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={{ fontWeight: '800' }}>Your cart is empty.</Text>
              <Text style={styles.muted}>Add some products from the Shop tab.</Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            {cart.map((it) => {
              const img =
                resolveApiUrl(it.productSnapshot?.images?.[0]) || 'https://via.placeholder.com/200x200.png?text=FitHub';
              return (
                <Card key={it.productId} style={styles.card}>
                  <Card.Content style={{ gap: 10 }}>
                    <View style={styles.row}>
                      <Image source={{ uri: img }} style={styles.thumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '900' }} numberOfLines={2}>
                          {it.productSnapshot?.name || it.productId}
                        </Text>
                        <Text style={styles.muted}>{formatINR(it.productSnapshot?.price || 0)}</Text>
                      </View>
                      <IconButton icon="close" onPress={() => removeFromCart(it.productId)} />
                    </View>

                    <View style={styles.qtyRow}>
                      <Button mode="outlined" onPress={() => updateQty(it.productId, it.quantity - 1)}>
                        -
                      </Button>
                      <TextInput
                        mode="outlined"
                        value={String(it.quantity)}
                        onChangeText={(t) => updateQty(it.productId, Math.max(1, Number(t.replace(/\D/g, '') || 1)))}
                        style={{ flex: 1, maxWidth: 110 }}
                        keyboardType="numeric"
                      />
                      <Button mode="outlined" onPress={() => updateQty(it.productId, it.quantity + 1)}>
                        +
                      </Button>
                      <View style={{ flex: 1 }} />
                      <Text style={{ fontWeight: '900' }}>
                        {formatINR((it.productSnapshot?.price || 0) * it.quantity)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}

            <Card style={styles.card}>
              <Card.Content style={{ gap: 8 }}>
                <View style={styles.summaryRow}>
                  <Text style={styles.muted}>Subtotal</Text>
                  <Text style={{ fontWeight: '900' }}>{formatINR(subtotal)}</Text>
                </View>
                <Text style={styles.muted}>Checkout is set to COD for now (Razorpay can be added next).</Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={placeOrder} loading={submitting} disabled={submitting}>
                  Place order
                </Button>
              </Card.Actions>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  card: {
    backgroundColor: 'rgba(17,28,47,0.70)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
  },
  muted: { color: 'rgba(245,247,255,0.70)' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorCard: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderColor: 'rgba(255,77,77,0.25)',
    borderWidth: 1,
    borderRadius: 18,
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
});

