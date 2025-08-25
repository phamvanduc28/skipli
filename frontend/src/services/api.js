import axios from 'axios';
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
export const ownerAPI = {
  createAccessCode: (phoneNumber) =>
    api.post('/owner/create-access-code', { phoneNumber }),
  validateAccessCode: (phoneNumber, accessCode) =>
    api.post('/owner/validate-access-code', { phoneNumber, accessCode }),
  getEmployees: () =>
    api.get('/owner/employees'),
  getEmployee: (id) =>
    api.get(`/owner/employees/${id}`),
  createEmployee: (employeeData) =>
    api.post('/owner/employees', employeeData),
  updateEmployee: (id, employeeData) =>
    api.put(`/owner/employees/${id}`, employeeData),
  deleteEmployee: (id) =>
    api.delete(`/owner/employees/${id}`),
  getDashboard: () =>
    api.get('/owner/dashboard'),
};
export const employeeAPI = {
  loginEmail: (email) =>
    api.post('/employee/login-email', { email }),
  validateAccessCode: (email, accessCode) =>
    api.post('/employee/validate-access-code', { email, accessCode }),
  setupAccount: (setupToken, username, password) =>
    api.post('/employee/setup-account', { setupToken, username, password }),
  login: (username, password) =>
    api.post('/employee/login', { username, password }),
  getProfile: () =>
    api.get('/employee/profile'),
  updateProfile: (profileData) =>
    api.put('/employee/profile', profileData),
  getTasks: () =>
    api.get('/employee/tasks'),
  updateTaskStatus: (taskId, status) =>
    api.put(`/employee/tasks/${taskId}/status`, { status }),
  getDashboard: () =>
    api.get('/employee/dashboard'),
};
export const taskAPI = {
  getTasks: () =>
    api.get('/tasks'),
  getTask: (id) =>
    api.get(`/tasks/${id}`),
  createTask: (taskData) =>
    api.post('/tasks', taskData),
  updateTask: (id, taskData) =>
    api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) =>
    api.delete(`/tasks/${id}`),
  getEmployeeTasks: (employeeId) =>
    api.get(`/tasks/employee/${employeeId}`),
  getTaskStats: () =>
    api.get('/tasks/stats/overview'),
};
export const messageAPI = {
  getChatHistory: (userId, limit = 50) =>
    api.get(`/messages/${userId}?limit=${limit}`),
  sendMessage: (toUserId, message, type = 'text') =>
    api.post('/messages', { toUserId, message, type }),
  getConversations: () =>
    api.get('/messages/conversations/list'),
  markConversationAsRead: (userId) =>
    api.put(`/messages/conversations/${userId}/read`),
  deleteMessage: (messageId) =>
    api.delete(`/messages/${messageId}`),
  searchMessages: (query, userId = null, limit = 20) =>
    api.get('/messages/search', { 
      params: { q: query, userId, limit }
    }),
};
export const authUtils = {
  setAuthData: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  getAuthData: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      token,
      user: user ? JSON.parse(user) : null,
    };
  },
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  getUserRole: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  },
};
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 401) {
      return 'Authentication failed. Please log in again.';
    } else if (status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (status === 404) {
      return 'The requested resource was not found.';
    } else if (status === 422) {
      return data.message || 'Validation error occurred.';
    } else if (status >= 500) {
      return 'Server error occurred. Please try again later.';
    } else {
      return data.message || 'An error occurred.';
    }
  } else if (error.request) {
    return 'Network error. Please check your connection and try again.';
  } else {
    return 'An unexpected error occurred.';
  }
};
export default api;
