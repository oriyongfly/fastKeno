// components/game/NumberGrid.jsx

import React, { useMemo } from 'react';
import { GRID_SIZE } from '../../constants/gameConfig';

/**
 * The 80-number Keno board.
 *
 * Priority order (highest first):
 *   1. hit      — selected AND drawn   → yellow glow
 *   2. selected — picked, not drawn    → emerald (matches FastKeno)
 *   3. drawn    — drawn, not picked    → green gradient; latest gets inset ring
 *   4. default  — neither              → zinc (matches FastKeno)
 *
 * Hot/cold corner dots (from game statistics) are layered on top of
 * every state except `hit` — the hit cell's yellow fill already
 * dominates, and FastKeno doesn't draw a dot there either.
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
 * @param {number[]} [props.hotNumbers=[]]     - red corner dot
 * @param {number[]} [props.coldNumbers=[]]    - blue corner dot
 * @param {number}   [props.gridSize=GRID_SIZE]
 * @param {string}   [props.className]
 */
export default function NumberGrid({
  selectedNumbers = [],
  drawnNumbers = [],
  latestNumber = null,
  isDrawing = false,
  onNumberClick,
  hotNumbers = [],
  coldNumbers = [],
  gridSize = GRID_SIZE,
  className = '',
}) {
  // O(1) membership checks.
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);
  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);
  const hotSet = useMemo(() => new Set(hotNumbers), [hotNumbers]);
  const coldSet = useMemo(() => new Set(coldNumbers), [coldNumbers]);

  // Static range 1..gridSize.
  const numbers = useMemo(
    () => Array.from({ length: gridSize }, (_, i) => i + 1),
    [gridSize]
  );

  return (
    <div
      // FastKeno's grid wrapper: no card, no border, flat on the page.
      //   mt-3  gap-1  px-2
      // A caller that wants a card can add one via `className`.
      className={`mt-3 grid grid-cols-10 gap-1 px-2 ${className}`}
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
          isHot={hotSet.has(num)}
          isCold={coldSet.has(num)}
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

function NumberCell({
  num,
  isSelected,
  isDrawn,
  isLatest,
  isHot,
  isCold,
  disabled,
  onClick,
}) {
  const isHit = isSelected && isDrawn;
  const style = getCellStyle({ isSelected, isDrawn });
  const inlineStyle = getCellInlineStyle({ isSelected, isDrawn, isLatest });

  // Hot wins if a number is somehow in both sets — matches FastKeno,
  // where the red dot is rendered first and the blue dot would sit
  // underneath it at the same coordinates anyway.
  const dot = isHit ? null : isHot ? 'hot' : isCold ? 'cold' : null;

  return (
    <button
      type="button"
      role="gridcell"
      onClick={() => onClick?.(num)}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={buildAriaLabel(num, isSelected, isDrawn, isLatest, isHot, isCold)}
      // h-[34px] / text-[13px] / no border — matches FastKeno's cell.
      // `relative` is kept so the hot/cold dot can be positioned.
      className={`relative h-[34px] rounded text-[13px] font-semibold flex items-center justify-center transition-colors duration-150 motion-reduce:transition-none tabular-nums ${style} ${
        isHit ? 'z-10' : ''
      }`}
      style={inlineStyle}
    >
      {dot === 'hot' && (
        <i
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 h-1 w-1 rounded-full bg-red-500"
        />
      )}
      {dot === 'cold' && (
        <i
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 h-1 w-1 rounded-full bg-sky-400"
        />
      )}
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
 *   1. hit      → yellow (overrides everything)
 *   2. selected → emerald, matching FastKeno's bg-emerald-600
 *   3. drawn    → green gradient base classes (visual via inline style)
 *   4. default  → zinc, matching FastKeno's bg-zinc-700/80
 *
 * `isLatest` only affects the drawn case, and only via inline style —
 * it does not change the class string here.
 *
 * @param {{ isSelected: boolean, isDrawn: boolean }} state
 * @returns {string}
 */
export function getCellStyle({ isSelected, isDrawn }) {
  // 1. HIT — highest priority. Yellow glow, kept from the previous
  //    design because FastKeno has no drawn-cell state to copy from.
  if (isSelected && isDrawn) {
    return 'bg-yellow-400 text-slate-950 font-black shadow-[0_0_10px_rgba(250,204,21,0.8)] scale-105';
  }

  // 2. SELECTED — green, per FastKeno.
  if (isSelected) {
    return 'bg-emerald-600 text-white';
  }

  // 3. DRAWN — base classes only; gradient + ring come from inline style.
  if (isDrawn) {
    return 'text-slate-100 font-bold';
  }

  // 4. DEFAULT — zinc, per FastKeno.
  return 'bg-zinc-700/80 text-slate-200 active:bg-zinc-600';
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

function buildAriaLabel(num, isSelected, isDrawn, isLatest, isHot, isCold) {
  const tags = [];
  if (isSelected) tags.push('selected');
  if (isDrawn) tags.push('drawn');
  if (isLatest && !isSelected) tags.push('latest');
  // Only announce hot/cold when it's actually visible — the hit cell
  // suppresses the dot, so the label shouldn't claim it either.
  const isHit = isSelected && isDrawn;
  if (!isHit) {
    if (isHot) tags.push('hot');
    else if (isCold) tags.push('cold');
  }
  return tags.length ? `${num}, ${tags.join(', ')}` : `${num}`;
}