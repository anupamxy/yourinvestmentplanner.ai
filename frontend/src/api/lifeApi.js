import api from './axiosInstance';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const lifeApi = {
  // Life Profile
  getProfile:    ()       => api.get('/life-profile/'),
  saveProfile:   (data)   => api.post('/life-profile/', data),
  updateProfile: (data)   => api.put('/life-profile/', data),

  // Life Advisor runs
  startRun:  ()     => api.post('/life-advisor/run/'),
  getHistory: ()    => api.get('/life-advisor/runs/'),
  getRun:    (id)   => api.get(`/life-advisor/runs/${id}/`),

  // SSE stream — raw fetch for streaming
  streamUrl: (id) => {
    const token = localStorage.getItem('access_token');
    return `${API_BASE}/life-advisor/runs/${id}/stream/?token=${encodeURIComponent(token || '')}`;
  },
};
