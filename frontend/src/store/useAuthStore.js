import { create } from 'zustand';
import { authApi } from '../api/userApi';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login(credentials);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      set({ user: data.user, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      return false;
    }
  },

  register: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.register(credentials);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      set({ user: data.user, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Registration failed';
      set({ error: msg, loading: false });
      return false;
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
      localStorage.clear();
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
