import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function listSessions() {
  const { data } = await axios.get(`${API_BASE}/live/sessions`);
  if (!data.ok) throw new Error(data.error || 'Failed to load sessions');
  return data.data;
}

export async function getSession(id) {
  const { data } = await axios.get(`${API_BASE}/live/sessions/${id}`);
  if (!data.ok) throw new Error(data.error || 'Not found');
  return data.data;
}

export async function createSession(payload) {
  const { data } = await axios.post(`${API_BASE}/live/sessions`, payload);
  if (!data.ok) throw new Error(data.error || 'Failed to create session');
  return data.data;
}

export async function reserveSession(id, payload) {
  const { data } = await axios.post(`${API_BASE}/live/sessions/${id}/reserve`, payload);
  if (!data.ok) throw new Error(data.error || 'Failed to reserve');
  return data.data;
}

// New approval workflow helpers
export async function requestSeat(id, payload) {
  const { data } = await axios.post(`${API_BASE}/live/sessions/${id}/request`, payload);
  if (!data.ok) throw new Error(data.error || 'Failed to request seat');
  return data.data;
}

export async function approveReservation(id, email) {
  const { data } = await axios.post(`${API_BASE}/live/sessions/${id}/approve`, { email });
  if (!data.ok) throw new Error(data.error || 'Failed to approve');
  return data.data;
}

export async function rejectReservation(id, email) {
  const { data } = await axios.post(`${API_BASE}/live/sessions/${id}/reject`, { email });
  if (!data.ok) throw new Error(data.error || 'Failed to reject');
  return data.data;
}

export async function listReservations(id) {
  const { data } = await axios.get(`${API_BASE}/live/sessions/${id}/reservations`);
  if (!data.ok) throw new Error(data.error || 'Failed to list reservations');
  return data.data;
}

export async function markPaid(id, email) {
  const { data } = await axios.post(`${API_BASE}/live/sessions/${id}/mark-paid`, { email });
  if (!data.ok) throw new Error(data.error || 'Failed to mark paid');
  return true;
}

// Fetch Razorpay key ID from server as a fallback if client env is missing
export async function getRazorpayKey() {
  const { data } = await axios.get(`${API_BASE}/live/config`);
  if (!data.ok) throw new Error(data.error || 'Failed to load config');
  return data.razorpayKeyId || '';
}
