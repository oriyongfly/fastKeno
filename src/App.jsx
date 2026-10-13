// App.jsx

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ── Config ─────────────────────────────────────
import { NUMBERS_DRAWN, DRAW_ANIMATION_MS } from './constants/gameConfig';

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
import PicksCounter from './components/game/PicksCounter';
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

// ── Constants ──────────────────────────────────
import { MAX_PICKS } from './constants/gameConfig';

/**
 * App shell.
 *
 * Reads game state from the Zustand store, wires the timer hook to the
 * draw sequence, and renders the layout. All game rules live in the
 * store and utilities — this file is pure composition.
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

  // ── Store actions ──────────────────────────
  const toggleNumber    = useGameStore((s) => s.toggleNumber);
  const autoPick        = useGameStore((s) => s.autoPick);
  const clearPicks      = useGameStore((s) => s.clearPicks);
  const changeBet       = useGameStore((s) => s.changeBet);
  const multiplyBet     = useGameStore((s) => s.multiplyBet);
  const maxBet          = useGameStore((s) => s.maxBet);
  const placeBet        = useGameStore((s) => s.placeBet);
  const startDraw       = useGameStore((s) => s.startDraw);
  const revealNumber    = useGameStore((s) => s.revealNumber);
  const finishDraw      = useGameStore((s) => s.finishDraw);
  const registerNotifier = useGameStore((s) => s.registerNotifier);

  // ── Local UI state (not shared) ────────────
  const [activeTab, setActiveTab] = useState('Game');

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

    const drawn = drawNumbers(NUMBERS_DRAWN, 80);
    startDraw();

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
    duration: 60,
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

          {/* Radar / countdown */}
          <RadarDisplay
            isDrawing={isDrawing}
            timer={timer}
            drawnNumbers={drawnNumbers}
          />

          {/* Picks summary */}
          <PicksCounter
            selectedNumbers={selectedNumbers}
            maxPicks={MAX_PICKS}
          />

          {/* 80-cell board */}
          <NumberGrid
            selectedNumbers={selectedNumbers}
            drawnNumbers={drawnNumbers}
            isDrawing={isDrawing}
            onNumberClick={handleNumberClick}
          />

          {/* Bet sizing + BET button */}
          <BetControls
            betAmount={betAmount}
            balance={balance}
            isDrawing={isDrawing}
            onDecrement={() => changeBet(-1)}
            onIncrement={() => changeBet(1)}
            onMultiply={multiplyBet}
            onMax={maxBet}
            onPlaceBet={handlePlaceBet}
          />

          {/* Tabs */}
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