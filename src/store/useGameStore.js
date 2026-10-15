// store/useGameStore.js

import { create } from 'zustand';
import {
  GRID_SIZE,
  MAX_PICKS,
  MIN_PICKS,
  NUMBERS_DRAWN,
  DRAW_INTERVAL_SECONDS,
  BET,
} from '../constants/gameConfig';
import { drawNumbers } from '../utils/drawEngine';
import { settleTickets } from '../utils/payoutCalculator';
import { formatTime, formatETB } from '../utils/formatters';

// Timing for the three-phase BET button feedback (ms).
// "idle" -> "wait" -> "accepted" -> "idle"
export const BET_WAIT_MS = 450;
export const BET_ACCEPTED_MS = 600;

export const useGameStore = create((set, get) => ({
  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  balance: BET.STARTING_BALANCE,
  selectedNumbers: [],
  drawnNumbers: [],
  isDrawing: false,
  betAmount: BET.DEFAULT,
  activeTickets: [],
  gameHistory: [],
  timer: DRAW_INTERVAL_SECONDS,

  // Three-phase BET button feedback: "idle" | "wait" | "accepted"
  betState: 'idle',

  // Optional: a notify function the UI can register so actions can
  // surface messages (toasts) without importing React.
  _notify: null,
  registerNotifier: (fn) => set({ _notify: fn }),

  // ─────────────────────────────────────────────
  // Selection
  // ─────────────────────────────────────────────
  toggleNumber: (num) => {
    const { selectedNumbers, isDrawing, _notify } = get();
    if (isDrawing) return;

    if (selectedNumbers.includes(num)) {
      set({ selectedNumbers: selectedNumbers.filter((n) => n !== num) });
      return;
    }
    if (selectedNumbers.length >= MAX_PICKS) {
      _notify?.(`You can pick a maximum of ${MAX_PICKS} numbers!`);
      return;
    }
    set({ selectedNumbers: [...selectedNumbers, num] });
  },

  autoPick: (count = 5) => {
    const { isDrawing } = get();
    if (isDrawing) return;

    const clamped = Math.max(MIN_PICKS, Math.min(MAX_PICKS, count));
    const picks = drawNumbers(clamped, GRID_SIZE);
    set({ selectedNumbers: picks });
  },

  clearPicks: () => {
    if (get().isDrawing) return;
    set({ selectedNumbers: [] });
  },

  // ─────────────────────────────────────────────
  // Bet amount
  // ─────────────────────────────────────────────
  setBetAmount: (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    set({ betAmount: Math.min(BET.MAX, Math.max(BET.MIN, Math.floor(n))) });
  },

  changeBet: (delta) => {
    const { betAmount } = get();
    get().setBetAmount(betAmount + delta);
  },

  multiplyBet: (factor) => {
    const { betAmount } = get();
    get().setBetAmount(betAmount * factor);
  },

  maxBet: () => {
    const { balance } = get();
    get().setBetAmount(Math.min(BET.MAX, Math.floor(balance)));
  },

  // ─────────────────────────────────────────────
  // Betting
  // ─────────────────────────────────────────────
  /**
   * Validate, deduct, and record a new ticket.
   *
   * On success the live selection is cleared — the ticket holds its
   * own defensive copy of the picks, so the grid resets to default
   * immediately after the bet is placed.
   *
   * The BET button cycles through three visual phases on success:
   *   "idle" -> "wait" (immediately)
   *          -> "accepted" (after BET_WAIT_MS)
   *          -> "idle" (after another BET_ACCEPTED_MS)
   *
   * @returns {{ ok: boolean, reason?: string, ticket?: Object }}
   */
  placeBet: () => {
    const {
      selectedNumbers,
      betAmount,
      balance,
      activeTickets,
      isDrawing,
      _notify,
    } = get();

    // ── Validation ─────────────────────────────
    // Any early return leaves selectedNumbers untouched.
    if (isDrawing) return { ok: false, reason: 'Round in progress.' };

    if (selectedNumbers.length < MIN_PICKS) {
      const reason = `Please select at least ${MIN_PICKS} number before placing a bet!`;
      _notify?.(reason);
      return { ok: false, reason };
    }
    if (selectedNumbers.length > MAX_PICKS) {
      const reason = `You can pick a maximum of ${MAX_PICKS} numbers!`;
      _notify?.(reason);
      return { ok: false, reason };
    }
    if (betAmount < BET.MIN || betAmount > BET.MAX) {
      const reason = `Bet must be between ${BET.MIN} and ${BET.MAX}.`;
      _notify?.(reason);
      return { ok: false, reason };
    }
    if (balance < betAmount) {
      const reason = 'Insufficient balance to place this bet.';
      _notify?.(reason);
      return { ok: false, reason };
    }

    // ── Ticket construction ────────────────────
    // Defensive copy: clearing `selectedNumbers` below must not affect
    // the picks stored on the ticket.
    const ticket = {
      id: Date.now(),
      picks: [...selectedNumbers],
      bet: betAmount,
      time: formatTime(new Date()),
      status: 'Pending',
    };

    // ── Commit ─────────────────────────────────
    set({
      balance: balance - betAmount,
      activeTickets: [ticket, ...activeTickets],
      selectedNumbers: [],        // ← reset the grid on success
      betState: 'wait',           // ← phase 1: pending
    });

    // ── Three-phase button feedback ────────────
    // Phase 2: accepted
    setTimeout(() => {
      // Guard against a reset that happened in the meantime.
      if (get().betState !== 'wait') return;
      set({ betState: 'accepted' });
    }, BET_WAIT_MS);

    // Phase 3: back to idle
    setTimeout(() => {
      if (get().betState !== 'accepted') return;
      set({ betState: 'idle' });
    }, BET_WAIT_MS + BET_ACCEPTED_MS);

    _notify?.(`Bet of ${formatETB(betAmount)} placed successfully!`);
    return { ok: true, ticket };
  },

  // ─────────────────────────────────────────────
  // Draw / settle
  // ─────────────────────────────────────────────
  startDraw: () => set({ isDrawing: true, drawnNumbers: [] }),

  revealNumber: (num) => {
    set((state) => ({ drawnNumbers: [...state.drawnNumbers, num] }));
  },

  finishDraw: () => {
    const { drawnNumbers, activeTickets, balance, gameHistory, _notify } = get();

    // No-op if nothing to settle
    if (activeTickets.length === 0) {
      set({ isDrawing: false, timer: DRAW_INTERVAL_SECONDS });
      return { ok: false, totalPayout: 0, settled: 0 };
    }

    const { results, totalPayout } = settleTickets(activeTickets, drawnNumbers);

    const settledTickets = results.map((r, i) => ({
      ...activeTickets[i],
      matches: r.matches,
      payout: r.payout,
      status: r.won ? `Won ${formatETB(r.payout)}` : 'Lost',
    }));

    if (totalPayout > 0) {
      _notify?.(`🎉 Congratulations! You won ${formatETB(totalPayout)}!`);
    }

    set({
      isDrawing: false,
      timer: DRAW_INTERVAL_SECONDS,
      balance: balance + totalPayout,
      activeTickets: [],
      gameHistory: [...settledTickets, ...gameHistory],
    });

    return { ok: true, totalPayout, settled: settledTickets.length };
  },

  // ─────────────────────────────────────────────
  // Timer
  // ─────────────────────────────────────────────
  tick: () => {
    set((state) => ({ timer: Math.max(0, state.timer - 1) }));
  },

  resetTimer: () => set({ timer: DRAW_INTERVAL_SECONDS }),
  setTimer: (n) => set({ timer: Math.max(0, Math.floor(n)) }),

  // ─────────────────────────────────────────────
  // Admin / tests
  // ─────────────────────────────────────────────
  resetBalance: (amount = BET.STARTING_BALANCE) => set({ balance: amount }),
  resetAll: () =>
    set({
      balance: BET.STARTING_BALANCE,
      selectedNumbers: [],
      drawnNumbers: [],
      isDrawing: false,
      betAmount: BET.DEFAULT,
      activeTickets: [],
      gameHistory: [],
      timer: DRAW_INTERVAL_SECONDS,
      betState: 'idle',           // ← don't leave the button stuck
    }),
}));