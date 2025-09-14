// src/services/events.ts
type Handler = (payload?: any) => void;

const listeners = new Map<string, Set<Handler>>();

export const on = (event: string, handler: Handler) => {
  let s = listeners.get(event);
  if (!s) {
    s = new Set();
    listeners.set(event, s);
  }
  s.add(handler);
  return () => off(event, handler);
};

export const off = (event: string, handler: Handler) => {
  const s = listeners.get(event);
  if (!s) return;
  s.delete(handler);
  if (s.size === 0) listeners.delete(event);
};

export const emit = (event: string, payload?: any) => {
  const s = listeners.get(event);
  if (!s) return;
  // copy to avoid mutation during iteration
  Array.from(s).forEach(h => {
    try {
      h(payload);
    } catch (e) {
      // swallow handler errors so emitter is robust
      // optionally log: console.warn('event handler error', e);
    }
  });
};
