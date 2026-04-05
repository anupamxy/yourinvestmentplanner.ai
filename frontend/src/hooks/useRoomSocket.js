import { useEffect, useRef, useCallback, useState } from 'react';
import { discussionsApi } from '../api/discussionsApi';

/**
 * Manages a WebSocket connection to a discussion room.
 * Reconnects automatically on disconnect.
 */
export function useRoomSocket(roomSlug, onEvent) {
  const wsRef      = useRef(null);
  const onEventRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);

  // Keep callback ref fresh without re-connecting
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!roomSlug) return;
    let active = true;
    let retryTimer;

    function connect() {
      if (!active) return;
      const url = discussionsApi.wsUrl(roomSlug);
      const ws  = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen  = () => { if (active) setConnected(true); };
      ws.onclose = () => {
        setConnected(false);
        if (active) retryTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try { onEventRef.current(JSON.parse(e.data)); } catch {}
      };
    }

    connect();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, [roomSlug]);

  const send = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
    }
  }, []);

  return { send, connected };
}
