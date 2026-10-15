// components/game/BetControls.jsx

import React from 'react';
import { BET } from '../../constants/gameConfig';

/**
 * Bet controls: - / value / + / x2 / max, plus the primary BET button.
 *
 * Stateless. The parent owns `betAmount`, `balance`, `betState`, and all
 * clamping logic (including the max-bet edge case — see `handleMaxBet` notes).
 *
 * The primary button cycles through three visual phases, mirroring
 * `BetButton` in FastKeno.jsx:
 *
 *   "idle"      → BET            (disabled if unaffordable or drawing)
 *   "wait"      → WAIT...        (button locked)
 *   "accepted"  → ✓ BET ACCEPTED (button locked)
 *
 * The store's `placeBet` drives the phase transitions; this component
 * only renders what it's told.
 *
 * @param {Object}   props
 * @param {number}   props.betAmount
 * @param {number}   props.balance
 * @param {boolean}  props.isDrawing
 * @param {string}   [props.betState="idle"] - "idle" | "wait" | "accepted"
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
  betState = 'idle',
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

  // Stake row is locked while drawing or while the button is animating.
  const stakeLocked = isDrawing || betState !== 'idle';

  // BET is disabled when:
  //   - a round is in progress,
  //   - the player can't afford the current bet,
  //   - the button is mid-feedback ("wait" / "accepted").
  const canAfford = Number.isFinite(balance) && balance >= betAmount;
  const betDisabled = isDrawing || !canAfford || betState !== 'idle';

  // FastKeno's lit/dim rule: the button lights up whenever it's not
  // sitting idle-and-unaffordable. `wait` and `accepted` stay lit so the
  // state change reads as a colour swap, not a flicker to disabled grey.
  const lit = betState !== 'idle' || (!betDisabled && canAfford);

  return (
    <div className={`space-y-2 pt-1 ${className}`}>
      <div className="flex gap-1.5">
        {/* ── Minus ── */}
        <StepButton
          label="−"
          onClick={onDecrement}
          disabled={stakeLocked}
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
          disabled={stakeLocked}
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
            disabled={stakeLocked}
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
          disabled={stakeLocked}
          aria-label="Set maximum bet"
          className="flex-1 py-2.5 text-xs"
        >
          max
        </StepButton>
      </div>

      {/* ── Main BET button (three-phase, mirrors FastKeno's BetButton) ── */}
      <button
        type="button"
        onClick={onPlaceBet}
        disabled={betDisabled}
        aria-label={
          betState === 'wait'
            ? 'Placing bet'
            : betState === 'accepted'
            ? 'Bet accepted'
            : `Place bet of ${betAmount}`
        }
        aria-live="polite"
        className={[
          'w-full flex items-center justify-center gap-2 rounded-lg',
          'font-black tracking-wider border',
          'transition-colors duration-150 motion-reduce:transition-none',
          'disabled:cursor-not-allowed',
          // sizing: "wait" is base-size, idle/accepted are the big label
          betState === 'wait' ? 'text-base' : 'text-xl',
          'h-12',
          lit
            ? 'bg-emerald-700 text-white border-emerald-400/40'
            : 'bg-emerald-950/70 text-zinc-500 border-emerald-900/60',
        ].join(' ')}
      >
        {betState === 'wait' && 'WAIT...'}

        {betState === 'accepted' && (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-white stroke-[3]"
              aria-hidden="true"
            >
              <path
                d="M4 12l5 5L20 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-base">BET ACCEPTED</span>
          </>
        )}

        {betState === 'idle' && 'BET'}
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