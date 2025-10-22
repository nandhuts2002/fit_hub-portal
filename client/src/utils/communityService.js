import axios from 'axios';
import SessionManager from './sessionManager';
import { io } from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://fit-hub-portal-1.onrender.com';

export async function uploadAvatar(file, token) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await axios.post(`${API_BASE}/me/avatar`, form, {
    headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!data.ok) throw new Error(data.error || 'Failed to upload avatar');
  const url = data.url.startsWith('http') ? data.url : `${API_BASE}${data.url}`;
  return url;
}

// --- Follow system & personalized feed ---
export async function followUser(follower, following) {
  const { data } = await axios.post(`${API_BASE}/community/follow`, { follower, following });
  if (!data.ok) throw new Error(data.error || 'Failed to follow');
  return data.data;
}

export async function unfollowUser(follower, following) {
  const { data } = await axios.post(`${API_BASE}/community/unfollow`, { follower, following });
  if (!data.ok) throw new Error(data.error || 'Failed to unfollow');
  return data.data;
}

export async function getPersonalizedFeed(email, page = 1, limit = 10) {
  const { data } = await axios.get(`${API_BASE}/community/feed`, { params: { email, page, limit } });
  if (!data.ok) throw new Error(data.error || 'Failed to load feed');
  return data; // { data, page, limit, total }
}

export async function getFollowing(follower) {
  const { data } = await axios.get(`${API_BASE}/community/following`, { params: { follower } });
  if (!data.ok) throw new Error(data.error || 'Failed to load following');
  return data.data; // [email]
}

export async function listPosts(page = 1, limit = 10) {
  const { data } = await axios.get(`${API_BASE}/community/posts`, { params: { page, limit } });
  if (!data.ok) throw new Error(data.error || 'Failed to load posts');
  return data;
}

export async function createPost(payload) {
  const user = SessionManager.getCurrentUser?.() || {};
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : undefined;
  const { data } = await axios.post(`${API_BASE}/community/posts`, payload, { headers });
  if (!data.ok) throw new Error(data.error || 'Failed to create post');
  return data.data;
}

export async function likePost(postId, email) {
  const { data } = await axios.post(`${API_BASE}/community/posts/${postId}/like`, { email });
  if (!data.ok) throw new Error(data.error || 'Failed to like');
  return data.data;
}

export async function unlikePost(postId, email) {
  const { data } = await axios.post(`${API_BASE}/community/posts/${postId}/unlike`, { email });
  if (!data.ok) throw new Error(data.error || 'Failed to unlike');
  return data.data;
}

export async function listComments(postId) {
  const { data } = await axios.get(`${API_BASE}/community/posts/${postId}/comments`);
  if (!data.ok) throw new Error(data.error || 'Failed to load comments');
  return data.data;
}

export async function addComment(postId, payload) {
  const { data } = await axios.post(`${API_BASE}/community/posts/${postId}/comments`, payload);
  if (!data.ok) throw new Error(data.error || 'Failed to add comment');
  return data.data;
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await axios.post(`${API_BASE}/community/upload-image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.ok) throw new Error(data.error || 'Failed to upload image');
  // Return absolute URL for immediate display
  const url = data.url.startsWith('http') ? data.url : `${API_BASE}${data.url}`;
  return url;
}

export async function deletePost(postId, token) {
  const { data } = await axios.delete(`${API_BASE}/community/posts/${postId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!data.ok) throw new Error(data.error || 'Failed to delete post');
  return data.data;
}

// --- Socket.IO client ---
let socket;
let socketConnected = false;

export function getCommunitySocket() {
  if (!socket) {
    const WS_URL = process.env.REACT_APP_WS_URL || API_BASE;
    try {
      // Connect to community namespace to receive events emitted there
      socket = io(`${WS_URL}/community`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'], // Try polling as fallback
        withCredentials: true,
        forceNew: false,
        autoConnect: false, // Don't auto-connect, connect only when needed
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        query: {},
      });

      // Handle connection events
      socket.on('connect', () => {
        console.log('Socket.IO connected to community namespace');
        socketConnected = true;
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected from community namespace');
        socketConnected = false;
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket.IO connection error:', error.message);
        socketConnected = false;
      });

    } catch (error) {
      console.warn('Failed to initialize Socket.IO:', error);
      socket = null;
    }
  }
  return socket;
}

