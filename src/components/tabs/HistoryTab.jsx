// components/tabs/HistoryTab.jsx

import React from 'react';
import { formatETB } from '../../utils/formatters';

/**
 * "History" tab content.
 *
 * Renders settled tickets (from `gameHistory`) in newest-first order —
 * the store already prepends, so this component does not re-sort.
 *
 * Win/loss is derived from the ticket status string, but a `payout`
 * field takes priority when present (more robust than string matching).
 *
 * @param {Object}   props
 * @param {Array}    props.gameHistory
 * @param {string}   [props.className]
 */
export default function HistoryTab({ gameHistory = [], className = '' }) {
  if (gameHistory.length === 0) {
    return (
      <p className={`text-xs text-slate-500 text-center py-2 font-mono ${className}`}>
        No past games played yet.
      </p>
    );
  }

  return (
    <div className={`space-y-1 max-h-36 overflow-y-auto ${className}`}>
      {gameHistory.map((item, idx) => (
        <HistoryRow key={item.id ?? idx} ticket={item} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Row
   ───────────────────────────────────────────── */

function HistoryRow({ ticket }) {
  const won = isWinner(ticket);
  const sortedPicks = Array.isArray(ticket.picks)
    ? [...ticket.picks].sort((a, b) => a - b)
    : [];

  return (
    <div className="flex justify-between items-center text-xs bg-[#182030] p-2 rounded border border-slate-700/40">
      <div className="min-w-0 flex-1">
        <p className="text-slate-300 font-semibold tabular-nums">
          Bet: {formatETB(ticket.bet)}
        </p>
        <p className="text-[10px] text-slate-400 truncate">
          Picks: {sortedPicks.join(', ')}
        </p>
        {typeof ticket.matches === 'number' && (
          <p className="text-[10px] text-slate-500">
            Matches: {ticket.matches}
          </p>
        )}
      </div>

      <span
        className={`font-bold text-xs whitespace-nowrap ml-2 ${
          won ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {ticket.status}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Win/loss detection
   ───────────────────────────────────────────── */

/**
 * Determine whether a settled ticket was a winner.
 *
 * Prefers a numeric `payout` field if present; falls back to matching
 * the status string. Both paths are covered because different parts of
 * the app write tickets slightly differently (the store writes
 * `Won ETB X` or `Lost`).
 *
 * @param {Object} ticket
 * @returns {boolean}
 */
function isWinner(ticket) {
  if (typeof ticket?.payout === 'number') {
    return ticket.payout > 0;
  }
  return typeof ticket?.status === 'string' && ticket.status.startsWith('Won');
}