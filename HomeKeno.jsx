import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  // HelpCircle, 
  // RefreshCw, 
  // Zap, 
  Trash2, 
  // Trophy, 
  // BarChart3, 
  // History, 
  // Clock, 
  // Dices,
  // Info
} from 'lucide-react';

export default function App() {
  // Game parameters
  const MAX_PICKS = 10;
  const GRID_SIZE = 80;

  // App State
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betAmount, setBetAmount] = useState(2);
  const [balance, setBalance] = useState(100.00);
  // const [demoBalance, setDemoBalance] = useState(0.00);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timer, setTimer] = useState(60);
  const [activeTab, setActiveTab] = useState('Game');
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Timer Countdown Effect
  useEffect(() => {
    // triggerDraw defined inside to avoid stale-closure lint warning
    const triggerDraw = () => {
      setIsDrawing(true);
      setDrawnNumbers([]);

      const winners = new Set();
      while (winners.size < 20) {
        winners.add(Math.floor(Math.random() * GRID_SIZE) + 1);
      }
      const drawnArray = Array.from(winners);

      let currentRevealed = [];
      drawnArray.forEach((num, index) => {
        setTimeout(() => {
          currentRevealed.push(num);
          setDrawnNumbers([...currentRevealed]);

          if (index === 19) {
            setIsDrawing(false);
            evaluateResults(drawnArray);
          }
        }, index * 150);
      });
    };

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          triggerDraw();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNumbers, betAmount]);

  // Toast message timer
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle individual number selection
  const handleNumberClick = (num) => {
    if (isDrawing) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length >= MAX_PICKS) {
        showToast(`You can pick a maximum of ${MAX_PICKS} numbers!`);
        return;
      }
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  // Quick Random Auto Pick
  const handleAutoPick = (count = 5) => {
    if (isDrawing) return;
    const nums = new Set();
    while (nums.size < count) {
      const rand = Math.floor(Math.random() * GRID_SIZE) + 1;
      nums.add(rand);
    }
    setSelectedNumbers(Array.from(nums));
  };

  // Clear selections
  const handleClearPicks = () => {
    if (!isDrawing) setSelectedNumbers([]);
  };

  const handleBetChange = (delta) => {
    setBetAmount((prev) => Math.max(1, prev + delta));
  };

  const handleMultiplyBet = (factor) => {
    setBetAmount((prev) => Math.max(1, Math.floor(prev * factor)));
  };

  const handleMaxBet = () => {
    setBetAmount(Math.min(100, Math.floor(balance)));
  };

  // Place Bet
  const handlePlaceBet = () => {
    if (selectedNumbers.length === 0) {
      showToast("Please select at least 1 number before placing a bet!");
      return;
    }
    if (balance < betAmount) {
      showToast("Insufficient balance to place this bet.");
      return;
    }

    // Deduct balance & add ticket
    setBalance((prev) => prev - betAmount);
    const newTicket = {
      id: Date.now(),
      picks: [...selectedNumbers],
      bet: betAmount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending'
    };

    setActiveTickets([newTicket, ...activeTickets]);
    showToast(`Bet of ETB ${betAmount.toFixed(2)} placed successfully!`);
  };

  // Calculate winnings for placed tickets
  const evaluateResults = (drawn) => {
    if (activeTickets.length === 0) return;

    let totalWin = 0;
    const updatedTickets = activeTickets.map((ticket) => {
      const matches = ticket.picks.filter((n) => drawn.includes(n)).length;
      let multiplier = 0;

      // Basic Keno payout multiplier chart simulation
      if (ticket.picks.length === matches) multiplier = matches * 3;
      else if (matches > ticket.picks.length / 2) multiplier = 1.5;

      const payout = ticket.bet * multiplier;
      totalWin += payout;

      return {
        ...ticket,
        status: payout > 0 ? `Won ETB ${payout.toFixed(2)}` : 'Lost',
        matches
      };
    });

    if (totalWin > 0) {
      setBalance((prev) => prev + totalWin);
      showToast(`🎉 Congratulations! You won ETB ${totalWin.toFixed(2)}!`);
    }

    setGameHistory((prev) => [...updatedTickets, ...prev]);
    setActiveTickets([]);
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-slate-100 flex justify-center font-sans select-none">
      <div className="w-full max-w-md bg-[#0d131f] flex flex-col justify-between shadow-2xl relative border-x border-slate-800/50">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20 animate-bounce text-center max-w-[85%]">
            {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between px-3 py-3 bg-[#121927] border-b border-slate-800">
          <button className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            <span className="font-black text-xl italic tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
              FAST<span className="text-emerald-500">KENO</span>
            </span>
          </div>

          {/* Balance Pill */}
          <div className="bg-[#0a0f19] border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200">
            ETB {balance.toFixed(2)} {/* <span className="text-slate-500 mx-0.5">|</span> <span className="text-slate-400">{demoBalance.toFixed(2)}</span> */}
          </div>

          {/* Demo Help Badge */}
          <div className="flex items-center text-[11px] text-red-400 font-semibold bg-red-950/40 border border-red-800/40 px-2 py-1 rounded-md gap-1">
            <span className="text-red-500 font-bold">?</span> ለመሞከር ብቻ ነው
          </div>
        </div>

        {/* Sound Bar Sub-Header */}
        <div className="px-3 py-1.5 bg-[#0a0f19] border-b border-slate-800/50 flex justify-between items-center">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-600" />}
          </button>
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button 
              onClick={() => handleAutoPick(5)} 
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/20"
            >
              Auto 5
            </button>
            <button 
              onClick={() => handleAutoPick(10)} 
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/20"
            >
              Auto 10
            </button>
            {selectedNumbers.length > 0 && (
              <button 
                onClick={handleClearPicks}
                className="p-1 text-slate-400 hover:text-red-400 transition"
                title="Clear picks"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          
          {/* Radar Screen / Countdown Display */}
          <div className="relative h-36 bg-[#090d16] rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            
            {/* Subtle Radar Ring Animations in background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
              <div className="w-64 h-64 rounded-full border border-emerald-500 animate-ping" style={{ animationDuration: '4s' }} />
              <div className="w-48 h-48 rounded-full border border-emerald-400/50 absolute" />
              <div className="w-32 h-32 rounded-full border border-emerald-400/30 absolute" />
              <div className="w-16 h-16 rounded-full border border-emerald-400/20 absolute" />
            </div>

            {/* Neon Green Timer Display */}
            {!isDrawing ? (
              <div className="z-10 flex items-center gap-3 font-mono font-bold text-4xl text-emerald-400 tracking-wider drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                <span>00</span>
                <span className="text-emerald-500/60 animate-pulse">:</span>
                <span>{timer < 10 ? `0${timer}` : timer}</span>
              </div>
            ) : (
              /* Live Drawn Numbers Display */
              <div className="z-10 w-full px-3">
                <div className="text-center text-xs font-semibold text-emerald-400 mb-1 animate-pulse">
                  DRAWING NUMBERS... ({drawnNumbers.length}/20)
                </div>
                <div className="flex flex-wrap justify-center gap-1 max-h-24 overflow-y-auto p-1">
                  {drawnNumbers.map((num, i) => (
                    <span 
                      key={i} 
                      className="w-7 h-7 bg-emerald-500 text-slate-950 font-bold text-xs rounded-full flex items-center justify-center shadow-md shadow-emerald-500/40 animate-scale"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Picks Counter Header */}
          <div className="flex justify-between items-center bg-[#121927] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-slate-300">
              Picks: <span className="text-emerald-400 font-bold">{selectedNumbers.length}</span>/{MAX_PICKS}
            </span>
            {selectedNumbers.length > 0 && (
              <div className="text-[11px] text-slate-400 flex gap-1 overflow-x-auto max-w-[200px] no-scrollbar">
                {selectedNumbers.sort((a,b)=>a-b).join(', ')}
              </div>
            )}
          </div>

          {/* 80-Number Grid (10 columns x 8 rows) */}
          <div className="grid grid-cols-10 gap-1 bg-[#101622] p-1.5 rounded-xl border border-slate-800/80">
            {Array.from({ length: GRID_SIZE }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              const isDrawn = drawnNumbers.includes(num);
              const isHit = isSelected && isDrawn;

              let btnStyle = "bg-[#182030] text-slate-300 border-slate-700/50 hover:bg-slate-700/50";

              if (isHit) {
                btnStyle = "bg-yellow-400 text-slate-950 font-black border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.8)] scale-105 z-10";
              } else if (isSelected) {
                btnStyle = "bg-slate-100 text-slate-900 font-extrabold border-white shadow-[0_0_8px_rgba(255,255,255,0.6)]";
              } else if (isDrawn) {
                btnStyle = "bg-emerald-600/80 text-white font-bold border-emerald-400/50";
              }

              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={isDrawing}
                  className={`h-8 rounded text-xs font-semibold flex items-center justify-center transition-all duration-150 border ${btnStyle}`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Bet Control Section */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-5 gap-1.5">
              {/* Minus */}
              <button
                onClick={() => handleBetChange(-1)}
                className="bg-[#182030] hover:bg-slate-700 text-slate-200 font-bold rounded-lg py-2.5 border border-slate-700 text-lg flex items-center justify-center active:scale-95 transition"
              >
                -
              </button>

              {/* Amount Box */}
              <div className="col-span-1 bg-[#101622] border border-slate-700 rounded-lg flex items-center justify-center text-slate-100 font-bold text-sm">
                {betAmount}
              </div>

              {/* Plus */}
              <button
                onClick={() => handleBetChange(1)}
                className="bg-[#182030] hover:bg-slate-700 text-slate-200 font-bold rounded-lg py-2.5 border border-slate-700 text-lg flex items-center justify-center active:scale-95 transition"
              >
                +
              </button>

              {/* Multiplier x2 */}
              <button
                onClick={() => handleMultiplyBet(2)}
                className="bg-[#182030] hover:bg-slate-700 text-slate-200 font-semibold rounded-lg py-2.5 border border-slate-700 text-xs active:scale-95 transition"
              >
                x2
              </button>

              {/* Max */}
              <button
                onClick={handleMaxBet}
                className="bg-[#182030] hover:bg-slate-700 text-slate-200 font-semibold rounded-lg py-2.5 border border-slate-700 text-xs active:scale-95 transition"
              >
                max
              </button>
            </div>

            {/* Main Green BET Button */}
            <button
              onClick={handlePlaceBet}
              disabled={isDrawing}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-black tracking-wider text-base py-3.5 rounded-lg shadow-lg shadow-emerald-950/50 border border-emerald-400/40 transition transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              BET
            </button>
          </div>

          {/* Bottom Tabs Header */}
          <div className="pt-2">
            <div className="flex border-b border-slate-800 bg-[#0a0f19] rounded-t-lg overflow-x-auto no-scrollbar">
              {['Game', 'History', 'Results', 'Statistics', 'Leaders'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-2 text-[11px] font-mono transition text-center whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-slate-100 border-b-2 border-slate-300 font-bold bg-[#141b2b]'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab View Content */}
            <div className="bg-[#101622] p-3 rounded-b-lg border-x border-b border-slate-800 min-h-[90px]">
              {activeTab === 'Game' && (
                <div>
                  <div className="grid grid-cols-3 text-center text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 pb-1.5 mb-2">
                    <div>All</div>
                    <div>My Ticket</div>
                    <div>My Bets</div>
                  </div>
                  <div className="grid grid-cols-3 text-center text-xs font-mono text-slate-300 pb-2">
                    <div>All 0</div>
                    <div>My Ticket {activeTickets.length}</div>
                    <div>My Bets {gameHistory.length}</div>
                  </div>

                  {/* Active / Pending Tickets List */}
                  {activeTickets.length > 0 ? (
                    <div className="space-y-1.5 mt-1">
                      {activeTickets.map((t) => (
                        <div key={t.id} className="bg-[#182030] p-2 rounded text-xs flex justify-between items-center border border-slate-700/50">
                          <div>
                            <span className="text-emerald-400 font-bold">ETB {t.bet}</span>
                            <span className="text-slate-400 text-[10px] ml-2">[{t.picks.join(', ')}]</span>
                          </div>
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-bold">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs text-slate-500 font-mono">
                      No tickets yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'History' && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {gameHistory.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2 font-mono">No past games played yet.</p>
                  ) : (
                    gameHistory.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-[#182030] p-2 rounded">
                        <div>
                          <p className="text-slate-300 font-semibold">Bet: ETB {item.bet}</p>
                          <p className="text-[10px] text-slate-400">Picks: {item.picks.join(', ')}</p>
                        </div>
                        <span className={`font-bold text-xs ${item.status.includes('Won') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Results' && (
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between font-semibold border-b border-slate-800 pb-1">
                    <span>Draw Time</span>
                    <span>Recent Drawn Numbers</span>
                  </div>
                  {drawnNumbers.length > 0 ? (
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-500 font-mono text-[10px]">Just now</span>
                      <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                        {drawnNumbers.slice(0, 8).map((n, i) => (
                          <span key={i} className="bg-emerald-900/60 text-emerald-300 px-1 rounded text-[10px] font-mono">
                            {n}
                          </span>
                        ))}
                        {drawnNumbers.length > 8 && <span className="text-[10px] text-slate-500">...</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 text-xs py-2">Waiting for next draw finish...</p>
                  )}
                </div>
              )}

              {activeTab === 'Statistics' && (
                <div className="text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Hot Numbers:</span>
                    <span className="text-emerald-400 font-mono font-bold">7, 12, 23, 49, 77</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cold Numbers:</span>
                    <span className="text-cyan-400 font-mono font-bold">3, 19, 34, 61, 80</span>
                  </div>
                </div>
              )}

              {activeTab === 'Leaders' && (
                <div className="text-xs space-y-1.5">
                  {[
                    { name: 'User_7891', win: 'ETB 1,450.00' },
                    { name: 'KenoKing', win: 'ETB 920.00' },
                    { name: 'LuckyPick', win: 'ETB 500.00' },
                  ].map((leader, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#182030] px-2 py-1.5 rounded">
                      <span className="text-slate-300 font-medium">#{i+1} {leader.name}</span>
                      <span className="text-emerald-400 font-bold font-mono">{leader.win}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}