import axios from 'axios';
import { getCurrentTabToken } from './tabManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const BACKEND_URL = API_BASE_URL.startsWith('http') 
  ? API_BASE_URL.replace(/\/api\/?$/, '') 
  : window.location.origin.includes('localhost:3000') 
    ? 'http://localhost:5000' 
    : window.location.origin;
export const UPLOADS_URL = `${BACKEND_URL}/uploads`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getCurrentTabToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  forgotPasswordQuestion: (identifier) => api.post('/auth/forgot-password/question', { identifier }),
  forgotPasswordReset: (data) => api.post('/auth/forgot-password/reset', data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getRooms: () => api.get('/admin/rooms'),
  createRoom: (data) => api.post('/admin/rooms', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateRoom: (id, data) => api.put(`/admin/rooms/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteRoom: (id) => api.delete(`/admin/rooms/${id}`),
  getComplaints: () => api.get('/admin/complaints'),
  getComplaintsHistory: () => api.get('/admin/complaints-history'),
  updateComplaint: (id, data) => api.put(`/admin/complaints/${id}`, data),
  getTransactions: () => api.get('/admin/transactions'),
  getTransactionsByRoom: () => api.get('/admin/transactions-by-room'),
  updateTransaction: (id, data) => api.put(`/admin/transactions/${id}`, data),
  createNotice: (data) => api.post('/admin/notices', data),
  getNotices: () => api.get('/admin/notices'),
  deleteNotice: (id) => api.delete(`/admin/notices/${id}`),
  getRoomChanges: () => api.get('/admin/room-changes'),
  updateRoomChange: (id, data) => api.put(`/admin/room-changes/${id}`, data),
  getPhoto: (filename) => api.get(`/student/photo/${filename}`, { responseType: 'blob' }),
  // Super Admin APIs
  getAllUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
};

export const studentAPI = {
  getRoom: () => api.get('/student/room'),
  getRooms: () => api.get('/student/rooms'),
  getTransactions: () => api.get('/student/transactions'),
  getPendingDues: () => api.get('/student/pending-dues'),
  payTransaction: (id) => api.put(`/student/transactions/${id}`),
  createComplaint: (data) => api.post('/student/complaints', data),
  getComplaints: () => api.get('/student/complaints'),
  getComplaintsHistory: () => api.get('/student/complaints-history'),
  getNotices: () => api.get('/student/notices'),
  acknowledgeNotice: (id) => api.post(`/student/notices/${id}/acknowledge`),
  getRoomChangeRequests: () => api.get('/student/room-change-requests'),
  requestRoomChange: (data) => api.post('/student/room-change-requests', data),
  bookRoom: (roomId) => api.post(`/student/rooms/${roomId}/book`),
  previewRoomBooking: (roomId) => api.get(`/student/rooms/${roomId}/preview`),
  getPhoto: (filename) => api.get(`/student/photo/${filename}`, { responseType: 'blob' })
};

export const aiAPI = {
  getFacilityInsights: (data) => api.post('/ai/facility-insights', data),
  draftNotice: (data) => api.post('/ai/draft-notice', data),
  enhanceComplaint: (data) => api.post('/ai/enhance-complaint', data)
};

export default api;
export { API_BASE_URL };
