import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, ShoppingCart, Star, Package, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onToggleWishlist, 
  onViewProduct, 
  isInWishlist = false,
  viewMode = "grid",
  onBuyNow = () => {}
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  
  // Debug: Log product data
  console.log('🔍 ProductCard rendering:', {
    name: product.name,
    image: product.image,
    images: product.images,
    hasImage: !!(product.images?.[0] || product.image)
  });
  
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isInStock = (product.in_stock !== undefined ? product.in_stock : (product.inStock !== undefined ? product.inStock : true));

  const addBtnRef = useRef(null);

  const handleAddToCart = async (e) => {
    if (isAdding) return; // Prevent multiple clicks
    
    setIsAdding(true);
    try {
      // Compute start coordinates (button center)
      const btn = addBtnRef.current || e?.currentTarget;
      let start = null;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        start = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      await onAddToCart(product, null, start);
      setMessage({ type: 'success', text: 'Added to cart!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add to cart' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      // Reset after a short delay
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    try {
      await onToggleWishlist(product);
      setMessage({ 
        type: 'success', 
        text: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!' 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update wishlist' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col ${
        viewMode === "list" ? "flex" : "min-h-[520px]"
      }`}
      whileHover={{ y: -8, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative ${viewMode === "list" ? "w-48 h-48" : "w-full h-48"}`}>
        {product.images?.[0] || product.image ? (
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('❌ ProductCard image failed to load:', e.target.src);
              console.log('❌ Product data:', product);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            onLoad={() => {
              console.log('✅ ProductCard image loaded successfully:', product.images?.[0] || product.image);
            }}
          />
        ) : null}
        <div 
          className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
          style={{ display: product.images?.[0] || product.image ? 'none' : 'flex' }}
        >
          <div className="text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">No Image</p>
          </div>
        </div>
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
            {discountPercentage}% OFF
          </div>
        )}
        {!isInStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`p-3 rounded-full shadow-xl transition-all duration-200 hover:scale-110 ${
              isInWishlist
                ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                : "bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-600"
            }`}
          >
            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className={`p-4 flex-1 flex flex-col ${viewMode === "list" ? "" : ""}`}>
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-gray-900 text-sm mb-1 truncate leading-snug h-5"
                title={product.name}
              >
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs text-gray-500 mb-2 truncate" title={product.brand}>{product.brand}</p>
              )}
            </div>
            <div className="flex items-center space-x-1 whitespace-nowrap ml-2" title={`${product.rating || 0} out of 5`}>
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              ))}
              <span className="text-sm text-gray-700 font-medium ml-1">{(product.rating || 0).toFixed ? (product.rating || 0).toFixed(1) : (product.rating || 0)}</span>
              <span className="text-xs text-gray-400">({product.reviews || 0})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="mb-2">
            {isInStock ? (
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                {typeof product.stock_quantity === 'number' ? `In stock: ${product.stock_quantity}` : 'In stock'}
              </span>
            ) : (
              <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded">
                Out of stock
              </span>
            )}
          </div>

          {/* Tags - Fixed height */}
          <div className="flex flex-wrap gap-1 h-8 overflow-hidden">
            {product.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Actions Section - Fixed at bottom */}
        <div className="flex flex-col space-y-3">
          {/* Buy Now Button */}
          <button
            onClick={() => onBuyNow(product)}
            disabled={!isInStock}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <span className="text-base">Buy Now</span>
          </button>

          {/* Add to Cart Button */}
          <button
            ref={addBtnRef}
            onClick={handleAddToCart}
            disabled={!product.in_stock || isAdding}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-base">
              {isAdding ? 'Adding...' : product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </span>
          </button>
          
          {/* Alt toolbar: icon-only buttons for perfect alignment across cards */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
            <button
              onClick={() => onViewProduct(product)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-white border hover:border-gray-300 text-gray-700"
              title="View"
              aria-label="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const pid = product._id || product.id || product.slug;
                if (pid) navigate(`/shop/products/${pid}`); else onViewProduct(product);
              }}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border hover:bg-white hover:border-gray-300 text-gray-700"
              title="View 360"
              aria-label="View 360"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`w-9 h-9 inline-flex items-center justify-center rounded-full border ${
                isInWishlist
                  ? 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200'
                  : 'hover:bg-white hover:border-gray-300 text-gray-700'
              }`}
              title={isInWishlist ? 'Saved' : 'Save'}
              aria-label="Save"
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-2 left-2 right-2 p-2 rounded-lg text-xs font-medium text-center ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductCard;
