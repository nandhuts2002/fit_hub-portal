import React from "react";
import { motion } from "framer-motion";
import { Heart, Eye, ShoppingCart, Star, Package } from "lucide-react";

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onToggleWishlist, 
  onViewProduct, 
  isInWishlist = false,
  viewMode = "grid" 
}) => {
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-300 ${
        viewMode === "list" ? "flex" : ""
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
              console.log('Image failed to load:', e.target.src);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', product.images?.[0] || product.image);
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
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => onToggleWishlist(product)}
            className={`p-3 rounded-full shadow-xl transition-all duration-200 hover:scale-110 ${
              isInWishlist
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                : "bg-white text-gray-600 hover:bg-red-50"
            }`}
          >
            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.reviews})</span>
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

        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onViewProduct(product)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-200 text-sm font-medium border border-gray-200"
            style={{ backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb' }}
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.in_stock}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium border border-indigo-600"
            style={{ 
              backgroundColor: product.in_stock ? '#4f46e5' : '#9ca3af', 
              color: '#ffffff', 
              border: `1px solid ${product.in_stock ? '#4f46e5' : '#9ca3af'}` 
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{product.in_stock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
