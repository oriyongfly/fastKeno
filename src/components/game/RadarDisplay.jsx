// components/game/RadarDisplay.jsx

import React from 'react';
import { formatCountdown } from '../../utils/formatters';

// How many recent balls the strip shows. Fixed so empty slots can
// pad the row on the first few reveals.
const RECENT_SLOTS = 9;

/**
 * Radar screen.
 *
 * Idle:   countdown clock (HH:MM)
 * Drawing / settled:
 *   - Large "current number" ball (last drawn)
 *   - 9-slot strip of the most recent numbers, newest first
 *
 * All state is derived from `drawnNumbers` — no internal hooks,
 * no timers, no side effects. Safe on an empty array.
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
  const showDrawView = isDrawing || drawnNumbers.length > 0;

  // Derived values. Both are null / empty-safe.
  const currentNumber =
    Array.isArray(drawnNumbers) && drawnNumbers.length > 0
      ? drawnNumbers[drawnNumbers.length - 1]
      : null;

  const recentNumbers =
    Array.isArray(drawnNumbers) && drawnNumbers.length > 0
      ? drawnNumbers.slice(-RECENT_SLOTS).reverse()
      : [];

  const emptySlots = Math.max(0, RECENT_SLOTS - recentNumbers.length);

  return (
    <div
      className={`relative h-36 bg-[#090d16] rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner ${className}`}
    >
      <RadarRings />

      {showDrawView ? (
        <DrawStage
          currentNumber={currentNumber}
          recentNumbers={recentNumbers}
          emptySlots={emptySlots}
        />
      ) : (
        <ClockView timer={timer} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-views
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

function DrawStage({ currentNumber, recentNumbers, emptySlots }) {
  return (
    <div className="relative z-10 w-full h-full">
      {/* Current number — large ball, right-center */}
      {currentNumber !== null && (
        <div
          className="absolute right-[21%] top-[30px] w-[60px] h-[60px] rounded-full grid place-items-center border-2 border-slate-500/70 text-slate-50 text-3xl font-extrabold tabular-nums"
          style={{
            background:
              'radial-gradient(circle at 35% 22%, #607985, #15252e 68%)',
            boxShadow:
              'inset 0 3px 5px rgba(255,255,255,0.17), 0 4px 8px rgba(0,0,0,0.4)',
          }}
          aria-label={`Current number ${currentNumber}`}
        >
          {currentNumber}
        </div>
      )}

      {/* 9-slot recent strip — pinned to the bottom of the stage */}
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-[clamp(6px,2vw,20px)]">
        {recentNumbers.map((num, index) => (
          <RecentBall key={`${num}-${index}`} num={num} latest={index === 0} />
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <EmptyBall key={`empty-${index}`} />
        ))}
      </div>
    </div>
  );
}

function RecentBall({ num, latest }) {
  return (
    <span
      className={`shrink-0 w-9 h-9 rounded-full grid place-items-center text-slate-50 text-lg font-extrabold border-2 tabular-nums transition-transform duration-150 ${
        latest ? '-translate-y-0.5' : ''
      }`}
      style={{
        background:
          'radial-gradient(circle at 35% 20%, #47dfaa, #006e4e 65%, #033d32)',
        borderColor: '#368a6d',
        boxShadow:
          'inset 0 2px 3px rgba(255,255,255,0.14), 0 2px 3px rgba(0,0,0,0.4)',
      }}
    >
      {num}
    </span>
  );
}

function EmptyBall() {
  return (
    <span
      className="shrink-0 w-9 h-9 rounded-full grid place-items-center text-slate-400/70 text-lg font-extrabold border-2"
      style={{
        background:
          'radial-gradient(circle at 35% 22%, #425f6b, #0b1720 65%)',
        borderColor: '#4b646c',
        boxShadow:
          'inset 0 2px 3px rgba(255,255,255,0.14), 0 2px 3px rgba(0,0,0,0.4)',
      }}
      aria-hidden="true"
    >
      –
    </span>
  );
}