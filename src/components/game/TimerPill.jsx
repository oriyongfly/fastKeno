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
  className={`text-center text-4xl font-mono font-bold text-emerald-400 tracking-wider drop-shadow-[0_0_12px_rgba(52,211,153,0.8)] ${className}`}
>
  {formatCountdown(timer)}
</div>

  );
}