// Function to manually connect socket when needed
export function connectSocket() {
  const socket = getCommunitySocket();
  if (socket && !socketConnected) {
    try {
      socket.connect();
    } catch (error) {
      console.warn('Failed to connect Socket.IO:', error);
    }
  }
}

// Function to disconnect socket when not needed
export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect();
      socketConnected = false;
    } catch (error) {
      console.warn('Failed to disconnect Socket.IO:', error);
    }
  }
}

export async function sendTyping({ postId, user, isTyping }) {
  try {
    await axios.post(`${API_BASE}/community/typing`, { postId, user, isTyping });
  } catch (e) {
    // ignore network errors for typing
  }
}

export async function listTrending(limit = 10) {
  const { data } = await axios.get(`${API_BASE}/community/trending`, { params: { limit } });
  if (!data.ok) throw new Error(data.error || 'Failed to load trending');
  return data.data;
}

export async function listByHashtag(tag, page = 1, limit = 10) {
  const { data } = await axios.get(`${API_BASE}/community/hashtag/${encodeURIComponent(tag)}`, { params: { page, limit } });
  if (!data.ok) throw new Error(data.error || 'Failed to load hashtag posts');
  return data;
}

// --- Reports ---
export async function reportPost(postId, payload) {
  try {
    const { data } = await axios.post(`${API_BASE}/community/posts/${postId}/report`, payload);
    if (!data.ok) throw new Error(data.error || 'Failed to report post');
    return data.data;
  } catch (e) {
    // Fallback store in localStorage queue
    try {
      const key = 'fithub:reports';
      const raw = localStorage.getItem(key) || '[]';
      const list = JSON.parse(raw);
      list.push({ id: `local-${Date.now()}`, postId, payload, created_at: Date.now() });
      localStorage.setItem(key, JSON.stringify(list));
      return { ok: true };
    } catch {
      throw e;
    }
  }
}

// --- Collections (Bookmarks) ---
// Collections let users save posts into named groups
export async function listCollections(email) {
  try {
    const { data } = await axios.get(`${API_BASE}/community/collections`, { params: { email } });
    if (!data.ok) throw new Error(data.error || 'Failed to load collections');
    return data.data; // [{id, name, count}]
  } catch (e) {
    try {
      const raw = localStorage.getItem(`fithub:collections:${email}`) || '[]';
      const cols = JSON.parse(raw);
      // ensure counts are computed from mapping
      const mapRaw = localStorage.getItem('fithub:collections:map') || '{}';
      const map = JSON.parse(mapRaw);
      return cols.map(c => ({ ...c, count: Array.isArray(map[c.id]) ? map[c.id].length : 0 }));
    } catch {
      return [];
    }
  }
}

export async function createCollection({ email, name }) {
  try {
    const { data } = await axios.post(`${API_BASE}/community/collections`, { email, name });
    if (!data.ok) throw new Error(data.error || 'Failed to create collection');
    return data.data; // {id, name}
  } catch (e) {
    // local fallback
    const id = `col-${Date.now()}`;
    const col = { id, name };
    try {
      const key = `fithub:collections:${email}`;
      const raw = localStorage.getItem(key) || '[]';
      const cols = JSON.parse(raw);
      cols.push(col);
      localStorage.setItem(key, JSON.stringify(cols));
      return col;
    } catch {
      throw e;
    }
  }
}

