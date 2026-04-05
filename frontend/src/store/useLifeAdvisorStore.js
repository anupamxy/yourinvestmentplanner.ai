import { create } from 'zustand';
import { lifeApi } from '../api/lifeApi';

const useLifeAdvisorStore = create((set, get) => ({
  // Life profile
  lifeProfile: null,
  profileLoading: false,
  profileSaving: false,
  profileError: null,

  // Run state
  runId: null,
  runStatus: 'idle',   // idle | running | completed | failed
  agentSteps: {},      // { web_research: 'running'|'done', life_advisor: 'running'|'done' }
  report: null,
  webSources: [],
  runError: null,
  _eventSource: null,

  // --- Profile actions ---
  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    try {
      const { data } = await lifeApi.getProfile();
      set({ lifeProfile: data, profileLoading: false });
    } catch (err) {
      set({
        profileLoading: false,
        profileError: err.response?.status === 404 ? null : 'Failed to load profile',
      });
    }
  },

  saveProfile: async (formData) => {
    set({ profileSaving: true, profileError: null });
    try {
      const { lifeProfile } = get();
      const { data } = lifeProfile
        ? await lifeApi.updateProfile(formData)
        : await lifeApi.saveProfile(formData);
      set({ lifeProfile: data, profileSaving: false });
      return true;
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save profile';
      set({ profileSaving: false, profileError: msg });
      return false;
    }
  },

  // --- Run actions ---
  startRun: async () => {
    set({ runStatus: 'running', report: null, agentSteps: {}, runError: null });
    try {
      const { data } = await lifeApi.startRun();
      set({ runId: data.run_id });
      get()._subscribe(data.run_id);
    } catch (err) {
      set({ runStatus: 'failed', runError: err.response?.data?.error || 'Failed to start' });
    }
  },

  _subscribe: (runId) => {
    const existing = get()._eventSource;
    if (existing) existing.close();

    const url = lifeApi.streamUrl(runId);
    const es = new EventSource(url);
    set({ _eventSource: es });

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'step') {
          set((s) => ({
            agentSteps: { ...s.agentSteps, [payload.agent]: payload.status },
          }));
        } else if (payload.type === 'status') {
          // running status pulse — do nothing extra
        } else if (payload.type === 'done') {
          if (payload.status === 'completed') {
            set({
              runStatus: 'completed',
              report: payload.report,
              webSources: payload.web_sources || [],
              agentSteps: { web_research: 'done', life_advisor: 'done' },
            });
          } else {
            set({ runStatus: 'failed', runError: payload.error || 'Unknown error' });
          }
          es.close();
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      // Poll fallback
      es.close();
      get()._poll(runId);
    };
  },

  _poll: async (runId) => {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const { data } = await lifeApi.getRun(runId);
        if (data.status === 'completed') {
          set({ runStatus: 'completed', report: data.report, webSources: data.web_sources || [], agentSteps: { web_research: 'done', life_advisor: 'done' } });
          return;
        }
        if (data.status === 'failed') {
          set({ runStatus: 'failed', runError: data.error_message });
          return;
        }
      } catch { break; }
    }
  },

  reset: () => {
    const es = get()._eventSource;
    if (es) es.close();
    set({ runId: null, runStatus: 'idle', report: null, agentSteps: {}, runError: null });
  },
}));

export default useLifeAdvisorStore;
