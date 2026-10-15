// components/game/TimerPill.jsx

import React from 'react';
import { formatCountdown } from '../../utils/formatters';

/**
 * Floating countdown pill. Sits between the radar stage and the hint
 * panels, hanging off the stage's bottom edge — port of the timer in
 * FastKeno's SelectView.
 *
 * The pill itself is just the number: "00 : 45". `formatCountdown`
 * owns the MM:SS padding, so this component stays trivial.
 *
 * @param {Object} props
 * @param {number} props.timer        - seconds remaining
 * @param {string} [props.className]
 */
export default function TimerPill({ timer, className = '' }) {
  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      className={[
        'mx-auto mt-1 w-24 rounded-b-xl bg-emerald-950/60 py-0.5',
        'text-center text-[11px] font-bold tabular-nums text-slate-200',
        'shadow-[0_6px_14px_rgba(16,185,129,0.25)]',
        className,
      ].join(' ')}
    >
      {formatCountdown(timer)}
    </div>
  );
}