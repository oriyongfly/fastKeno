// components/game/InfoPanels.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PAYOUT_TABLE, MAX_PICKS } from '../../constants/gameConfig';

/**
 * Two-panel hint strip that replaces the old static PicksCounter.
 *
 *   "choose" panel — "Choose 10 numbers / From 1 to 80" + Help button.
 *                    Visible when no picks are selected.
 *   "win"    panel — "N Possible win X" + match/pays grid + pick slots.
 *                    Visible when picks.length > 0.
 *
 * Slide behaviour (from FastKeno's InfoPanels):
 *   - While picking: switching modes is a hard cut (no transition).
 *   - After BET ACCEPTED: the win panel slides out left, the choose
 *     panel slides in from the right — 300ms ease-out.
 *
 * Fixed height (88px) so the board below never reflows during the slide.
 *
 * @param {Object}   props
 * @param {number[]} props.picks                  - currently selected numbers
 * @param {boolean}  [props.slide]                - external override; if
 *                                                  omitted, derived from betState
 * @param {string}   [props.betState="idle"]      - "idle" | "wait" | "accepted"
 * @param {number}   [props.maxPicks=MAX_PICKS]
 * @param {string}   [props.className]
 */
export default function InfoPanels({
  picks = [],
  slide: slideProp,
  betState = 'idle',
  maxPicks = MAX_PICKS,
  className = '',
}) {
  // ── Slide trigger ─────────────────────────────────────────────
  // If the caller passes `slide`, honor it verbatim (useful for the
  // demo's manual "Replay" button). Otherwise derive it from betState:
  // slide ON while phase === "accepted", OFF on the next tick.
  const derivedSlide = useDerivedSlide(betState);
  const slide = slideProp !== undefined ? slideProp : derivedSlide;

  const mode = picks.length ? 'win' : 'choose';

  // FastKeno uses a 300ms ease-out; we only enable the transition when
  // `slide` is true so the idle mode-switch stays a hard cut.
  const motion = slide
    ? 'transition-transform duration-300 ease-out motion-reduce:transition-none'
    : '';

  // ── Pay table slice ───────────────────────────────────────────
  // Clamp the pick-count into the table's known keys so a 0-pick or
  // 10-pick selection can't crash the lookup. Falls back to {} if the
  // table has no entry for this count.
  const table = useMemo(() => {
    const n = Math.min(Math.max(picks.length, 1), maxPicks);
    return PAYOUT_TABLE?.[n] ?? {};
  }, [picks.length, maxPicks]);

  const matchKeys = useMemo(() => Object.keys(table), [table]);
  const maxPayout = matchKeys.length
    ? Math.max(...matchKeys.map((k) => table[k]))
    : 0;

  return (
    <div
      className={`relative mx-2 mt-1 h-[88px] overflow-hidden rounded-lg bg-zinc-800/90 ${className}`}
    >
      {/* ── choose panel ─────────────────────────────────────── */}
      <div
        className={`absolute inset-0 flex items-center gap-3 px-4 ${motion} ${
          mode === 'choose' ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={mode !== 'choose'}
      >
        {/* decorative 80 / 10 balls */}
        <div className="absolute left-2 top-1 flex items-center gap-0.5">
          <MiniBall n={80} size="sm" />
          <MiniBall n={10} size="lg" />
        </div>

        <div className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-900/70 ring-2 ring-emerald-400/60">
          <div className="h-5 w-0.5 -rotate-45 rounded bg-emerald-300" />
        </div>
        <div className="mt-3 leading-tight">
          <div className="text-xl font-bold text-white">
            Choose {maxPicks} numbers
          </div>
          <div className="text-sm font-semibold text-emerald-400">
            From 1 to 80
          </div>
        </div>
        <Help />
      </div>

      {/* ── pay-table panel ──────────────────────────────────── */}
      <div
        className={`absolute inset-0 px-3 pt-1.5 ${motion} ${
          mode === 'win' ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={mode !== 'win'}
      >
        <div className="text-sm font-semibold text-slate-100">
          {picks.length} Possible win{' '}
          <span className="text-emerald-400">{maxPayout}</span>
        </div>

        <div className="mt-0.5 grid grid-cols-[44px_repeat(10,1fr)] gap-y-0.5 text-[10px] text-slate-400">
          <span>Match</span>
          {matchKeys.map((k) => (
            <span key={k} className="text-center text-slate-200">
              {k}
            </span>
          ))}
          {Array.from({ length: 10 - matchKeys.length }, (_, k) => (
            <span key={`m${k}`} />
          ))}

          <span>Pays</span>
          {matchKeys.map((k) => (
            <span key={k} className="text-center font-semibold text-emerald-400">
              x{table[k]}
            </span>
          ))}
        </div>

        <div className="mt-1 flex gap-1">
          {Array.from({ length: 10 }, (_, k) => (
            <div
              key={k}
              className="flex h-6 flex-1 items-center justify-center rounded bg-zinc-700 text-[11px] font-semibold text-slate-100 empty:bg-zinc-900/60"
            >
              {picks[k]}
            </div>
          ))}
        </div>

        <Help />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide derivation
   ───────────────────────────────────────────── */

/**
 * Derives the slide flag from the store's betState transitions.
 *
 * The store (Step 1) schedules:
 *   idle → wait        (immediately on placeBet)
 *   wait → accepted    (after 450ms)
 *   accepted → idle    (after another 600ms)
 *
 * We want the slide to run once, during "accepted", and then flip
 * back off so the choose panel is showing again when the grid clears.
 * A short trailing delay (250ms) lets the 300ms slide finish before
 * we tear down the transition class.
 */
function useDerivedSlide(betState, trailingMs = 250) {
  const [slide, setSlide] = useState(false);
  const wasAccepted = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (betState === 'accepted' && !wasAccepted.current) {
      wasAccepted.current = true;
      setSlide(true);

      // Kick the slide back off once the accepted phase is over.
      timeoutRef.current = setTimeout(() => {
        setSlide(false);
        wasAccepted.current = false;
      }, 300 + trailingMs);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [betState, trailingMs]);

  return slide;
}

/* ─────────────────────────────────────────────
   Bits
   ───────────────────────────────────────────── */

function MiniBall({ n, size = 'sm' }) {
  const sizeCls =
    size === 'lg' ? 'h-6 w-6 text-[10px]' : 'h-4 w-4 text-[7px]';
  return (
    <div
      className={`flex select-none items-center justify-center rounded-full font-bold tabular-nums text-slate-100 ring-1 ring-sky-900/80 shadow-[inset_0_5px_6px_rgba(255,255,255,0.22)] bg-gradient-to-b from-slate-700 to-slate-950 ${sizeCls}`}
    >
      {n}
    </div>
  );
}

function Help() {
  return (
    <button
      type="button"
      aria-label="Help"
      onClick={() => {
        /* no-op for now */
      }}
      className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/60 text-[11px] font-bold text-emerald-400"
    >
      ?
    </button>
  );
}