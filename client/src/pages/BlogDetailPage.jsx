import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Eye } from 'lucide-react';
import api from '../utils/api';
import SessionManager from '../utils/sessionManager';

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchBlogPost();
  }, [id]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/blog/posts/${id}`);
      if (response.data.ok) {
        const postData = response.data.data;
        setPost(postData);
        setLikeCount(postData.likes || 0);
        setViews(postData.views || 0);
        setLiked(postData.liked_by_user || false);
        if (postData.comments) {
          setComments(postData.comments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await api.post(`/blog/posts/${id}/like`);
      if (response.data) {
        setLiked(response.data.liked);
        setLikeCount(response.data.like_count || likeCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post. Please try again.');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/blog/posts/${id}/comments`);
      if (response.data.ok) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setCommentLoading(true);
      const user = SessionManager.getCurrentUser() || {};
      const response = await api.post(`/blog/posts/${id}/comments`, {
        text: commentText,
        author: user.name || user.email || 'Anonymous',
        author_avatar: user.avatar || ''
      });
      
      if (response.data.ok) {
        setCommentText('');
        setComments(prev => [response.data.comment, ...prev]);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog Post Not Found</h2>
          <button
            onClick={() => navigate('/community')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const user = SessionManager.getCurrentUser() || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/community')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Back to Blog
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="w-full h-96 overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Author and Meta */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {post.author?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {post.author?.name || 'Anonymous'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(post.created_at)} · {getReadTime(post.content)} min read
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {post.title}
          </h1>

          {/* Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />

          {/* Actions */}
          <div className="flex items-center gap-6 py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-12">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                liked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likeCount}</span>
              <span className="text-sm opacity-75">{liked ? 'Liked' : 'Like'}</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={toggleComments}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{comments.length || post.comments_count || 0}</span>
              <span className="text-sm opacity-75">Comments</span>
            </motion.button>

            <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <Eye className="w-5 h-5" />
              <span className="font-medium">{views}</span>
              <span className="text-sm opacity-75">Views</span>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Comments ({comments.length})
              </h3>

              {/* Comment Form */}
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {commentLoading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {comment.author?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {comment.author || 'Anonymous'}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          {comment.text}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {new Date(comment.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Related Posts */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Posts
            </h2>
            <div className="text-gray-600 dark:text-gray-400">
              Coming soon...
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogDetailPage;

