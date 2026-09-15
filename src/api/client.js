import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getWsUrl(path = '/live-detect') {
  if (API_BASE) {
    const wsProto = API_BASE.startsWith('https') ? 'wss:' : 'ws:';
    const host = API_BASE.replace(/^https?:\/\//, '');
    return `${wsProto}//${host}${path}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultHost = window.location.host || 'localhost:5173';
  if (window.location.port === '5173') {
    return `ws://localhost:5000${path}`;
  }
  return `${protocol}//${defaultHost}${path}`;
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voiceguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('voiceguard_token');
      localStorage.removeItem('voiceguard_user');
      // Dispatch custom event so AuthContext can react
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────
export async function registerUser(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateSettings(settings) {
  const { data } = await api.put('/auth/settings', settings);
  return data;
}

// ── Scans / History ───────────────────────────────────────
export async function fetchScans() {
  const { data } = await api.get('/history');
  return data;
}

export async function deleteScan(id) {
  const { data } = await api.delete(`/history/${id}`);
  return data;
}

// ── Transcripts ───────────────────────────────────────────
export async function fetchTranscripts() {
  const { data } = await api.get('/history/transcripts');
  return data;
}

export async function saveTranscript(transcript) {
  const { data } = await api.post('/history/transcripts', transcript);
  return data;
}

// ── Health ────────────────────────────────────────────────
export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}

export default api;
