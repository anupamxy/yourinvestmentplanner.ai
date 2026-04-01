import { create } from 'zustand';
import { agentApi } from '../api/agentApi';

const useAgentStore = create((set, get) => ({
  currentRunId: null,
  runStatus: 'idle',   // idle | pending | running | completed | failed | cancelled | conflict
  stepLogs: [],
  runs: [],
  currentReportId: null,
  conflictRunId: null,   // run_id of the already-running pipeline (409 conflict)
  cancelling: false,
  error: null,
  _eventSource: null,

  startRun: async () => {
    set({ runStatus: 'pending', stepLogs: [], currentReportId: null, error: null, conflictRunId: null });
    try {
      const { data } = await agentApi.startRun();
      set({ currentRunId: data.run_id });
      get().subscribeToStream(data.run_id);
      return data.run_id;
    } catch (err) {
      if (err.response?.status === 409) {
        // Another pipeline is already running — surface it to the UI
        set({
          runStatus: 'conflict',
          conflictRunId: err.response.data?.run_id || null,
          error: null,
        });
      } else {
        set({ runStatus: 'failed', error: err.response?.data?.error || 'Failed to start run' });
      }
      return null;
    }
  },

  cancelAndRestart: async () => {
    const { conflictRunId } = get();
    if (!conflictRunId) return;
    set({ cancelling: true });
    try {
      await agentApi.cancelRun(conflictRunId);
    } catch {
      // Ignore — even if cancel fails, try to start fresh
    }
    set({ cancelling: false, conflictRunId: null, runStatus: 'idle' });
    await get().startRun();
  },

  cancelCurrent: async () => {
    const { currentRunId } = get();
    if (!currentRunId) return;
    const es = get()._eventSource;
    if (es) es.close();
    try {
      await agentApi.cancelRun(currentRunId);
    } catch { /* ignore */ }
    set({ runStatus: 'cancelled', currentRunId: null });
  },

  subscribeToStream: (runId) => {
    // Close existing connection
    const existing = get()._eventSource;
    if (existing) existing.close();

    // Browser EventSource cannot send custom headers, so we pass JWT as query param.
    // The backend _get_user_from_request() reads ?token= as a fallback.
    const token = localStorage.getItem('access_token');
    const baseUrl = agentApi.getStreamUrl(runId);
    const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;

    const es = new EventSource(url);
    set({ _eventSource: es, runStatus: 'running' });

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'step') {
          set((state) => ({ stepLogs: [...state.stepLogs, payload.step] }));
        } else if (payload.type === 'done') {
          set({
            runStatus: payload.status,   // completed | failed | cancelled
            currentReportId: payload.report_id || null,
          });
          es.close();
        } else if (payload.type === 'error') {
          set({ runStatus: 'failed', error: payload.message });
          es.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      const { runStatus } = get();
      if (runStatus === 'running' || runStatus === 'pending') {
        // Poll fallback
        get()._pollStatus(runId);
      }
      es.close();
    };
  },

  _pollStatus: async (runId) => {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const { data } = await agentApi.getRun(runId);
        set({ stepLogs: data.steps || [] });
        if (data.status === 'completed') {
          set({ runStatus: 'completed', currentReportId: data.report?.id || null });
          return;
        }
        if (data.status === 'failed') {
          set({ runStatus: 'failed', error: data.error_message });
          return;
        }
      } catch {
        break;
      }
    }
  },

  fetchRuns: async () => {
    try {
      const { data } = await agentApi.listRuns();
      set({ runs: data });
    } catch {
      // ignore
    }
  },

  reset: () => {
    const es = get()._eventSource;
    if (es) es.close();
    set({ currentRunId: null, runStatus: 'idle', stepLogs: [], currentReportId: null, error: null });
  },
}));

export default useAgentStore;
