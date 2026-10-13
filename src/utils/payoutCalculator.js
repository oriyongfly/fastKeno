// utils/payoutCalculator.js

import { getMultiplier, computePayout, MIN_PICKS } from '../constants/gameConfig';

/**
 * Compute how many of the ticket's picks appear in the drawn numbers.
 *
 * Uses a Set for O(n + m) lookup instead of O(n * m) `.includes` scans.
 * Pure — does not mutate either array.
 *
 * @param {number[]} picks  - numbers the player selected
 * @param {number[]} drawn  - numbers that were drawn
 * @returns {number} match count (>= 0)
 */
export function countMatches(picks, drawn) {
  if (!Array.isArray(picks) || !Array.isArray(drawn)) return 0;
  if (picks.length === 0 || drawn.length === 0) return 0;

  const drawnSet = new Set(drawn);
  let matches = 0;
  for (let i = 0; i < picks.length; i++) {
    if (drawnSet.has(picks[i])) matches++;
  }
  return matches;
}

/**
 * Settle a single ticket against a draw.
 *
 * Returns match count, the multiplier applied, and the payout amount.
 * Safe on empty picks / empty draw — returns a clean zero result.
 *
 * @param {Object} ticket
 * @param {number[]} ticket.picks - numbers the player selected
 * @param {number}   ticket.bet   - stake in currency units
 * @param {number[]} drawn        - numbers that were drawn
 * @returns {{
 *   matches: number,
 *   multiplier: number,
 *   payout: number,
 *   bet: number,
 *   picks: number,
 *   won: boolean
 * }}
 */
export function settleTicket(ticket, drawn) {
  const empty = {
    matches: 0,
    multiplier: 0,
    payout: 0,
    bet: 0,
    picks: 0,
    won: false,
  };

  if (!ticket || typeof ticket !== 'object') return empty;

  const picks = Array.isArray(ticket.picks) ? ticket.picks : [];
  const bet = Number.isFinite(ticket.bet) ? ticket.bet : 0;

  // ── Edge case: nothing to settle ────────────
  if (picks.length === 0 || !Array.isArray(drawn) || drawn.length === 0) {
    return { ...empty, bet, picks: picks.length };
  }

  // ── Guard: bet must be positive ─────────────
  if (bet <= 0) {
    return {
      matches: countMatches(picks, drawn),
      multiplier: 0,
      payout: 0,
      bet,
      picks: picks.length,
      won: false,
    };
  }

  const matches = countMatches(picks, drawn);

  // Use the single source of truth for multiplier + payout math
  const { multiplier, payout } = computePayout(bet, picks.length, matches);

  return {
    matches,
    multiplier,
    payout,
    bet,
    picks: picks.length,
    won: payout > 0,
  };
}

/**
 * Settle a batch of tickets against one draw.
 * Aggregates total winnings across all tickets.
 *
 * @param {Array<{picks:number[], bet:number}>} tickets
 * @param {number[]} drawn
 * @returns {{
 *   results: Array<ReturnType<typeof settleTicket>>,
 *   totalPayout: number,
 *   anyWin: boolean
 * }}
 */
export function settleTickets(tickets, drawn) {
  const list = Array.isArray(tickets) ? tickets : [];

  const results = list.map((t) => settleTicket(t, drawn));

  let totalPayout = 0;
  for (const r of results) totalPayout += r.payout;

  return {
    results,
    totalPayout: +totalPayout.toFixed(2),
    anyWin: totalPayout > 0,
  };
}