import React from 'react';
import { motion } from 'framer-motion';

const BlogCategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Categories</h3>
        <div className="h-px bg-slate-200 dark:bg-gray-700 flex-1"></div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategoryChange('')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            selectedCategory === ''
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700'
          }`}
        >
          All Posts
        </motion.button>
        
        {categories.map((category) => (
          <motion.button
            key={category._id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryChange(category.name)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedCategory === category.name
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700'
            }`}
          >
            {category.name}
            {category.post_count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 dark:bg-gray-700/50 rounded-full">
                {category.post_count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default BlogCategoryFilter;
