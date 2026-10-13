// utils/drawEngine.js

import { GRID_SIZE, NUMBERS_DRAWN } from '../constants/gameConfig';

/**
 * Fisher–Yates partial shuffle.
 * Picks `count` unique numbers from 1..size, in draw order.
 *
 * Pure function: does not mutate inputs, no globals, no I/O.
 *
 * @param {number} [count=NUMBERS_DRAWN] - how many unique numbers to draw
 * @param {number} [size=GRID_SIZE]      - pool size (numbers 1..size)
 * @returns {number[]} array of `count` unique integers in 1..size
 * @throws {TypeError|RangeError} on invalid input
 */
export function drawNumbers(count = NUMBERS_DRAWN, size = GRID_SIZE) {
  // ── Validate ────────────────────────────────
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`drawNumbers: size must be a positive integer, got ${size}`);
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`drawNumbers: count must be a non-negative integer, got ${count}`);
  }
  if (count > size) {
    throw new RangeError(
      `drawNumbers: cannot draw ${count} unique numbers from a pool of ${size}`
    );
  }

  // Trivial cases
  if (count === 0) return [];
  if (count === size) {
    // Full permutation
    const all = Array.from({ length: size }, (_, i) => i + 1);
    return shuffleInPlace(all);
  }

  // ── Partial Fisher–Yates ────────────────────
  // Build the pool, then swap the first `count` slots with random
  // partners from the remaining tail. This yields `count` unique
  // values without needing a "retry if duplicate" loop.
  const pool = Array.from({ length: size }, (_, i) => i + 1);
  const out = new Array(count);

  for (let i = 0; i < count; i++) {
    // Random index in [i, size - 1]
    const j = i + randomInt(size - i);
    // Swap i <-> j
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
    out[i] = pool[i];
  }

  return out;
}

/**
 * In-place Fisher–Yates shuffle of an array. Returns the same array.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Cryptographically-strong random integer in [0, maxExclusive).
 * Uses Web Crypto when available (browser + Node 19+), falls back
 * to Math.random only if crypto is unavailable.
 *
 * Rejection sampling keeps the distribution uniform.
 *
 * @param {number} maxExclusive
 * @returns {number}
 */
function randomInt(maxExclusive) {
  if (maxExclusive <= 0) return 0;

  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  const cryptoObj = g.crypto;

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    // Smallest power-of-two-ish bound via rejection sampling
    const range = maxExclusive;
    const maxUint32 = 0xFFFFFFFF;
    const limit = maxUint32 - (maxUint32 % range);

    const buf = new Uint32Array(1);
    let x;
    do {
      cryptoObj.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);

    return x % range;
  }

  // Fallback (non-crypto). Still uniform, just not secure.
  return Math.floor(Math.random() * maxExclusive);
}

/**
 * Sort a draw result ascending (for display).
 * Pure — does not mutate input.
 * @param {number[]} nums
 * @returns {number[]}
 */
export function sortAscending(nums) {
  return [...nums].sort((a, b) => a - b);
}

/**
 * Convenience: draw + sort in one call.
 * @param {number} [count]
 * @param {number} [size]
 * @returns {number[]}
 */
export function drawSorted(count = NUMBERS_DRAWN, size = GRID_SIZE) {
  return sortAscending(drawNumbers(count, size));
}