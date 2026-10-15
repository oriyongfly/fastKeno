// App.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ── Config ─────────────────────────────────────
import {
  NUMBERS_DRAWN,
  DRAW_ANIMATION_MS,
  DRAW_INTERVAL_SECONDS,
  GRID_SIZE,
  MAX_PICKS,
} from './constants/gameConfig';

// ── Store ──────────────────────────────────────
import { useGameStore } from './store/useGameStore';

// ── Hooks ──────────────────────────────────────
import { useGameTimer } from './hooks/useGameTimer';
import { useSound, SFX } from './hooks/useSound';
import { useToast } from './hooks/useToast';

// ── Utilities ──────────────────────────────────
import { drawNumbers } from './utils/drawEngine';

// ── Layout ─────────────────────────────────────
import Header from './components/layout/Header';
import SubHeader from './components/layout/SubHeader';

// ── Game ───────────────────────────────────────
import RadarDisplay from './components/game/RadarDisplay';
import TimerPill from './components/game/TimerPill';
import InfoPanels from './components/game/InfoPanels';
import NumberGrid from './components/game/NumberGrid';
import BetControls from './components/game/BetControls';

// ── Tabs ───────────────────────────────────────
import TabBar from './components/tabs/TabBar';
import GameTab from './components/tabs/GameTab';
import HistoryTab from './components/tabs/HistoryTab';
import ResultsTab from './components/tabs/ResultsTab';
import StatisticsTab from './components/tabs/StatisticsTab';
import LeadersTab from './components/tabs/LeadersTab';

// ── UI ─────────────────────────────────────────
import Toast from './components/ui/Toast';
import ViewSwap from './components/ui/ViewSwap';

/**
 * App shell.
 *
 * Reads game state from the Zustand store, wires the timer hook to the
 * draw sequence, and renders the layout. All game rules live in the
 * store and utilities — this file is pure composition.
 *
 * Changes applied:
 *   1. betState read from store, passed to BetControls.
 *   3. NumberGrid receives hotNumbers / coldNumbers (empty for now).
 *   4. InfoPanels replaces PicksCounter.
 *   5. ViewSwap wraps the game area, keyed on `round`.
 *   6. `round` bumps inside runDraw, at draw start.
 *   7. TimerPill extracted, rendered between RadarDisplay and InfoPanels.
 *  12. InfoPanels + NumberGrid + BetControls hidden while isDrawing.
 *  14. pickedNumbers derived from activeTickets, passed to RadarDisplay
 *      so hit balls light up green in the draw stage.
 */
