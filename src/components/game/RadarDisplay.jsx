// components/game/RadarDisplay.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatCountdown } from '../../utils/formatters';
import { NUMBERS_DRAWN } from '../../constants/gameConfig';

// Maximum number of drawn numbers we render in the strip.
const MAX_BALLS = 20;

// Ball animation timings, copied from FastKeno.jsx.
//   enter : mount at scale 0.5 / opacity 0.4 (no transition)
//   show  : pop to scale 1 (300ms, overshoot easing)
//   fly   : move to tray slot & shrink to 0.4 (350ms ease-in)
const T = { enter: 300, hold: 350, fly: 350 };

// Delay before "TRY AGAIN" fades in after the last ball lands.
const TRY_AGAIN_DELAY_MS = 300;

// ── Stage geometry ─────────────────────────────────────────────
// Fixed so slot(i) is computable without a DOM read. All values are
// inside a h-[208px] position:relative stage, matching FastKeno.
const STAGE_H = 208;
const CENTER_Y = 80;          // big ball's vertical center
const TRAY_TOP_LOWER = 184;   // y of the lower tray row
const TRAY_TOP_UPPER = 148;   // y of the upper tray row
const TRAY_LEFT_BASE = 5.6;   // % left of the first column
const TRAY_LEFT_STEP = 7.77;  // % left per column

// Exact pixel slot for tray index i (0 = first landed, 19 = last).
// Lower row fills first; once it's full, the upper row fills.
const slot = (i) => ({
  left: `${TRAY_LEFT_BASE + (i % 10) * TRAY_LEFT_STEP}%`,
  top: i < 10 ? TRAY_TOP_LOWER : TRAY_TOP_UPPER,
});

// ── Ball backgrounds ───────────────────────────────────────────
// Two variants, used by both CenterBall and TrayBall so the swap
// from flying → landed is colour-identical for a given hit state.
const BG_DARK = 'radial-gradient(circle at 35% 22%, #607985, #15252e 68%)';
const BG_HIT  = 'radial-gradient(circle at 35% 22%, #34d399, #059669 68%)';

/**
 * Radar screen.
 *
 * Renders nothing unless a draw is in progress or there are drawn
 * numbers to show. When it does render:
 *
 *   - Fixed 208px stage with rotating arc rings + teal glow backdrop
 *   - Ball-count indicator (XX / 20) in the top-right
 *   - Large center ball for the most recently revealed number, which
 *     pops in at the stage center and flies to its exact tray slot
 *   - Fixed two-row tray of landed balls (up to 20)
 *   - Balls light up green when their number was on an active ticket
 *   - "TRY AGAIN" banner fades in after the final ball lands
 *
 * The flying ball is keyed on the draw count, so each new number gets
 * a fresh DOM node and the `enter` phase runs from scratch — mirroring
 * FastKeno's <DrawBall key={seq.i}>.
 *
 * @param {Object}   props
 * @param {boolean}  props.isDrawing
 * @param {number}   props.timer              - seconds remaining (unused)
 * @param {number[]} props.drawnNumbers       - numbers revealed so far
 * @param {number[]} [props.pickedNumbers=[]] - numbers on active tickets
 * @param {string}   [props.className]
 */
