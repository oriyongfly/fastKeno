// components/tabs/ResultsTab.jsx

import React from 'react';
import { NUMBERS_DRAWN } from '../../constants/gameConfig';

// Cap how many balls render inline before we collapse to "...".
// The full set is still available via the grid above — this row is a
// summary, not a comprehensive list.
const MAX_INLINE_BALLS = 8;

/**
 * "Results" tab content.
 *
 * Shows the numbers from the most recent draw. The tab is intentionally
 * forward-looking: it only ever displays the *current* `drawnNumbers`,
 * which the store clears at the start of each new round.
 *
 * Stateless. Renders a placeholder when no draw has occurred yet.
 *
 * @param {Object}   props
 * @param {number[]} props.drawnNumbers
 * @param {string}   [props.className]
 */
export default function ResultsTab({ drawnNumbers = [], className = '' }) {
  const hasResults = Array.isArray(drawnNumbers) && drawnNumbers.length > 0;

  return (
    <div className={`text-xs text-slate-400 space-y-2 ${className}`}>
      {/* ── Header ── */}
      <div className="flex justify-between font-semibold border-b border-slate-800 pb-1">
        <span>Draw Time</span>
        <span>Recent Drawn Numbers</span>
      </div>

      {/* ── Row ── */}
      {hasResults ? (
        <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
          <span className="text-slate-500 font-mono text-[10px] whitespace-nowrap">
            Just now
          </span>

          <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
            {drawnNumbers.slice(0, MAX_INLINE_BALLS).map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="bg-emerald-900/60 text-emerald-300 px-1 rounded text-[10px] font-mono tabular-nums"
              >
                {n}
              </span>
            ))}

            {drawnNumbers.length > MAX_INLINE_BALLS && (
              <span className="text-[10px] text-slate-500 tabular-nums">
                +{drawnNumbers.length - MAX_INLINE_BALLS}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-500 text-xs py-2">
          Waiting for next draw finish...
        </p>
      )}
    </div>
  );
}