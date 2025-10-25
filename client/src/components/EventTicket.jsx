import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Download, 
  QrCode,
  CheckCircle,
  X
} from 'lucide-react';
import api from '../utils/api';

const EventTicket = ({ ticketId, isOpen, onClose }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket();
    }
  }, [isOpen, ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/location/api/ticket/${ticketId}`);
      if (response.data.success) {
        setTicket(response.data.ticket);
      } else {
        setError('Failed to load ticket');
      }
    } catch (err) {
      console.error('Error loading ticket:', err);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    if (!ticket) return;
    
    // Create a printable version of the ticket
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Event Ticket - ${ticket.event_title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .ticket { border: 2px solid #333; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .details { margin: 10px 0; }
            .label { font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>FitHub Event Ticket</h1>
              <h2>${ticket.event_title}</h2>
            </div>
            <div class="details">
              <p><span class="label">Ticket ID:</span> ${ticket.ticket_id}</p>
              <p><span class="label">Date:</span> ${ticket.event_date}</p>
              <p><span class="label">Time:</span> ${ticket.event_time}</p>
              <p><span class="label">Location:</span> ${ticket.event_location}</p>
              <p><span class="label">Participant:</span> ${ticket.participant_name}</p>
              <p><span class="label">Email:</span> ${ticket.participant_email}</p>
              <p><span class="label">Phone:</span> ${ticket.participant_phone}</p>
              <p><span class="label">Amount Paid:</span> ₹${ticket.amount_paid}</p>
            </div>
            ${ticket.qr_code ? `<div class="qr-code"><img src="${ticket.qr_code}" alt="QR Code" style="max-width: 200px;" /></div>` : ''}
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
              <p>Please bring this ticket to the event</p>
              <p>Generated on: ${new Date(ticket.generated_at).toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event Ticket</h2>
                <p className="text-sm text-gray-600">Your event confirmation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading ticket...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Ticket</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadTicket}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : ticket ? (
              <div className="space-y-6">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{ticket.event_title}</h3>
                      <p className="text-blue-600 font-medium">Ticket ID: {ticket.ticket_id}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Confirmed
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium">{ticket.event_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-medium">{ticket.event_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{ticket.event_location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs">₹</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount Paid</p>
                        <p className="font-medium">₹{ticket.amount_paid}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participant Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Participant Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{ticket.participant_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{ticket.participant_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{ticket.participant_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">ID</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Booking ID</p>
                        <p className="font-medium">{ticket.booking_id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                {ticket.qr_code && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Event QR Code
                    </h4>
                    <div className="flex justify-center">
                      <img 
                        src={ticket.qr_code} 
                        alt="Event QR Code" 
                        className="max-w-48 h-48 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Show this QR code at the event entrance
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadTicket}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Ticket
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventTicket;

