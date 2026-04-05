import api from './axiosInstance';

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

export const discussionsApi = {
  rooms:       (category)   => api.get('/discussions/rooms/', { params: category ? { category } : {} }),
  room:        (slug)       => api.get(`/discussions/rooms/${slug}/`),
  createRoom:  (data)       => api.post('/discussions/rooms/', data),
  messages:    (slug)       => api.get(`/discussions/rooms/${slug}/messages/`),

  wsUrl: (roomSlug) => {
    const token   = localStorage.getItem('access_token') || '';
    const wsBase  = BASE.replace(/^http/, 'ws') || 'ws://localhost:8000';
    return `${wsBase}/ws/discussions/${roomSlug}/?token=${token}`;
  },
};
