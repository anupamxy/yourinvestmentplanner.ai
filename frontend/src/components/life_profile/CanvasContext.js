import { createContext } from 'react';

/** Canvas-wide callbacks injected into every node via context. */
export const CanvasCtx = createContext({
  update: (_id, _field, _value) => {},
  remove: (_id) => {},
});
