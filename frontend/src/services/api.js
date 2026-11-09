import axios from 'axios';

// VITE_API_URL is supported as an alias for existing Vercel configurations.
// Keep VITE_API_BASE_URL as the canonical name used in local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `Cannot reach the HavenStay server at ${API_BASE_URL}. Please make sure the backend is running and try again.`;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.';
  }
  return fallback;
};

export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (credentials) => api.post('/auth/signin', credentials),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
};

export const apartmentAPI = {
  getAll: (params) => api.get('/apartments', { params }),
  getById: (id) => api.get(`/apartments/${id}`),
};

export const bookingAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getGuestBooking: (token) => api.get(`/bookings/guest/${token}`),
  getUserBookings: () => api.get('/bookings/my-bookings'),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
};

export const paymentAPI = {
  initialize: (paymentData) => api.post('/payments/initialize', paymentData),
  verify: (paymentData) => api.post('/payments/verify', paymentData),
};

export const subscriptionAPI = {
  subscribe: (data) => api.post('/subscriptions/subscribe', data),
  unsubscribe: (data) => api.post('/subscriptions/unsubscribe', data),
  status: (token) => api.get('/subscriptions/status', { params: { token } }),
  subscribeByToken: (token) => api.get('/subscriptions/subscribe', { params: { token } }),
  unsubscribeByToken: (token) => api.get('/subscriptions/unsubscribe', { params: { token } }),
};

export default api;
