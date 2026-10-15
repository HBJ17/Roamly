import axios from 'axios';

// The session lives in an httpOnly cookie set by the API, so nothing is stored in the browser.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

const listeners = new Set();
export const onUnauthorized = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      listeners.forEach((fn) => fn());
    }
    return Promise.reject(error);
  }
);

// Human-readable message from any API error.
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.message === 'Network Error' ? 'Cannot reach Roamly right now. Check your connection.' : fallback);

export const fieldErrors = (err) =>
  Object.fromEntries((err?.response?.data?.details || []).map((d) => [d.field, d.message]));

export default api;
