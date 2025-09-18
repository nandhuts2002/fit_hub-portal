import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, MapPin, Gift, Check, AlertCircle } from "lucide-react";

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Online Payment (Razorpay)' },
  { id: 'cod', label: 'Cash on Delivery (COD)' }
];

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

  const [selectedPayment, setSelectedPayment] = React.useState('razorpay');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Real-time validation functions
  const validateField = (field, value) => {
    switch (field) {
      case 'name': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Full name is required';
        if (/[^a-zA-Z\s'.-]/.test(trimmed)) return 'Name can contain only letters and spaces';
        if (/\d/.test(trimmed)) return 'Numbers are not allowed in name';
        if (trimmed.length < 2) return 'Name must be at least 2 characters';
        return '';
      }
      
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) return 'Please enter a valid 10-digit phone number';
        return '';
      
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Please enter a complete address';
        return '';
      
      case 'city':
        if (!value.trim()) return 'City is required';
        return '';
      
      case 'state':
        if (!value.trim()) return 'State is required';
        return '';
      
      case 'pincode':
        if (!value.trim()) return 'Pincode is required';
        if (!/^\d{6}$/.test(value)) return 'Please enter a valid 6-digit pincode';
        return '';
      
      default:
        return '';
    }
  };

  const handleFieldChange = (field, value) => {
    let newValue = value;

    // Sanitize inputs per field for live validation UX
    switch (field) {
      case 'name': {
        // Allow letters, spaces, and common name punctuation; strip digits and others
        newValue = (value || '').replace(/[^a-zA-Z\s'.-]/g, '');
        newValue = newValue.replace(/\s{2,}/g, ' ');
        break;
      }
      case 'city':
      case 'state': {
        newValue = (value || '').replace(/[^a-zA-Z\s'.-]/g, '');
        newValue = newValue.replace(/\s{2,}/g, ' ');
        break;
      }
      case 'phone': {
        newValue = (value || '').replace(/\D/g, '').slice(0, 10);
        break;
      }
      case 'pincode': {
        newValue = (value || '').replace(/\D/g, '').slice(0, 6);
        break;
      }
      case 'email': {
        newValue = (value || '').trim();
        break;
      }
      default:
        break;
    }

    setShippingAddress({ ...shippingAddress, [field]: newValue });

    // Live-validate when the field has been focused (touched)
    if (touched[field]) {
      const error = validateField(field, newValue);
      setErrors({ ...errors, [field]: error });
    } else if (errors[field]) {
      // Clear stale error as user starts typing before focus state is set
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleFieldFocus = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, shippingAddress[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleFieldBlur = (field) => {
    setTouched({...touched, [field]: true});
    const error = validateField(field, shippingAddress[field]);
    setErrors({...errors, [field]: error});
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    
    fields.forEach(field => {
      const error = validateField(field, shippingAddress[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map(field => [field, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = () => {
    if (validateForm()) {
      onCheckout(selectedPayment);
    }
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
          className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="p-8 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Order</h2>
                <p className="text-gray-600">Fill in your details to proceed with checkout</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Shipping Information */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
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
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        onFocus={() => handleFieldFocus('name')}
                        onBlur={() => handleFieldBlur('name')}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                          errors.name && touched.name ? 'border-red-500 bg-red-50' : 
                          touched.name && !errors.name ? 'border-green-500 bg-green-50' : 
                          'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && touched.name && (
                        <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onFocus={() => handleFieldFocus('email')}
                        onBlur={() => handleFieldBlur('email')}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                          errors.email && touched.email ? 'border-red-500 bg-red-50' : 
                          touched.email && !errors.email ? 'border-green-500 bg-green-50' : 
                          'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="Enter your email"
                      />
                      {errors.email && touched.email && (
                        <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      onFocus={() => handleFieldFocus('phone')}
                      onBlur={() => handleFieldBlur('phone')}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.phone && touched.phone ? 'border-red-500 bg-red-50' : 
                        touched.phone && !errors.phone ? 'border-green-500 bg-green-50' : 
                        'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && touched.phone && (
                      <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={shippingAddress.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onFocus={() => handleFieldFocus('address')}
                      onBlur={() => handleFieldBlur('address')}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.address && touched.address ? 'border-red-500 bg-red-50' : 
                        touched.address && !errors.address ? 'border-green-500 bg-green-50' : 
                        'border-gray-300 hover:border-gray-400'
                      }`}
                      rows="3"
                      placeholder="Enter your complete address with landmark"
                    />
                    {errors.address && touched.address && (
                      <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        onFocus={() => handleFieldFocus('city')}
                        onBlur={() => handleFieldBlur('city')}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                          errors.city && touched.city ? 'border-red-500 bg-red-50' : 
                          touched.city && !errors.city ? 'border-green-500 bg-green-50' : 
                          'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="Enter your city"
                      />
                      {errors.city && touched.city && (
                        <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        onFocus={() => handleFieldFocus('state')}
                        onBlur={() => handleFieldBlur('state')}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                          errors.state && touched.state ? 'border-red-500 bg-red-50' : 
                          touched.state && !errors.state ? 'border-green-500 bg-green-50' : 
                          'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="Enter your state"
                      />
                      {errors.state && touched.state && (
                        <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {errors.state}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.pincode}
                        onChange={(e) => handleFieldChange('pincode', e.target.value)}
                        onFocus={() => handleFieldFocus('pincode')}
                        onBlur={() => handleFieldBlur('pincode')}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                          errors.pincode && touched.pincode ? 'border-red-500 bg-red-50' : 
                          touched.pincode && !errors.pincode ? 'border-green-500 bg-green-50' : 
                          'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="Enter 6-digit pincode"
                      />
                      {errors.pincode && touched.pincode && (
                        <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {errors.pincode}
                        </p>
                      )}
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
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  Order Summary
                </h3>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-6 border border-gray-200">
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.cartId} className="flex items-center space-x-4 p-3 bg-white rounded-xl border border-gray-200">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
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

                  {/* Payment Method */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((pm) => (
                        <label key={pm.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="payment_method"
                            value={pm.id}
                            checked={selectedPayment === pm.id}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                          />
                          <span>{pm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0 || !canCheckout}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing Order...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Place Order - ₹{getFinalTotal().toLocaleString()}</span>
                      </div>
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

