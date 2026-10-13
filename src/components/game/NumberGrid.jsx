// components/game/NumberGrid.jsx

import React, { useMemo } from 'react';
import { GRID_SIZE } from '../../constants/gameConfig';

/**
 * The 80-number Keno board.
 *
 * Priority order (highest first):
 *   1. hit      — selected AND drawn   → yellow, glow, slight scale
 *   2. selected — picked, not drawn    → white, glow
 *   3. drawn    — drawn, not picked    → emerald
 *   4. default  — neither              → slate
 *
 * Stateless. Parent owns `onNumberClick`; this component just forwards
 * the clicked number.
 *
 * @param {Object}   props
 * @param {number[]} props.selectedNumbers
 * @param {number[]} props.drawnNumbers
 * @param {boolean}  props.isDrawing
 * @param {Function} props.onNumberClick       - (num: number) => void
 * @param {number}   [props.gridSize=GRID_SIZE]
 * @param {string}   [props.className]
 */
export default function NumberGrid({
  selectedNumbers = [],
  drawnNumbers = [],
  isDrawing = false,
  onNumberClick,
  gridSize = GRID_SIZE,
  className = '',
}) {
  // O(1) membership checks. Sets are rebuilt only when the arrays
  // actually change identity, which is exactly what the parent gives us
  // (new array per update, stable reference otherwise).
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);
  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

  // Static range 1..gridSize — recomputed only if gridSize changes.
  const numbers = useMemo(
    () => Array.from({ length: gridSize }, (_, i) => i + 1),
    [gridSize]
  );

  return (
    <div
      className={`grid grid-cols-10 gap-1 bg-[#101622] p-1.5 rounded-xl border border-slate-800/80 ${className}`}
      role="grid"
      aria-label="Keno number board"
    >
      {numbers.map((num) => (
        <NumberCell
          key={num}
          num={num}
          isSelected={selectedSet.has(num)}
          isDrawn={drawnSet.has(num)}
          disabled={isDrawing}
          onClick={onNumberClick}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Cell
   ───────────────────────────────────────────── */

function NumberCell({ num, isSelected, isDrawn, disabled, onClick }) {
  const isHit = isSelected && isDrawn;
  const style = getCellStyle({ isSelected, isDrawn });

  return (
    <button
      type="button"
      role="gridcell"
      onClick={() => onClick?.(num)}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={buildAriaLabel(num, isSelected, isDrawn)}
      className={`h-8 rounded text-xs font-semibold flex items-center justify-center transition-all duration-150 border tabular-nums ${style} ${
        isHit ? 'z-10' : ''
      }`}
    >
      {num}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Style resolver — the priority-order rule lives here, not in JSX
   ───────────────────────────────────────────── */

/**
 * Returns the Tailwind class string for a cell's visual state.
 *
 * Priority (checked top-down, first match wins):
 *   1. hit
 *   2. selected
 *   3. drawn
 *   4. default
 *
 * @param {{ isSelected: boolean, isDrawn: boolean }} state
 * @returns {string}
 */
export function getCellStyle({ isSelected, isDrawn }) {
  // 1. HIT — highest priority
  if (isSelected && isDrawn) {
    return 'bg-yellow-400 text-slate-950 font-black border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.8)] scale-105';
  }

  // 2. SELECTED
  if (isSelected) {
    return 'bg-slate-100 text-slate-900 font-extrabold border-white shadow-[0_0_8px_rgba(255,255,255,0.6)]';
  }

  // 3. DRAWN
  if (isDrawn) {
    return 'bg-emerald-600/80 text-white font-bold border-emerald-400/50';
  }

  // 4. DEFAULT
  return 'bg-[#182030] text-slate-300 border-slate-700/50 hover:bg-slate-700/50';
}

/* ─────────────────────────────────────────────
   A11y helper
   ───────────────────────────────────────────── */

function buildAriaLabel(num, isSelected, isDrawn) {
  const tags = [];
  if (isSelected) tags.push('selected');
  if (isDrawn) tags.push('drawn');
  return tags.length ? `${num}, ${tags.join(', ')}` : `${num}`;
}