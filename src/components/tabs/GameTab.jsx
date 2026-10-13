// components/tabs/GameTab.jsx

import React from 'react';
import { formatETB } from '../../utils/formatters';

/**
 * "Game" tab content.
 *
 * Shows a 3-cell summary (All / My Ticket / My Bets) and, below it, the
 * list of currently-pending tickets. Settled tickets live in `gameHistory`
 * and are not rendered here.
 *
 * Stateless. Reads only `activeTickets` and `gameHistory` from props.
 *
 * @param {Object}   props
 * @param {Array}    props.activeTickets   - pending tickets
 * @param {Array}    props.gameHistory     - settled tickets (for the count)
 * @param {number}   [props.allCount=0]    - optional "All" figure (e.g. total rounds)
 * @param {string}   [props.className]
 */
export default function GameTab({
  activeTickets = [],
  gameHistory = [],
  allCount = 0,
  className = '',
}) {
  return (
    <div className={className}>
      {/* ── Summary row ── */}
      <div className="grid grid-cols-3 text-center text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 pb-1.5 mb-2">
        <div>All</div>
        <div>My Ticket</div>
        <div>My Bets</div>
      </div>

      <div className="grid grid-cols-3 text-center text-xs font-mono text-slate-300 pb-2">
        <div className="tabular-nums">{allCount}</div>
        <div className="tabular-nums">{activeTickets.length}</div>
        <div className="tabular-nums">{gameHistory.length}</div>
      </div>

      {/* ── Active ticket list ── */}
      {activeTickets.length > 0 ? (
        <div className="space-y-1.5 mt-1">
          {activeTickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      ) : (
        <div className="text-center py-2 text-xs text-slate-500 font-mono">
          No tickets yet.
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Row
   ───────────────────────────────────────────── */

function TicketRow({ ticket }) {
  const sortedPicks = Array.isArray(ticket.picks)
    ? [...ticket.picks].sort((a, b) => a - b)
    : [];

  return (
    <div className="bg-[#182030] p-2 rounded text-xs flex justify-between items-center border border-slate-700/50">
      <div className="min-w-0 flex-1">
        <span className="text-emerald-400 font-bold tabular-nums">
          {formatETB(ticket.bet)}
        </span>
        <span className="text-slate-400 text-[10px] ml-2 truncate">
          [{sortedPicks.join(', ')}]
        </span>
      </div>

      <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-bold whitespace-nowrap ml-2">
        {ticket.status}
      </span>
    </div>
  );
}