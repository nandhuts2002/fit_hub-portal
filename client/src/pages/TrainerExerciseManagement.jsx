import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import customExerciseService from '../utils/customExerciseService';

export default function TrainerExerciseManagement() {
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bodyPart: '',
    target: '',
    equipment: '',
    // Keep as textarea string; convert to array on submit
    instructions: '',
    gifFile: null,
    gifUrl: ''
  });
  
  const [useUrl, setUseUrl] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const bodyParts = [
    'chest', 'back', 'upper legs', 'lower legs', 'upper arms', 
    'lower arms', 'waist', 'neck', 'shoulders'
  ];

  const equipmentOptions = [
    'body weight', 'dumbbell', 'barbell', 'cable', 'machine', 
    'kettlebell', 'resistance band', 'band', 'rope', 'assisted', 
    'other'
  ];

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const data = await customExerciseService.getCustomExercises();
      // Filter to show only trainer-uploaded exercises
      const trainerExercises = data.filter(ex => ex.source === 'trainer');
      setExercises(trainerExercises);
    } catch (error) {
      setError('Failed to fetch exercises');
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

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
        gifFile: file
      }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleInstructionsChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      instructions: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.name || !formData.bodyPart || !formData.target || !formData.equipment) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.instructions || formData.instructions.length === 0) {
        throw new Error('Please provide exercise instructions');
      }

      // Convert textarea to array of steps
      const instructionsArr = (formData.instructions || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      // Create exercise data
      const exerciseData = {
        name: formData.name,
        bodyPart: formData.bodyPart,
        target: formData.target,
        equipment: formData.equipment,
        instructions: instructionsArr,
        gifFile: formData.gifFile, // Include the GIF file
        gifUrl: formData.gifUrl, // Include the GIF URL
        trainerId: localStorage.getItem('userId') || 'anonymous'
      };

      let newExercise;
      if (editingExercise) {
        // Update existing exercise
        const response = await fetch(`http://localhost:5000/api/custom-exercises/${editingExercise.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exerciseData)
        });
        
        if (response.ok) {
          newExercise = await response.json();
        } else {
          throw new Error('Failed to update exercise');
        }
      } else {
        // Add new exercise
        newExercise = await customExerciseService.addTrainerExercise(exerciseData);
      }


      setSuccess(editingExercise ? 'Exercise updated successfully!' : 'Exercise added successfully!');
      
      // Reset form
      resetForm();
      
      // Refresh exercises list
      fetchExercises();

      // Auto-close form after success
      setTimeout(() => {
        setShowUploadForm(false);
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to save exercise');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bodyPart: '',
      target: '',
      equipment: '',
      instructions: '',
      gifFile: null,
      gifUrl: ''
    });
    setPreviewUrl('');
    setEditingExercise(null);
    setUseUrl(false);
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      target: exercise.target,
      equipment: exercise.equipment,
      // Convert array to textarea string
      instructions: Array.isArray(exercise.instructions) ? exercise.instructions.join('\n') : (exercise.instructions || ''),
      gifFile: null,
      gifUrl: exercise.gifUrl || exercise.mediaUrl || ''
    });
    setUseUrl(!!(exercise.gifUrl || exercise.mediaUrl));
    if (exercise.gifUrl || exercise.mediaUrl) {
      setPreviewUrl(exercise.gifUrl || exercise.mediaUrl);
    }
    setShowUploadForm(true);
  };

  const handleDelete = async (exerciseId) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      await customExerciseService.deleteTrainerExercise(exerciseId);
      setSuccess('Exercise deleted successfully!');
      fetchExercises();
    } catch (error) {
      setError(error.message || 'Error deleting exercise');
      console.error('Error deleting exercise:', error);
    }
  };

  const openUploadForm = () => {
    resetForm();
    setShowUploadForm(true);
  };

  const viewExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Exercise GIF Management
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Add and manage exercise GIFs that will appear in the services exercise page
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-4">
            <motion.button
              onClick={openUploadForm}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg font-medium ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} flex items-center gap-2 shadow-lg`}
            >
              <span className="text-lg">+</span>
              Add Exercise GIF
            </motion.button>
            
            <motion.button
              onClick={fetchExercises}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} flex items-center gap-2 shadow-lg`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </motion.button>
          </div>
          
          {/* Status Indicator */}
          <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            <span className="text-sm font-medium">
              {exercises.length} Exercise{exercises.length !== 1 ? 's' : ''} Added
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-green-900/40 border-green-700 text-green-100' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {success}
          </div>
        )}

        {/* Exercises Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exercises.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                  No exercises yet
                </h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  Add your first exercise GIF to start building your exercise library.
                </p>
                <button
                  onClick={openUploadForm}
                  className={`px-6 py-3 rounded-lg font-medium ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} shadow-lg`}
                >
                  Add Your First Exercise
                </button>
              </div>
            ) : (
              exercises.map((exercise, idx) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg transition-shadow`}
                >
                  {exercise.gifUrl ? (
                    <div className="h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden relative group cursor-pointer" onClick={() => viewExercise(exercise)}>
         {exercise.mediaType === 'video' ? (
           <video
             src={(exercise.mediaUrl || exercise.gifUrl).startsWith('/') ? `http://localhost:5000${exercise.mediaUrl || exercise.gifUrl}` : (exercise.mediaUrl || exercise.gifUrl)}
             className="w-full h-full object-cover"
             muted
             loop
             playsInline
           />
         ) : (
           <img
             src={(exercise.mediaUrl || exercise.gifUrl).startsWith('/') ? `http://localhost:5000${exercise.mediaUrl || exercise.gifUrl}` : (exercise.mediaUrl || exercise.gifUrl)}
             alt={exercise.name}
             className="w-full h-full object-cover transition-transform group-hover:scale-105"
           />
         )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 shadow-lg transform transition-all group-hover:scale-110">
                          <svg className="w-8 h-8 text-gray-700 dark:text-gray-300 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Source Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Trainer
                        </span>
                      </div>
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 left-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-black/50 text-white">
                          GIF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group cursor-pointer" onClick={() => viewExercise(exercise)}>
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No GIF Available</p>
                        <div className="mt-2 bg-white/90 dark:bg-gray-800/90 rounded-full p-3 shadow-lg">
                          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                        {exercise.name}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => viewExercise(exercise)}
                          className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                          title="View Exercise"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(exercise)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                          title="Edit Exercise"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(exercise.id)}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title="Delete Exercise"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {exercise.bodyPart} • {exercise.target}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exercise.equipment && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                          {exercise.equipment}
                        </span>
                      )}
                    </div>
                    
                    {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
                      <details className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <summary className="cursor-pointer text-xs">Instructions</summary>
                        <ul className="text-xs list-disc ml-4 mt-1 space-y-1">
                          {exercise.instructions.slice(0, 3).map((instruction, i) => (
                            <li key={i}>{instruction}</li>
                          ))}
                          {exercise.instructions.length > 3 && (
                            <li className="text-gray-500">...and {exercise.instructions.length - 3} more</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingExercise ? 'Edit Exercise' : 'Add Exercise GIF'}
                  </h2>
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    ✕
                  </button>
                </div>

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
                        Equipment *
                      </label>
                      <select
                        name="equipment"
                        value={formData.equipment}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        required
                      >
                        <option value="">Select equipment</option>
                        {equipmentOptions.map(equipment => (
                          <option key={equipment} value={equipment}>{equipment}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Instructions *
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInstructionsChange}
                      placeholder="Enter each instruction on a new line..."
                      rows={4}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Exercise GIF (Optional)
                    </label>
                    
                    {/* Toggle between URL and File Upload */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setUseUrl(false)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !useUrl 
                            ? (isDark ? 'bg-green-600 text-white' : 'bg-green-600 text-white')
                            : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')
                        }`}
                      >
                        📁 Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseUrl(true)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          useUrl 
                            ? (isDark ? 'bg-green-600 text-white' : 'bg-green-600 text-white')
                            : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')
                        }`}
                      >
                        🔗 Use URL
                      </button>
                    </div>

                    {!useUrl ? (
                      <>
                        <input
                          type="file"
                          accept=".gif,.webp,.mp4,.mov"
                          onChange={handleFileChange}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Supported formats: GIF, WebP, MP4, MOV (max 10MB)
                        </p>
                      </>
                    ) : (
                      <>
                        <input
                          type="url"
                          name="gifUrl"
                          value={formData.gifUrl}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, gifUrl: e.target.value }));
                            setPreviewUrl(e.target.value);
                          }}
                          placeholder="https://example.com/exercise.gif"
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Enter a direct URL to a GIF, WebP, MP4, or MOV file
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
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full h-48 object-contain mx-auto"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-2 rounded-lg font-medium ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} shadow-lg`}
                    >
                      {editingExercise ? 'Update Exercise' : 'Add Exercise'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Professional Exercise Viewer Modal */}
        {showExerciseModal && selectedExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {selectedExercise.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedExercise.bodyPart}
                      </span>
                      <span className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedExercise.target}
                      </span>
                      <span className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedExercise.equipment}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExerciseModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* GIF/Video Section */}
                  <div className="space-y-4">
                    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                     {selectedExercise.gifUrl || selectedExercise.mediaUrl ? (
                        <div className="relative">
                         {selectedExercise.mediaType === 'video' ? (
                           <video
                             src={(selectedExercise.mediaUrl || selectedExercise.gifUrl).startsWith('/') ? `http://localhost:5000${selectedExercise.mediaUrl || selectedExercise.gifUrl}` : (selectedExercise.mediaUrl || selectedExercise.gifUrl)}
                             className="w-full h-64 object-cover"
                             controls
                           />
                         ) : (
                           <img
                             src={(selectedExercise.mediaUrl || selectedExercise.gifUrl).startsWith('/') ? `http://localhost:5000${selectedExercise.mediaUrl || selectedExercise.gifUrl}` : (selectedExercise.mediaUrl || selectedExercise.gifUrl)}
                             alt={selectedExercise.name}
                             className="w-full h-64 object-cover"
                           />
                         )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4">
                            <span className="text-xs px-2 py-1 rounded-full bg-black/50 text-white">
                             {selectedExercise.mediaType ? `Exercise ${selectedExercise.mediaType.toUpperCase()}` : 'Exercise GIF'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <p className="text-gray-500">No GIF Available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowExerciseModal(false);
                          handleEdit(selectedExercise);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} transition-colors flex items-center justify-center gap-2`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Exercise
                      </button>
                      <button
                        onClick={() => {
                          setShowExerciseModal(false);
                          handleDelete(selectedExercise.id);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors flex items-center justify-center gap-2`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Exercise
                      </button>
                    </div>
                  </div>

                  {/* Instructions Section */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Exercise Instructions
                    </h3>
                    
                    {Array.isArray(selectedExercise.instructions) && selectedExercise.instructions.length > 0 ? (
                      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <ol className="space-y-3">
                          {selectedExercise.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                {index + 1}
                              </span>
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {instruction}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No instructions available for this exercise.
                        </p>
                      </div>
                    )}

                    {/* Exercise Details */}
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Exercise Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Body Part:</span>
                          <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedExercise.bodyPart}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Target Muscle:</span>
                          <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedExercise.target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Equipment:</span>
                          <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedExercise.equipment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            {selectedExercise.source === 'pinterest' ? 'Pinterest' : 'Trainer'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
