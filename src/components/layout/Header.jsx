// components/layout/Header.jsx

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { formatETB } from '../../utils/formatters';

/**
 * App header: back button, logo, balance pill, demo badge.
 *
 * Stateless. All data via props. Callbacks are optional — omit them and
 * the corresponding button becomes inert but still renders.
 *
 * @param {Object}   props
 * @param {number}   props.balance          - current balance (number)
 * @param {Function} [props.onBack]         - back button handler
 * @param {string}   [props.demoLabel]      - demo badge text
 * @param {string}   [props.className]      - extra classes for the wrapper
 */
export default function Header({
  balance,
  onBack,
  demoLabel = 'ለመሞከር ብቻ ነው',
  className = '',
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-3 bg-[#121927] border-b border-slate-800 ${className}`}
    >
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-1" aria-label="Fast Keno">
        <span className="font-black text-xl italic tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
          FAST<span className="text-emerald-500">KENO</span>
        </span>
      </div>

      {/* Balance pill */}
      <div
        className="bg-[#0a0f19] border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 tabular-nums"
        aria-label={`Balance ${formatETB(balance)}`}
      >
        {formatETB(balance)}
      </div>

      {/* Demo badge */}
      <div className="flex items-center text-[11px] text-red-400 font-semibold bg-red-950/40 border border-red-800/40 px-2 py-1 rounded-md gap-1">
        <span className="text-red-500 font-bold" aria-hidden="true">?</span>
        {demoLabel}
      </div>
    </div>
  );
}