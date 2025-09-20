import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar,
  Users,
  DollarSign,
  User,
  Phone,
  CheckCircle
} from 'lucide-react';
import paymentService from '../utils/paymentService';

const EventDetailsModal = ({ event, isOpen, onClose }) => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinForm, setJoinForm] = useState({
    name: '',
    phone: '',
    email: '',
    emergencyContact: '',
    specialRequirements: ''
  });
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen || !event) return null;

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    setIsJoining(true);

    try {
      // Check if event is free or paid
      const isFree = event.price === 'Free' || event.price === '0' || !event.price;
      
      if (isFree) {
        // Free event - just join
        alert('Successfully joined the free event! You will receive confirmation details via email.');
        setShowJoinForm(false);
        setJoinForm({ name: '', phone: '', email: '', emergencyContact: '', specialRequirements: '' });
      } else {
        // Paid event - process payment
        const amount = paymentService.parseAmount(event.price);
        if (amount > 0) {
          // Create payment order
          const userData = paymentService.getUserData();
          const paymentOrder = await paymentService.createEventPaymentOrder(event, {
            ...userData,
            ...joinForm
          });

          // Open Razorpay checkout
          const options = {
            key: paymentOrder.key_id,
            amount: paymentOrder.order.amount,
            currency: paymentOrder.order.currency,
            name: 'FitHub Events',
            description: `Event: ${event.title}`,
            order_id: paymentOrder.order.id,
            prefill: {
              name: joinForm.name,
              email: joinForm.email,
              contact: joinForm.phone
            },
            notes: {
              event_id: event._id,
              event_title: event.title
            },
            theme: { color: '#7c3aed' }
          };

          const paymentResponse = await paymentService.openRazorpayCheckout(options);
          
          // Verify payment
          await paymentService.verifyPayment({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            event_id: event._id,
            user_data: joinForm
          });

          alert('Payment successful! You have joined the event. Confirmation details will be sent to your email.');
          setShowJoinForm(false);
          setJoinForm({ name: '', phone: '', email: '', emergencyContact: '', specialRequirements: '' });
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert(`Error joining event: ${error.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date not specified';
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Time not specified';
    return time;
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'Yoga': 'bg-green-100 text-green-800',
      'Running': 'bg-blue-100 text-blue-800',
      'HIIT': 'bg-red-100 text-red-800',
      'Cycling': 'bg-yellow-100 text-yellow-800',
      'Volleyball': 'bg-purple-100 text-purple-800',
      'Walking': 'bg-indigo-100 text-indigo-800',
      'Swimming': 'bg-cyan-100 text-cyan-800',
      'Zumba': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">{event.location}</span>
                </div>
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
            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600">{formatTime(event.time)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-gray-600">
                      {event.participants || 0} / {event.max_participants || event.maxParticipants || 'Unlimited'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Price</p>
                    <p className="text-gray-600 font-semibold">{event.price || 'Free'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Organizer</p>
                    <p className="text-gray-600">{event.organizer || 'FitHub Community'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* What to Bring */}
            <div>
              <h3 className="text-lg font-semibold mb-3">What to Bring</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {event.type === 'Yoga' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Yoga mat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Comfortable clothes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Water bottle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Towel</span>
                    </div>
                  </>
                )}
                {event.type === 'Running' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Running shoes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Comfortable running clothes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Water bottle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Energy snacks</span>
                    </div>
                  </>
                )}
                {event.type === 'Cycling' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Bicycle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Helmet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Water bottle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Repair kit</span>
                    </div>
                  </>
                )}
                {/* Default items for other event types */}
                {!['Yoga', 'Running', 'Cycling'].includes(event.type) && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Comfortable clothes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Water bottle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Positive attitude</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Join Form */}
            {showJoinForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t pt-6"
              >
                <h3 className="text-lg font-semibold mb-4">Join This Event</h3>
                <form onSubmit={handleJoinEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({...joinForm, name: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={joinForm.phone}
                      onChange={(e) => setJoinForm({...joinForm, phone: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={joinForm.email}
                    onChange={(e) => setJoinForm({...joinForm, email: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Emergency Contact Number"
                    value={joinForm.emergencyContact}
                    onChange={(e) => setJoinForm({...joinForm, emergencyContact: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full"
                    required
                  />
                  <textarea
                    placeholder="Any special requirements or medical conditions we should know about?"
                    value={joinForm.specialRequirements}
                    onChange={(e) => setJoinForm({...joinForm, specialRequirements: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full h-20 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isJoining}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isJoining ? 'Processing...' : `Join Event ${event.price !== 'Free' ? `- ${event.price}` : '(Free)'}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
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
              <button
                onClick={() => setShowJoinForm(!showJoinForm)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {showJoinForm ? 'Cancel' : 'Join This Event'}
              </button>
              <button
                onClick={() => {/* Add to calendar functionality */}}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Add to Calendar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventDetailsModal;