export default function App() {
  // ── Store slices ───────────────────────────
  const balance         = useGameStore((s) => s.balance);
  const selectedNumbers = useGameStore((s) => s.selectedNumbers);
  const drawnNumbers    = useGameStore((s) => s.drawnNumbers);
  const isDrawing       = useGameStore((s) => s.isDrawing);
  const betAmount       = useGameStore((s) => s.betAmount);
  const activeTickets   = useGameStore((s) => s.activeTickets);
  const gameHistory     = useGameStore((s) => s.gameHistory);
  const betState        = useGameStore((s) => s.betState);

  // ── Store actions ──────────────────────────
  const toggleNumber     = useGameStore((s) => s.toggleNumber);
  const autoPick         = useGameStore((s) => s.autoPick);
  const clearPicks       = useGameStore((s) => s.clearPicks);
  const changeBet        = useGameStore((s) => s.changeBet);
  const multiplyBet      = useGameStore((s) => s.multiplyBet);
  const maxBet           = useGameStore((s) => s.maxBet);
  const placeBet         = useGameStore((s) => s.placeBet);
  const startDraw        = useGameStore((s) => s.startDraw);
  const revealNumber     = useGameStore((s) => s.revealNumber);
  const finishDraw       = useGameStore((s) => s.finishDraw);
  const registerNotifier = useGameStore((s) => s.registerNotifier);

  // ── Local UI state (not shared) ────────────
  const [activeTab, setActiveTab] = useState('Game');

  // Round counter drives <ViewSwap key={round}>. Bumped once per draw
  // cycle (inside runDraw, right after startDraw) so the whole game
  // area fades in when a new draw begins.
  const [round, setRound] = useState(0);

  // ── Toast ──────────────────────────────────
  const toast = useToast(3000);

  // Bridge toast into the store so actions can surface messages
  // without importing React or reaching into component state.
  useEffect(() => {
    registerNotifier(toast.show);
    return () => registerNotifier(null);
  }, [registerNotifier, toast.show]);

  // ── Sound ──────────────────────────────────
  const {
    soundEnabled,
    toggleSound,
    playSound,
  } = useSound({
    initialEnabled: true,
    volume: 0.6,
    soundMap: {
      // Drop files here when ready:
      // [SFX.CLICK]:     '/sfx/click.mp3',
      // [SFX.PLACE_BET]: '/sfx/bet.mp3',
      // [SFX.DRAW_TICK]: '/sfx/tick.mp3',
      // [SFX.WIN]:       '/sfx/win.mp3',
      // [SFX.LOSE]:      '/sfx/lose.mp3',
    },
  });

  // ── Draw sequence ──────────────────────────
  // Track reveal timeouts so they can be cleared if the component
  // unmounts mid-draw, or if a new round starts before the last
  // reveal chain finishes.
  const revealTimersRef = useRef([]);

  const clearRevealTimers = useCallback(() => {
    for (const id of revealTimersRef.current) clearTimeout(id);
    revealTimersRef.current = [];
  }, []);

  useEffect(() => clearRevealTimers, [clearRevealTimers]);

  /**
   * Fires when the timer hits zero. Owns the reveal sequence and
   * hands the final draw to `finishDraw` for settlement.
   */
  const runDraw = useCallback(() => {
    clearRevealTimers();

    const drawn = drawNumbers(NUMBERS_DRAWN, GRID_SIZE);
    startDraw();

    // Start a new "round" for the ViewSwap fade — this is the moment
    // the game area transitions from betting to drawing.
    setRound((r) => r + 1);

    drawn.forEach((num, i) => {
      const id = setTimeout(() => {
        revealNumber(num);
        playSound(SFX.DRAW_TICK);

        if (i === drawn.length - 1) {
          const { totalPayout } = finishDraw();

          if (totalPayout > 0) playSound(SFX.WIN);
          else playSound(SFX.LOSE);
        }
      }, i * DRAW_ANIMATION_MS);

      revealTimersRef.current.push(id);
    });
  }, [
    clearRevealTimers,
    startDraw,
    revealNumber,
    finishDraw,
    playSound,
  ]);

  // ── Timer ──────────────────────────────────
  const { timer } = useGameTimer({
    duration: DRAW_INTERVAL_SECONDS,
    onComplete: runDraw,
    // Pause countdown while the reveal animation is running so every
    // round gets a full 60 s of betting.
    paused: isDrawing,
  });

  // ── Handlers ───────────────────────────────
  const handleNumberClick = useCallback(
    (num) => {
      toggleNumber(num);
      playSound(SFX.CLICK);
    },
    [toggleNumber, playSound]
  );

  const handleAutoPick = useCallback(
    (count) => {
      autoPick(count);
      playSound(SFX.CLICK);
    },
    [autoPick, playSound]
  );

  const handleClearPicks = useCallback(() => {
    clearPicks();
    playSound(SFX.CLICK);
  }, [clearPicks, playSound]);

  const handlePlaceBet = useCallback(() => {
    const { ok } = placeBet();
    if (ok) playSound(SFX.PLACE_BET);
  }, [placeBet, playSound]);

  // ── Derived ────────────────────────────────
  // All numbers currently on active tickets — used to highlight hits
  // in the draw stage. Flattened across every live ticket; RadarDisplay
  // dedupes via its internal Set.
  const pickedNumbers = useMemo(
    () => activeTickets.flatMap((t) => t.picks),
    [activeTickets]
  );

  // The cell that should render with the "latest draw" inset ring.
  // null before any draw, so NumberGrid receives a stable, safe value.
  const latestNumber =
    drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

  // ── Render ─────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d131f] text-slate-100 flex justify-center font-sans select-none">
      <div className="w-full max-w-md bg-[#0d131f] flex flex-col justify-between shadow-2xl relative border-x border-slate-800/50">

        {/* Toast */}
        <Toast message={toast.message} />

        {/* Header */}
        <Header
          balance={balance}
          onBack={() => {
            // Wire router here later.
          }}
        />

        {/* Sub-header */}
        <SubHeader
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onAutoPick={handleAutoPick}
          onClear={handleClearPicks}
          selectedCount={selectedNumbers.length}
          disabled={isDrawing}
        />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">

          {/* ── Game area: fades in on each new round ── */}
          <ViewSwap key={round}>
            {/* Radar / draw stage — always visible.
                During the draw this is the whole show. */}
            <RadarDisplay
              isDrawing={isDrawing}
              drawnNumbers={drawnNumbers}
              pickedNumbers={pickedNumbers}
            />

            {/* Countdown pill — kept outside the draw-conditional so the
                player never loses sight of the clock. The timer hook is
                `paused: isDrawing`, so it freezes (not resets) during the
                draw and resumes when betting reopens. */}
            <TimerPill timer={timer} />

            {/* Betting UI — hidden while a round is running.
                Picks are locked anyway (toggleNumber early-returns when
                isDrawing), so hiding the grid doesn't change behaviour —
                only the visuals. */}
            {!isDrawing && (
              <>
                {/* Hint panel: choose ↔ pay-table slide */}
                <InfoPanels
                  picks={selectedNumbers}
                  betState={betState}
                />

                {/* 80-cell board */}
                <NumberGrid
                  selectedNumbers={selectedNumbers}
                  drawnNumbers={drawnNumbers}
                  latestNumber={latestNumber}
                  isDrawing={isDrawing}
                  onNumberClick={handleNumberClick}
                  hotNumbers={[]}
                  coldNumbers={[]}
                />

                {/* Bet sizing + BET button (three-phase) */}
                <BetControls
                  betAmount={betAmount}
                  balance={balance}
                  isDrawing={isDrawing}
                  betState={betState}
                  onDecrement={() => changeBet(-1)}
                  onIncrement={() => changeBet(1)}
                  onMultiply={multiplyBet}
                  onMax={maxBet}
                  onPlaceBet={handlePlaceBet}
                />
              </>
            )}
          </ViewSwap>

          {/* Tabs — always visible */}
          <div className="pt-2">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            <div
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="bg-[#101622] p-3 rounded-b-lg border-x border-b border-slate-800 min-h-[90px]"
            >
          {activeTab === 'Game' && (
            <GameTab
              activeTickets={activeTickets}
              gameHistory={gameHistory}
              drawnNumbers={drawnNumbers}
              isDrawing={isDrawing}
            />

              )}
              {activeTab === 'History' && (
                <HistoryTab gameHistory={gameHistory} />
              )}
              {activeTab === 'Results' && (
                <ResultsTab drawnNumbers={drawnNumbers} />
              )}
              {activeTab === 'Statistics' && (
                <StatisticsTab hotNumbers={[]} coldNumbers={[]} />
              )}
              {activeTab === 'Leaders' && <LeadersTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}