import api from './axiosInstance';

export const agentApi = {
  startRun: () => api.post('/agents/run/'),
  cancelRun: (runId) => api.post(`/agents/runs/${runId}/cancel/`),
  listRuns: () => api.get('/agents/runs/'),
  getRun: (runId) => api.get(`/agents/runs/${runId}/`),
  getStreamUrl: (runId) => `/api/v1/agents/runs/${runId}/stream/`,
};
