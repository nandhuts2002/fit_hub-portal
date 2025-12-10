import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
  Trophy,
  Zap
} from 'lucide-react';
import { gamificationApi } from '../../utils/communityExtendedApi';

const StatBadge = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
    <div className={`p-3 rounded-xl ${accent}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const ProgressBar = ({ percent }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
    <div
      className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all"
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

const GamificationPanel = ({ activitySummary }) => {
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [questUpdating, setQuestUpdating] = useState({});
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setLoadingSummary(true);
    setError('');
    try {
      const response = await gamificationApi.getSummary();
      if (response.ok) {
        setSummary(response.data);
      } else {
        setError(response.error || 'Unable to load stats');
      }
    } catch (err) {
      setError(err.message || 'Unable to load stats');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await gamificationApi.getLeaderboard();
      if (response.ok) {
        setLeaderboard(response.data);
      }
    } catch (err) {
      console.error('Leaderboard error', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadLeaderboard();
  }, []);

  const handleQuestProgress = async (questId) => {
    setQuestUpdating((prev) => ({ ...prev, [questId]: true }));
    try {
      const response = await gamificationApi.updateQuestProgress(questId, { value: 1 });
      if (response.ok) {
        setSummary(response.data);
      } else {
        setError(response.error || 'Unable to update quest');
      }
    } catch (err) {
      setError(err.message || 'Unable to update quest');
    } finally {
      setQuestUpdating((prev) => ({ ...prev, [questId]: false }));
    }
  };

  const mergedStats = summary || {
    streakDays: activitySummary?.streakDays || 0,
    postsCount: activitySummary?.totalPosts || 0,
    challengeWins: activitySummary?.completedChallenges || 0,
    badgesEarned: activitySummary?.badgesEarned || 0,
    xp: 0,
    level: 1,
    progressToNextLevel: 0,
    quests: []
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">Level</p>
              <p className="text-4xl font-bold mt-1">{mergedStats.level}</p>
            </div>
            <Sparkles className="w-10 h-10 text-white/80" />
          </div>
          <p className="mt-4 text-sm text-white/80">
            {mergedStats.xp} XP · Rank #{mergedStats.leaderboardRank || '--'}
          </p>
          <ProgressBar percent={mergedStats.progressToNextLevel || 0} />
          <p className="text-xs text-white/80 mt-2">
            {mergedStats.nextLevelXp
              ? `${Math.max(0, mergedStats.nextLevelXp - mergedStats.xp)} XP to next level`
              : 'Keep showing up!'}
          </p>
        </div>

        <StatBadge
          icon={Flame}
          label="Daily streak"
          value={`${mergedStats.streakDays} days`}
          accent="bg-orange-500"
        />
        <StatBadge
          icon={Zap}
          label="Posts shared"
          value={mergedStats.postsCount}
          accent="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">Quest tracker</p>
                <p className="text-sm text-gray-500">
                  Complete micro-missions to unlock bonus XP.
                </p>
              </div>
              <Target className="w-6 h-6 text-gray-400" />
            </div>

            {loadingSummary ? (
              <p className="text-sm text-gray-500">Loading quests...</p>
            ) : mergedStats.quests?.length ? (
              <div className="space-y-4">
                {mergedStats.quests.map((quest) => {
                  const completed = quest.status === 'completed';
                  return (
                    <div
                      key={quest.id}
                      className="p-4 border border-gray-100 rounded-2xl hover:border-blue-200 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            {completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Trophy className="w-5 h-5 text-amber-500" />
                            )}
                            {quest.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{quest.description}</p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                          +{quest.rewardXp} XP
                        </span>
                      </div>
                      <ProgressBar percent={quest.progressPercent || 0} />
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <p>
                          {quest.currentValue}/{quest.goalValue} actions logged
                        </p>
                        {!completed && (
                          <button
                            onClick={() => handleQuestProgress(quest.id)}
                            disabled={questUpdating[quest.id]}
                            className="text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50"
                          >
                            {questUpdating[quest.id] ? 'Logging...' : 'Log progress'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">New quests dropping soon.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">Weekly highlights</p>
                <p className="text-sm text-gray-500">Quick glance at your wins.</p>
              </div>
              <Award className="w-6 h-6 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBadge
                icon={Zap}
                label="Challenge wins"
                value={mergedStats.challengeWins}
                accent="bg-teal-500"
              />
              <StatBadge
                icon={Trophy}
                label="Badges earned"
                value={mergedStats.badgesEarned}
                accent="bg-purple-500"
              />
              <StatBadge
                icon={Sparkles}
                label="Recent boosts"
                value={mergedStats.recentRewards?.length || 0}
                accent="bg-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-semibold text-gray-900">Leaderboard</p>
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            {loadingLeaderboard ? (
              <p className="text-sm text-gray-500">Loading leaderboard...</p>
            ) : leaderboard.length ? (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userEmail}
                    className="flex items-center justify-between border border-gray-100 rounded-2xl px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center justify-center">
                        #{entry.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{entry.displayName}</p>
                        <p className="text-xs text-gray-500">{entry.xp} XP</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                      Lv {entry.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No leaderboard data yet.</p>
            )}
          </div>

          {summary?.recentRewards?.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-semibold text-gray-900">Recent boosts</p>
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              <ul className="space-y-3">
                {summary.recentRewards.map((reward, index) => (
                  <li
                    key={`${reward.type}-${index}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 capitalize">{reward.type}</span>
                    <span className="font-semibold text-green-600">+{reward.xp} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default GamificationPanel;

