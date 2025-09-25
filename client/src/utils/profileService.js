import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || '';

export async function getProfile(identifier) {
  const { data } = await axios.get(`${API}/profile/${encodeURIComponent(identifier)}`);
  if (!data.ok) throw new Error(data.error || 'Failed to load profile');
  return data.data;
}

export async function getProfilePosts(identifier, page = 1, limit = 12) {
  const { data } = await axios.get(`${API}/profile/${encodeURIComponent(identifier)}/posts`, { params: { page, limit } });
  if (!data.ok) throw new Error(data.error || 'Failed to load posts');
  return data;
}

export async function updateProfile(payload, token) {
  const { data } = await axios.post(`${API}/profile/update`, payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!data.ok) throw new Error(data.error || 'Failed to update profile');
  return data.data;
}

export async function follow(target, token) {
  const { data } = await axios.post(`${API}/profile/follow`, { target }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!data.ok) throw new Error(data.error || 'Failed to follow');
  return true;
}

export async function unfollow(target, token) {
  const { data } = await axios.post(`${API}/profile/unfollow`, { target }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!data.ok) throw new Error(data.error || 'Failed to unfollow');
  return true;
}

export async function migrateAvatar(token) {
  const { data } = await axios.post(`${API}/profile/migrate-avatar`, {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!data.ok) throw new Error(data.error || 'Failed to sync avatars');
  return data.data;
}
