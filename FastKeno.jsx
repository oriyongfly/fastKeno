import { useEffect, useRef, useState } from "react";

/* =============================================================================
FAST KENO – UI transitions reproduced from RecordIt-1792080056.mp4
(portrait screen recording, 60 fps, 44 s, ~4 rounds of play)

TRANSITIONS (in the order they happen in the video)
Ball reveal        – ghost ball scales/fades in at the stage centre   ~300ms
Ball → tray        – ball holds, then flies down-left & shrinks        ~350ms
Hit highlight      – ticket cell + drawn ball turn green               ~200ms
TRY AGAIN banner   – fades in after the 20th ball, stays ~4.5s         ~200ms
View swap          – results view → number-selection view, hard cut    ~100ms
Number select      – cell turns green, hint panel swaps to pay table   ~150ms
BET button         – disabled → BET → WAIT... → ✓ BET ACCEPTED         ~150ms
Panel slide        – pay table slides out left, "Choose" slides in     ~300ms
Timer              – 00:60 → 00:00 countdown, 1 tick per second

Needs Tailwind v3+. Only dynamic values (positions, durations) use style.
Font in the video is Roboto Condensed – load it for an exact match.
============================================================================= */

/* ----------------------------- data / constants ---------------------------- */

const DRAW = [7, 37, 6, 13, 54, 29, 4, 20, 63, 72, 74, 8, 39, 60, 26, 66, 80, 23, 59, 40];

const TICKETS = [
  { id: 3, nums: [20, 30, 50, 68], bet: 1 },
  { id: 2, nums: [24, 34, 36, 17, 16], bet: 1 },
  { id: 1, nums: [38, 57], bet: 1 },
  { id: "4**f", nums: [19, 75, 22], bet: 100 },
];

const MY_NUMS = new Set(TICKETS.flatMap((t) => t.nums));

// red corner dots (approximate)
const HOT = new Set([11, 27, 49, 56, 65]);

// blue corner dots (approximate)
const COLD = new Set([14, 31, 74, 75, 79]);

const PAYTABLE = {
  1: { 1: 3.5 },
  2: { 1: 1, 2: 10 },
  3: { 2: 2, 3: 50 },
};

// Per-ball timing: 300 + 350 + 350 = 1000ms, i.e. one ball per second as in the video
const T = { enter: 300, hold: 350, fly: 350 };

// px, where the big ball sits inside the 208px stage
const CENTER_Y = 80;

const slot = (i) => ({
  left: `${5.6 + (i % 10) * 7.77}%`,
  // first ten fill the lower row, next ten the upper row
  top: i < 10 ? 184 : 148,
});

/* ------------------------------- small hooks ------------------------------- */

// true after two animation frames -> lets an element mount in its "from" state first
function useMounted() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

/* Runs the 20-ball draw: enter -> show -> fly, one ball per second */
function useDrawSequence(draw = DRAW) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState("enter");
  const done = i >= draw.length;

  useEffect(() => {
    if (done) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("show")));
    const t1 = setTimeout(() => setPhase("fly"), T.enter + T.hold);
    const t2 = setTimeout(() => {
      setPhase("enter");
      setI((n) => n + 1);
    }, T.enter + T.hold + T.fly);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [i, done]);

  const tray = draw.slice(0, i);
  const current = done ? null : draw[i];
  const drawn = new Set(tray);
  // ticket lights up as ball is revealed
  if (current != null && phase !== "enter") drawn.add(current);

  return {
    i,
    phase,
    tray,
    current,
    drawn,
    done,
    counter: done ? draw.length : i + (phase === "fly" ? 1 : 0),
  };
}

/* ---------------------------------- Ball ----------------------------------- */

function Ball({ n, hit = false, className = "", style }) {
  return (
    <div
      style={style}
      className={[
        "flex select-none items-center justify-center rounded-full font-bold tabular-nums text-slate-100",
        "ring-1 ring-sky-900/80 shadow-[inset_0_5px_6px_rgba(255,255,255,0.22)]",
        "transition-colors duration-200",
        hit ? "bg-emerald-500" : "bg-gradient-to-b from-slate-700 to-slate-950",
        className,
      ].join(" ")}
    >
      {n}
    </div>
  );
}

/* ============================================================================
TRANSITIONS 1 + 2 — Ball reveal and fly-to-tray

enter : opacity .4, scale .5            (mount state, no transition)
show  : opacity 1,  scale 1  – 300ms, overshoot easing (the "pop")
fly   : moves to its tray slot, scale .4 – 350ms ease-in
============================================================================ */

