import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  ShoppingBag,
  Truck,
  Grid3X3,
  List,
  SlidersHorizontal,
  Package
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import ProductModal from "../components/ProductModal";
import CartSidebar from "../components/CartSidebar";
import CheckoutModal from "../components/CheckoutModal";
import OrderSuccessModal from "../components/OrderSuccessModal";

// Enhanced sample products with more details
const products = [
  {
    id: 1,
    name: "Premium Adjustable Dumbbells Set",
    price: 12999,
    originalPrice: 15999,
    image: "https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg",
    category: "Weights",
    brand: "FitPro",
    rating: 4.8,
    reviews: 1247,
    inStock: true,
    variants: [
      { size: "5-25kg", price: 12999 },
      { size: "10-50kg", price: 18999 }
    ],
    description: "Professional adjustable dumbbells with quick-change weight system",
    features: ["Quick-change system", "Non-slip grip", "Compact storage", "2-year warranty"],
    tags: ["Best Seller", "Premium"]
  },
  {
    id: 2,
    name: "Yoga Mat Pro - Extra Thick",
    price: 1299,
    originalPrice: 1799,
    image: "https://m.media-amazon.com/images/I/71bYv8XlR4L._SX522_.jpg",
    category: "Yoga",
    brand: "ZenFit",
    rating: 4.6,
    reviews: 892,
    inStock: true,
    variants: [
      { color: "Purple", price: 1299 },
      { color: "Blue", price: 1299 },
      { color: "Pink", price: 1299 }
    ],
    description: "6mm thick premium yoga mat with superior grip and cushioning",
    features: ["6mm thickness", "Non-slip surface", "Eco-friendly", "Easy to clean"],
    tags: ["Eco-Friendly"]
  },
  {
    id: 3,
    name: "Whey Protein Isolate - Vanilla",
    price: 2499,
    originalPrice: 2999,
    image: "https://m.media-amazon.com/images/I/71iO2R+cwUL._SX679_.jpg",
    category: "Supplements",
    brand: "MuscleMax",
    rating: 4.7,
    reviews: 2156,
    inStock: true,
    variants: [
      { flavor: "Vanilla", price: 2499 },
      { flavor: "Chocolate", price: 2499 },
      { flavor: "Strawberry", price: 2499 }
    ],
    description: "100% whey protein isolate with 25g protein per serving",
    features: ["25g protein", "Low carb", "No artificial flavors", "Lab tested"],
    tags: ["High Protein", "Lab Tested"]
  },
  {
    id: 4,
    name: "Resistance Bands Set",
    price: 899,
    originalPrice: 1199,
    image: "https://m.media-amazon.com/images/I/71Q8g8XJwJL._SX522_.jpg",
    category: "Accessories",
    brand: "FlexBand",
    rating: 4.5,
    reviews: 634,
    inStock: true,
    variants: [
      { resistance: "Light (5-15kg)", price: 899 },
      { resistance: "Medium (10-25kg)", price: 899 },
      { resistance: "Heavy (15-35kg)", price: 899 }
    ],
    description: "Complete resistance band set for full-body workouts",
    features: ["5 resistance levels", "Door anchor", "Ankle straps", "Exercise guide"],
    tags: ["Complete Set"]
  },
  {
    id: 5,
    name: "Smart Fitness Tracker",
    price: 3999,
    originalPrice: 4999,
    image: "https://m.media-amazon.com/images/I/71Q8g8XJwJL._SX522_.jpg",
    category: "Electronics",
    brand: "FitTech",
    rating: 4.4,
    reviews: 1876,
    inStock: false,
    variants: [
      { color: "Black", price: 3999 },
      { color: "Rose Gold", price: 3999 }
    ],
    description: "Advanced fitness tracker with heart rate monitoring and GPS",
    features: ["Heart rate monitor", "GPS tracking", "7-day battery", "Waterproof"],
    tags: ["Smart", "Waterproof"]
  },
  {
    id: 6,
    name: "Foam Roller Set",
    price: 1599,
    originalPrice: 1999,
    image: "https://m.media-amazon.com/images/I/71Q8g8XJwJL._SX522_.jpg",
    category: "Recovery",
    brand: "RecoveryPro",
    rating: 4.6,
    reviews: 423,
    inStock: true,
    variants: [
      { density: "Soft", price: 1599 },
      { density: "Medium", price: 1599 },
      { density: "Firm", price: 1599 }
    ],
    description: "Professional foam roller set for muscle recovery and massage",
    features: ["3 density levels", "Textured surface", "Durable construction", "Exercise guide"],
    tags: ["Recovery", "Professional"]
  }
];

const categories = [
  { name: "All", count: products.length },
  { name: "Weights", count: products.filter(p => p.category === "Weights").length },
  { name: "Yoga", count: products.filter(p => p.category === "Yoga").length },
  { name: "Supplements", count: products.filter(p => p.category === "Supplements").length },
  { name: "Accessories", count: products.filter(p => p.category === "Accessories").length },
  { name: "Electronics", count: products.filter(p => p.category === "Electronics").length },
  { name: "Recovery", count: products.filter(p => p.category === "Recovery").length }
];

