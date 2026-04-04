import api from './axiosInstance';

// VITE_API_BASE_URL already includes /api/v1 (e.g. http://localhost:8000/api/v1)
// so we use it directly as the base for raw fetch calls.
// Falls back to '/api/v1' (relative) when unset, which Vite proxy handles in dev.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const reportApi = {
  list: () => api.get('/reports/'),
  get: (id) => api.get(`/reports/${id}/`),
  delete: (id) => api.delete(`/reports/${id}/`),
  // Returns a raw fetch Response with a readable stream.
  // We use fetch (not Axios) because we need direct access to the response body stream.
  askStream: (id, question) => {
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE}/reports/${id}/ask/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });
  },
};
