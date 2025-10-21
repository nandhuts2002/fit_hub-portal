import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, MoreHorizontal, Users, BarChart3 } from 'lucide-react';

const EnhancedPostCard = ({ post, onLike, onComment, onReact, onVote }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState(null);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '💪', '🔥', '👏'];

  const handleReaction = (emoji) => {
    onReact(post.id, emoji);
    setShowReactions(false);
  };

  const handlePollVote = (optionIndex) => {
    setSelectedPollOption(optionIndex);
    onVote(post.id, optionIndex);
  };

  const getReactionCounts = () => {
    const counts = {};
    post.reactions?.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

  const getPollResults = () => {
    if (!post.poll) return null;
    
    const totalVotes = post.poll.votes?.length || 0;
    const optionCounts = new Array(post.poll.options.length).fill(0);
    
    post.poll.votes?.forEach(vote => {
      if (vote.optionIndex < optionCounts.length) {
        optionCounts[vote.optionIndex]++;
      }
    });

    return optionCounts.map(count => ({
      count,
      percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0
    }));
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const reactionCounts = getReactionCounts();
  const pollResults = getPollResults();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              <img
                src={post.user.avatar || '/api/placeholder/40/40'}
                alt={post.user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-medium text-gray-800">{post.user.name}</div>
              <div className="text-sm text-gray-500">{formatDate(post.created_at)}</div>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {post.text && (
          <p className="text-gray-800 mb-4 leading-relaxed">{post.text}</p>
        )}

        {/* Post Image */}
        {post.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {/* Poll Section */}
        {post.poll && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {post.poll.question}
            </h4>
            
            <div className="space-y-2">
              {post.poll.options.map((option, index) => {
                const result = pollResults?.[index];
                const isSelected = selectedPollOption === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handlePollVote(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{option}</span>
                      {result && (
                        <span className="text-sm text-gray-600">
                          {result.count} votes ({Math.round(result.percentage)}%)
                        </span>
                      )}
                    </div>
                    
                    {result && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-3 text-sm text-gray-500">
              {post.poll.votes?.length || 0} total votes
            </div>
          </div>
        )}

        {/* Tagged Users */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Tagged:</span>
            {post.tags.slice(0, 3).map((email, index) => (
              <span key={email} className="text-blue-600 hover:underline cursor-pointer">
                @{email.split('@')[0]}{index < Math.min(2, post.tags.length - 1) ? ',' : ''}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-gray-500">+{post.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Reactions Display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <button
              onClick={() => onLike(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">{post.likes?.length || 0}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => onComment(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comments?.length || 0}</span>
            </button>

            {/* Reaction Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors"
              >
                <span className="text-lg">😊</span>
                <span className="text-sm">React</span>
              </button>

              {/* Reactions Popup */}
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1"
                >
                  {reactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Share Button */}
          <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
            <Share className="w-5 h-5" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section (Preview) */}
      {post.comments && post.comments.length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {post.comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={comment.user.avatar || '/api/placeholder/24/24'}
                    alt={comment.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
            
            {post.comments.length > 2 && (
              <button
                onClick={() => onComment(post.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                View all {post.comments.length} comments
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedPostCard;
