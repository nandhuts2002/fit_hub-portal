import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import SessionManager from '../../utils/sessionManager';

const BlogComposer = ({ onClose, onPostCreated, categories = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    featured_image: '',
    status: 'draft'
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const user = SessionManager.getCurrentUser() || {};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formDataObj = new FormData();
      formDataObj.append('image', file);
      
      // Use the correct endpoint for image upload
      const response = await api.post('/upload/image', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.ok) {
        setFormData(prev => ({
          ...prev,
          featured_image: response.data.url
        }));
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const postData = {
        ...formData,
        author_name: user?.name || user?.email || 'Anonymous',
        author_avatar: user?.avatar || ''
      };

      // Use the correct endpoint for blog posts
      await api.post('/blog/posts', postData);
      
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating blog post:', error);
      setError(error.response?.data?.error || 'Failed to create blog post');
    } finally {
      setSaving(false);
    }
  };

  const getReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-full p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Write Blog Post</h2>
            <p className="text-slate-600 dark:text-gray-300">Share your fitness knowledge with the community</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a compelling title for your blog post..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400"
                  required
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Featured Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                      Uploading image...
                    </div>
                  )}
                  {formData.featured_image && (
                    <div className="relative">
                      <img 
                        src={formData.featured_image} 
                        alt="Featured image preview" 
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200 dark:border-gray-700"
                        onError={(e) => {
                          // Handle broken image links
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRTFFMUUxIi8+CjxwYXRoIGQ9Ik0zNS41IDM4LjVIMjQuNUwzMCAyOS41TDM1LjUgMzguNVoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTI0LjUgMjQuNUgyNy41VjI3LjVIMjQuNVYyNC41WiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMzIuNSAyNC41SDM1LjVWMjcuNUgzMi41VjI0LjVaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                        className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                    Content *
                  </label>
                  <div className="text-xs text-slate-500 dark:text-gray-400">
                    {getReadTime(formData.content)} min read
                  </div>
                </div>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your blog post content here... Use markdown for formatting."
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 resize-y"
                  required
                />
                <div className="mt-2 text-xs text-slate-500 dark:text-gray-400">
                  Tip: Use #hashtags to make your post discoverable
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Publish Now</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex-shrink-0">
            <div className="text-sm text-slate-600 dark:text-gray-400">
              {formData.status === 'published' ? 'This post will be published immediately' : 'Save as draft to publish later'}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  saving || !formData.title.trim() || !formData.content.trim()
                    ? 'bg-slate-300 dark:bg-gray-600 text-slate-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {formData.status === 'published' ? 'Publishing...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {formData.status === 'published' ? 'Publish Post' : 'Save Draft'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogComposer;