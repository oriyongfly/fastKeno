// hooks/useGameTimer.js

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 60-second round countdown.
 *
 * Counts down once per second. When it reaches zero it:
 *   1. calls `onComplete()` (the draw trigger)
 *   2. resets itself to `duration`
 *
 * The interval is created ONCE on mount and cleared on unmount — no
 * re-subscription when the parent re-renders. The callback is stored in
 * a ref, so passing a new function each render is safe.
 *
 * @param {Object}   [opts]
 * @param {number}   [opts.duration=60]      - seconds per round
 * @param {Function} [opts.onComplete]       - called when timer hits 0
 * @param {boolean}  [opts.paused=false]     - freeze the countdown
 * @returns {{ timer: number, reset: () => void, setTimer: (n:number) => void }}
 */
export function useGameTimer({
  duration = 60,
  onComplete,
  paused = false,
} = {}) {
  // Clamp to a positive integer so `00:00` is the true floor
  const safeDuration = Math.max(1, Math.floor(duration));

  const [timer, setTimer] = useState(safeDuration);

  // Keep the latest callback in a ref so the interval below doesn't
  // need it in its dependency array (which would re-create the interval
  // on every parent render).
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Same for duration, in case it changes at runtime.
  const durationRef = useRef(safeDuration);
  useEffect(() => {
    durationRef.current = safeDuration;
  }, [safeDuration]);

  // Manual reset exposed to the parent (e.g. a "skip" button).
  const reset = useCallback(() => {
    setTimer(durationRef.current);
  }, []);

  useEffect(() => {
    if (paused) return undefined;

    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Fire the draw, then restart the round.
          // Wrapped so a throwing callback can't kill the interval.
          try {
            onCompleteRef.current?.();
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[useGameTimer] onComplete threw:', err);
          }
          return durationRef.current;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup: clears the interval on unmount and whenever `paused` flips.
    return () => clearInterval(id);
  }, [paused]);

  return { timer, reset, setTimer };
}