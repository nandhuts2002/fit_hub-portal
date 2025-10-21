import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Crown, Zap, Lock } from 'lucide-react';
import { badgesApi } from '../../utils/communityExtendedApi';

const BadgesSection = ({ userEmail }) => {
  const [allBadges, setAllBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
    if (userEmail) {
      fetchUserBadges();
    }
  }, [userEmail]);

  const fetchBadges = async () => {
    try {
      const data = await badgesApi.getAll();
      if (data.ok) {
        setAllBadges(data.data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const data = await badgesApi.getUserBadges(userEmail);
      if (data.ok) {
        setUserBadges(data.data);
      }
    } catch (error) {
      console.error('Error fetching user badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'common': return <Award className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      case 'epic': return <Crown className="w-4 h-4" />;
      case 'legendary': return <Zap className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const isEarned = (badgeId) => {
    return userBadges.some(badge => badge.id === badgeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">Achievement Badges</h2>
        <div className="ml-auto text-sm text-gray-600">
          {userBadges.length} / {allBadges.length} earned
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
          style={{ 
            width: `${allBadges.length > 0 ? (userBadges.length / allBadges.length) * 100 : 0}%` 
          }}
        ></div>
      </div>

      {/* Earned Badges Section */}
      {userBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {userBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className={`p-4 rounded-xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 text-center transition-all duration-200 hover:shadow-lg`}>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-xs font-medium text-gray-800 truncate">
                    {badge.name}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mt-2 ${getRarityColor(badge.rarity)}`}>
                    {getRarityIcon(badge.rarity)}
                    {badge.rarity}
                  </div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                  {badge.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Badges Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All Available Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge) => {
            const earned = isEarned(badge.id);
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  earned 
                    ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge Icon */}
                  <div className={`relative ${earned ? '' : 'opacity-50'}`}>
                    <div className="text-3xl">{badge.icon}</div>
                    {!earned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold truncate ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
                        {badge.name}
                      </h4>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRarityColor(badge.rarity)}`}>
                        {getRarityIcon(badge.rarity)}
                        {badge.rarity}
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
                      {badge.description}
                    </p>

                    {/* Criteria */}
                    <div className={`text-xs ${earned ? 'text-gray-500' : 'text-gray-400'}`}>
                      {badge.criteria.type === 'challenges_completed' && 
                        `Complete ${badge.criteria.value} challenges`}
                      {badge.criteria.type === 'posts_created' && 
                        `Create ${badge.criteria.value} posts`}
                      {badge.criteria.type === 'consecutive_days' && 
                        `${badge.criteria.value} days of activity`}
                    </div>

                    {/* Earned Status */}
                    {earned && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          <Award className="w-3 h-3" />
                          Earned
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badge Categories Legend */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Badge Rarities</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { rarity: 'common', label: 'Common', description: 'Easy to earn' },
            { rarity: 'rare', label: 'Rare', description: 'Requires effort' },
            { rarity: 'epic', label: 'Epic', description: 'Challenging goals' },
            { rarity: 'legendary', label: 'Legendary', description: 'Ultimate achievements' }
          ].map(({ rarity, label, description }) => (
            <div key={rarity} className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${getRarityColor(rarity)}`}>
                {getRarityIcon(rarity)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{label}</div>
                <div className="text-xs text-gray-600">{description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgesSection;
