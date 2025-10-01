import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaExclamationTriangle, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

const MedicalCheckPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [acknowledged, setAcknowledged] = useState(false);
  const nextPath = searchParams.get('next') || '/tutorials';

  const handleAcknowledge = () => {
    if (acknowledged) {
      // Store acknowledgment in localStorage
      localStorage.setItem('medical_ack_v1', 'accepted');
      // Navigate to the intended destination
      navigate(nextPath, { replace: true });
    }
  };

  const handleGoBack = () => {
    navigate('/user-home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <FaExclamationTriangle className="text-2xl" />
            <h1 className="text-2xl font-bold">Medical Disclaimer & Safety Notice</h1>
          </div>
          <p className="text-orange-100">
            Please read and acknowledge this important health and safety information before proceeding.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-600" />
              Important Health Notice
            </h2>
            <p className="text-yellow-700 text-sm leading-relaxed">
              The fitness content, exercises, and wellness information provided on this platform are for educational and informational purposes only. They are not intended as medical advice, diagnosis, or treatment.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Before You Begin:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Consult with your healthcare provider before starting any new exercise program, especially if you have pre-existing medical conditions, injuries, or health concerns.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Listen to your body and stop immediately if you experience pain, dizziness, shortness of breath, or any discomfort during exercises.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Ensure you have adequate space, proper equipment, and appropriate clothing before attempting any exercises.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Start slowly and gradually increase intensity. Modify exercises as needed for your fitness level.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Stay hydrated and take breaks as needed during your workout sessions.</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Disclaimer</h3>
            <p className="text-red-700 text-sm leading-relaxed">
              By using this platform, you acknowledge that you participate in fitness activities at your own risk. 
              FitHub and its trainers are not liable for any injuries, health issues, or damages that may occur 
              from following the provided content. Always prioritize your safety and well-being.
            </p>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              <span className="text-gray-700 text-sm leading-relaxed">
                <strong>I acknowledge</strong> that I have read and understood this medical disclaimer. 
                I confirm that I am in good health and able to participate in physical activities. 
                I understand the risks involved and agree to exercise at my own discretion and responsibility.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              Go Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: acknowledged ? 1.02 : 1 }}
              whileTap={{ scale: acknowledged ? 0.98 : 1 }}
              onClick={handleAcknowledge}
              disabled={!acknowledged}
              className={`flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all flex-1 ${
                acknowledged
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FaCheckCircle className="text-sm" />
              I Understand & Agree - Continue to Tutorials
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MedicalCheckPage;
