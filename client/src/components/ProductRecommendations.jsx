import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const ProductRecommendations = ({ userEmail, type = 'recent_orders', title = "Based on your recent orders" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint;
      if (type === 'trending') {
        endpoint = '/shop/api/recommendations/trending';
      } else if (type === 'recent_orders') {
        endpoint = `/shop/api/recommendations/${encodeURIComponent(userEmail)}/recent`;
      } else {
        endpoint = `/shop/api/recommendations/${encodeURIComponent(userEmail)}?type=${type}`;
      }
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        if (type === 'trending') {
          setRecommendations(response.data.trending_products || []);
        } else {
          setRecommendations(response.data.recommendations || []);
        }
      } else {
        setError('Failed to fetch recommendations');
      }
    } catch (err) {
      setError('Error fetching recommendations: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail || type === 'trending') {
      fetchRecommendations();
    }
  }, [userEmail, type]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddToCart = async (productId) => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) {
        alert('Please login to add items to cart');
        return;
      }

      await api.post(`/shop/api/cart/${encodeURIComponent(userEmail)}/add`, {
        product_id: productId,
        quantity: 1
      });
      
      alert('Product added to cart successfully!');
    } catch (err) {
      alert('Error adding to cart: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddToWishlist = async (productId) => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) {
        alert('Please login to add items to wishlist');
        return;
      }

      await api.post(`/shop/api/wishlist/${encodeURIComponent(userEmail)}/toggle`, {
        product_id: productId
      });
      
      alert('Product added to wishlist!');
    } catch (err) {
      alert('Error adding to wishlist: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-600">No recommendations available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button 
          onClick={fetchRecommendations}
          className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <div key={product.product_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Product Image */}
            <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800 line-clamp-2">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.brand}</p>
              
              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(product.original_price)}
                  </span>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-sm ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">({product.reviews})</span>
              </div>
              
              {/* Recommendation Reason */}
              {product.recommendation_reason && (
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {product.recommendation_reason}
                </p>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleAddToCart(product.product_id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleAddToWishlist(product.product_id)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  title="Add to Wishlist"
                >
                  ♥
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Show more button */}
      {recommendations.length >= 10 && (
        <div className="text-center mt-4">
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Show More Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;
