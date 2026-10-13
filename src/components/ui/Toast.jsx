// components/ui/Toast.jsx

import React from 'react';

/**
 * Floating pill notification.
 *
 * Renders nothing when `message` is null/undefined/empty — the caller
 * controls visibility entirely via state. No timers, no auto-dismiss,
 * no local state.
 *
 * @param {Object}   props
 * @param {string|null} props.message   - toast text; falsy = hidden
 * @param {string}   [props.className]  - extra positioning classes
 */
export default function Toast({ message, className = '' }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20 animate-bounce text-center max-w-[85%] ${className}`}
    >
      {message}
    </div>
  );
}