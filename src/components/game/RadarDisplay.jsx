// components/game/RadarDisplay.jsx

import React from 'react';
import { formatCountdown } from '../../utils/formatters';

// Maximum number of drawn numbers we render in the strip.
// Keeps the UI bounded — the game never reveals more than 20.
const MAX_BALLS = 20;

/**
 * Radar screen.
 *
 * Idle:   countdown clock (HH:MM)
 * Drawing / settled:
 *   - Large "current number" ball (last drawn) in the top-right
 *   - Wrapping grid of the most recent numbers (up to 20),
 *     newest first, flowing right-to-left with new rows on top
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

  const hasNumbers = Array.isArray(drawnNumbers) && drawnNumbers.length > 0;

  // Derived values. Both are null / empty-safe.
  const currentNumber = hasNumbers
    ? drawnNumbers[drawnNumbers.length - 1]
    : null;

  // Newest first, capped at MAX_BALLS.
  const recentNumbers = hasNumbers
    ? drawnNumbers.slice(-MAX_BALLS).reverse()
    : [];

  return (
    <div
      className={`relative h-auto min-h-[144px] bg-[#090d16] rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner ${className}`}
    >
      <RadarRings />

      {showDrawView ? (
        <DrawStage
          currentNumber={currentNumber}
          recentNumbers={recentNumbers}
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

function DrawStage({ currentNumber, recentNumbers }) {
  return (
    <div className="relative z-10 w-full px-3 pt-2 pb-3">
      {/* Current number — large ball, top-right.
          Kept in normal flow via a spacer row so it never overlaps
          the ball grid below. */}
      <div className="flex items-start justify-end h-[68px] pr-[14%]">
        {currentNumber !== null && (
          <div
            className="w-[60px] h-[60px] rounded-full grid place-items-center border-2 border-slate-500/70 text-slate-50 text-3xl font-extrabold tabular-nums"
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
      </div>

      {/* Wrapping ball grid.
          flex-row-reverse + flex-wrap-reverse:
            - newest ball sits at the right edge of the bottom row
            - subsequent balls flow leftward
            - once a row fills, the next row appears above it
          This keeps the visual anchor (newest) at the bottom-right and
          lets older draws scroll upward, matching the original strip. */}
      <div
        className="flex flex-row-reverse flex-wrap-reverse items-center justify-start gap-[clamp(6px,2vw,20px)]"
        aria-label="Recent drawn numbers"
      >
        {recentNumbers.map((num, index) => (
          <RecentBall key={`${num}-${index}`} num={num} latest={index === 0} />
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