export function DrawBall({ n, phase, index }) {
  const s = slot(index);
  const styles = {
    enter: {
      left: "50%",
      top: CENTER_Y,
      opacity: 0.4,
      transform: "translate(-50%,-50%) scale(0.5)",
      transitionDuration: "0ms",
    },
    show: {
      left: "50%",
      top: CENTER_Y,
      opacity: 1,
      transform: "translate(-50%,-50%) scale(1)",
      transitionDuration: `${T.enter}ms`,
      transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
    },
    fly: {
      left: s.left,
      top: s.top,
      opacity: 1,
      transform: "translate(-50%,-50%) scale(0.4)",
      transitionDuration: `${T.fly}ms`,
      transitionTimingFunction: "cubic-bezier(0.4,0,1,1)",
    },
  };
  return (
    <Ball
      n={n}
      hit={MY_NUMS.has(n) && phase !== "enter"}
      style={styles[phase]}
      className="absolute h-16 w-16 text-3xl transition-[left,top,transform,opacity,background-color] will-change-transform motion-reduce:transition-none"
    />
  );
}

function TrayBall({ n, index }) {
  const s = slot(index);
  return (
    <Ball
      n={n}
      hit={MY_NUMS.has(n)}
      style={{ left: s.left, top: s.top }}
      className="absolute h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 text-[11px]"
    />
  );
}

