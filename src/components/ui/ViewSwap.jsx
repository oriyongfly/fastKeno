// components/ui/ViewSwap.jsx

import React, { useEffect, useState } from 'react';

/**
 * Mounts its children at opacity 0, then flips to opacity 1 after two
 * animation frames. The two-rAF delay is the standard trick for making
 * a CSS transition fire on mount: the first rAF lets the element paint
 * in its "from" state, the second lets the browser commit that paint
 * before the class flip triggers the transition.
 *
 * Port of FastKeno's ViewSwap (transition 5). Keep it dumb — it owns
 * nothing but its own mount flag.
 *
 * Give it a `key` to force a remount + re-fade whenever the key changes:
 *
 *   <ViewSwap key={round}>
 *     <RadarDisplay … />
 *     <InfoPanels … />
 *     <NumberGrid … />
 *   </ViewSwap>
 *
 * @param {Object}  props
 * @param {number}  [props.durationMs=100] - fade duration
 * @param {string}  [props.className]
 * @param {React.ReactNode} props.children
 */
export default function ViewSwap({
  durationMs = 100,
  className = '',
  children,
}) {
  const on = useMounted();

  return (
    <div
      className={`transition-opacity motion-reduce:transition-none ${
        on ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ transitionDuration: `${durationMs}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * True after two animation frames — lets an element mount in its
 * "from" state, paint, then transition to its "to" state.
 *
 * Cancels the pending rAF on unmount so a rapid remount (e.g. round
 * changing mid-fade) doesn't flip a stale component's opacity.
 */
function useMounted() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOn(true))
    );
    return () => cancelAnimationFrame(id);
  }, []);

  return on;
}