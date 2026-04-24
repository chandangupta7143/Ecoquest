import axios from 'axios';

// In production (Vercel): VITE_API_URL = https://ecoquest-bx2q.onrender.com
// In development (local): VITE_API_URL = http://localhost:5000  (set in frontend/.env)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Helper — build full URL for uploaded files (avatars, images, etc.)
export const fileUrl = (path) =>
  path ? `${BASE}${path}` : null;

export default api;
