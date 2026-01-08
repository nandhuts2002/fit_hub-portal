// API utilities for extended community features
import SessionManager from './sessionManager';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const currentUser = SessionManager.getCurrentUser();
  const token = currentUser?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Non‑JSON response; leave data as null
  }

  if (!response.ok) {
    const backendMessage = data && (data.error || data.message);
    const error = new Error(backendMessage || `HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  // For successful responses, always return parsed JSON (may include { ok, data, ... })
  return data;
};

// Challenges API
export const challengesApi = {
  getAll: () => apiCall('/community/challenges'),
  create: (data) => apiCall('/community/challenges', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/community/challenges/${id}`, { method: 'DELETE' }),
  join: (id) => apiCall(`/community/challenges/${id}/join`, { method: 'POST' }),
  leave: (id) => apiCall(`/community/challenges/${id}/leave`, { method: 'POST' }),
  getLeaderboard: (id) => apiCall(`/community/challenges/${id}/leaderboard`),
  updateProgress: (id, data) => apiCall(`/community/challenges/${id}/progress`, { method: 'POST', body: JSON.stringify(data) }),
  resetProgress: (id) => apiCall(`/community/challenges/${id}/progress/reset`, { method: 'POST' }),
  getMyProgress: (id) => apiCall(`/community/challenges/${id}/progress/me`)
};

// Badges API
export const badgesApi = {
  getAll: () => apiCall('/community/badges'),
  getUserBadges: (email) => apiCall(`/community/users/${email}/badges`),
  create: (data) => apiCall('/community/badges', { method: 'POST', body: JSON.stringify(data) })
};

// Q&A Sessions API
export const qaApi = {
  getAll: () => apiCall('/community/qa-sessions'),
  create: (data) => apiCall('/community/qa-sessions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/community/qa-sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/community/qa-sessions/${id}`, { method: 'DELETE' }),
  toggleLive: (id, data) => apiCall(`/community/qa-sessions/${id}/toggle-live`, { method: 'POST', body: JSON.stringify(data) }),
  submitQuestion: (id, data) => apiCall(`/community/qa-sessions/${id}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  answerQuestion: (sessionId, questionId, data) => apiCall(`/community/qa-sessions/${sessionId}/questions/${questionId}/answer`, { method: 'POST', body: JSON.stringify(data) })
};

// Spotlights API
export const spotlightsApi = {
  getAll: () => apiCall('/community/spotlights'),
  create: (data) => apiCall('/community/spotlights', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/community/spotlights/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/community/spotlights/${id}`, { method: 'DELETE' }),
  approve: (id) => apiCall(`/community/spotlights/${id}/approve`, { method: 'POST' }),
  feature: (id) => apiCall(`/community/spotlights/${id}/feature`, { method: 'POST' }),
  like: (id) => apiCall(`/community/spotlights/${id}/like`, { method: 'POST' })
};

// Interactive Posts API
export const interactivePostsApi = {
  vote: (id, data) => apiCall(`/community/posts/${id}/poll/vote`, { method: 'POST', body: JSON.stringify(data) }),
  react: (id, data) => apiCall(`/community/posts/${id}/react`, { method: 'POST', body: JSON.stringify(data) }),
  tag: (id, data) => apiCall(`/community/posts/${id}/tag`, { method: 'POST', body: JSON.stringify(data) })
};

// Messenger API
export const messengerApi = {
  getThreads: () => apiCall('/community/messenger/threads'),
  createThread: (data) => apiCall('/community/messenger/threads', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMessages: (threadId, limit = 50) => apiCall(`/community/messenger/threads/${threadId}/messages?limit=${limit}`),
  sendMessage: (threadId, data) => apiCall(`/community/messenger/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Gamification API
export const gamificationApi = {
  getSummary: () => apiCall('/community/gamification/summary'),
  getLeaderboard: () => apiCall('/community/gamification/leaderboard'),
  updateQuestProgress: (questId, data) => apiCall(`/community/gamification/quests/${questId}/progress`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Activity Summary API
export const activityApi = {
  getUserSummary: (email) => apiCall(`/community/user/${email}/activity-summary`)
};

// Coupons API
export const couponsApi = {
  getMyCoupons: () => apiCall('/community/coupons/my-coupons')
};

export default {
  challengesApi,
  badgesApi,
  qaApi,
  spotlightsApi,
  interactivePostsApi,
  activityApi,
  messengerApi,
  gamificationApi,
  couponsApi
};
