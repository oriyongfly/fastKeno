// components/layout/SubHeader.jsx

import React from 'react';
import { Volume2, VolumeX, Trash2 } from 'lucide-react';

/**
 * Sub-header strip: sound toggle, Auto 5 / Auto 10 quick picks, and
 * a "clear picks" trash icon that only renders when there's something
 * to clear.
 *
 * Stateless. All data + callbacks via props.
 *
 * @param {Object}   props
 * @param {boolean}  props.soundEnabled
 * @param {Function} props.onToggleSound
 * @param {Function} props.onAutoPick        - called with the count (5 or 10)
 * @param {Function} props.onClear
 * @param {number}   [props.selectedCount=0] - controls trash icon visibility
 * @param {boolean}  [props.disabled=false]  - locks all controls (e.g. during draw)
 * @param {string}   [props.className]
 */
export default function SubHeader({
  soundEnabled,
  onToggleSound,
  onAutoPick,
  onClear,
  selectedCount = 0,
  disabled = false,
  className = '',
}) {
  return (
    <div
      className={`px-3 py-1.5 bg-[#0a0f19] border-b border-slate-800/50 flex justify-between items-center ${className}`}
    >
      {/* Sound toggle */}
      <button
        type="button"
        onClick={onToggleSound}
        disabled={disabled}
        aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
        aria-pressed={soundEnabled}
        className="p-1 text-slate-400 hover:text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Quick-pick + clear */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => onAutoPick(5)}
          disabled={disabled}
          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Auto 5
        </button>

        <button
          type="button"
          onClick={() => onAutoPick(10)}
          disabled={disabled}
          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Auto 10
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            aria-label="Clear picks"
            title="Clear picks"
            className="p-1 text-slate-400 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}