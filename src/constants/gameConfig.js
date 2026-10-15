// constants/gameConfig.js

/**
 * Central configuration for the Keno game.
 * All magic numbers live here — import from this file everywhere else.
 */

// ─────────────────────────────────────────────
// Board / Selection
// ─────────────────────────────────────────────
export const GRID_SIZE = 80;          // Numbers 1..80 on the board
export const MAX_PICKS = 10;          // Max numbers a player can select
export const MIN_PICKS = 1;           // Min numbers required to place a bet

// ─────────────────────────────────────────────
// Draw
// ─────────────────────────────────────────────
export const NUMBERS_DRAWN = 20;      // Keno draws 20 of 80
export const DRAW_INTERVAL_SECONDS = 60; // Round length
export const DRAW_ANIMATION_MS = 2000;    // Delay between each revealed ball

// ─────────────────────────────────────────────
// Betting
// ─────────────────────────────────────────────
export const BET = {
  MIN: 1,
  MAX: 100,
  DEFAULT: 2,
  STEP: 1,               // +/- amount per click
  MULTIPLIERS: [2],      // Quick-multiply buttons (x2, x5, etc.)
  STARTING_BALANCE: 100, // Demo balance
};

// ─────────────────────────────────────────────
// Payout Table
// Multipliers indexed by [picks][matches].
// Value is the multiplier applied to the bet (0 = no win).
// Rows = how many numbers the player picked (1..10)
// Cols = how many of those matched the draw (0..picks)
//
// These are illustrative demo values — NOT real casino odds.
// Tune to hit a target house edge (~70–85% RTP).
// ─────────────────────────────────────────────
export const PAYOUT_TABLE = {
  1:  { 0: 0, 1: 3.5 },
  2:  { 0: 0, 1: 1,   2: 9 },
  3:  { 0: 0, 1: 0,   2: 2,   3: 25 },
  4:  { 0: 0, 1: 0,   2: 1,   3: 5,   4: 50 },
  5:  { 0: 0, 1: 0,   2: 0,   3: 3,   4: 15,   5: 100 },
  6:  { 0: 0, 1: 0,   2: 0,   3: 2,   4: 8,    5: 40,   6: 200 },
  7:  { 0: 0, 1: 0,   2: 0,   3: 1,   4: 4,    5: 15,   6: 75,   7: 400 },
  8:  { 0: 0, 1: 0,   2: 0,   3: 0,   4: 2,    5: 8,    6: 40,   7: 150,  8: 750 },
  9:  { 0: 0, 1: 0,   2: 0,   3: 0,   4: 1,    5: 5,    6: 20,   7: 80,   8: 300,  9: 1000 },
  10: { 0: 0, 1: 0,   2: 0,   3: 0,   4: 0,    5: 3,    6: 12,   7: 50,   8: 200,  9: 700,  10: 2000 },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Get the multiplier for a given pick count + match count.
 * @param {number} picks   - how many numbers the player selected
 * @param {number} matches - how many matched the draw
 * @returns {number} multiplier (0 if no win / invalid)
 */
export function getMultiplier(picks, matches) {
  const row = PAYOUT_TABLE[picks];
  if (!row) return 0;
  return row[matches] ?? 0;
}

/**
 * Compute payout in currency units.
 * @param {number} bet
 * @param {number} picks
 * @param {number} matches
 * @returns {{ multiplier: number, payout: number }}
 */
export function computePayout(bet, picks, matches) {
  const multiplier = getMultiplier(picks, matches);
  return { multiplier, payout: +(bet * multiplier).toFixed(2) };
}