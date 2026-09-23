import { useEffect } from "react";

export interface PersistedLoadResult<T> {
  state: T;
  awayMs: number;
}

/**
 * Loads T from localStorage, falling back to a fresh instance if there's
 * nothing saved or it fails to parse. Also reports how much wall-clock time
 * passed since the save was written (capped by maxAwayMs) — what to do with
 * that time is entirely up to the game; the engine doesn't compute anything
 * from it beyond the raw duration.
 */
export function loadPersisted<T extends { lastSeen: number }>(
  key: string,
  initialState: () => T,
  merge?: (fresh: T, parsed: Partial<T>) => T,
  maxAwayMs = 8 * 3600_000,
): PersistedLoadResult<T> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { state: initialState(), awayMs: 0 };
    const parsed = JSON.parse(raw) as Partial<T>;
    const fresh = initialState();
    const state = merge ? merge(fresh, parsed) : { ...fresh, ...parsed };
    const awayMs = Math.min(Math.max(0, Date.now() - (parsed.lastSeen ?? Date.now())), maxAwayMs);
    return { state, awayMs };
  } catch {
    return { state: initialState(), awayMs: 0 };
  }
}

/** Periodically (and on page hide) writes the latest state to localStorage. */
export function useAutosave<T extends { lastSeen: number }>(
  key: string,
  stateRef: { current: T },
  intervalMs = 2000,
) {
  useEffect(() => {
    const save = () => {
      localStorage.setItem(key, JSON.stringify({ ...stateRef.current, lastSeen: Date.now() }));
    };
    const id = window.setInterval(save, intervalMs);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("beforeunload", save);
    };
  }, [key, intervalMs, stateRef]);
}

export function clearPersisted(key: string) {
  localStorage.removeItem(key);
}
