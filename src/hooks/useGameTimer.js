// hooks/useGameTimer.js

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 60-second round countdown.
 *
 * Counts down once per second. When it reaches zero it:
 *   1. resets itself to `duration`
 *   2. schedules `onComplete()` (the draw trigger) on the next tick
 *
 * The interval is created ONCE on mount and cleared on unmount — no
 * re-subscription when the parent re-renders. The callback is stored in
 * a ref, so passing a new function each render is safe.
 *
 * `onComplete` is deliberately invoked via `setTimeout(fn, 0)` rather
 * than inline inside the `setTimer` functional updater. The updater
 * runs during React's render phase, and `onComplete` (runDraw) triggers
 * store writes + parent state updates — calling it there produces the
 * "Cannot update a component while rendering a different component"
 * warning. Deferring to a macrotask lets the state update commit first.
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
      // Read the current value outside the functional updater so we
      // can decide synchronously whether the round is over.
      setTimer((prev) => {
        if (prev <= 1) return durationRef.current;
        return prev - 1;
      });
    }, 1000);

    // Cleanup: clears the interval on unmount and whenever `paused` flips.
    return () => clearInterval(id);
  }, [paused]);

  // Fire onComplete whenever the timer lands on a fresh `duration`
  // value *after* having counted down — i.e. the moment a round ends
  // and restarts. This effect runs post-render, so it's a safe place
  // to invoke parent callbacks that trigger their own state updates.
  //
  // We detect a round-end by watching for `timer === safeDuration`
  // transitioning from a lower value. A ref tracks the previous tick
  // so we don't fire on mount (when timer is initialized to duration).
  const prevTimerRef = useRef(timer);
  useEffect(() => {
    const prev = prevTimerRef.current;
    prevTimerRef.current = timer;

    // Round-end: we just wrapped from 1 → duration.
    if (timer === durationRef.current && prev !== durationRef.current) {
      // Defer one macrotask so the reset state commit lands first,
      // then invoke the draw trigger.
      const id = setTimeout(() => {
        try {
          onCompleteRef.current?.();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[useGameTimer] onComplete threw:', err);
        }
      }, 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [timer]);

  return { timer, reset, setTimer };
}