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

const GymDetailsModal = ({ gym, isOpen, onClose }) => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  if (!isOpen || !gym) return null;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the contact form to your backend
    alert('Contact form submitted! The gym will get back to you soon.');
    setShowContactForm(false);
    setContactForm({ name: '', phone: '', email: '', message: '' });
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
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
            <div className="flex gap-3">
              {!showContactForm && (
                <button
                  onClick={() => setShowContactForm(true)}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Request to Join
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

