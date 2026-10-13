// components/game/BetControls.jsx

import React from 'react';
import { BET } from '../../constants/gameConfig';

/**
 * Bet controls: - / value / + / x2 / max, plus the primary BET button.
 *
 * Stateless. The parent owns `betAmount`, `balance`, and all clamping
 * logic (including the max-bet edge case — see `handleMaxBet` notes).
 *
 * @param {Object}   props
 * @param {number}   props.betAmount
 * @param {number}   props.balance
 * @param {boolean}  props.isDrawing
 * @param {Function} props.onDecrement
 * @param {Function} props.onIncrement
 * @param {Function} props.onMultiply     - called with the multiplier (e.g. 2)
 * @param {Function} props.onMax
 * @param {Function} props.onPlaceBet
 * @param {number[]} [props.multipliers=BET.MULTIPLIERS]
 * @param {string}   [props.className]
 */
export default function BetControls({
  betAmount,
  balance,
  isDrawing,
  onDecrement,
  onIncrement,
  onMultiply,
  onMax,
  onPlaceBet,
  multipliers = BET.MULTIPLIERS,
  className = '',
}) {
  // Only render the buttons the config asks for. If BET.MULTIPLIERS is
  // [2], we get x2. If it's [2, 5, 10], we get all three. The parent
  // doesn't need to change.
  const multiplierButtons = Array.isArray(multipliers) ? multipliers : [];

  // Disable BET when drawing OR when the player can't afford the current bet.
  const canAfford = Number.isFinite(balance) && balance >= betAmount;
  const betDisabled = isDrawing || !canAfford;

  return (
    <div className={`space-y-2 pt-1 ${className}`}>
      <div className="flex gap-1.5">
        {/* ── Minus ── */}
        <StepButton
          label="−"
          onClick={onDecrement}
          disabled={isDrawing}
          aria-label="Decrease bet"
          className="flex-1 py-2.5 text-lg"
        >
          -
        </StepButton>

        {/* ── Value box ── */}
        <div
          className="flex-1 bg-[#101622] border border-slate-700 rounded-lg flex items-center justify-center text-slate-100 font-bold text-sm tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {betAmount}
        </div>

        {/* ── Plus ── */}
        <StepButton
          label="+"
          onClick={onIncrement}
          disabled={isDrawing}
          aria-label="Increase bet"
          className="flex-1 py-2.5 text-lg"
        >
          +
        </StepButton>

        {/* ── Multiplier buttons (x2, x5, ... from config) ── */}
        {multiplierButtons.map((m) => (
          <StepButton
            key={m}
            label={`x${m}`}
            onClick={() => onMultiply(m)}
            disabled={isDrawing}
            aria-label={`Multiply bet by ${m}`}
            className="flex-1 py-2.5 text-xs"
          >
            x{m}
          </StepButton>
        ))}

        {/* ── Max ── */}
        <StepButton
          label="max"
          onClick={onMax}
          disabled={isDrawing}
          aria-label="Set maximum bet"
          className="flex-1 py-2.5 text-xs"
        >
          max
        </StepButton>
      </div>

      {/* ── Main BET button ── */}
      <button
        type="button"
        onClick={onPlaceBet}
        disabled={betDisabled}
        aria-label={`Place bet of ${betAmount}`}
        className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black tracking-wider text-base py-3.5 rounded-lg shadow-lg shadow-emerald-950/50 border border-emerald-400/40 transition transform active:scale-[0.99] flex items-center justify-center gap-2"
      >
        BET
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared small button
   ───────────────────────────────────────────── */

function StepButton({ onClick, disabled, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#182030] hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}