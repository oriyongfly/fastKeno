// hooks/useSound.js

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sound manager for the Keno game.
 *
 * Today it only tracks the mute flag — `playSound()` is a safe no-op
 * until an audio backend is registered via `registerSound()`.
 *
 * When you're ready to add audio, either:
 *   a) pass a `soundMap` prop, e.g. { click: '/sfx/click.mp3', win: '/sfx/win.mp3' }
 *   b) call `registerSound(type, urlOrFactory)` once at app start
 *
 * No component that calls `playSound('win')` needs to change either way.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.initialEnabled=true]
 * @param {Record<string, string>} [opts.soundMap] - type -> URL map
 * @param {number}  [opts.volume=0.6]              - 0..1
 * @returns {{
 *   soundEnabled: boolean,
 *   toggleSound: () => void,
 *   setSoundEnabled: (v: boolean) => void,
 *   playSound: (type: string, overrides?: { volume?: number }) => void,
 *   registerSound: (type: string, url: string) => void,
 *   preload: () => void,
 * }}
 */
export function useSound({
  initialEnabled = true,
  soundMap = {},
  volume = 0.6,
} = {}) {
  const [soundEnabled, setSoundEnabled] = useState(initialEnabled);

  // Keep enabled state in a ref so `playSound` can stay stable (useCallback [])
  // and still read the latest value without re-creating on every toggle.
  const enabledRef = useRef(soundEnabled);
  useEffect(() => {
    enabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Mutable registry of type -> HTMLAudioElement (lazily created).
  const registryRef = useRef(new Map());

  // Seed the registry from the initial soundMap (if any).
  useEffect(() => {
    for (const [type, url] of Object.entries(soundMap)) {
      ensureAudio(type, url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  /**
   * Lazily create + cache an HTMLAudioElement for a given type.
   * Returns null in non-browser environments (SSR, tests).
   */
  const ensureAudio = useCallback((type, url) => {
    if (!type || !url) return null;
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
      return null;
    }
    const map = registryRef.current;
    if (map.has(type)) return map.get(type);

    try {
      const audio = new window.Audio(url);
      audio.preload = 'auto';
      audio.volume = clamp01(volume);
      map.set(type, audio);
      return audio;
    } catch {
      return null;
    }
  }, [volume]);

  /**
   * Register (or replace) a sound for a given event type.
   * Safe to call repeatedly — replaces the cached element.
   */
  const registerSound = useCallback((type, url) => {
    if (!type || !url) return;
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') return;

    try {
      const audio = new window.Audio(url);
      audio.preload = 'auto';
      audio.volume = clamp01(volume);
      registryRef.current.set(type, audio);
    } catch {
      // swallow — sound is a progressive enhancement, never a hard failure
    }
  }, [volume]);

  /**
   * Eagerly load every registered sound. Optional — call on first
   * user gesture to sidestep browser autoplay policies.
   */
  const preload = useCallback(() => {
    for (const audio of registryRef.current.values()) {
      try {
        audio.load();
      } catch {
        // ignore
      }
    }
  }, []);

  /**
   * Play a registered sound. No-op when:
   *   - muted (soundEnabled === false)
   *   - type not registered
   *   - running outside a browser
   *
   * Clones the audio node so overlapping plays don't cut each other off
   * (e.g. two "win" sounds within a second).
   *
   * @param {string} type
   * @param {{ volume?: number }} [overrides]
   */
  const playSound = useCallback((type, overrides = {}) => {
    // 1. Mute gate — the entire point of this hook
    if (!enabledRef.current) return;

    const base = registryRef.current.get(type);
    if (!base) return;

    const vol = clamp01(
      typeof overrides.volume === 'number' ? overrides.volume : base.volume
    );

    try {
      // Clone so rapid-fire triggers don't cancel each other.
      const node = base.cloneNode();
      node.volume = vol;
      // play() returns a promise that rejects if the browser blocks it.
      const p = node.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay blocked — silently ignore */ });
      }
    } catch {
      // never let audio break game flow
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const next = !v;
      enabledRef.current = next; // keep ref in sync immediately
      return next;
    });
  }, []);

  // Optional: pause all cached audio on unmount so it doesn't keep
  // playing if the component tree goes away.
  useEffect(() => {
    const map = registryRef.current;
    return () => {
      for (const audio of map.values()) {
        try {
          audio.pause();
          audio.src = '';
        } catch {
          // ignore
        }
      }
      map.clear();
    };
  }, []);

  return {
    soundEnabled,
    toggleSound,
    setSoundEnabled,
    playSound,
    registerSound,
    preload,
  };
}

// ─────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// ─────────────────────────────────────────────
// Suggested sound-type constants
// Import these anywhere you call playSound so strings stay typo-proof.
// ─────────────────────────────────────────────
export const SFX = Object.freeze({
  CLICK: 'click',
  PLACE_BET: 'placeBet',
  DRAW_TICK: 'drawTick',
  WIN: 'win',
  LOSE: 'lose',
  ERROR: 'error',
});