export default function RadarDisplay({
  isDrawing,
  timer,
  drawnNumbers = [],
  pickedNumbers = [],
  className = '',
}) {
  const totalDrawn = Array.isArray(drawnNumbers) ? drawnNumbers.length : 0;
  const showDrawView = isDrawing || totalDrawn > 0;

  const currentNumber = totalDrawn > 0 ? drawnNumbers[totalDrawn - 1] : null;

  // Balls already landed in the tray — everything except the one in
  // flight. This is FastKeno's seq.tray = draw.slice(0, i).
  const landedNumbers =
    totalDrawn > 0 ? drawnNumbers.slice(0, totalDrawn - 1) : [];

  // O(1) membership check for "did the player pick this number?".
  const pickedSet = useMemo(() => new Set(pickedNumbers), [pickedNumbers]);

  // Per-ball phase for the center ball, keyed off length changes.
  const phase = useDrawBallPhase(totalDrawn);

  // "TRY AGAIN" banner: shown 300ms after the last ball lands.
  const drawComplete = totalDrawn >= NUMBERS_DRAWN && !isDrawing;
  const showTryAgain = useDelayedFlag(drawComplete, TRY_AGAIN_DELAY_MS);

  // Nothing to show — collapse entirely. The parent's
  // `{!isDrawing && …}` already hides the betting UI during a draw,
  // so an idle RadarDisplay is pure dead space.
  if (!showDrawView) return null;

  return (
    <div
      className={`relative h-[208px] bg-[#090d16] rounded-xl border border-slate-800 overflow-hidden shadow-inner ${className}`}
    >
      <StageBackdrop />
      <DrawStage
        currentNumber={currentNumber}
        currentPhase={phase}
        landedNumbers={landedNumbers}
        totalDrawn={totalDrawn}
        showTryAgain={showTryAgain}
        pickedSet={pickedSet}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Per-ball animation phase
   ───────────────────────────────────────────── */

function useDrawBallPhase(drawnCount) {
  const [phase, setPhase] = useState('enter');
  const prevCount = useRef(drawnCount);

  useEffect(() => {
    if (drawnCount === prevCount.current) return;
    prevCount.current = drawnCount;

    setPhase('enter');

    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase('show'))
    );
    const t1 = setTimeout(() => setPhase('fly'), T.enter + T.hold);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
    };
  }, [drawnCount]);

  return phase;
}

function useDelayedFlag(active, delayMs) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) {
      setOn(false);
      return;
    }
    const id = setTimeout(() => setOn(true), delayMs);
    return () => clearTimeout(id);
  }, [active, delayMs]);
  return on;
}

/* ─────────────────────────────────────────────
   Backdrop
   ───────────────────────────────────────────── */

