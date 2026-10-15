// components/tabs/GameTab.jsx

import React from 'react';
import { formatETB } from '../../utils/formatters';

/**
 * "Game" tab content.
 *
 * Top:   single inline summary row — All / My Tickets / My Bets,
 *        matching FastKeno's `flex justify-between text-[10px]` bar.
 * Below: the list of currently-pending tickets, each rendered as a
 *        card with ten number cells. Cells whose number appears in
 *        `drawnNumbers` turn green.
 *
 * Stateless. Reads `activeTickets`, `gameHistory`, and `drawnNumbers`
 * from props.
 *
 * @param {Object}   props
 * @param {Array}    props.activeTickets       - pending tickets
 * @param {Array}    props.gameHistory         - settled tickets (for the count)
 * @param {number[]} [props.drawnNumbers=[]]   - numbers drawn this round, for hits
 * @param {number}   [props.allCount=0]        - optional "All" figure
 * @param {string}   [props.className]
 */
export default function GameTab({
  activeTickets = [],
  gameHistory = [],
  drawnNumbers = [],
  allCount = 0,
  className = '',
}) {
  // O(1) membership check, shared across all ticket cards.
  const drawnSet = React.useMemo(
    () => new Set(drawnNumbers),
    [drawnNumbers]
  );

  return (
    <div className={className}>
      {/* ── Summary row — single inline bar, FastKeno-style ── */}
      <div className="flex justify-between px-1 py-1 text-[10px] text-slate-400">
        <span>
          All <b className="text-emerald-400">{allCount}</b>
        </span>
        <span>
          My Tickets <b className="text-slate-200">{activeTickets.length}</b>
        </span>
        <span>
          My Bets <b className="text-slate-200">{gameHistory.length}</b>
        </span>
      </div>

      {/* ── Active ticket list ── */}
      {activeTickets.length > 0 ? (
        <div className="space-y-1.5 mt-1.5">
          {activeTickets.map((t) => (
            <TicketCard key={t.id} ticket={t} drawnSet={drawnSet} />
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
   Ticket card
   ───────────────────────────────────────────── */

/**
 * A single pending ticket, rendered as a FastKeno-style card:
 *
 *   ┌──────────────────────────────────┐
 *   │ 3 My Ticket                       │  ← emerald ID
 *   │ [20][30][50][68][ ][ ][ ][ ][ ][ ]│  ← 10 cells, hits green
 *   │ Bet 1                    Waiting  │  ← footer
 *   └──────────────────────────────────┘
 *
 * Picks are padded to ten cells; empty cells render as dark slots.
 * A cell turns green when its number is in `drawnSet`.
 */
function TicketCard({ ticket, drawnSet }) {
  const picks = Array.isArray(ticket.picks) ? ticket.picks : [];

  // FastKeno labels numeric ids as "N My Ticket". Non-numeric ids
  // (e.g. "4**f") are shown verbatim.
  const idLabel =
    typeof ticket.id === 'number' ? `${ticket.id} My Ticket` : ticket.id;

  return (
    <div className="rounded-md bg-zinc-800/80 px-2 pb-1.5 pt-1">
      {/* Header — ticket id */}
      <div className="text-[11px] font-semibold text-emerald-400">
        {idLabel}
      </div>

      {/* Number row — always ten cells */}
      <div className="mt-1 flex gap-1">
        {Array.from({ length: 10 }, (_, k) => {
          const n = picks[k];
          const hit = n != null && drawnSet.has(n);

          return (
            <div
              key={k}
              className={[
                'flex h-7 flex-1 items-center justify-center rounded text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none',
                n == null
                  ? 'bg-zinc-900/60'
                  : hit
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-700 text-slate-200',
              ].join(' ')}
            >
              {n}
            </div>
          );
        })}
      </div>

      {/* Footer — bet on the left, status on the right.
          Only pending tickets are ever rendered here, so "Waiting"
          is unconditional. */}
      <div className="mt-1 flex justify-between text-[10px] font-semibold">
        <span className="text-slate-200">
          Bet {formatETB(ticket.bet)}
        </span>
        <span className="text-yellow-400">Waiting</span>
      </div>
    </div>
  );
}