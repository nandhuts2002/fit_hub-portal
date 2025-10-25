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
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const [joinForm, setJoinForm] = useState({
    name: '',
    phone: '',
    email: '',
    emergencyContact: '',
    specialRequirements: ''
  });
  const [isJoining, setIsJoining] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen || !event) return null;

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!joinForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (joinForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!joinForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(joinForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!joinForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(joinForm.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit Indian phone number';
    }
    
    if (!joinForm.emergencyContact.trim()) {
      errors.emergencyContact = 'Emergency contact is required';
    } else if (!/^[6-9]\d{9}$/.test(joinForm.emergencyContact.replace(/\D/g, ''))) {
      errors.emergencyContact = 'Please enter a valid 10-digit Indian phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add to calendar function
  const addToCalendar = () => {
    if (!event.date || !event.time) {
      alert('Event date and time are required to add to calendar');
      return;
    }

    const eventDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const calendarData = {
      title: event.title,
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      location: event.location,
      description: event.description || `Join us for ${event.title} at ${event.location}`,
      url: window.location.href
    };

    // Create Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&dates=${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}`;
    
    // Create ICS file for other calendar apps
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FitHub//Event//EN
BEGIN:VEVENT
UID:${event._id}@fithub.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${calendarData.title}
DESCRIPTION:${calendarData.description}
LOCATION:${calendarData.location}
END:VEVENT
END:VCALENDAR`;

    // Show calendar options modal instead of using confirm
    setShowCalendarOptions(true);
    
    // Store calendar data for use in modal
    window._calendarData = { googleCalendarUrl, icsContent, eventTitle: event.title };
  };

  const handleCalendarChoice = (choice) => {
    setShowCalendarOptions(false);
    const { googleCalendarUrl, icsContent, eventTitle } = window._calendarData || {};
    
    if (choice === 'google' && googleCalendarUrl) {
      window.open(googleCalendarUrl, '_blank');
    } else if (choice === 'ics' && icsContent) {
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    // Clean up
    delete window._calendarData;
  };

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    
    // Validate form first
    if (!validateForm()) {
      setIsValidating(false);
      return;
    }
    
    setIsJoining(true);

    try {
      // Check if event is free or paid
      const isFree = event.price === 'Free' || event.price === '0' || !event.price;
      
      if (isFree) {
        // Free event - create booking directly
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/location/api/event-bookings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_id: event._id,
            user_data: joinForm,
            status: 'confirmed'
          })
        });

        if (response.ok) {
          alert('Successfully joined the free event! You will receive confirmation details via email.');
          setShowJoinForm(false);
          setJoinForm({ name: '', phone: '', email: '', emergencyContact: '', specialRequirements: '' });
          onClose(); // Close modal after successful join
        } else {
          throw new Error('Failed to join event');
        }
      } else {
        // Paid event - process payment
        const amount = paymentService.parseAmount(event.price);
        if (amount > 0) {
          // Ensure Razorpay is loaded
          await paymentService.ensureRazorpayLoaded();
          
          // Create payment order
          const paymentOrder = await paymentService.createEventPaymentOrder(event, joinForm);

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
          onClose(); // Close modal after successful payment
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert(`Error joining event: ${error.message}`);
    } finally {
      setIsJoining(false);
      setIsValidating(false);
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
      {/* Calendar Options Modal */}
      <AnimatePresence>
        {showCalendarOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCalendarOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add to Calendar</h3>
                <button
                  onClick={() => setShowCalendarOptions(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">Choose how you'd like to add this event to your calendar:</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleCalendarChoice('google')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Google Calendar</span>
                </button>
                <button
                  onClick={() => handleCalendarChoice('ics')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>Download ICS File</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      {event.max_participants && event.max_participants > 0 && (
                        <span className="ml-2 text-sm text-blue-600">
                          ({event.max_participants - (event.participants || 0)} spots remaining)
                        </span>
                      )}
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
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={joinForm.name}
                        onChange={(e) => {
                          setJoinForm({...joinForm, name: e.target.value});
                          if (formErrors.name) {
                            setFormErrors({...formErrors, name: ''});
                          }
                        }}
                        className={`border rounded-lg px-3 py-2 w-full ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        required
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={joinForm.phone}
                        onChange={(e) => {
                          setJoinForm({...joinForm, phone: e.target.value});
                          if (formErrors.phone) {
                            setFormErrors({...formErrors, phone: ''});
                          }
                        }}
                        className={`border rounded-lg px-3 py-2 w-full ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        required
                      />
                      {formErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={joinForm.email}
                      onChange={(e) => {
                        setJoinForm({...joinForm, email: e.target.value});
                        if (formErrors.email) {
                          setFormErrors({...formErrors, email: ''});
                        }
                      }}
                      className={`border rounded-lg px-3 py-2 w-full ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Emergency Contact Number"
                      value={joinForm.emergencyContact}
                      onChange={(e) => {
                        setJoinForm({...joinForm, emergencyContact: e.target.value});
                        if (formErrors.emergencyContact) {
                          setFormErrors({...formErrors, emergencyContact: ''});
                        }
                      }}
                      className={`border rounded-lg px-3 py-2 w-full ${formErrors.emergencyContact ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      required
                    />
                    {formErrors.emergencyContact && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.emergencyContact}</p>
                    )}
                  </div>
                  <textarea
                    placeholder="Any special requirements or medical conditions we should know about?"
                    value={joinForm.specialRequirements}
                    onChange={(e) => setJoinForm({...joinForm, specialRequirements: e.target.value})}
                    className="border rounded-lg px-3 py-2 w-full h-20 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isJoining || isValidating}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isValidating ? 'Validating...' : isJoining ? 'Processing...' : `Join Event ${event.price !== 'Free' ? `- ${event.price}` : '(Free)'}`}
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
                disabled={event.max_participants && event.max_participants > 0 && (event.participants || 0) >= event.max_participants}
                className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium ${
                  event.max_participants && event.max_participants > 0 && (event.participants || 0) >= event.max_participants
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {event.max_participants && event.max_participants > 0 && (event.participants || 0) >= event.max_participants
                  ? 'Event Fully Booked'
                  : showJoinForm ? 'Cancel' : 'Join This Event'
                }
              </button>
              <button
                onClick={addToCalendar}
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