function StageBackdrop() {
  const rings = [
    { size: 150, dur: '14s', rev: false },
    { size: 210, dur: '20s', rev: true },
    { size: 270, dur: '28s', rev: false },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(16,185,129,0.38),transparent_62%)]" />
      {rings.map((r) => (
        <div
          key={r.size}
          style={{
            width: r.size,
            height: r.size,
            top: CENTER_Y - r.size / 2,
            animationDuration: r.dur,
            animationDirection: r.rev ? 'reverse' : 'normal',
          }}
          className="absolute left-1/2 -ml-[1px] -translate-x-1/2 animate-spin rounded-full border-2 border-emerald-400/20 border-b-transparent border-l-transparent motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Views
   ───────────────────────────────────────────── */

function DrawStage({
  currentNumber,
  currentPhase,
  landedNumbers,
  totalDrawn,
  showTryAgain,
  pickedSet,
}) {
  return (
    <div className="relative z-10 h-full">
      {/* Ball-count indicator — top-right, "XX / 20" */}
      <div
        className="absolute right-3 top-2 text-[11px] font-semibold tabular-nums text-slate-300"
        aria-label={`${totalDrawn} of ${NUMBERS_DRAWN} balls drawn`}
      >
        {String(totalDrawn).padStart(2, '0')}{' '}
        <span className="text-emerald-400">/</span> {NUMBERS_DRAWN}
      </div>

      {/* "TRY AGAIN" overlay */}
      <TryAgainBanner show={showTryAgain} />

      {/* Landed tray balls — absolute slots, one per index. */}
      {landedNumbers.map((num, i) => (
        <TrayBall
          key={i}
          num={num}
          index={i}
          hit={pickedSet.has(num)}
        />
      ))}

      {/* Flying ball — keyed on totalDrawn so each new number remounts,
          which is what makes the `enter` phase fire reliably. */}
      {currentNumber !== null && (
        <CenterBall
          key={totalDrawn}
          num={currentNumber}
          phase={currentPhase}
          index={totalDrawn - 1}
          hit={pickedSet.has(currentNumber)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Balls
   ───────────────────────────────────────────── */

/**
 * The flying ball, animated through enter → show → fly.
 *
 *   enter : at stage center, scale 0.5, opacity 0.4, no transition
 *   show  : at stage center, scale 1,   opacity 1,   300ms overshoot
 *   fly   : to its exact tray slot,     scale 0.4,   opacity 1, 350ms ease-in
 *
 * Opacity stays 1 through `fly` — the ball visibly lands, matching
 * FastKeno. The `key={totalDrawn}` on the parent guarantees a fresh
 * DOM node per ball, so `enter` always runs from the mount state.
 *
 * The ball only lights up green once it has popped to full size:
 * `hit && phase !== 'enter'`. During the ghost enter state it stays
 * dark, matching FastKeno's `hit={MY_NUMS.has(n) && phase !== "enter"}`.
 */
function CenterBall({ num, phase, index, hit = false }) {
  const s = slot(index);
  const isLit = hit && phase !== 'enter';

  const styles = {
    enter: {
      left: '50%',
      top: CENTER_Y,
      opacity: 0.4,
      transform: 'translate(-50%, -50%) scale(0.5)',
      transitionDuration: '0ms',
    },
    show: {
      left: '50%',
      top: CENTER_Y,
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(1)',
      transitionDuration: `${T.enter}ms`,
      transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
    },
    fly: {
      left: s.left,
      top: s.top,
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(0.4)',
      transitionDuration: `${T.fly}ms`,
      transitionTimingFunction: 'cubic-bezier(0.4,0,1,1)',
    },
  };

  return (
    <span
      aria-label={`Current number ${num}${hit ? ', match' : ''}`}
      style={{
        ...styles[phase],
        background: isLit ? BG_HIT : BG_DARK,
        boxShadow: isLit
          ? 'inset 0 3px 5px rgba(255,255,255,0.25), 0 4px 10px rgba(5,150,105,0.6)'
          : 'inset 0 3px 5px rgba(255,255,255,0.17), 0 4px 8px rgba(0,0,0,0.4)',
        position: 'absolute',
        willChange: 'left, top, transform, opacity, background',
      }}
      className="w-[60px] h-[60px] rounded-full grid place-items-center border-2 border-slate-500/70 text-slate-50 text-3xl font-extrabold tabular-nums transition-[left,top,transform,opacity,background,box-shadow] duration-200 ease-out motion-reduce:transition-none"
    >
      {num}
    </span>
  );
}

/**
 * A ball that has landed in the tray.
 *
 * Sized, coloured, and shadowed to match the exact end state of
 * CenterBall's `fly` phase, so the swap from flying ball → tray ball
 * is invisible for a given hit state:
 *
 *   - 26px, matching CenterBall's 60px × scale(0.4) ≈ 24px
 *   - same dark steel or green gradient, depending on `hit`
 *   - same 2px slate border
 *   - same inset/outset shadow offsets
 *   - text-xs (12px), matching CenterBall's scaled-down text-3xl
 */
function TrayBall({ num, index, hit = false }) {
  const s = slot(index);
  return (
    <span
      aria-label={`Drawn number ${num}${hit ? ', match' : ''}`}
      style={{
        left: s.left,
        top: s.top,
        background: hit ? BG_HIT : BG_DARK,
        boxShadow: hit
          ? 'inset 0 3px 5px rgba(255,255,255,0.25), 0 4px 10px rgba(5,150,105,0.6)'
          : 'inset 0 3px 5px rgba(255,255,255,0.17), 0 4px 8px rgba(0,0,0,0.4)',
      }}
      className="absolute w-[26px] h-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center text-slate-50 text-xs font-extrabold border-2 border-slate-500/70 tabular-nums"
    >
      {num}
    </span>
  );
}

/* ─────────────────────────────────────────────
   TRY AGAIN banner
   ───────────────────────────────────────────── */

function TryAgainBanner({ show }) {
  return (
    <div
      className={[
        'pointer-events-none absolute inset-x-0 top-6 z-20 text-center',
        'text-4xl font-extrabold tracking-tight text-emerald-400',
        'transition-opacity duration-200 ease-out motion-reduce:transition-none',
        show ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-live="polite"
    >
      TRY AGAIN
    </div>
  );
}