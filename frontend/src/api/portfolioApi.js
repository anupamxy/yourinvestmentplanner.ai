import api from './axiosInstance';

export const portfolioApi = {
  list:    ()         => api.get('/portfolio/'),
  summary: ()         => api.get('/portfolio/summary/'),
  create:  (data)     => api.post('/portfolio/', data),
  update:  (id, data) => api.patch(`/portfolio/${id}/`, data),
  remove:  (id)       => api.delete(`/portfolio/${id}/`),
};
