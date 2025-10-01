import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import customExerciseService from '../../utils/customExerciseService';
import TrainerExerciseUpload from '../../components/TrainerExerciseUpload';

export default function ExerciseExplorerPage() {
  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';
  const apiBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [bodyParts, setBodyParts] = useState(['all', 'chest', 'back', 'upper legs', 'lower legs', 'upper arms', 'lower arms', 'waist', 'neck', 'shoulders']);
  const [bodyPart, setBodyPart] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  useEffect(() => {
    // Check if body part is specified in URL
    const urlBodyPart = searchParams.get('bodyPart');
    if (urlBodyPart && bodyParts.includes(urlBodyPart)) {
      setBodyPart(urlBodyPart);
    }
    
    // Check if equipment is specified in URL
    const urlEquipment = searchParams.get('equipment');
    if (urlEquipment) {
      setEquipment(urlEquipment);
    }
    // Trigger initial fetch once filters are parsed
    onSearch();
  }, [searchParams]);

  // Auto-refresh list when bodyPart or equipment changes via dropdowns
  useEffect(() => {
    onSearch();
    // Also sync URL with current filters
    const params = new URLSearchParams();
    if (bodyPart && bodyPart !== 'all') params.set('bodyPart', bodyPart);
    if (equipment && equipment !== 'all') params.set('equipment', equipment);
    navigate({ pathname: '/services/exercise-explorer', search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyPart, equipment]);

  const onSearch = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    try {
      let data;
      
      // Use only custom exercises (Pinterest + trainer uploads)
      if (q.trim()) {
        data = await customExerciseService.searchCustomExercises(q.trim());
      } else if (bodyPart && bodyPart !== 'all') {
        data = await customExerciseService.getCustomExercisesByBodyPart(bodyPart);
      } else {
        data = await customExerciseService.getCustomExercises();
      }
      
      // Filter by equipment if specified
      if (equipment && equipment !== 'all') {
        data = data.filter(exercise => 
          exercise.equipment && exercise.equipment.toLowerCase() === equipment.toLowerCase()
        );
      }
      
      setItems(data || []);
    } catch (e) {
      setError(e?.message || 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };


  const cards = useMemo(() => items, [items]);

  const handleExerciseAdded = (newExercise) => {
    // Refresh the exercise list
    onSearch();
  };

  const viewExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const deleteExercise = async (exerciseId) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      await customExerciseService.deleteTrainerExercise(exerciseId);
      // Refresh the exercise list
      onSearch();
    } catch (error) {
      setError(error.message || 'Error deleting exercise');
      console.error('Error deleting exercise:', error);
    }
  };

  const getBodyPartDisplayName = (bodyPartId) => {
    const bodyPartNames = {
      'chest': 'Chest',
      'back': 'Back',
      'upper legs': 'Upper Legs',
      'lower legs': 'Lower Legs',
      'upper arms': 'Upper Arms',
      'lower arms': 'Lower Arms',
      'waist': 'Waist',
      'neck': 'Neck',
      'shoulders': 'Shoulders'
    };
    return bodyPartNames[bodyPartId] || 'All Body Parts';
  };


  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen' : 'bg-gray-50 min-h-screen'}>
      <header className={(isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200') + ' sticky top-0 z-20 border-b'}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/services/body-part-selection')}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
              title="Back to Body Part Selection"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className={(isDark ? 'text-white' : 'text-gray-900') + ' text-2xl md:text-3xl font-bold'}>
                {bodyPart === 'all' ? 'Exercise Explorer' : `${getBodyPartDisplayName(bodyPart)} Exercises`}
              </h1>
              <p className={(isDark ? 'text-gray-300' : 'text-gray-600') + ' mt-1'}>
                {bodyPart === 'all' 
                  ? 'Search by name or filter by body part. Custom exercise GIFs from trainers.' 
                  : `Professional exercise GIFs for ${getBodyPartDisplayName(bodyPart).toLowerCase()} training.`
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Button - Only show for trainers */}
        <div className="mb-6 flex justify-center">
          {localStorage.getItem('userRole') === 'trainer' && (
            <motion.button
              onClick={() => setShowUploadModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg text-sm font-medium ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} flex items-center gap-2 shadow-lg`}
            >
              <span className="text-lg">+</span>
              Add Exercise GIF
            </motion.button>
          )}
        </div>

        <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by exercise name (e.g., push up)"
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
          />
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {bodyParts.map((bp) => (
              <option key={bp} value={bp}>{bp}</option>
            ))}
          </select>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">All Equipment</option>
            <option value="body weight">Body Weight</option>
            <option value="dumbbell">Dumbbells</option>
            <option value="barbell">Barbell</option>
            <option value="cable">Cable Machine</option>
            <option value="machine">Machines</option>
            <option value="kettlebell">Kettlebells</option>
            <option value="resistance band">Resistance Bands</option>
          </select>
          <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-5 py-3 rounded-xl font-semibold shadow-md ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {loading ? 'Searching…' : 'Search'}
          </motion.button>
        </form>

        {error && (
          <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((c, idx) => (
            <motion.div key={c.id || idx} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: idx * 0.03 }} className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg transition-shadow`}>
              {(c.mediaUrl || c.gifUrl) ? (
                <div className="h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden relative group cursor-pointer" onClick={() => viewExercise(c)}>
                  {c.mediaType === 'video' ? (
                    <video
                      src={c.mediaUrl?.startsWith('/') ? `${apiBase}${c.mediaUrl}` : (c.mediaUrl || c.gifUrl)}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={(c.mediaUrl || c.gifUrl).startsWith('/') ? `${apiBase}${c.mediaUrl || c.gifUrl}` : (c.mediaUrl || c.gifUrl)}
                      alt={c.name}
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      c.source === 'pinterest' 
                        ? (isDark ? 'bg-pink-800 text-pink-200' : 'bg-pink-100 text-pink-700')
                        : (isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700')
                    }`}>
                      {c.source === 'pinterest' ? 'Pinterest' : 'Trainer'}
                    </span>
                  </div>
                  
                  {/* Media Type Badge */}
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-black/50 text-white">
                      {(c.mediaType ? c.mediaType.toUpperCase() : ((c.mediaUrl || c.gifUrl)?.toLowerCase().endsWith('.mp4') || (c.mediaUrl || c.gifUrl)?.toLowerCase().endsWith('.mov')) ? 'VIDEO' : 'IMAGE')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group cursor-pointer" onClick={() => viewExercise(c)}>
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
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => viewExercise(c)}
                      className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                      title="View Exercise"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {c.source === 'trainer' && localStorage.getItem('userRole') === 'trainer' && (
                      <button
                        onClick={() => deleteExercise(c.id)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Delete Exercise"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {c.bodyPart} • {c.target}
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.equipment && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                      {c.equipment}
                    </span>
                  )}
                </div>
                
                {Array.isArray(c.instructions) && c.instructions.length > 0 && (
                  <details className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <summary className="cursor-pointer text-xs">Instructions</summary>
                    <ul className="text-xs list-disc ml-4 mt-1 space-y-1">
                      {c.instructions.slice(0, 3).map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                      {c.instructions.length > 3 && (
                        <li className="text-gray-500">...and {c.instructions.length - 3} more</li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <TrainerExerciseUpload
          onExerciseAdded={handleExerciseAdded}
          onClose={() => setShowUploadModal(false)}
        />
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
              {/* GIF/Video/Image Section */}
                <div className="space-y-4">
                  <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    {(selectedExercise.mediaUrl || selectedExercise.gifUrl) ? (
                      <div className="relative">
                        {selectedExercise.mediaType === 'video' ? (
                          <video
                            src={(selectedExercise.mediaUrl || selectedExercise.gifUrl).startsWith('/') ? `${apiBase}${selectedExercise.mediaUrl || selectedExercise.gifUrl}` : (selectedExercise.mediaUrl || selectedExercise.gifUrl)}
                            className="w-full h-64 object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={(selectedExercise.mediaUrl || selectedExercise.gifUrl).startsWith('/') ? `${apiBase}${selectedExercise.mediaUrl || selectedExercise.gifUrl}` : (selectedExercise.mediaUrl || selectedExercise.gifUrl)}
                            alt={selectedExercise.name}
                            className="w-full h-64 object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-black/50 text-white">
                            {selectedExercise.mediaType ? `Exercise ${selectedExercise.mediaType.toUpperCase()}` : 'Exercise Media'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-gray-500">No Media Available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons for Trainers */}
                  {selectedExercise.source === 'trainer' && localStorage.getItem('userRole') === 'trainer' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowExerciseModal(false);
                          deleteExercise(selectedExercise.id);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors flex items-center justify-center gap-2`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Exercise
                      </button>
                    </div>
                  )}
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          selectedExercise.source === 'pinterest' 
                            ? (isDark ? 'bg-pink-900 text-pink-300' : 'bg-pink-100 text-pink-700')
                            : (isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                        }`}>
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
  );
}
