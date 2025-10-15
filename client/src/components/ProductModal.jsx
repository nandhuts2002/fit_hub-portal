import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, ShoppingCart, Check } from "lucide-react";
import api from "../utils/api";
import SessionManager from "../utils/sessionManager";
import { useNavigate } from "react-router-dom";

const ProductModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false
}) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  // Debug: Log product data (guard when null)
  if (product) {
    console.log('ProductModal - Product data:', product);
    console.log('ProductModal - Image field:', product.image);
    console.log('ProductModal - Images field:', product.images);
  }
  
  // Normalize stock flag from API (in_stock) or local (inStock)
  const isInStock = (product?.in_stock !== undefined) ? product.in_stock : (product?.inStock !== undefined ? product.inStock : true);

  const addBtnRef = useRef(null);

  // Load reviews when opened
  useEffect(() => {
    const loadReviews = async () => {
      try {
        if (!product?._id && !product?.id) return;
        const pid = product._id || product.id;
        console.log('Loading reviews for product:', pid);
        const { data } = await api.get(`/shop/api/products/${pid}/reviews`);
        console.log('Reviews loaded:', data);
        if (data.success) setReviews(data.reviews || []);
      } catch (e) {
        console.error('Error loading reviews:', e);
        // ignore
      }
    };
    if (isOpen && product) loadReviews();
  }, [isOpen, product]);

  const handleAddVariant = (e, variant) => {
    const rect = e.currentTarget?.getBoundingClientRect?.();
    const start = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    onAddToCart(product, variant, start);
  };

  const handleAddMain = (e) => {
    const btn = addBtnRef.current || e.currentTarget;
    const rect = btn?.getBoundingClientRect?.();
    const start = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    onAddToCart(product, null, start);
  };

  if (!product) return null;

  // Helper to refresh reviews for current product
  const refreshReviews = async () => {
    try {
      if (!product?._id && !product?.id) return;
      const pid = product._id || product.id;
      const { data } = await api.get(`/shop/api/products/${pid}/reviews`);
      if (data.success) setReviews(data.reviews || []);
    } catch (e) {
      // swallow errors in refresh to avoid breaking UX
    }
  };

  const submitReview = async () => {
    setError("");
    if (!rating) { setError("Please select a rating"); return; }
    try {
      setSubmitting(true);
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser?.token) { setError("Please login to review"); setSubmitting(false); return; }
      const pid = product._id || product.id;
      console.log('Submitting review for product:', pid);
      console.log('User token:', currentUser.token);
      const { data } = await api.post(`/shop/api/products/${pid}/reviews`, { rating, comment }, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      console.log('Review submission response:', data);
      // Always refresh reviews so existing ones show up even if user already reviewed
      await refreshReviews();
      if (data?.success) {
        console.log('Review submitted successfully');
        setRating(0);
        setHoverRating(0);
        setComment("");
      } else {
        setError(data?.error || "Failed to submit review");
      }
    } catch (e) {
      console.error('Review submission error:', e);
      setError(e?.response?.data?.error || e.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

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
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} className={`w-5 h-5 ${i <= Math.round(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="font-semibold">{(product.rating || 0).toFixed ? (product.rating || 0).toFixed(1) : (product.rating || 0)}</span>
                      <span className="text-gray-500">({product.reviews || 0} reviews)</span>
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
                  <span className={`text-sm font-medium px-2 py-1 rounded border ${isInStock ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                    {isInStock ? (typeof product.stock_quantity === 'number' ? `In stock: ${product.stock_quantity}` : 'In stock') : 'Out of stock'}
                  </span>
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
                          onClick={(e) => handleAddVariant(e, variant)}
                        >
                          {Object.entries(variant).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(", ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review form */}
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Rate this product</h3>
                  <div className="flex items-center mb-3">
                    {[1,2,3,4,5].map((i) => (
                      <button
                        key={i}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i)}
                        className="mr-1"
                        title={`${i} star`}
                      >
                        <Star className={`w-6 h-6 ${i <= (hoverRating || rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-gray-700">{rating} / 5</span>
                    )}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience (optional)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    rows={3}
                  />
                  {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                  <div className="mt-3 text-right">
                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>

                {/* Reviews list */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Reviews</h3>
                  {reviews.length === 0 ? (
                    <div className="text-sm text-gray-500">No reviews yet. Be the first to review!</div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r, idx) => (
                        <div key={r._id || idx} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              {[1,2,3,4,5].map((i) => (
                                <Star key={i} className={`w-4 h-4 ${i <= (r.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}
                              <span className="ml-2 text-sm text-gray-700">{r.rating}/5</span>
                            </div>
                            <span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleString?.() : ''}</span>
                          </div>
                          {r.comment && <div className="text-sm text-gray-700">{r.comment}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
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
                    onClick={() => navigate(`/shop/products/${product._id || product.id}`)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                    title="Open 360° Viewer"
                  >
                    <span>View 360</span>
                  </button>
                  <button
                    ref={addBtnRef}
                    onClick={handleAddMain}
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

