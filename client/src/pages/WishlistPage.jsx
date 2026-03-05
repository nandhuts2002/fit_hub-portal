import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Trash2, Star, Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SessionManager from '../utils/sessionManager';
import api from '../utils/api';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load wishlist (prefer server if logged in)
    const loadWishlist = async () => {
      const user = SessionManager.getCurrentUser();

      // Helper: try new key, then old spaced key as migration fallback
      const readStorage = (email) => {
        const attempts = email
          ? [
            `fithub-wishlist:${email}`,          // new (correct)
            `fithub - wishlist:${email} `,         // old (had spaces bug)
          ]
          : ['fithub-wishlist'];
        for (const k of attempts) {
          const val = localStorage.getItem(k);
          if (val) return JSON.parse(val);
        }
        return null;
      };

      try {
        if (user?.token && user?.email) {
          const { data } = await api.get(`/shop/api/wishlist/${encodeURIComponent(user.email)}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const items = data?.wishlist?.items || [];
          const normalized = items.map((it) => ({
            id: it.product_id,
            name: it.product?.name,
            price: it.product?.price,
            image: it.product?.image,
            brand: it.product?.brand,
            in_stock: true
          }));
          setWishlist(normalized);
          localStorage.setItem(`fithub-wishlist:${user.email}`, JSON.stringify(normalized));
        } else {
          const saved = readStorage(user?.email);
          if (saved) setWishlist(saved);
        }
      } catch (e) {
        // Server failed (e.g. 422 JWT error) — fall back to localStorage
        const saved = readStorage(user?.email);
        if (saved) setWishlist(saved);
        if (!(e?.response?.status === 422 || e?.response?.status === 401)) {
          console.error('Error loading wishlist:', e);
        }
      }
    };
    loadWishlist();


    // Load cart from localStorage
    const user = SessionManager.getCurrentUser();
    const cartKey = user?.email ? `fithub-cart:${user.email}` : 'fithub-cart';
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) setCart(JSON.parse(savedCart));

    setLoading(false);
  }, []);

  const removeFromWishlist = async (productId) => {
    const prev = wishlist;
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem('fithub-wishlist', JSON.stringify(updatedWishlist));

    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token || !currentUser?.email) return;
      // Don't encode the email here, let the browser handle it automatically
      await api.post(
        `/shop/api/wishlist/${currentUser.email}/toggle`,
        { product_id: productId },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
    } catch (e) {
      // revert on failure
      setWishlist(prev);
      localStorage.setItem('fithub-wishlist', JSON.stringify(prev));
      console.error('Error removing from wishlist:', e);
    }
  };

  const addToCart = (product) => {
    const cartItem = {
      ...product,
      quantity: 1,
      cartId: Date.now()
    };

    const existingItem = cart.find(item =>
      item.id === product.id &&
      JSON.stringify(item.variant) === JSON.stringify(product.variant)
    );

    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.cartId === existingItem.cartId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
      {
        const current = SessionManager.getCurrentUser();
        const key = current?.email ? `fithub-cart:${current.email}` : 'fithub-cart';
        localStorage.setItem(key, JSON.stringify(updatedCart));
      }
    } else {
      const updatedCart = [...cart, cartItem];
      setCart(updatedCart);
      {
        const current = SessionManager.getCurrentUser();
        const key = current?.email ? `fithub-cart:${current.email}` : 'fithub-cart';
        localStorage.setItem(key, JSON.stringify(updatedCart));
      }
    }
  };

  const moveAllToCart = () => {
    const newCartItems = wishlist.map(product => ({
      ...product,
      quantity: 1,
      cartId: Date.now() + Math.random()
    }));

    const updatedCart = [...cart, ...newCartItems];
    setCart(updatedCart);
    {
      const current = SessionManager.getCurrentUser();
      const cartKey = current?.email ? `fithub-cart:${current.email}` : 'fithub-cart';
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    }

    // Clear wishlist
    setWishlist([]);
    {
      const current = SessionManager.getCurrentUser();
      if (current?.email) localStorage.removeItem(`fithub-wishlist:${current.email}`);
      else localStorage.removeItem('fithub-wishlist');
    }

    alert('All items moved to cart!');
  };

  const clearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      setWishlist([]);
      localStorage.removeItem('fithub-wishlist');
    }
  };

  const getTotalValue = () => {
    return wishlist.reduce((total, item) => total + item.price, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600 mt-1">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>

            {wishlist.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearWishlist}
                  className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={moveAllToCart}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Move All to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-8">
                Start adding items you love to your wishlist and they'll appear here.
              </p>
              <button
                onClick={() => navigate('/shop')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
              >
                Start Shopping
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Wishlist Summary</h3>
                  <p className="text-gray-600">
                    Total value: <span className="font-bold text-purple-600">₹{getTotalValue().toLocaleString()}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Items saved</p>
                  <p className="text-2xl font-bold text-purple-600">{wishlist.length}</p>
                </div>
              </div>
            </motion.div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative">
                    {product.images?.[0] || product.image ? (
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                      style={{ display: product.images?.[0] || product.image ? 'none' : 'flex' }}
                    >
                      <div className="text-center text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No Image</p>
                      </div>
                    </div>

                    {/* Wishlist Button */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="p-3 rounded-full bg-red-500 text-white shadow-xl transition-all duration-200 hover:scale-110 hover:bg-red-600"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    {/* Discount Badge */}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/shop?product=${product.id}`)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-200 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.in_stock}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;