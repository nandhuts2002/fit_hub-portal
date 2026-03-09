import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { CartItem, ShopProduct } from './types';

type ShopContextValue = {
  cart: CartItem[];
  cartCount: number;
  addToCart: (product: ShopProduct, opts?: { quantity?: number; variant?: Record<string, any> | null }) => void;
  updateQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  hydrate: () => Promise<void>;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function cartKey(email: string | null | undefined) {
  const base = email ? `fithub_cart_v1_${email.toLowerCase()}` : 'fithub_cart_v1_guest';
  // SecureStore keys must only contain alphanumeric, '.', '-', and '_'
  return base.replace(/[^a-z0-9._-]/gi, '_');
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const email = state.status === 'authed' ? state.user.email : null;

  const [cart, setCart] = useState<CartItem[]>([]);

  const hydrate = async () => {
    try {
      const raw = await SecureStore.getItemAsync(cartKey(email));
      if (!raw) {
        setCart([]);
        return;
      }
      const parsed = JSON.parse(raw) as CartItem[];
      setCart(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    void SecureStore.setItemAsync(cartKey(email), JSON.stringify(cart));
  }, [cart, email]);

  const addToCart: ShopContextValue['addToCart'] = (product, opts) => {
    const qty = Math.max(1, opts?.quantity ?? 1);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) => (i.productId === product._id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [
        ...prev,
        {
          productId: product._id,
          quantity: qty,
          variant: opts?.variant ?? null,
          productSnapshot: {
            _id: product._id,
            name: product.name,
            price: product.price,
            brand: product.brand,
            images: product.images,
          },
        },
      ];
    });
  };

  const updateQty: ShopContextValue['updateQty'] = (productId, quantity) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  };

  const removeFromCart: ShopContextValue['removeFromCart'] = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, it) => sum + (it.quantity || 0), 0);

  const value = useMemo<ShopContextValue>(
    () => ({ cart, cartCount, addToCart, updateQty, removeFromCart, clearCart, hydrate }),
    [cart, cartCount]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}

