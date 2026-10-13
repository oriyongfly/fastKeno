// components/tabs/StatisticsTab.jsx

import React from 'react';

/**
 * "Statistics" tab content.
 *
 * Hot/cold number lists are computed *externally* (see a future
 * `utils/frequencyTracker.js` or a derived selector on `pastDraws`).
 * This component takes them pre-computed and renders them.
 *
 * Stateless. Does not sort, rank, or slice — the caller decides
 * how many numbers to show and in what order.
 *
 * @param {Object}   props
 * @param {number[]} props.hotNumbers   - most frequently drawn (descending)
 * @param {number[]} props.coldNumbers  - least frequently drawn (ascending)
 * @param {string}   [props.className]
 */
export default function StatisticsTab({
  hotNumbers = [],
  coldNumbers = [],
  className = '',
}) {
  const hasHot = Array.isArray(hotNumbers) && hotNumbers.length > 0;
  const hasCold = Array.isArray(coldNumbers) && coldNumbers.length > 0;

  if (!hasHot && !hasCold) {
    return (
      <p className={`text-xs text-slate-500 text-center py-2 font-mono ${className}`}>
        Not enough draw history yet.
      </p>
    );
  }

  return (
    <div className={`text-xs text-slate-300 space-y-2 ${className}`}>
      <StatRow label="Hot Numbers" numbers={hotNumbers} tone="hot" />
      <StatRow label="Cold Numbers" numbers={coldNumbers} tone="cold" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Row
   ───────────────────────────────────────────── */

function StatRow({ label, numbers, tone }) {
  const hasNumbers = Array.isArray(numbers) && numbers.length > 0;

  const valueClass =
    tone === 'hot' ? 'text-emerald-400' : 'text-cyan-400';

  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-slate-400 whitespace-nowrap">{label}:</span>
      {hasNumbers ? (
        <span
          className={`font-mono font-bold tabular-nums truncate text-right ${valueClass}`}
          title={numbers.join(', ')}
        >
          {numbers.join(', ')}
        </span>
      ) : (
        <span className="text-slate-600 font-mono">—</span>
      )}
    </div>
  );
}