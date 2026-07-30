import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// ── JWT Interceptor ────────────────────────────────────────────────────────────
// Automatically attaches the stored Bearer token to every outgoing request.
// This means quiz/generate and proctoring/is-locked get authenticated
// without each call-site needing to manage the header manually.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
