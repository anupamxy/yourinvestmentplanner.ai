import { create } from 'zustand';
import { preferencesApi } from '../api/userApi';

const usePreferencesStore = create((set, get) => ({
  profile: null,
  loading: false,
  saving: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await preferencesApi.get();
      set({ profile: data, loading: false });
    } catch (err) {
      if (err.response?.status === 404) {
        set({ profile: null, loading: false });
      } else {
        set({ error: 'Failed to load profile', loading: false });
      }
    }
  },

  saveProfile: async (formData) => {
    set({ saving: true, error: null });
    try {
      const { profile } = get();
      const { data } = profile
        ? await preferencesApi.update(formData)
        : await preferencesApi.create(formData);
      set({ profile: data, saving: false });
      return true;
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Save failed';
      set({ error: msg, saving: false });
      return false;
    }
  },
}));

export default usePreferencesStore;
