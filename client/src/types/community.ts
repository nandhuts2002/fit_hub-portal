// TypeScript interfaces for extended community features

export interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate: number;
  goalType: 'workouts' | 'distance' | 'calories' | 'posts';
  goalValue: number;
  participants: string[];
  leaderboard: LeaderboardEntry[];
  createdBy: string;
  created_at: number;
  isActive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userEmail: string;
  userName: string;
  userAvatar: string;
  currentValue: number;
  targetValue: number;
  progress: number;
}

export interface UserProgress {
  userEmail: string;
  challengeId: string;
  goalType: string;
  currentValue: number;
  targetValue: number;
  activities: Activity[];
  joined_at: number;
}

export interface Activity {
  id: string;
  type: 'manual' | 'post' | 'workout';
  value: number;
  timestamp: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: {
    type: 'challenges_completed' | 'posts_created' | 'consecutive_days';
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  created_at: number;
}

export interface QASession {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  scheduledAt: number;
  isLive: boolean;
  questions: Question[];
  created_at: number;
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  questionText: string;
  answer: string;
  isAnswered: boolean;
  likes: string[];
  created_at: number;
  answeredAt?: number;
}

export interface Spotlight {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  beforeImage: string;
  afterImage: string;
  caption: string;
  likes: string[];
  comments: Comment[];
  isApproved: boolean;
  isFeatured: boolean;
  created_at: number;
  approvedAt?: number;
  featuredAt?: number;
}

export interface ExtendedPost {
  id: string;
  text: string;
  imageUrl: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  likes: string[];
  comments: Comment[];
  created_at: number;
  // Extended features
  poll?: Poll;
  reactions?: Reaction[];
  tags?: string[];
}

export interface Poll {
  question: string;
  options: string[];
  votes: Vote[];
}

export interface Vote {
  userEmail: string;
  optionIndex: number;
  timestamp: number;
}

export interface Reaction {
  userEmail: string;
  emoji: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  text: string;
  created_at: number;
}

export interface ActivitySummary {
  activeChallenges: number;
  completedChallenges: number;
  totalPosts: number;
  badgesEarned: number;
  spotlights: number;
}
