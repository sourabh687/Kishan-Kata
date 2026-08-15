import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_URL || '/api';
if (rawBaseURL && !rawBaseURL.endsWith('/api') && !rawBaseURL.endsWith('/api/')) {
  rawBaseURL = rawBaseURL.replace(/\/+$/, '') + '/api';
}

const api = axios.create({
  baseURL: rawBaseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
