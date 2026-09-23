import { useEffect, useRef } from "react";

/**
 * Runs onTick(dtSeconds) on a fixed interval. onTick can change every render
 * without restarting the underlying timer — only intervalMs restarts it.
 * Knows nothing about what a tick computes; that's entirely the caller's business.
 */
export function useGameLoop(onTick: (dtSeconds: number) => void, intervalMs = 200) {
  const tickRef = useRef(onTick);
  useEffect(() => {
    tickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      tickRef.current(dt);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}
