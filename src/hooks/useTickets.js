// hooks/useTickets.js

import { useCallback, useRef, useState } from 'react';
import { MIN_PICKS, MAX_PICKS, BET } from '../constants/gameConfig';
import { settleTickets } from '../utils/payoutCalculator';
import { formatTime } from '../utils/formatters';

/**
 * Owns ticket lifecycle + balance.
 *
 * - placeBet(picks, betAmount)  → validates, deducts, appends to activeTickets
 * - evaluateResults(drawn)      → settles all active tickets, credits balance,
 *                                 moves them to history, clears active list
 *
 * Balance lives here because every mutation to it is triggered by a ticket
 * event. Keeps the money trail in one place.
 *
 * @param {Object} [opts]
 * @param {number} [opts.initialBalance=BET.STARTING_BALANCE]
 * @param {(msg: string) => void} [opts.onMessage] - toast bridge (optional)
 * @returns {{
 *   activeTickets: Array,
 *   gameHistory: Array,
 *   balance: number,
 *   placeBet: (picks: number[], betAmount: number) => { ok: boolean, reason?: string, ticket?: Object },
 *   evaluateResults: (drawn: number[]) => { ok: boolean, totalPayout: number, settled: number },
 *   resetBalance: (amount?: number) => void,
 *   setBalance: (updater: number | ((prev: number) => number)) => void,
 * }}
 */
export function useTickets({
  initialBalance = BET.STARTING_BALANCE,
  onMessage,
} = {}) {
  const [balance, setBalance] = useState(initialBalance);
  const [activeTickets, setActiveTickets] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);

  // Keep the latest notify callback in a ref so placeBet/evaluateResults
  // stay stable and don't need it in their dependency arrays.
  const notifyRef = useRef(onMessage);
  notifyRef.current = onMessage;

  const notify = useCallback((msg) => {
    notifyRef.current?.(msg);
  }, []);

  // ─────────────────────────────────────────────
  // placeBet
  // ─────────────────────────────────────────────
  /**
   * Validate, deduct, and record a new ticket.
   *
   * Returns a result object rather than throwing, so the caller can
   * decide how to surface the failure (toast, inline error, etc.).
   *
   * @param {number[]} picks
   * @param {number} betAmount
   * @returns {{ ok: boolean, reason?: string, ticket?: Object }}
   */
  const placeBet = useCallback((picks, betAmount) => {
    // ── Validation ─────────────────────────────
    if (!Array.isArray(picks) || picks.length < MIN_PICKS) {
      const reason = `Please select at least ${MIN_PICKS} number before placing a bet!`;
      notify(reason);
      return { ok: false, reason };
    }

    if (picks.length > MAX_PICKS) {
      const reason = `You can pick a maximum of ${MAX_PICKS} numbers!`;
      notify(reason);
      return { ok: false, reason };
    }

    const bet = Number(betAmount);
    if (!Number.isFinite(bet) || bet < BET.MIN) {
      const reason = `Minimum bet is ${BET.MIN}.`;
      notify(reason);
      return { ok: false, reason };
    }
    if (bet > BET.MAX) {
      const reason = `Maximum bet is ${BET.MAX}.`;
      notify(reason);
      return { ok: false, reason };
    }

    // ── Balance gate ───────────────────────────
    // Read balance from the functional updater so we can't race.
    // We use a local flag captured outside the updater to know the outcome.
    let placed = false;
    let insufficient = false;

    setBalance((prev) => {
      if (prev < bet) {
        insufficient = true;
        return prev; // no change
      }
      placed = true;
      return prev - bet;
    });

    if (insufficient) {
      const reason = 'Insufficient balance to place this bet.';
      notify(reason);
      return { ok: false, reason };
    }
    if (!placed) {
      // Shouldn't happen, but keep the contract explicit.
      return { ok: false, reason: 'Bet could not be placed.' };
    }

    // ── Ticket construction ────────────────────
    const ticket = {
      id: Date.now(),                 // matches original HomeKeno.jsx
      picks: [...picks],              // defensive copy — never alias caller's array
      bet,
      time: formatTime(new Date()),
      status: 'Pending',
    };

    setActiveTickets((prev) => [ticket, ...prev]);

    notify(`Bet of ETB ${bet.toFixed(2)} placed successfully!`);
    return { ok: true, ticket };
  }, [notify]);

  // ─────────────────────────────────────────────
  // evaluateResults
  // ─────────────────────────────────────────────
  /**
   * Settle every active ticket against the drawn numbers.
   *
   * No-op when there are zero active tickets (no toast spam on idle rounds).
   *
   * @param {number[]} drawnNumbers
   * @returns {{ ok: boolean, totalPayout: number, settled: number }}
   */
  const evaluateResults = useCallback((drawnNumbers) => {
    // ── Edge case: nothing to settle ───────────
    if (!Array.isArray(drawnNumbers) || drawnNumbers.length === 0) {
      return { ok: false, totalPayout: 0, settled: 0 };
    }

    // Read activeTickets from the functional updater so we don't
    // depend on the array identity at call time.
    let settledTickets = [];
    let totalPayout = 0;

    setActiveTickets((prev) => {
      if (prev.length === 0) {
        return prev; // no-op: leave the list alone
      }

      const { results, totalPayout: total } = settleTickets(prev, drawnNumbers);
      totalPayout = total;

      settledTickets = results.map((r, i) => ({
        ...prev[i],
        matches: r.matches,
        status: r.won ? `Won ETB ${r.payout.toFixed(2)}` : 'Lost',
        payout: r.payout,
      }));

      return []; // clear active list
    });

    if (settledTickets.length === 0) {
      // Nothing was settled — either empty list or invalid input.
      return { ok: false, totalPayout: 0, settled: 0 };
    }

    // ── Credit winnings ────────────────────────
    if (totalPayout > 0) {
      setBalance((prev) => prev + totalPayout);
      notify(`🎉 Congratulations! You won ETB ${totalPayout.toFixed(2)}!`);
    }

    // ── Move to history (newest first) ─────────
    setGameHistory((prev) => [...settledTickets, ...prev]);

    return { ok: true, totalPayout, settled: settledTickets.length };
  }, [notify]);

  // ─────────────────────────────────────────────
  // Convenience
  // ─────────────────────────────────────────────
  const resetBalance = useCallback((amount = initialBalance) => {
    setBalance(amount);
  }, [initialBalance]);

  return {
    activeTickets,
    gameHistory,
    balance,
    placeBet,
    evaluateResults,
    resetBalance,
    setBalance, // escape hatch for refunds / admin / tests
  };
}