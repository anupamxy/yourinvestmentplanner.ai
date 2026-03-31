import api from './axiosInstance';

export const reportApi = {
  list: () => api.get('/reports/'),
  get: (id) => api.get(`/reports/${id}/`),
  delete: (id) => api.delete(`/reports/${id}/`),
};
