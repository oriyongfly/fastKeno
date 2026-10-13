// hooks/useToast.js

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Toast queue of length 1.
 *
 * Exposes the current `message` (or null) and a `show(msg)` that
 * auto-clears after `duration` ms. Calling `show` while a toast is
 * visible replaces it and restarts the timer.
 *
 * @param {number} [duration=3000] - ms before auto-dismiss
 * @returns {{ message: string|null, show: (msg: string) => void, clear: () => void }}
 */
export function useToast(duration = 3000) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback(
    (msg) => {
      // Ignore empty strings / null / undefined — the Toast component
      // treats those as "hidden" anyway, but rejecting them here keeps
      // a stray `show('')` from wiping a real message.
      if (!msg) return;

      setMessage(msg);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  // Cleanup on unmount — prevents a setState-after-unmount warning
  // if the toast timer fires after the component is gone.
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return { message, show, clear };
}