const ShopPage = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('fithub-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('fithub-wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiProducts, setApiProducts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Load products and categories from API
  useEffect(() => {
    const loadShopData = async () => {
      setLoading(true);
      try {
        // Load products first
        const productsResponse = await fetch('http://localhost:5000/shop/api/products');
        const productsData = await productsResponse.json();
        
        // Only initialize sample data if no products exist
        if (productsData.success && productsData.products.length === 0) {
          console.log('No products found, initializing sample data...');
          await fetch('http://localhost:5000/shop/api/init-shop-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          // Reload products after initialization
          const newProductsResponse = await fetch('http://localhost:5000/shop/api/products');
          const newProductsData = await newProductsResponse.json();
          if (newProductsData.success) {
            setApiProducts(newProductsData.products);
          }
        } else if (productsData.success) {
          setApiProducts(productsData.products);
        }

        // Load categories
        const categoriesResponse = await fetch('http://localhost:5000/shop/api/categories');
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setApiCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error('Error loading shop data:', error);
        // Fallback to local data
        setApiProducts(products);
        setApiCategories(categories);
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, []);

  // Auto-refresh products every 30 seconds to catch new admin products
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProducts();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fithub-cart', JSON.stringify(cart));
  }, [cart]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fithub-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Refresh products when component mounts or when needed
  const refreshProducts = async () => {
    try {
      const productsResponse = await fetch('http://localhost:5000/shop/api/products');
      const productsData = await productsResponse.json();
      if (productsData.success) {
        setApiProducts(productsData.products);
        console.log('Products refreshed:', productsData.products.length);
        console.log('First product images:', productsData.products[0]?.images);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  // Use API products if available, otherwise fallback to local products
  const allProducts = apiProducts.length > 0 ? apiProducts : products;
  const allCategories = apiCategories.length > 0 ? apiCategories : categories;

  // Filter and sort products
  const filteredProducts = allProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return b.id - a.id;
        default:
          return 0;
      }
    });

  // Cart functions
  const addToCart = (product, variant = null) => {
    const cartItem = {
      ...product,
      variant,
      quantity: 1,
      cartId: Date.now()
    };
    
    const existingItem = cart.find(item => 
      item.id === product.id && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.cartId === existingItem.cartId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, cartItem]);
    }
  };

  const updateQuantity = (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCart(cart.map(item => 
        item.cartId === cartId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const toggleWishlist = (product) => {
    if (wishlist.find(item => item.id === product.id)) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  // Checkout functions
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const response = await fetch('http://localhost:5000/shop/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      
      const data = await response.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        alert('Coupon applied successfully!');
      } else {
        alert('Invalid or expired coupon');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Error applying coupon');
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = getTotalPrice();
    if (appliedCoupon.type === 'percentage') {
      return Math.min(subtotal * (appliedCoupon.value / 100), appliedCoupon.max_discount || subtotal);
    } else {
      return Math.min(appliedCoupon.value, subtotal);
    }
  };

  const calculateShipping = () => {
    const subtotal = getTotalPrice();
    return subtotal >= 999 ? 0 : 99;
  };

  const getFinalTotal = () => {
    const subtotal = getTotalPrice();
    const shipping = calculateShipping();
    const discount = calculateDiscount();
    return subtotal + shipping - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Validate shipping address
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field].trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const orderData = {
        user_email: shippingAddress.email,
        items: cart.map(item => ({
          product_id: item.id || item._id,
          quantity: item.quantity,
          variant: item.variant || {}
        })),
        shipping_address: shippingAddress,
        payment_method: {
          type: 'razorpay', // Will be integrated later
          status: 'pending'
        },
        coupon_code: appliedCoupon ? appliedCoupon.code : ''
      };

      const response = await fetch('http://localhost:5000/shop/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.success) {
        setOrderDetails({
          orderId: data.order_number,
          total: getFinalTotal(),
          items: cart.length
        });
        setOrderSuccess(true);
        setCart([]);
        setCheckoutOpen(false);
        setAppliedCoupon(null);
        setCouponCode('');
        // Clear localStorage cart
        localStorage.removeItem('fithub-cart');
      } else {
        alert('Error creating order: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏋️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">FitHub Store</h1>
                  <p className="text-gray-600 text-sm">Premium Fitness Equipment</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="font-medium">Free shipping on orders over ₹999</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                className="relative p-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group border border-gray-200"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <FilterSidebar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            categories={allCategories}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  className="lg:hidden flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-blue-600 font-semibold"
                  onClick={() => setShowFilters(true)}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>Filters</span>
                </button>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-indigo-600">{filteredProducts.length}</span> of <span className="font-semibold text-gray-900">{allProducts.length}</span> products
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshProducts}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold border-2 border-green-600"
                >
                  🔄 Refresh
                </button>
                <div className="bg-white p-1 rounded-lg shadow-sm border-2 border-gray-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-3 rounded-lg transition-all duration-200 font-semibold ${
                      viewMode === "grid" 
                        ? "bg-blue-600 text-white shadow-md border-2 border-blue-600" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 border-2 border-transparent"
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-3 rounded-lg transition-all duration-200 font-semibold ${
                      viewMode === "list" 
                        ? "bg-blue-600 text-white shadow-md border-2 border-blue-600" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 border-2 border-transparent"
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-indigo-600 font-medium">Loading amazing products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms to find what you're looking for</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setPriceRange([0, 10000]);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-indigo-600"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-8 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                    onAddToCart={addToCart}
                    onToggleWishlist={toggleWishlist}
                    onViewProduct={openProductModal}
                    isInWishlist={wishlist.find(item => item.id === product.id || item.id === product._id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={() => {
          setCart([]);
          localStorage.removeItem('fithub-cart');
        }}
        onCheckout={() => setCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        shippingAddress={shippingAddress}
        setShippingAddress={setShippingAddress}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={applyCoupon}
        onCheckout={handleCheckout}
        loading={loading}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={orderSuccess}
        onClose={() => setOrderSuccess(false)}
        orderDetails={orderDetails}
      />

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        isInWishlist={wishlist.find(item => item.id === selectedProduct?.id || item.id === selectedProduct?._id)}
      />
    </div>
  );
};

export default ShopPage;
