import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, MapPin, Gift, Check } from "lucide-react";

const CheckoutModal = ({
  isOpen,
  onClose,
  cart,
  shippingAddress,
  setShippingAddress,
  onUseCurrentLocation,
  couponCode,
  setCouponCode,
  appliedCoupon,
  onApplyCoupon,
  onCheckout,
  loading = false,
  canCheckout = true
}) => {
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Shipping Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Enter your full address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.pincode}
                        onChange={(e) => setShippingAddress({...shippingAddress, pincode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2" />
                    Coupon Code
                  </h3>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter coupon code"
                    />
                    <button
                      onClick={onApplyCoupon}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="mt-2 p-3 bg-green-100 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                          Coupon applied: {appliedCoupon.description}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Order Summary
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.cartId} className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span>₹{getTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Shipping:</span>
                      <span>{calculateShipping() === 0 ? 'Free' : `₹${calculateShipping()}`}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-₹{calculateDiscount().toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{getFinalTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={onCheckout}
                    disabled={loading || cart.length === 0 || !canCheckout}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Place Order'
                    )}
                  </button>

                  <div className="text-center text-xs text-gray-500">
                    By placing this order, you agree to our terms and conditions
                  </div>
                </div>

                {/* Use Current Location */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onUseCurrentLocation}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <MapPin className="w-4 h-4" /> Use My Current Location
                  </button>
                  {shippingAddress?.geo?.lat && shippingAddress?.geo?.lon && (
                    <div className="mt-2 text-xs text-gray-600">
                      Captured: {shippingAddress.geo.lat.toFixed(5)}, {shippingAddress.geo.lon.toFixed(5)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;

