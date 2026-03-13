import axios from 'axios';

let getAccessToken = null;

export const setTokenGetter = (getter) => {
  getAccessToken = getter;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    if (getAccessToken) {
      try {
        const token = await getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
