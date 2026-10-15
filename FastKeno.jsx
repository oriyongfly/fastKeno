import React, { useState, useEffect } from 'react'; import { Zap, History, BarChart2, HelpCircle, Trophy, Volume2, User } from 'lucide-react';
export default function FastKeno() { const [balance, setBalance] = useState(9997.00); const [ticketId] = useState('892079972'); const [activeTab, setActiveTab] = useState('game'); // 'game', 'history', 'results', 'stats' const [selectedNumbers, setSelectedNumbers] = useState([20, 30, 50, 68, 24, 34, 36, 17, 16, 38, 57, 19, 75, 22]); const [betAmount, setBetAmount] = useState(1); const [isPlaying, setIsPlaying] = useState(true); const [drawCount, setDrawCount] = useState(20); const [currentDrawnNumber, setCurrentDrawnNumber] = useState(72); const [drawnList, setDrawnList] = useState([74, 8, 39, 60, 66, 18, 23, 20, 63, 72]);
// Toggle selection of numbers (1-80) const toggleNumber = (num) => { if (selectedNumbers.includes(num)) { setSelectedNumbers(selectedNumbers.filter(n => n !== num)); } else { if (selectedNumbers.length < 10) { setSelectedNumbers([...selectedNumbers, num]); } } };
return ( <div className="min-h-screen bg-[#0b191e] text-white flex flex-col max-w-md mx-auto select-none font-sans">
  {/* Top Header */}
  <div className="bg-[#102229] px-4 py-3 flex items-center justify-between border-b border-[#1f3842]">
    <div className="flex items-center space-x-2">
      <div className="bg-yellow-400 p-1.5 rounded-lg text-black font-bold">
        <Zap size={20} className="fill-current" />
      </div>
      <div>
        <h1 className="font-black tracking-wider text-sm italic text-yellow-400">FAST KENO</h1>
      </div>
    </div>

    <div className="flex items-center space-x-3">
      <div className="bg-[#162e38] px-3 py-1 rounded-full text-xs font-semibold border border-[#23424f] flex items-center space-x-1">
        <span className="text-yellow-400 font-bold">{balance.toFixed(2)}</span>
        <span className="text-gray-400 text-[10px]">DEMO</span>
      </div>
      <div className="bg-[#162e38] px-2.5 py-1 rounded-full text-xs text-gray-300 border border-[#23424f] flex items-center space-x-1">
        <User size={12} className="text-gray-400" />
        <span className="text-[11px]">{ticketId}</span>
      </div>
    </div>
  </div>

  {/* Main Draw Stage / Dashboard */}
  <div className="bg-gradient-to-b from-[#102229] to-[#0b191e] p-4 flex flex-col items-center relative border-b border-[#1f3842]">
    <div className="absolute top-3 right-3 text-gray-400 text-xs flex items-center space-x-1">
      <span>{drawCount} / 20</span>
    </div>

    {/* Central Ball / Number Spinner Display */}
    <div className="relative w-36 h-36 my-4 flex items-center justify-center">
      {/* Outer Ring Animation / Glow */}
      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/20"></div>
      
      <div className="w-24 h-24 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/50 border-4 border-emerald-300">
        <span className="text-4xl font-black text-white drop-shadow">{currentDrawnNumber}</span>
      </div>
    </div>

    {/* Drawn Numbers Bar */}
    <div className="w-full overflow-x-auto py-2 flex space-x-2 scrollbar-none justify-start px-2">
      {drawnList.map((num, idx) => (
        <div 
          key={idx} 
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            selectedNumbers.includes(num) 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300' 
              : 'bg-[#1b343e] text-gray-300 border border-[#294c5a]'
          }`}
        >
          {num}
        </div>
      ))}
    </div>
  </div>

  {/* Navigation Sub-Tabs */}
  <div className="bg-[#0e1f26] grid grid-cols-4 text-center border-b border-[#1b343e] text-xs font-semibold">
    <button 
      onClick={() => setActiveTab('game')}
 className={`py-3 flex items-center justify-center space-x-1 border-b-2 ${activeTab === 'game' ? 'border-emerald-400 text-emerald-400 bg-[#142b34]' : 'border-transparent text-gray-400'}`}
    >
      <Zap size={14} />
      <span>GAME</span>
    </button>
    <button 
      onClick={() => setActiveTab('history')}
      className={`py-3 flex items-center justify-center space-x-1 border-b-2 ${activeTab === 'history' ? 'border-emerald-400 text-emerald-400 bg-[#142b34]' : 'border-transparent text-gray-400'}`}
    >
      <History size={14} />
      <span>HISTORY</span>
    </button>
    <button 
      onClick={() => setActiveTab('results')}
      className={`py-3 flex items-center justify-center space-x-1 border-b-2 ${activeTab === 'results' ? 'border-emerald-400 text-emerald-400 bg-[#142b34]' : 'border-transparent text-gray-400'}`}
    >
      <Trophy size={14} />
      <span>RESULTS</span>
    </button>
    <button 
      onClick={() => setActiveTab('stats')}
      className={`py-3 flex items-center justify-center space-x-1 border-b-2 ${activeTab === 'stats' ? 'border-emerald-400 text-emerald-400 bg-[#142b34]' : 'border-transparent text-gray-400'}`}
    >
      <BarChart2 size={14} />
      <span>STATS</span>
    </button>
  </div>

  {/* Tickets Content Section */}
  <div className="flex-1 p-3 space-y-3 overflow-y-auto pb-28">
    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
      <span>All 1234</span>
      <span>My Tickets (3)</span>
      <span>My Bets (3)</span>
    </div>

    {/* Ticket Item 3 */}
    <div className="bg-[#12252e] rounded-xl p-3 border border-[#1c3844] space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-300">3 My Ticket</span>
        <span className="text-yellow-500 font-semibold">Waiting</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {[20, 30, 50, 68].map((n, i) => (
          <div key={i} className="bg-emerald-600 text-white font-bold text-center py-1.5 rounded text-xs shadow">
            {n}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 pt-1 flex justify-between">
        <span>Bet 1</span>
      </div>
    </div>

    {/* Ticket Item 2 */}
    <div className="bg-[#12252e] rounded-xl p-3 border border-[#1c3844] space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-300">2 My Ticket</span>
        <span className="text-yellow-500 font-semibold">Waiting</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {[24, 34, 36, 17, 16].map((n, i) => (
          <div key={i} className="bg-[#1c3642] text-gray-300 font-bold text-center py-1.5 rounded text-xs border border-[#284b5c]">
            {n}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 pt-1 flex justify-between">
        <span>Bet 1</span>
      </div>
    </div>

    {/* Ticket Item 1 */}
    <div className="bg-[#12252e] rounded-xl p-3 border border-[#1c3844] space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-300">1 My Ticket</span>
        <span className="text-yellow-500 font-semibold">Waiting</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {[38, 57].map((n, i) => (
          <div key={i} className="bg-[#1c3642] text-gray-300 font-bold text-center py-1.5 rounded text-xs border border-[#284b5c]">
            {n}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 pt-1 flex justify-between">
        <span>Bet 1</span>
      </div>
    </div>
  </div>

  {/* Bottom Sticky Action Bar / Bet Controller */}
  <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0e1f26] border-t border-[#1b343e] p-3 shadow-2xl">
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-[#142933] border border-[#234756] rounded-xl flex items-center px-3 py-1.5 justify-between">
        <button
 onClick={() => setBetAmount(Math.max(1, betAmount - 1))}
          className="text-gray-400 font-bold text-lg px-2 hover:text-white"
        >
          -
        </button>
        <span className="font-black text-base text-white">{betAmount}</span>
        <button 
          onClick={() => setBetAmount(betAmount + 1)}
          className="text-gray-400 font-bold text-lg px-2 hover:text-white"
        >
          +
        </button>
      </div>
      <button className="bg-[#142933] border border-[#234756] px-4 py-2 rounded-xl font-bold text-xs text-gray-300 hover:bg-[#1b343e]">
        X2
      </button>
      <button 
        onClick={() => setBetAmount(100)}
        className="bg-[#142933] border border-[#234756] px-4 py-2 rounded-xl font-bold text-xs text-emerald-400 hover:bg-[#1b343e]"
      >
        MAX
      </button>
    </div>
    
    <button className="w-full mt-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black py-3 rounded-xl tracking-wider text-sm shadow-lg shadow-emerald-900/50">
      BET ACCEPTED
    </button>
  </div>

</div>
); }