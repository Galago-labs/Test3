import { useCallback, useRef, useState } from "react";

export interface Toast {
  id: number;
  text: string;
  tone: "good" | "bad" | "info";
}

export function useToasts(options?: { max?: number; durationMs?: number }) {
  const max = options?.max ?? 4;
  const durationMs = options?.durationMs ?? 1800;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback(
    (text: string, tone: Toast["tone"] = "info") => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, text, tone }].slice(-max));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), durationMs);
    },
    [max, durationMs],
  );

  return { toasts, toast };
}
