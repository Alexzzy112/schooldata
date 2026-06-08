import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const subjectAPI = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const resultAPI = {
  getAll: (params) => api.get('/results', { params }),
  getByStudent: (studentId) => api.get(`/results/student/${studentId}`),
  create: (data) => api.post('/results', data),
  update: (id, data) => api.put(`/results/${id}`, data),
  delete: (id) => api.delete(`/results/${id}`),
};

export const classAPI = {
  getAll: () => api.get('/classes'),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

export const sessionAPI = {
  getAll: () => api.get('/sessions'),
  create: (data) => api.post('/sessions', data),
  setCurrent: (id) => api.put(`/sessions/${id}/set-current`),
  delete: (id) => api.delete(`/sessions/${id}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getStudentPerformance: (params) => api.get('/analytics/student-performance', { params }),
  getClassPerformance: (params) => api.get('/analytics/class-performance', { params }),
  getSubjectComparison: (params) => api.get('/analytics/subject-comparison', { params }),
  getGenderAnalysis: (params) => api.get('/analytics/gender-analysis', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getRanking: (params) => api.get('/analytics/ranking', { params }),
};

export const reportAPI = {
  getStudentReport: (studentId, params) => api.get(`/reports/student/${studentId}`, { params }),
  getClassReport: (classId, params) => api.get(`/reports/class/${classId}`, { params }),
  getSubjectReport: (subjectId, params) => api.get(`/reports/subject/${subjectId}`, { params }),
  getAnnualReport: (params) => api.get('/reports/annual', { params }),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  generateAlerts: () => api.post('/notifications/generate-alerts'),
};

export default api;
