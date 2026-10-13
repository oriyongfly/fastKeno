// utils/formatters.js

/**
 * Display formatters for the Keno UI.
 * Pure functions — no state, no side effects, no DOM access.
 * Reused across ticket lists, history, toasts, and the balance pill.
 */

// ─────────────────────────────────────────────
// Currency
// ─────────────────────────────────────────────

/**
 * Format a number as ETB currency with exactly 2 decimal places.
 *
 * Always shows 2 decimals (unlike Intl's "auto" minimum), always uses
 * a plain "ETB" prefix to match the app's existing style ("ETB 100.00"),
 * and never renders "-0.00".
 *
 * @param {number|string} value
 * @returns {string} e.g. "ETB 100.00"
 */
export function formatETB(value) {
  const n = toFiniteNumber(value);
  // Guard against -0 (Intl would render "-ETB 0.00" on some locales)
  const safe = Object.is(n, -0) ? 0 : n;
  return `ETB ${safe.toFixed(2)}`;
}

/**
 * Format just the numeric part, no currency prefix.
 * Useful when you want to style "ETB" separately.
 *
 * @param {number|string} value
 * @returns {string} e.g. "100.00"
 */
export function formatAmount(value) {
  const n = toFiniteNumber(value);
  const safe = Object.is(n, -0) ? 0 : n;
  return safe.toFixed(2);
}

// ─────────────────────────────────────────────
// Time
// ─────────────────────────────────────────────

/**
 * Format a timestamp as HH:MM (24-hour).
 * Accepts a Date, epoch ms, or ISO string.
 * Returns "--:--" for invalid input so the UI never shows "Invalid Date".
 *
 * @param {Date|number|string} when
 * @returns {string} e.g. "14:07"
 */
export function formatTime(when) {
  const d = toDate(when);
  if (!d) return '--:--';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format a timestamp as HH:MM:SS (24-hour).
 * @param {Date|number|string} when
 * @returns {string} e.g. "14:07:33"
 */
export function formatTimeWithSeconds(when) {
  const d = toDate(when);
  if (!d) return '--:--:--';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Countdown display: seconds -> "MM:SS".
 * Clamps negatives to "00:00" so a race condition never shows "-1:-3".
 *
 * @param {number} seconds
 * @returns {string} e.g. "00:47"
 */
export function formatCountdown(seconds) {
  const total = Math.max(0, Math.floor(toFiniteNumber(seconds)));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(m)}:${pad(s)}`;
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Coerce to a finite number, defaulting to 0.
 * @param {unknown} v
 * @returns {number}
 */
function toFiniteNumber(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Coerce to a valid Date or return null.
 * @param {Date|number|string} v
 * @returns {Date|null}
 */
function toDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}