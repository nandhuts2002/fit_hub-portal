import React, { useState } from 'react';
import { motion } from 'framer-motion';
import customExerciseService from '../utils/customExerciseService';

export default function TrainerExerciseUpload({ onExerciseAdded, onClose }) {
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    name: '',
    bodyPart: '',
    target: '',
    equipment: '',
    instructions: [],
    gifFile: null,
    mediaFile: null,
    mediaUrl: ''
  });
  
  const [mediaInputType, setMediaInputType] = useState('file'); // 'file' or 'url'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const bodyParts = [
    'chest', 'back', 'upper legs', 'lower legs', 'upper arms', 
    'lower arms', 'waist', 'neck', 'shoulders'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        gifFile: file,
        mediaFile: file,
        mediaUrl: '' // Clear URL when file is selected
      }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      mediaUrl: url,
      gifFile: null, // Clear file when URL is entered
      mediaFile: null
    }));
    
    // Set preview URL if it's a valid URL
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleInstructionsChange = (e) => {
    const instructions = e.target.value.split('\n').filter(line => line.trim());
    setFormData(prev => ({
      ...prev,
      instructions: instructions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.name || !formData.bodyPart || !formData.target || !formData.equipment) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.instructions || formData.instructions.length === 0) {
        throw new Error('Please provide exercise instructions');
      }

      // Create exercise data
      const exerciseData = {
        name: formData.name,
        bodyPart: formData.bodyPart,
        target: formData.target,
        equipment: formData.equipment,
        instructions: formData.instructions,
        // Include both file and URL options
        gifFile: formData.gifFile,
        mediaFile: formData.mediaFile,
        mediaUrl: formData.mediaUrl,
        trainerId: localStorage.getItem('userId') || 'anonymous'
      };

      // Add exercise (includes file upload)
      const newExercise = await customExerciseService.addTrainerExercise(exerciseData);

      setSuccess('Exercise added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        bodyPart: '',
        target: '',
        equipment: '',
        instructions: [],
        gifFile: null,
        mediaFile: null,
        mediaUrl: ''
      });
      setPreviewUrl('');
      
      // Notify parent component
      if (onExerciseAdded) {
        onExerciseAdded(newExercise);
      }

      // Auto-close after success
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to add exercise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Add Exercise GIF
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-red-900/40 border border-red-700 text-red-100' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-green-900/40 border border-green-700 text-green-100' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Exercise Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Push Up"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Body Part *
                </label>
                <select
                  name="bodyPart"
                  value={formData.bodyPart}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                >
                  <option value="">Select body part</option>
                  {bodyParts.map(part => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Target Muscle *
                </label>
                <input
                  type="text"
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                  placeholder="e.g., pectorals"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Equipment Type *
                </label>
                <select
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                >
                  <option value="">Select equipment</option>
                  <option value="body weight">Body Weight</option>
                  <option value="dumbbell">Dumbbells</option>
                  <option value="barbell">Barbell</option>
                  <option value="cable">Cable Machine</option>
                  <option value="machine">Machines</option>
                  <option value="kettlebell">Kettlebells</option>
                  <option value="resistance band">Resistance Bands</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Instructions *
              </label>
              <textarea
                name="instructions"
                value={formData.instructions.join('\n')}
                onChange={handleInstructionsChange}
                placeholder="Enter each instruction on a new line..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Exercise Media (Optional)
              </label>
              
              {/* Toggle between File and URL */}
              <div className="flex mb-3">
                <button
                  type="button"
                  onClick={() => setMediaInputType('file')}
                  className={`px-4 py-2 rounded-l-lg border ${mediaInputType === 'file' 
                    ? (isDark ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600')
                    : (isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200')
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setMediaInputType('url')}
                  className={`px-4 py-2 rounded-r-lg border ${mediaInputType === 'url' 
                    ? (isDark ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600')
                    : (isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200')
                  }`}
                >
                  Add URL
                </button>
              </div>

              {mediaInputType === 'file' ? (
                <>
                  <input
                    type="file"
                    accept=".gif,.webp,.mp4,.mov,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Supported formats: GIF, WebP, JPG, PNG, MP4, MOV (max 10MB)
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="url"
                    value={formData.mediaUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/exercise.gif"
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Enter a direct URL to a GIF, image, or video file
                  </p>
                </>
              )}
            </div>

            {previewUrl && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preview
                </label>
                <div className="border rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
                  {previewUrl && formData.mediaFile && formData.mediaFile.type.startsWith('video/') ? (
                    <video src={previewUrl} controls className="w-full h-56 object-contain" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="max-w-full h-48 object-contain mx-auto" />
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-2 rounded-lg font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Adding...' : 'Add Exercise'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
