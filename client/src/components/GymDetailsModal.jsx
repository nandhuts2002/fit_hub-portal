import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign,
  Users,
  Wifi,
  Car,
  Dumbbell,
  CheckCircle
} from 'lucide-react';

const GymDetailsModal = ({ gym, isOpen, onClose }) => {
  if (!isOpen || !gym) return null;

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

          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GymDetailsModal;

