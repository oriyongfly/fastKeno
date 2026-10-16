import React, { useState } from "react";

/**
 * Fast Keno mobile game screen — React + Tailwind CSS.
 * Save as FastKeno.jsx and render with <FastKeno />.
 * Tailwind CSS must already be configured in your project.
 */

const drawnRows = [
  [72, 4, 8, 35, 9, 3, 10, 69, 27, 19],
  [51, 68, 16, 31, 25, 37, 77, 5, 80, 67],
];

const initialTickets = [
  { id: 6, numbers: [46, 45, 36, 37], hits: [37], payout: null },
  { id: 5, numbers: [78, 77, 66, 56, 58], hits: [77], payout: null },
  { id: 4, numbers: [46, 27, 25, 17], hits: [27, 25], payout: "1.50" },
  { id: 3, numbers: [57, 56, 46, 45, 36], hits: [], payout: null },
];

const tabs = [
  { id: "game", label: "GAME", icon: "▶" },
  { id: "history", label: "HISTORY", icon: "↶" },
  { id: "results", label: "RESULTS", icon: "✓" },
  { id: "statistics", label: "STATISTICS", icon: "▥" },
];

function Ticket({ ticket }) {
  return (
    <section
      className={`rounded-xl p-2.5 ${
        ticket.payout ? "bg-[#24523d]" : "bg-[#293235]"
      }`}
    >
      <h2 className="mb-2 text-[27px] font-extrabold leading-none text-[#55c98a]">
        {ticket.id} My Ticket
      </h2>

      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, index) => {
          const number = ticket.numbers[index];
          const hit = number != null && ticket.hits.includes(number);

          return (
            <div
              key={`${ticket.id}-${index}`}
              className={`flex aspect-square min-w-0 items-center justify-center rounded-md text-[clamp(13px,4.2vw,29px)] font-bold ${
                number == null
                  ? ticket.payout
                    ? "bg-[#1d4030]"
                    : "bg-[#20282a]"
                  : hit
                    ? "bg-[#4db77d] text-white"
                    : "bg-[#37464d] text-[#e0e4e6]"
              }`}
            >
              {number ?? ""}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex min-h-12 items-center rounded-md bg-[#1f2729] px-2.5 text-[25px] font-bold text-[#d5d9db]">
        <span className={ticket.payout ? "w-1/2" : "w-full"}>Bet 1</span>
        {ticket.payout && (
          <span className="w-1/2 text-[#55c98a]">{ticket.payout}</span>
        )}
      </div>
    </section>
  );
}

export default function FastKeno() {
  const [activeTab, setActiveTab] = useState("game");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#1b2021] font-sans text-white">
      {/* App header */}
      <header className="flex h-[112px] items-center justify-between border-b border-[#30383a] bg-[#101216] px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#6fb6dc] bg-gradient-to-br from-[#d8f4ff] via-[#218bd2] to-[#07395b] shadow-inner">
          <span className="text-5xl font-black italic text-white drop-shadow">ϟ</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#4397ff]">ጨዋታ</span>
          <button className="rounded-lg bg-[#398cf0] px-6 py-3 text-2xl font-bold text-[#071321]">
            ግን
          </button>
        </div>
      </header>

      {/* Game title and account bar */}
      <div className="flex h-[62px] items-center justify-between gap-2 bg-black px-3">
        <div className="w-[105px] shrink-0 text-[23px] font-black italic leading-[18px] tracking-tight">
          <span className="block text-white">FAST</span>
          <span className="block text-[#56bd80]">KENO</span>
        </div>

        <div className="flex h-[42px] min-w-0 flex-1 items-center overflow-hidden rounded-full border border-[#175238] bg-[#111b18] text-sm">
          <div className="flex h-full flex-1 items-center justify-center gap-1 whitespace-nowrap px-2 text-[#f6c34d]">
            <span className="text-lg">10 004.50</span>
            <span className="text-xs text-white">DEMO</span>
          </div>
          <div className="h-full w-px bg-[#17402f]" />
          <div className="flex h-full flex-1 items-center justify-center gap-1 whitespace-nowrap px-2 text-sm">
            ID: 892090265 <span className="text-lg text-[#51c99a]">◆</span>
          </div>
        </div>

        <button
          aria-label="Open game menu"
          onClick={() => setMenuOpen((value) => !value)}
          className="ml-1 flex shrink-0 flex-col gap-1.5 p-1"
        >
          <span className="h-1.5 w-10 rounded-full bg-[#67c99a]" />
          <span className="h-1.5 w-10 rounded-full bg-[#67c99a]" />
          <span className="h-1.5 w-10 rounded-full bg-[#67c99a]" />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-3 z-10 mt-1 rounded-lg border border-[#3c5148] bg-[#101615] p-3 shadow-xl">
          <button onClick={() => setMenuOpen(false)} className="text-sm text-[#6bd39d]">
            Close menu ×
          </button>
          <p className="mt-2 text-sm text-gray-200">Game menu</p>
          <p className="text-sm text-gray-400">Settings · Help · Exit</p>
        </div>
      )}

      {/* Winning result */}
      <section className="relative overflow-hidden px-3 pb-4 pt-4">
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full border-[5px] border-[#254237]/50" />
        <div className="pointer-events-none absolute left-1/2 top-5 h-44 w-44 -translate-x-1/2 rounded-full border-[4px] border-[#254237]/50" />
        <div className="relative mb-10 text-center">
          <div className="text-[39px] font-extrabold leading-tight">YOU WIN</div>
          <div className="text-[58px] font-extrabold leading-[0.95] text-[#59d995]">3.50</div>
        </div>

        {/* Recently drawn numbers */}
        <div className="space-y-5">
          {drawnRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-10 gap-1.5">
              {row.map((number, index) => {
                const hit = [35, 27, 25, 37, 77].includes(number);
                return (
                  <div
                    key={`${rowIndex}-${index}`}
                    className={`flex aspect-square items-center justify-center rounded-full border-2 text-[clamp(13px,4vw,27px)] font-extrabold shadow-[inset_0_3px_7px_rgba(255,255,255,0.35),inset_0_-5px_8px_rgba(0,0,0,0.45)] ${
                      hit
                        ? "border-[#397e67] bg-gradient-to-b from-[#5ed9a2] to-[#00664d] text-[#80ffb7]"
                        : "border-[#43535b] bg-gradient-to-b from-[#72838d] via-[#203e50] to-[#00121e] text-[#e7edf2]"
                    }`}
                  >
                    {number}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Navigation tabs */}
      <nav className="mx-4 flex items-center justify-between gap-2 overflow-x-auto border-b-4 border-transparent">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-4 pb-2 text-[clamp(15px,3.7vw,27px)] ${
              activeTab === tab.id
                ? "border-[#67ce99] text-[#67ce99]"
                : "border-transparent text-[#68c995]"
            }`}
          >
            <span className="text-[1.15em] font-bold">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Ticket summary */}
      <div className="flex items-center justify-between px-5 py-5 text-[17px] text-[#91a89d]">
        <span>All <b className="ml-2 font-medium text-[#21c775]">1278</b></span>
        <span>My Tickets <b className="ml-2 font-medium text-[#21c775]">6</b></span>
        <span>My Bets <b className="ml-2 font-medium text-[#21c775]">6</b></span>
      </div>

      <div className="space-y-3 px-4 pb-8">
        {activeTab === "game" ? (
          initialTickets.map((ticket) => <Ticket key={ticket.id} ticket={ticket} />)
        ) : (
          <section className="rounded-xl bg-[#293235] p-5 text-center">
            <h2 className="text-xl font-bold text-[#55c98a]">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {activeTab === "history" && "Your recent game history will appear here."}
              {activeTab === "results" && "Recent Keno results will appear here."}
              {activeTab === "statistics" && "Your game statistics will appear here."}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
