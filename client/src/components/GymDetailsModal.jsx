import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  DollarSign,
  Users,
  Wifi,
  Car,
  Dumbbell,
  CheckCircle
} from 'lucide-react';
import paymentService from '../utils/paymentService';

const GymDetailsModal = ({ gym, isOpen, onClose }) => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    phone: '',
    email: '',
    membershipType: 'monthly',
    emergencyContact: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !gym) return null;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the contact form to your backend
    alert('Contact form submitted! The gym will get back to you soon.');
    setShowContactForm(false);
    setContactForm({ name: '', phone: '', email: '', message: '' });
  };

  const handleJoinGym = () => {
    setShowMembershipForm(true);
  };

  const handleMembershipSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const amount = paymentService.parseAmount(gym.price);
      if (amount <= 0) {
        alert('Invalid gym membership price. Please contact the gym directly.');
        return;
      }

      // Create payment order
      const userData = paymentService.getUserData();
      const paymentOrder = await paymentService.createGymPaymentOrder(gym, {
        ...userData,
        ...membershipForm
      }, membershipForm.membershipType);

      // Open Razorpay checkout
      const options = {
        key: paymentOrder.key_id,
        amount: paymentOrder.order.amount,
        currency: paymentOrder.order.currency,
        name: 'FitHub Gym Membership',
        description: `Gym Membership: ${gym.name}`,
        order_id: paymentOrder.order.id,
        prefill: {
          name: membershipForm.name,
          email: membershipForm.email,
          contact: membershipForm.phone
        },
        notes: {
          gym_id: gym._id,
          gym_name: gym.name,
          membership_type: membershipForm.membershipType
        },
        theme: { color: '#7c3aed' }
      };

      const paymentResponse = await paymentService.openRazorpayCheckout(options);
      
      // Verify payment
      await paymentService.verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        gym_id: gym._id,
        membership_type: membershipForm.membershipType,
        user_data: membershipForm
      });

      alert('Payment successful! Your gym membership is now active. Welcome to the gym!');
      setShowMembershipForm(false);
      setMembershipForm({ name: '', phone: '', email: '', membershipType: 'monthly', emergencyContact: '' });
    } catch (error) {
      console.error('Error processing gym membership:', error);
      alert(`Error processing membership: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{gym.name}</h2>
                <p className="text-gray-600 mt-1">{gym.address}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Rating and Price */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold">{gym.rating}</span>
                <span className="text-gray-500">(4.5/5)</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-green-600">{gym.price}</span>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Operating Hours</p>
                  <p className="text-gray-600">{gym.open_hours || gym.openHours || '24/7'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">Distance</p>
                  <p className="text-gray-600">{gym.distance ? `${gym.distance}km away` : 'Location available'}</p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Facilities & Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gym.facilities?.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{facility}</span>
                  </div>
                )) || (
                  <div className="col-span-full text-gray-500">
                    No facilities listed
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {gym.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3">About This Gym</h3>
                <p className="text-gray-700 leading-relaxed">{gym.description}</p>
              </div>
            )}

            {/* Contact Form */}
            {showContactForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t pt-6"
              >
                <h3 className="text-lg font-semibold mb-4">Contact This Gym</h3>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full"
                    required
                  />
                  <textarea
                    placeholder="Your message or inquiry..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full h-24 resize-none"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Membership Form */}
            {showMembershipForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t pt-6"
              >
                <h3 className="text-lg font-semibold mb-4">Join This Gym</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Membership Fee</p>
                      <p className="text-2xl font-bold text-blue-600">{gym.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">per month</p>
                      <p className="text-xs text-blue-600">All facilities included</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleMembershipSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={membershipForm.name}
                      onChange={(e) => setMembershipForm({...membershipForm, name: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={membershipForm.phone}
                      onChange={(e) => setMembershipForm({...membershipForm, phone: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={membershipForm.email}
                    onChange={(e) => setMembershipForm({...membershipForm, email: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full"
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={membershipForm.membershipType}
                      onChange={(e) => setMembershipForm({...membershipForm, membershipType: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="monthly">Monthly Membership</option>
                      <option value="quarterly">Quarterly (3 months)</option>
                      <option value="yearly">Yearly Membership</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Emergency Contact"
                      value={membershipForm.emergencyContact}
                      onChange={(e) => setMembershipForm({...membershipForm, emergencyContact: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : `Pay ${gym.price} & Join`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMembershipForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
            <div className="flex gap-3">
              {!showMembershipForm && !showContactForm && (
                <>
                  <button
                    onClick={handleJoinGym}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Join This Gym
                  </button>
                  <button
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    Contact
                  </button>
                </>
              )}
              {showMembershipForm && (
                <button
                  onClick={() => setShowMembershipForm(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Back to Details
                </button>
              )}
              {showContactForm && (
                <button
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Back to Details
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GymDetailsModal;
