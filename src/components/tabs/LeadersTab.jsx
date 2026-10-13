// components/tabs/LeadersTab.jsx

import React from 'react';

/**
 * Placeholder leaderboard used until real data is wired in.
 * Shaped exactly like the real thing will be, so swapping the source
 * is a one-line change at the call site — no component edits.
 */
export const PLACEHOLDER_LEADERS = [
  { id: 'u-7891',  name: 'User_7891',  win: 1450 },
  { id: 'u-king',  name: 'KenoKing',   win: 920 },
  { id: 'u-lucky', name: 'LuckyPick',  win: 500 },
];

/**
 * "Leaders" tab content.
 *
 * Ranked list of top winners. Medal emoji for the top three, plain
 * rank number for the rest. Renders nothing but rows — no fetches,
 * no derived sorting (the caller owns rank order).
 *
 * @param {Object}   props
 * @param {Array}    [props.leaders]     - [{ id, name, win }], rank order
 * @param {boolean}  [props.loading]     - show skeleton state
 * @param {number}   [props.maxRows]     - optional cap
 * @param {string}   [props.className]
 */
export default function LeadersTab({
  leaders = PLACEHOLDER_LEADERS,
  loading = false,
  maxRows,
  className = '',
}) {
  if (loading) return <LeadersSkeleton className={className} />;

  const list = Array.isArray(leaders) ? leaders : [];
  const capped = typeof maxRows === 'number' ? list.slice(0, maxRows) : list;

  if (capped.length === 0) {
    return (
      <p className={`text-xs text-slate-500 text-center py-2 font-mono ${className}`}>
        No leaders yet.
      </p>
    );
  }

  return (
    <div className={`text-xs space-y-1.5 ${className}`}>
      {capped.map((leader, i) => (
        <LeaderRow key={leader.id ?? i} rank={i + 1} leader={leader} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Row
   ───────────────────────────────────────────── */

function LeaderRow({ rank, leader }) {
  return (
    <div className="flex justify-between items-center bg-[#182030] px-2 py-1.5 rounded border border-slate-700/40">
      <span className="text-slate-300 font-medium truncate min-w-0">
        <span className="text-slate-500 font-mono mr-1 tabular-nums">
          {rankGlyph(rank)}
        </span>
        {leader.name}
      </span>

      <span className="text-emerald-400 font-bold font-mono tabular-nums whitespace-nowrap ml-2">
        {formatWin(leader.win)}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

/**
 * Medal for the top three, plain "#N" for the rest.
 * Keeps the list scannable without a separate column.
 */
function rankGlyph(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

/**
 * Accept either a number (1450) or a pre-formatted string
 * ("ETB 1,450.00") so the component works with both shapes.
 */
function formatWin(win) {
  if (typeof win === 'string') return win;
  if (!Number.isFinite(win)) return '—';
  return `ETB ${win.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ─────────────────────────────────────────────
   Skeleton
   ───────────────────────────────────────────── */

function LeadersSkeleton({ className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`} aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-7 bg-[#182030] rounded animate-pulse border border-slate-700/30"
        />
      ))}
    </div>
  );
}