export async function addPostToCollection({ collectionId, postId, email }) {
  try {
    const { data } = await axios.post(`${API_BASE}/community/collections/${collectionId}/add`, { postId, email });
    if (!data.ok) throw new Error(data.error || 'Failed to save to collection');
    return data.data;
  } catch (e) {
    // local fallback mapping collectionId -> [postId]
    try {
      const mapKey = 'fithub:collections:map';
      const raw = localStorage.getItem(mapKey) || '{}';
      const map = JSON.parse(raw);
      const set = new Set(map[collectionId] || []);
      set.add(postId);
      map[collectionId] = Array.from(set);
      localStorage.setItem(mapKey, JSON.stringify(map));
      return { ok: true };
    } catch {
      throw e;
    }
  }
}

export async function removePostFromCollection({ collectionId, postId, email }) {
  try {
    const { data } = await axios.post(`${API_BASE}/community/collections/${collectionId}/remove`, { postId, email });
    if (!data.ok) throw new Error(data.error || 'Failed to remove from collection');
    return data.data;
  } catch (e) {
    // local fallback mapping collectionId -> [postId]
    try {
      const mapKey = 'fithub:collections:map';
      const raw = localStorage.getItem(mapKey) || '{}';
      const map = JSON.parse(raw);
      map[collectionId] = (map[collectionId] || []).filter(id => id !== postId);
      localStorage.setItem(mapKey, JSON.stringify(map));
      return { ok: true };
    } catch {
      throw e;
    }
  }
}

// --- Stories ---
// 24-hour ephemeral media items
export async function listStories() {
  try {
    const { data } = await axios.get(`${API_BASE}/community/stories`);
    if (!data.ok) throw new Error(data.error || 'Failed to load stories');
    return data.data; // [{id, user:{name,email,avatar}, mediaUrl, created_at, expires_at}]
  } catch (e) {
    // Fallback to local storage
    try {
      const raw = localStorage.getItem('fithub:stories') || '[]';
      const list = JSON.parse(raw);
      // filter expired
      const now = Date.now();
      const fresh = list.filter(s => !s.expires_at || now < Number(s.expires_at));
      if (fresh.length !== list.length) localStorage.setItem('fithub:stories', JSON.stringify(fresh));
      return fresh;
    } catch {
      return [];
    }
  }
}

export async function createStory({ file, user }) {
  // Try server first
  try {
    // upload media first, then create story
    const form = new FormData();
    form.append('image', file);
    const up = await axios.post(`${API_BASE}/community/upload-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = up.data?.url?.startsWith('http') ? up.data.url : `${API_BASE}${up.data?.url || ''}`;
    const { data } = await axios.post(`${API_BASE}/community/stories`, { mediaUrl: url, user });
    if (!data.ok) throw new Error(data.error || 'Failed to create story');
    return data.data;
  } catch (err) {
    // Fallback to local storage: upload image if possible, else use object URL
    try {
      let mediaUrl = '';
      try {
        const form = new FormData();
        form.append('image', file);
        const up = await axios.post(`${API_BASE}/community/upload-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        mediaUrl = up.data?.url?.startsWith('http') ? up.data.url : `${API_BASE}${up.data?.url || ''}`;
      } catch {
        // Convert to base64 data URL for persistence across reloads
        mediaUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      const now = Date.now();
      const story = {
        id: `local-${now}`,
        user: user || {},
        mediaUrl,
        created_at: now,
        // expire in 24h
        expires_at: now + 24 * 60 * 60 * 1000,
      };
      const raw = localStorage.getItem('fithub:stories') || '[]';
      const list = JSON.parse(raw);
      list.unshift(story);
      localStorage.setItem('fithub:stories', JSON.stringify(list));
      return story;
    } catch (e2) {
      throw err;
    }
  }
}

export async function deleteStory(storyId, token) {
  try {
    const { data } = await axios.delete(`${API_BASE}/community/stories/${storyId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!data.ok) throw new Error(data.error || 'Failed to delete story');
    return data.data;
  } catch (e) {
    // Fallback: remove from local storage
    try {
      const raw = localStorage.getItem('fithub:stories') || '[]';
      const list = JSON.parse(raw);
      const filtered = list.filter(s => s.id !== storyId);
      localStorage.setItem('fithub:stories', JSON.stringify(filtered));
      return { ok: true };
    } catch {
      throw e;
    }
  }
}
