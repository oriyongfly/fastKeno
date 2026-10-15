// components/game/NumberGrid.jsx

import React, { useMemo } from 'react';
import { GRID_SIZE } from '../../constants/gameConfig';

/**
 * The 80-number Keno board.
 *
 * Priority order (highest first):
 *   1. hit      — selected AND drawn   → yellow glow (unchanged)
 *   2. selected — picked, not drawn    → white glow
 *   3. drawn    — drawn, not picked    → green gradient; latest gets inset ring
 *   4. default  — neither              → slate
 *
 * Stateless. Parent owns `onNumberClick`; this component just forwards
 * the clicked number.
 *
 * @param {Object}   props
 * @param {number[]} props.selectedNumbers
 * @param {number[]} props.drawnNumbers
 * @param {number|null} [props.latestNumber]  - most recent draw; ring highlight
 * @param {boolean}  props.isDrawing
 * @param {Function} props.onNumberClick       - (num: number) => void
 * @param {number}   [props.gridSize=GRID_SIZE]
 * @param {string}   [props.className]
 */
export default function NumberGrid({
  selectedNumbers = [],
  drawnNumbers = [],
  latestNumber = null,
  isDrawing = false,
  onNumberClick,
  gridSize = GRID_SIZE,
  className = '',
}) {
  // O(1) membership checks.
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);
  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

  // Static range 1..gridSize.
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
          isLatest={latestNumber === num}
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

function NumberCell({ num, isSelected, isDrawn, isLatest, disabled, onClick }) {
  const isHit = isSelected && isDrawn;
  const style = getCellStyle({ isSelected, isDrawn });
  const inlineStyle = getCellInlineStyle({ isSelected, isDrawn, isLatest });

  return (
    <button
      type="button"
      role="gridcell"
      onClick={() => onClick?.(num)}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={buildAriaLabel(num, isSelected, isDrawn, isLatest)}
      className={`h-8 rounded text-xs font-semibold flex items-center justify-center transition-all duration-150 border tabular-nums ${style} ${
        isHit ? 'z-10' : ''
      }`}
      style={inlineStyle}
    >
      {num}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Style resolver — Tailwind classes
   ───────────────────────────────────────────── */

/**
 * Returns the Tailwind class string for a cell's visual state.
 *
 * Priority (checked top-down, first match wins):
 *   1. hit      → yellow (unchanged; overrides latest)
 *   2. selected → white
 *   3. drawn    → green gradient base classes (visual via inline style)
 *   4. default  → slate
 *
 * `isLatest` only affects the drawn case, and only via inline style —
 * it does not change the class string here.
 *
 * @param {{ isSelected: boolean, isDrawn: boolean }} state
 * @returns {string}
 */
export function getCellStyle({ isSelected, isDrawn }) {
  // 1. HIT — highest priority, unchanged
  if (isSelected && isDrawn) {
    return 'bg-yellow-400 text-slate-950 font-black border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.8)] scale-105';
  }

  // 2. SELECTED
  if (isSelected) {
    return 'bg-slate-100 text-slate-900 font-extrabold border-white shadow-[0_0_8px_rgba(255,255,255,0.6)]';
  }

  // 3. DRAWN — base classes only; gradient + ring come from inline style
  if (isDrawn) {
    return 'text-slate-100 font-bold border-transparent';
  }

  // 4. DEFAULT
  return 'bg-[#182030] text-slate-300 border-slate-700/50 hover:bg-slate-700/50';
}

/* ─────────────────────────────────────────────
   Style resolver — inline (gradient + ring)
   ───────────────────────────────────────────── */

/**
 * Inline style for gradients and the latest-ring box-shadow. Tailwind
 * can't express `linear-gradient(...)` cleanly without a config entry,
 * so we compute it here.
 *
 * Only applies to the drawn (non-selected) case. Hit and selected
 * styles come entirely from Tailwind classes.
 *
 * @param {{ isSelected: boolean, isDrawn: boolean, isLatest?: boolean }} state
 * @returns {React.CSSProperties | undefined}
 */
function getCellInlineStyle({ isSelected, isDrawn, isLatest }) {
  // Hit wins — no inline style, Tailwind handles it.
  if (isSelected && isDrawn) return undefined;

  // Selected — no inline style.
  if (isSelected) return undefined;

  // Drawn — green gradient, plus ring if latest.
  if (isDrawn) {
    const ring = isLatest ? 'inset 0 0 0 2px #78d6a0' : null;
    return {
      background: 'linear-gradient(145deg, #438d65, #2f6b4d)',
      boxShadow: ring ?? undefined,
    };
  }

  // Default — no inline style.
  return undefined;
}

/* ─────────────────────────────────────────────
   A11y helper
   ───────────────────────────────────────────── */

function buildAriaLabel(num, isSelected, isDrawn, isLatest) {
  const tags = [];
  if (isSelected) tags.push('selected');
  if (isDrawn) tags.push('drawn');
  if (isLatest && !isSelected) tags.push('latest');
  return tags.length ? `${num}, ${tags.join(', ')}` : `${num}`;
}