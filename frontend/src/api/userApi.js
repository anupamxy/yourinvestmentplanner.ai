import api from './axiosInstance';

export const authApi = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
};

export const preferencesApi = {
  get: () => api.get('/preferences/'),
  create: (data) => api.post('/preferences/', data),
  update: (data) => api.put('/preferences/', data),
};
