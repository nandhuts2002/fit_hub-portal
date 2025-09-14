import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, ShoppingCart, Check } from "lucide-react";

const ProductModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false
}) => {
  if (!product) return null;
  
  // Debug: Log product data to see what we're working with
  console.log('ProductModal - Product data:', product);
  console.log('ProductModal - Image field:', product.image);
  console.log('ProductModal - Images field:', product.images);
  
  // Normalize stock flag from API (in_stock) or local (inStock)
  const isInStock = (product?.in_stock !== undefined) ? product.in_stock : (product?.inStock !== undefined ? product.inStock : true);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2">
                {product.image || product.images?.[0] ? (
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    className="w-full h-64 lg:h-full object-cover rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none"
                    onError={(e) => {
                      console.log('ProductModal image failed to load:', e.target.src);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log('ProductModal image loaded successfully:', product.image || product.images?.[0]);
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-64 lg:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none"
                  style={{ display: product.image || product.images?.[0] ? 'none' : 'flex' }}
                >
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-lg font-medium">No Image Available</p>
                    <p className="text-sm">Product: {product.name}</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h2>
                    <p className="text-gray-600 mb-2">{product.brand}</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-semibold">{product.rating}</span>
                        <span className="text-gray-500">({product.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-gray-700 mb-6">{product.description}</p>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Key Features:</h3>
                  <ul className="space-y-2">
                    {product.features?.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {product.variants && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Options:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {product.variants.map((variant, index) => (
                        <button
                          key={index}
                          className="p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
                          onClick={() => onAddToCart(product, variant)}
                        >
                          {Object.entries(variant).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(", ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => onToggleWishlist(product)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      isInWishlist
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    <span>
                      {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                    </span>
                  </button>
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={!isInStock}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      {isInStock ? "Add to Cart" : "Out of Stock"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;

