import apiClient from './apiClient';

export const authAPI = {
  signup: async (name, email, password) => {
    const response = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/auth/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/auth/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  changeUserPassword: async (userId, password) => {
    const response = await apiClient.patch(`/auth/users/${userId}/password`, {
      password,
    });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/auth/users/${userId}`);
    return response.data;
  },
};

export const projectAPI = {
  createProject: async (name) => {
    const response = await apiClient.post('/projects', { name });
    return response.data;
  },

  getAllProjects: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  getProjectById: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },

  updateProject: async (projectId, name) => {
    const response = await apiClient.put(`/projects/${projectId}`, { name });
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response.data;
  },

  addProjectMember: async (projectId, userId) => {
    const response = await apiClient.post(`/projects/${projectId}/members`, {
      userId,
    });
    return response.data;
  },

  getProjectMembers: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data;
  },

  removeProjectMember: async (projectId, memberId) => {
    const response = await apiClient.delete(
      `/projects/${projectId}/members/${memberId}`
    );
    return response.data;
  },
};

export const taskAPI = {
  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  getAllTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/tasks?${params}`);
    return response.data;
  },

  getTaskById: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  updateTask: async (taskId, updates) => {
    const response = await apiClient.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/tasks/stats/dashboard');
    return response.data;
  },
};

export const profileAPI = {
  updateProfile: async (data) => {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data;
  },
};

export const activityAPI = {
  getLogs: async (limit = 50) => {
    const response = await apiClient.get(`/activity?limit=${limit}`);
    return response.data;
  },
};

export const commentAPI = {
  getComments: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}/comments`);
    return response.data;
  },
  addComment: async (taskId, body) => {
    const response = await apiClient.post(`/tasks/${taskId}/comments`, { body });
    return response.data;
  },
  deleteComment: async (taskId, commentId) => {
    const response = await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  },
};
