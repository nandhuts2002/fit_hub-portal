export type ShopProduct = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number | null;
  category?: string;
  brand?: string;
  rating?: number;
  reviews?: number;
  images?: string[];
  in_stock?: boolean;
  stock_quantity?: number;
  featured?: boolean;
  variants?: Array<Record<string, any>>;
  features?: string[];
  tags?: string[];
};

export type CartItem = {
  productId: string;
  quantity: number;
  variant?: Record<string, any> | null;
  productSnapshot?: Pick<ShopProduct, '_id' | 'name' | 'price' | 'brand' | 'images'>;
};

export type WishlistItem = {
  id: string; // product_id
  name?: string;
  price?: number;
  image?: string;
  brand?: string;
};

export type Order = {
  _id: string;
  order_id?: string;
  orderStatus?: string;
  paymentStatus?: string;
  status?: string;
  total?: number;
  created_at?: string;
  updated_at?: string;
  items?: any[];
  shipping_address?: any;
  shipping?: any;
  timestamps?: any;
};

