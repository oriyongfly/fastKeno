import React, { useEffect, useRef, useState } from "react";

/**
 * FastKeno.jsx
 * A self-contained React recreation of the supplied Fast Keno screen.
 *
 * DRAW ALGORITHM:
 * - A round draws 20 unique numbers from 1..80.
 * - Each draw uses crypto.getRandomValues() when available.
 * - Rejection sampling avoids modulo bias.
 * - The draw is a client-side demo only. Do NOT use client-side randomness
 *   as the trusted result source for real-money gambling. Generate and audit
 *   results on a secure backend instead.
 */

const MIN_NUMBER = 1;
const MAX_NUMBER = 80;
const DRAW_COUNT = 20;
const DRAW_INTERVAL_MS = 650;
const ROUND_SECONDS = 20;

function secureRandomInt(min, max) {
  const range = max - min + 1;

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Uniform integer sampling by rejecting values in the modulo-bias tail.
    const uint32Range = 0x100000000;
    const limit = uint32Range - (uint32Range % range);
    const buffer = new Uint32Array(1);
    let value;
    do {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return min + (value % range);
  }

  // Fallback for local demos in older environments. Backend randomness is
  // required for production games.
  return min + Math.floor(Math.random() * range);
}

function drawUniqueNumbers(count = DRAW_COUNT, min = MIN_NUMBER, max = MAX_NUMBER) {
  if (count > max - min + 1) {
    throw new Error("Cannot draw more unique numbers than the range contains.");
  }

  // Partial Fisher-Yates shuffle: O(count) time, no duplicates.
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  for (let i = 0; i < count; i += 1) {
    const j = i + secureRandomInt(0, pool.length - i - 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function KenoBall({ number, active, latest }) {
  return (
    <div className={`keno-ball ${active ? "is-hit" : ""} ${latest ? "is-latest" : ""}`}>
      {number}
    </div>
  );
}

export default function FastKeno() {
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [isDrawing, setIsDrawing] = useState(false);
  const [round, setRound] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawSpeed, setDrawSpeed] = useState(DRAW_INTERVAL_MS);
  const drawQueueRef = useRef([]);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const beginRound = () => {
    window.clearInterval(timerRef.current);
    window.clearInterval(countdownRef.current);

    const numbers = drawUniqueNumbers();
    drawQueueRef.current = [...numbers];
    setDrawnNumbers([]);
    setCurrentNumber(null);
    setSecondsLeft(ROUND_SECONDS);
    setIsDrawing(true);

    timerRef.current = window.setInterval(() => {
      const next = drawQueueRef.current.shift();
      if (next == null) {
        window.clearInterval(timerRef.current);
        setIsDrawing(false);
        return;
      }

      setCurrentNumber(next);
      setDrawnNumbers((previous) => [...previous, next]);

      if (drawQueueRef.current.length === 0) {
        window.clearInterval(timerRef.current);
        setIsDrawing(false);
      }
    }, drawSpeed);

    countdownRef.current = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(countdownRef.current);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    beginRound();
    return () => {
      window.clearInterval(timerRef.current);
      window.clearInterval(countdownRef.current);
    };
    // Start the first round only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const numberSet = new Set(drawnNumbers);
  const recentNumbers = [...drawnNumbers].slice(-9).reverse();

  const nextRound = () => {
    setRound((value) => value + 1);
    beginRound();
  };

  return (
    <main className="keno-page">
      <style>{`
        * { box-sizing: border-box; }
        .keno-page {
          min-height: 100vh; width: 100%; padding: 0 10px 24px;
          background: #0e1115; color: #e8ecee;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        .keno-shell {
          width: 100%; max-width: 720px; min-height: calc(100vh - 48px);
          margin: 48px auto 0; padding: 8px 4px 30px; overflow: hidden;
          background: radial-gradient(ellipse at 50% 18%, #173c35 0%, #1a2020 34%, #191e20 65%);
          border-top: 1px solid #263133; position: relative;
        }
        .keno-header { height: 38px; display:flex; align-items:center; justify-content:center; position:relative; }
        .keno-logo { font-size: clamp(20px, 4vw, 27px); font-weight: 950; font-style:italic; letter-spacing:-1.5px; }
        .keno-logo span:first-child { color:#e7edf0; text-shadow: 1px 1px #72818a; }
        .keno-logo span:last-child { color:#43b77b; }
        .keno-menu { position:absolute; right:5px; top:2px; border:0; background:transparent; color:#59c98c; font-size:25px; cursor:pointer; line-height:1; }
        .keno-menu-panel { position:absolute; z-index:5; right:4px; top:34px; padding:10px; background:#101719; border:1px solid #344348; border-radius:8px; display:flex; flex-direction:column; gap:8px; }
        .keno-menu-panel button { color:#e6eeee; background:#253033; border:0; border-radius:5px; padding:8px 12px; cursor:pointer; }
        .keno-status { height:43px; display:flex; align-items:center; justify-content:flex-end; gap:9px; padding:0 10px; font-family:monospace; font-size:24px; font-weight:800; }
        .keno-slash { color:#49c184; font-size:27px; }
        .keno-stage { height:166px; position:relative; display:flex; flex-direction:column; justify-content:flex-end; padding-bottom:22px; }
        .keno-rings { position:absolute; inset:-20px 8% 0; overflow:hidden; opacity:.45; pointer-events:none; }
        .keno-rings i { position:absolute; left:50%; top:18px; border:4px solid transparent; border-top-color:#275447; border-left-color:#275447; border-radius:50%; transform:translateX(-50%) rotate(25deg); }
        .keno-rings i:nth-child(1) { width:95px;height:95px; }
        .keno-rings i:nth-child(2) { width:155px;height:155px;top:2px; }
        .keno-rings i:nth-child(3) { width:215px;height:215px;top:-16px; }
        .keno-rings i:nth-child(4) { width:275px;height:275px;top:-34px; }
        .keno-rings i:nth-child(5) { width:335px;height:335px;top:-52px; }
        .keno-current { position:absolute; right:21%; top:30px; width:60px; height:60px; border-radius:50%; display:grid; place-items:center; background:linear-gradient(#607985,#15252e 68%); border:2px solid #72838a; box-shadow:inset 0 3px 5px #ffffff2b, 0 4px 8px #0006; color:#f4f5f5; font-size:29px; font-weight:800; z-index:2; }
        .keno-recent { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:clamp(7px, 2.4vw, 24px); }
        .keno-ball { flex:0 0 auto; width:36px; height:36px; display:grid; place-items:center; border-radius:50%; color:#e9eff1; font-size:18px; font-weight:800; background:radial-gradient(circle at 35% 22%, #425f6b, #0b1720 65%); border:2px solid #4b646c; box-shadow:inset 0 2px 3px #ffffff24, 0 2px 3px #0006; }
        .keno-ball.is-hit { background:radial-gradient(circle at 35% 20%, #47dfaa, #006e4e 65%, #033d32); border-color:#368a6d; }
        .keno-ball.is-latest { transform:translateY(-2px); }
        .keno-grid { display:grid; grid-template-columns:repeat(10,minmax(0,1fr)); gap:3px; }
        .keno-cell { min-width:0; aspect-ratio:1.04; display:grid; place-items:center; border-radius:3px; background:linear-gradient(145deg,#2c3539,#242b2f); color:#777d80; font-size:clamp(14px, 3.6vw, 25px); font-weight:800; position:relative; }
        .keno-cell.hit { color:#d9e4de; background:#438d65; }
        .keno-cell.latest { box-shadow:inset 0 0 0 2px #78d6a0; }
        .keno-cell .dot { position:absolute; width:7px;height:7px;border-radius:50%;top:2px;left:3px;background:#58a6c0; }
        .keno-cell:nth-child(16n + 7) .dot, .keno-cell:nth-child(19n + 2) .dot { background:#c34a52; }
        .keno-controls { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:18px 0 0; }
        .keno-controls button { border:1px solid #38534a; background:#1e332c; color:#dce9e2; border-radius:6px; padding:9px 14px; font-weight:700; cursor:pointer; }
        .keno-controls button:disabled { opacity:.45; cursor:default; }
        .keno-note { text-align:center; color:#84918e; font-size:11px; margin:12px 8px 0; line-height:1.5; }
        @media (max-width:420px) {
          .keno-page { padding:0 6px 16px; }
          .keno-shell { margin-top:24px; }
          .keno-stage { height:156px; }
          .keno-ball { width:clamp(27px, 7.7vw, 36px); height:clamp(27px, 7.7vw, 36px); font-size:clamp(13px, 3.8vw, 18px); border-width:1px; }
          .keno-recent { gap:clamp(4px, 1.7vw, 8px); }
          .keno-current { right:21%; width:54px; height:54px; font-size:26px; }
          .keno-cell { aspect-ratio:1; }
        }
      `}</style>

      <section className="keno-shell">
        <header className="keno-header">
          <div className="keno-logo"><span>FAST</span><span>KENO</span></div>
          <button className="keno-menu" aria-label="Open menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          {menuOpen && (
            <div className="keno-menu-panel">
              <button onClick={nextRound}>New round</button>
              <button onClick={() => setDrawSpeed((v) => v === 650 ? 250 : 650)}>
                Draw speed: {drawSpeed === 650 ? "Normal" : "Fast"}
              </button>
            </div>
          )}
        </header>

        <div className="keno-status" aria-label="Round countdown">
          <span>{String(secondsLeft).padStart(2, "0")}</span>
          <span className="keno-slash">/</span>
          <span>{String(ROUND_SECONDS).padStart(2, "0")}</span>
        </div>

        <section className="keno-stage" aria-label="Latest drawn numbers">
          <div className="keno-rings" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          {currentNumber !== null && <div className="keno-current">{currentNumber}</div>}
          <div className="keno-recent">
            {recentNumbers.map((number, index) => (
              <KenoBall key={number} number={number} active={true} latest={index === 0} />
            ))}
            {Array.from({ length: Math.max(0, 9 - recentNumbers.length) }, (_, index) => (
              <KenoBall key={`empty-${index}`} number="–" active={false} latest={false} />
            ))}
          </div>
        </section>

        <section className="keno-grid" aria-label="Keno numbers 1 to 80">
          {Array.from({ length: MAX_NUMBER }, (_, index) => {
            const number = index + 1;
            const hit = numberSet.has(number);
            return (
              <div key={number} className={`keno-cell ${hit ? "hit" : ""} ${currentNumber === number ? "latest" : ""}`}>
                {[4, 27, 36, 48, 52, 60, 70, 74, 80].includes(number) && <span className="dot" />}
                {number}
              </div>
            );
          })}
        </section>

        <div className="keno-controls">
          <button onClick={nextRound}>{isDrawing ? "Restart round" : "Next round"}</button>
          <button onClick={() => { setDrawnNumbers([]); setCurrentNumber(null); }}>Clear board</button>
        </div>
        <p className="keno-note">
          Round {round} · {drawnNumbers.length}/{DRAW_COUNT} numbers drawn.
          Demo animation only; production results should be generated and verified server-side.
        </p>
      </section>
    </main>
  );
}

// Named exports make the draw logic easy to test separately.
export { drawUniqueNumbers, secureRandomInt, DRAW_COUNT, MAX_NUMBER };
