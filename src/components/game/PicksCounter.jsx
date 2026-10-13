// components/game/PicksCounter.jsx

import React from 'react';

/**
 * Picks counter bar: "Picks: X/10" plus the sorted selected numbers.
 *
 * Pure display. Does not own state, does not mutate `selectedNumbers`.
 * Sorting happens on a copy so the caller's array is untouched.
 *
 * @param {Object}   props
 * @param {number[]} props.selectedNumbers
 * @param {number}   props.maxPicks         - from gameConfig MAX_PICKS
 * @param {string}   [props.className]
 */
export default function PicksCounter({
  selectedNumbers = [],
  maxPicks,
  className = '',
}) {
  const count = selectedNumbers.length;
  const isFull = count >= maxPicks;

  // Copy before sorting — never mutate the caller's array.
  const sorted = count > 0 ? [...selectedNumbers].sort((a, b) => a - b) : [];

  return (
    <div
      className={`flex justify-between items-center bg-[#121927] px-3 py-1.5 rounded-lg border border-slate-800 ${className}`}
    >
      <span className="text-xs font-mono text-slate-300">
        Picks:{' '}
        <span
          className={`font-bold tabular-nums ${isFull ? 'text-yellow-400' : 'text-emerald-400'}`}
        >
          {count}
        </span>
        <span className="text-slate-500">/{maxPicks}</span>
      </span>

      {count > 0 && (
        <div
          className="text-[11px] text-slate-400 flex gap-1 overflow-x-auto max-w-[200px] no-scrollbar"
          aria-label="Selected numbers"
        >
          {sorted.join(', ')}
        </div>
      )}
    </div>
  );
}