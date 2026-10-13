// components/tabs/TabBar.jsx

import React from 'react';

/**
 * Tab navigation strip.
 *
 * Renders the 5 tabs, highlights `activeTab`, and calls `onTabChange`
 * with the clicked tab id. Does not render tab content — that's the
 * parent's job (see TabPanel or the tab-view components).
 *
 * @param {Object}   props
 * @param {string}   props.activeTab
 * @param {Function} props.onTabChange     - (tabId: string) => void
 * @param {string[]} [props.tabs]          - defaults to the app's 5 tabs
 * @param {string}   [props.className]
 */
export default function TabBar({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
  className = '',
}) {
  return (
    <div
      role="tablist"
      aria-label="Game information"
      className={`flex border-b border-slate-800 bg-[#0a0f19] rounded-t-lg overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`tab-${tab}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange?.(tab)}
            className={`flex-1 py-2 px-2 text-[11px] font-mono transition text-center whitespace-nowrap ${
              isActive
                ? 'text-slate-100 border-b-2 border-slate-300 font-bold bg-[#141b2b]'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The five tabs the app ships with. Exported so other components
 * (TabPanel, tests, deep-linkers) can reference the same list
 * without re-declaring it.
 */
export const DEFAULT_TABS = ['Game', 'History', 'Results', 'Statistics', 'Leaders'];