/* Rotating arcs + teal radial glow behind the balls */
function StageBackdrop() {
  const rings = [
    { size: 150, dur: "14s", rev: false },
    { size: 210, dur: "20s", rev: true },
    { size: 270, dur: "28s", rev: false },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(16,185,129,0.38),transparent_62%)]" />
      {rings.map((r) => (
        <div
          key={r.size}
          style={{
            width: r.size,
            height: r.size,
            top: CENTER_Y - r.size / 2,
            animationDuration: r.dur,
            animationDirection: r.rev ? "reverse" : "normal",
          }}
          className="absolute left-1/2 -ml-[1px] -translate-x-1/2 animate-spin rounded-full border-2 border-emerald-400/20 border-b-transparent border-l-transparent motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

/* ============================================================================
TRANSITION 4 — "TRY AGAIN" banner: 200ms fade-in ~300ms after ball 20 lands
============================================================================ */

export function TryAgainBanner({ show }) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 top-6 text-center text-4xl font-extrabold tracking-tight text-emerald-400",
        "transition-opacity duration-200 ease-out motion-reduce:transition-none",
        show ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      TRY AGAIN
    </div>
  );
}

/* ============================================================================
TRANSITION 3 — Ticket cell highlight (slate → green, 200ms)
============================================================================ */

export function Ticket({ id, nums, bet, drawn, finished }) {
  return (
    <div className="rounded-md bg-zinc-800/80 px-2 pb-1.5 pt-1">
      <div className="text-[11px] font-semibold text-emerald-400">
        {id} {typeof id === "number" ? "My Ticket" : ""}
      </div>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: 10 }, (_, k) => {
          const n = nums[k];
          const hit = n != null && drawn.has(n);
          return (
            <div
              key={k}
              className={[
                "flex h-7 flex-1 items-center justify-center rounded text-xs font-semibold transition-colors duration-200",
                n == null
                  ? "bg-zinc-900/60"
                  : hit
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-700 text-slate-200",
              ].join(" ")}
            >
              {n}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold">
        <span className="text-slate-200">Bet {bet}</span>
        {!finished && <span className="text-yellow-400">Waiting</span>}
      </div>
    </div>
  );
}

/* Results view = stage + tabs + tickets. Calls onDone 5s after the draw ends. */
function ResultsView({ onDone }) {
  const seq = useDrawSequence();
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    if (!seq.done) return;
    // TRY AGAIN appears
    const a = setTimeout(() => setBanner(true), 300);
    // hard cut to selection view
    const b = setTimeout(onDone, 5000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [seq.done]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="relative h-[208px] bg-zinc-900">
        <StageBackdrop />
        <div className="absolute right-3 top-2 text-[11px] font-semibold tabular-nums text-slate-300">
          {String(seq.counter).padStart(2, "0")} <span className="text-emerald-400">/</span> 20
        </div>
        {seq.tray.map((n, k) => (
          <TrayBall key={k} n={n} index={k} />
        ))}
        {seq.current != null && (
          <DrawBall key={seq.i} n={seq.current} phase={seq.phase} index={seq.i} />
        )}
        <TryAgainBanner show={banner} />
      </div>

      <div className="flex gap-4 px-3 pt-2 text-[13px] font-semibold text-slate-300">
        <span className="border-b-2 border-emerald-400 pb-1 text-emerald-400">GAME</span>
        <span>HISTORY</span>
        <span>RESULTS</span>
        <span>STATISTICS</span>
      </div>
      <div className="flex justify-between px-3 py-1 text-[10px] text-slate-400">
        <span>
          All <b className="text-emerald-400">1234</b>
        </span>
        <span>
          My Tickets <b className="text-slate-200">3</b>
        </span>
        <span>
          My Bets <b className="text-slate-200">3</b>
        </span>
      </div>
      <div className="space-y-1.5 px-1.5 pb-2">
        {TICKETS.map((t) => (
          <Ticket key={t.id} {...t} drawn={seq.drawn} finished={seq.done} />
        ))}
      </div>
    </>
  );
}

/* ============================================================================
TRANSITION 8 (+ 6) — Hint panel

picks → "N Possible win X" pay table appears instantly (hard cut).
after BET ACCEPTED → "Choose 10 numbers" slides in from the right while
the pay table slides out to the left, 300ms ease-out.
slide enables the motion.
============================================================================ */

export function InfoPanels({ picks, slide }) {
  const mode = picks.length ? "win" : "choose";
  const table = PAYTABLE[Math.min(Math.max(picks.length, 1), 3)];
  const keys = Object.keys(table);
  const max = Math.max(...Object.values(table));
  const motion = slide
    ? "transition-transform duration-300 ease-out motion-reduce:transition-none"
    : "";

  return (
    <div className="relative mx-2 mt-1 h-[88px] overflow-hidden rounded-lg bg-zinc-800/90">
      {/* choose panel */}
      <div
        className={`absolute inset-0 flex items-center gap-3 px-4 ${motion} ${
          mode === "choose" ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute left-2 top-1 flex items-center gap-0.5">
          <Ball n={80} className="h-4 w-4 text-[7px]" />
          <Ball n={10} className="h-6 w-6 text-[10px]" />
        </div>
        <div className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-900/70 ring-2 ring-emerald-400/60">
          <div className="h-5 w-0.5 -rotate-45 rounded bg-emerald-300" />
        </div>
        <div className="mt-3 leading-tight">
          <div className="text-xl font-bold text-white">Choose 10 numbers</div>
          <div className="text-sm font-semibold text-emerald-400">From 1 to 80</div>
        </div>
        <Help />
      </div>

      {/* pay-table panel */}
      <div
        className={`absolute inset-0 px-3 pt-1.5 ${motion} ${
          mode === "win" ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-sm font-semibold text-slate-100">
          {picks.length} Possible win <span className="text-emerald-400">{max}</span>
        </div>
        <div className="mt-0.5 grid grid-cols-[44px_repeat(10,1fr)] gap-y-0.5 text-[10px] text-slate-400">
          <span>Match</span>
          {keys.map((k) => (
            <span key={k} className="text-center text-slate-200">
              {k}
            </span>
          ))}
          {Array.from({ length: 10 - keys.length }, (_, k) => (
            <span key={`m${k}`} />
          ))}
          <span>Pays</span>
          {keys.map((k) => (
            <span key={k} className="text-center font-semibold text-emerald-400">
              x{table[k]}
            </span>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {Array.from({ length: 10 }, (_, k) => (
            <div
              key={k}
              className="flex h-6 flex-1 items-center justify-center rounded bg-zinc-700 text-[11px] font-semibold text-slate-100 empty:bg-zinc-900/60"
            >
              {picks[k]}
            </div>
          ))}
        </div>
        <Help />
      </div>
    </div>
  );
}

const Help = () => (
  <button className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/60 text-[11px] font-bold text-emerald-400">
    ?
  </button>
);

/* ============================================================================
TRANSITION 6 — Number cell: slate → green, 150ms
============================================================================ */

export function NumberCell({ n, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative h-[34px] rounded text-[13px] font-semibold transition-colors duration-150 motion-reduce:transition-none",
        selected
          ? "bg-emerald-600 text-white"
          : "bg-zinc-700/80 text-slate-200 active:bg-zinc-600",
      ].join(" ")}
    >
      {HOT.has(n) && (
        <i className="absolute left-0.5 top-0.5 h-1 w-1 rounded-full bg-red-500" />
      )}
      {COLD.has(n) && (
        <i className="absolute left-0.5 top-0.5 h-1 w-1 rounded-full bg-sky-400" />
      )}
      {n}
    </button>
  );
}

/* ============================================================================
TRANSITION 7 — BET button states

disabled (dim green, grey text) → BET (bright) → WAIT... → ✓ BET ACCEPTED → back to disabled BET.
All colour changes: 150ms.
============================================================================ */

export function BetButton({ state, enabled, onClick }) {
  const lit = state !== "idle" || enabled;
  return (
    <button
      onClick={onClick}
      disabled={!lit || state !== "idle"}
      className={[
        "mx-2 mt-1.5 flex h-12 w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-md text-xl font-extrabold",
        "transition-colors duration-150 motion-reduce:transition-none",
        lit ? "bg-emerald-700 text-white" : "bg-emerald-950/70 text-zinc-500",
        state === "wait" ? "text-base" : "",
      ].join(" ")}
    >
      {state === "wait" && "WAIT..."}
      {state === "accepted" && (
        <>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white stroke-[3]">
            <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-base">BET ACCEPTED</span>
        </>
      )}
      {state === "idle" && "BET"}
    </button>
  );
}

/* Selection view: timer, hint panels, 1–80 grid, stake row, BET button */
function SelectView({ onTimeout }) {
  const [picks, setPicks] = useState([]);
  // idle | wait | accepted
  const [bet, setBet] = useState("idle");
  const [slide, setSlide] = useState(false);
  const [t, setT] = useState(60);
  const timers = useRef([]);

  // TRANSITION 9 — countdown
  useEffect(() => {
    const id = setInterval(() => setT((s) => s - 1), 1000);
    return () => {
      clearInterval(id);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (t <= 0) onTimeout();
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (n) =>
    setPicks((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : p.length < 10 ? [...p, n] : p
    );

  const placeBet = () => {
    if (!picks.length || bet !== "idle") return;
    setBet("wait");
    const q = (fn, ms) => timers.current.push(setTimeout(fn, ms));
    // panel slides, grid clears
    q(() => {
      setBet("accepted");
      setSlide(true);
      setPicks([]);
    }, 450);
    q(() => setSlide(false), 800);
    q(() => setBet("idle"), 1050);
  };

  return (
    <>
      <div className="mx-auto mt-1 w-24 rounded-b-xl bg-emerald-950/60 py-0.5 text-center text-[11px] font-bold tabular-nums text-slate-200 shadow-[0_6px_14px_rgba(16,185,129,0.25)]">
        00 : {String(Math.max(t, 0)).padStart(2, "0")}
      </div>
      <InfoPanels picks={picks} slide={slide} />
      <div className="mt-3 grid grid-cols-10 gap-1 px-2">
        {Array.from({ length: 80 }, (_, k) => k + 1).map((n) => (
          <NumberCell key={n} n={n} selected={picks.includes(n)} onClick={() => toggle(n)} />
        ))}
      </div>
      <div className="mx-2 mt-3 flex h-11 items-center gap-1 rounded-md bg-zinc-800 text-lg font-bold text-slate-100">
        <span className="px-3 text-2xl text-slate-300">−</span>
        <span className="flex-1 text-center">1</span>
        <span className="px-3 text-2xl text-slate-300">+</span>
        <span className="flex h-full w-14 items-center justify-center bg-zinc-700/80 text-sm text-emerald-400">
          X2
        </span>
        <span className="flex h-full w-14 items-center justify-center bg-zinc-700/80 text-sm text-emerald-400">
          MAX
        </span>
      </div>
      <BetButton state={bet} enabled={picks.length > 0} onClick={placeBet} />
    </>
  );
}

/* ============================================================================
TRANSITION 5 — View swap. The video cuts almost instantly (~100ms fade).
============================================================================ */

function ViewSwap({ children }) {
  const on = useMounted();
  return (
    <div
      className={`transition-opacity duration-100 motion-reduce:transition-none ${
        on ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/* --------------------------------- demo app -------------------------------- */

export default function KenoTransitions() {
  // results | select
  const [view, setView] = useState("results");
  const [round, setRound] = useState(0);

  return (
    <div className="min-h-screen bg-black py-4 font-['Roboto_Condensed',ui-sans-serif,system-ui]">
      <div className="mx-auto w-full max-w-[444px] overflow-hidden bg-[#1b1e22] pb-4 text-slate-200">
        {/* top bar */}
        <div className="flex h-8 items-center justify-between bg-black px-2">
          <span className="text-sm font-black italic leading-none text-emerald-400">
            FAST KENO
          </span>
          <span className="rounded-full border border-emerald-900 px-2 text-[10px]">
            <b className="font-medium text-yellow-400">9 997</b> DEMO  |  ID: 892079972
          </span>
          <span className="text-xl text-emerald-400">≡</span>
        </div>

        <ViewSwap key={`${view}-${round}`}>
          {view === "results" ? (
            <ResultsView onDone={() => setView("select")} />
          ) : (
            <SelectView
              onTimeout={() => {
                setRound((r) => r + 1);
                setView("results");
              }}
            />
          )}
        </ViewSwap>
      </div>

      <div className="mx-auto mt-3 flex max-w-[444px] justify-center gap-2">
        <button
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-slate-200"
          onClick={() => {
            setRound((r) => r + 1);
            setView("results");
          }}
        >
          Replay draw
        </button>
        <button
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-slate-200"
          onClick={() => {
            setRound((r) => r + 1);
            setView("select");
          }}
        >
          Skip to selection
        </button>
      </div>
    </div>
  );
}