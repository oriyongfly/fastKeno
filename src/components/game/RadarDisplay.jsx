// components/game/RadarDisplay.jsx

import React from 'react';
import { NUMBERS_DRAWN } from '../../constants/gameConfig';
import { formatCountdown } from '../../utils/formatters';

/**
 * Radar screen: countdown clock when idle, live reveal grid when drawing.
 *
 * Stateless. Parent decides *when* to flip `isDrawing`.
 *
 * @param {Object}   props
 * @param {boolean}  props.isDrawing
 * @param {number}   props.timer              - seconds remaining
 * @param {number[]} props.drawnNumbers       - numbers revealed so far
 * @param {string}   [props.className]
 */
export default function RadarDisplay({
  isDrawing,
  timer,
  drawnNumbers = [],
  className = '',
}) {
  const revealed = drawnNumbers.length;
  const total = NUMBERS_DRAWN;

  return (
    <div
      className={`relative h-36 bg-[#090d16] rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner ${className}`}
    >
      <RadarRings />

      {isDrawing ? (
        <DrawView drawnNumbers={drawnNumbers} revealed={revealed} total={total} />
      ) : (
        <ClockView timer={timer} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-views (module-private — not exported)
   ───────────────────────────────────────────── */

function RadarRings() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="w-64 h-64 rounded-full border border-emerald-500 animate-ping"
        style={{ animationDuration: '4s' }}
      />
      <div className="w-48 h-48 rounded-full border border-emerald-400/50 absolute" />
      <div className="w-32 h-32 rounded-full border border-emerald-400/30 absolute" />
      <div className="w-16 h-16 rounded-full border border-emerald-400/20 absolute" />
    </div>
  );
}

function ClockView({ timer }) {
  return (
    <div
      className="z-10 font-mono font-bold text-4xl text-emerald-400 tracking-wider drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]"
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {formatCountdown(timer)}
    </div>
  );
}

function DrawView({ drawnNumbers, revealed, total }) {
  return (
    <div className="z-10 w-full px-3 flex flex-col items-center">
      {/* Status line + count badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-emerald-400 animate-pulse">
          DRAWING NUMBERS
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-950 bg-emerald-500 rounded-full px-1.5 py-0.5 tabular-nums">
          {revealed}/{total}
        </span>
      </div>

      {/*
        Capped, scrollable reveal area.
        - grid-cols-10 matches the main board for visual consistency
        - max-h keeps the radar panel fixed height so the layout below
          never shifts during a draw
        - overflow-y-auto + custom scrollbar fallback
      */}
      <div
        className="w-full max-h-[88px] overflow-y-auto no-scrollbar"
        role="list"
        aria-label="Drawn numbers"
      >
        <div className="grid grid-cols-10 gap-1 p-0.5">
          {drawnNumbers.map((num, i) => (
            <DrawnBall key={`${num}-${i}`} num={num} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DrawnBall({ num }) {
  return (
    <span
      role="listitem"
      className="w-7 h-7 bg-emerald-500 text-slate-950 font-bold text-xs rounded-full flex items-center justify-center shadow-md shadow-emerald-500/40 animate-scale tabular-nums"
    >
      {num}
    </span>
  );
}