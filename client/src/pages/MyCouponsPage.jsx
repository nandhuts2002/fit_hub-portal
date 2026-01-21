import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tag, Copy, Check, Calendar, ShoppingBag, Gift, AlertCircle,
    ChevronDown, ChevronUp, X, ArrowRight, Clock
} from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';
import { useNavigate } from 'react-router-dom';

const MyCouponsPage = () => {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState({ active: [], used: [], expired: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [copiedCode, setCopiedCode] = useState(null);
    const [expandedCoupon, setExpandedCoupon] = useState(null);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            const currentUser = SessionManager.getCurrentUser();
            if (!currentUser?.token) {
                navigate('/login');
                return;
            }

            const response = await api.get('/community/coupons/my-coupons', {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });

            if (response.data.ok) {
                setCoupons(response.data.data);
            }
        } catch (error) {
            console.error('Error loading coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getDaysRemaining = (expiryDate) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const CouponCard = ({ coupon, status }) => {
        const isExpanded = expandedCoupon === coupon.code;
        const daysRemaining = status === 'active' ? getDaysRemaining(coupon.expires_at) : null;
        const isExpiringSoon = daysRemaining !== null && daysRemaining <= 5;

        // Determine gradient based on status
        const gradientClasses = {
            active: 'from-green-500 to-emerald-600',
            used: 'from-gray-400 to-gray-500',
            expired: 'from-red-400 to-red-500'
        };

        const bgClasses = {
            active: 'bg-gradient-to-br from-green-50 to-emerald-50',
            used: 'bg-gradient-to-br from-gray-50 to-gray-100',
            expired: 'bg-gradient-to-br from-red-50 to-red-100'
        };

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ${isExpanded ? 'ring-4 ring-purple-400' : ''}`}
            >
                {/* Premium gradient border */}
                <div className={`absolute inset-0 bg-gradient-to-r ${gradientClasses[status]} opacity-10`} />

                <div className={`relative ${bgClasses[status]} border-2 border-dashed ${status === 'active' ? 'border-green-300' :
                        status === 'used' ? 'border-gray-300' :
                            'border-red-300'
                    } m-1 rounded-xl`}>
                    <div className="p-6">
                        {/* Top section - Badge and source */}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-4 py-2 rounded-full text-white font-bold text-lg shadow-lg bg-gradient-to-r ${gradientClasses[status]}`}>
                                {coupon.discount_type === 'percentage' && `${coupon.discount_value}% OFF`}
                                {coupon.discount_type === 'fixed' && `₹${coupon.discount_value} OFF`}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                {coupon.earned_from === 'challenge_completion' && <Gift className="w-4 h-4" />}
                                {coupon.earned_from === 'purchase' && <ShoppingBag className="w-4 h-4" />}
                                <span className="font-medium">
                                    {coupon.challenge_name || coupon.order_number || 'Reward'}
                                </span>
                            </div>
                        </div>

                        {/* Coupon code section */}
                        <div className="mb-4">
                            <div className={`bg-white rounded-xl p-4 border-4 border-dashed shadow-inner ${status === 'active' ? 'border-green-400' :
                                    status === 'used' ? 'border-gray-300' :
                                        'border-red-300'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Coupon Code</p>
                                        <code className={`text-2xl font-black tracking-widest ${status === 'active' ? 'text-green-700' :
                                                status === 'used' ? 'text-gray-500' :
                                                    'text-red-600'
                                            }`}>
                                            {coupon.code}
                                        </code>
                                    </div>

                                    {status === 'active' && (
                                        <button
                                            onClick={() => copyToClipboard(coupon.code)}
                                            className="ml-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            {copiedCode === coupon.code ? (
                                                <Check className="w-6 h-6" />
                                            ) : (
                                                <Copy className="w-6 h-6" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details section */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">💰 Max Discount:</span>
                                <span className="font-bold text-gray-900">₹{coupon.max_discount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">🛒 Min Purchase:</span>
                                <span className="font-bold text-gray-900">₹{coupon.min_purchase}</span>
                            </div>
                            {status === 'active' && daysRemaining !== null && (
                                <div className={`flex items-center justify-between text-sm ${isExpiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
                                    <span className="font-medium flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Expires in:
                                    </span>
                                    <span className="font-bold">
                                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            {status === 'used' && coupon.used_at && (
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span className="font-medium">✅ Used on:</span>
                                    <span>{new Date(coupon.used_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Expiration warning */}
                        {status === 'active' && isExpiringSoon && (
                            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 text-red-700 text-sm font-semibold">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>Expiring soon! Use it before it's gone.</span>
                                </div>
                            </div>
                        )}

                        {/* Expand for terms */}
                        <button
                            onClick={() => setExpandedCoupon(isExpanded ? null : coupon.code)}
                            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                        >
                            <span>{isExpanded ? 'Hide' : 'Show'} terms & conditions</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 pt-4 border-t-2 border-gray-200 text-sm text-gray-600 space-y-2"
                                >
                                    <p>• Applicable on minimum purchase of ₹{coupon.min_purchase}</p>
                                    <p>• Maximum discount: ₹{coupon.max_discount}</p>
                                    <p>• Valid for use on the FitHub Shop</p>
                                    <p>• {coupon.description || 'One-time use coupon'}</p>
                                    {status === 'active' && (
                                        <p>• Valid until {new Date(coupon.expires_at).toLocaleDateString()}</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Apply button for active coupons */}
                        {status === 'active' && (
                            <button
                                onClick={() => {
                                    sessionStorage.setItem('selected_coupon', coupon.code);
                                    navigate('/shop');
                                }}
                                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Shop Now & Apply Coupon
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const tabConfig = [
        { key: 'active', label: 'Active', icon: Tag, color: 'green', count: coupons.active.length },
        { key: 'used', label: 'Used', icon: Check, color: 'gray', count: coupons.used.length },
        { key: 'expired', label: 'Expired', icon: X, color: 'red', count: coupons.expired.length }
    ];

    const currentCoupons = coupons[activeTab] || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header */}
            <div className="bg-white shadow-xl border-b-4 border-purple-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                                My Coupons 🎫
                            </h1>
                            <p className="text-gray-600 text-lg">Your exclusive rewards and discounts</p>
                        </div>
                        <button
                            onClick={() => navigate('/shop')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <ShoppingBag className="w-5 h-5 inline mr-2" />
                            Shop Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {tabConfig.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg whitespace-nowrap ${isActive
                                        ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white`
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                <span>{tab.label}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-black ${isActive ? 'bg-white bg-opacity-30' : 'bg-gray-200'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Coupons List */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        <p className="mt-4 text-purple-600 font-medium">Loading your coupons...</p>
                    </div>
                ) : currentCoupons.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
                        <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Tag className="w-16 h-16 text-purple-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">No {activeTab} coupons</h3>
                        <p className="text-gray-600 text-lg mb-6">
                            {activeTab === 'active' && 'Complete challenges or make purchases to earn coupons!'}
                            {activeTab === 'used' && "You haven't used any coupons yet."}
                            {activeTab === 'expired' && "You don't have any expired coupons."}
                        </p>
                        {activeTab === 'active' && (
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/community')}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
                                >
                                    Join Challenges
                                </button>
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
                                >
                                    Start Shopping
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                        <AnimatePresence>
                            {currentCoupons.map((coupon) => (
                                <CouponCard key={coupon.code} coupon={coupon} status={activeTab} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Floating total count */}
            <div className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <p className="text-sm font-semibold opacity-90">Total Coupons</p>
                    <p className="text-3xl font-black">{coupons.active.length + coupons.used.length + coupons.expired.length}</p>
                </div>
            </div>
        </div>
    );
};

export default MyCouponsPage;
