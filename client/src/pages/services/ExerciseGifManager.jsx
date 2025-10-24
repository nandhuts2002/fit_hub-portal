import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaExternalLinkAlt } from 'react-icons/fa';

const ExerciseGifManager = () => {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGif, setEditingGif] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gif_url: '',
    category: 'general',
    tags: [],
    description: ''
  });

  useEffect(() => {
    fetchGifs();
    fetchCategories();
  }, []);

  const fetchGifs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const response = await fetch(`/exercise-gifs/api/exercise-gifs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGifs(data);
      } else {
        setError('Failed to fetch exercise GIFs');
      }
    } catch (err) {
      setError('Error fetching exercise GIFs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/exercise-gifs/api/exercise-gifs/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGifs();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingGif 
        ? `/exercise-gifs/api/exercise-gifs/${editingGif._id}`
        : '/exercise-gifs/api/exercise-gifs';
      
      const method = editingGif ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.filter(tag => tag.trim())
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setEditingGif(null);
        setFormData({ name: '', gif_url: '', category: 'general', tags: [], description: '' });
        fetchGifs();
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save exercise GIF');
      }
    } catch (err) {
      setError('Error saving exercise GIF');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gifId) => {
    if (!window.confirm('Are you sure you want to delete this exercise GIF?')) return;

    try {
      const response = await fetch(`/exercise-gifs/api/exercise-gifs/${gifId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchGifs();
      } else {
        setError('Failed to delete exercise GIF');
      }
    } catch (err) {
      setError('Error deleting exercise GIF');
    }
  };

  const handleEdit = (gif) => {
    setEditingGif(gif);
    setFormData({
      name: gif.name,
      gif_url: gif.gif_url,
      category: gif.category,
      tags: gif.tags || [],
      description: gif.description || ''
    });
    setShowAddForm(true);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, e.target.value.trim()]
      }));
      e.target.value = '';
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <FaPlus className="text-2xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exercise GIF Manager</h1>
          <p className="text-gray-600 text-lg">Add and manage exercise GIFs with URLs</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercise GIFs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaPlus className="inline mr-2" />
              Add GIF
            </motion.button>
          </div>
        </motion.div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {editingGif ? 'Edit Exercise GIF' : 'Add New Exercise GIF'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Push-ups"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="yoga">Yoga</option>
                    <option value="stretching">Stretching</option>
                    <option value="mobility">Mobility</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GIF URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.gif_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, gif_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/exercise.gif"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of the exercise..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  onKeyPress={addTag}
                  placeholder="Press Enter to add tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingGif ? 'Update' : 'Add')}
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingGif(null);
                    setFormData({ name: '', gif_url: '', category: 'general', tags: [], description: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* GIF Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">Loading exercise GIFs...</p>
            </div>
          ) : gifs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No exercise GIFs found. Add your first GIF!</p>
            </div>
          ) : (
            gifs.map((gif) => (
              <motion.div
                key={gif._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <img
                    src={gif.gif_url}
                    alt={gif.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center text-gray-500">
                    <div className="text-center">
                      <FaExternalLinkAlt className="mx-auto mb-2 text-2xl" />
                      <p>GIF not available</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{gif.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{gif.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      {gif.category}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(gif)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(gif._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {gif.tags && gif.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {gif.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ExerciseGifManager;









