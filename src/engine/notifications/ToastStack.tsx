import type { Toast } from "./useToasts";

export interface ToastStackProps {
  toasts: Toast[];
  /** The game supplies its own look per tone — the engine has no opinion on colors or fonts. */
  toneClassName?: (tone: Toast["tone"]) => string;
  className?: string;
}

const defaultToneClassName = () => "";

export function ToastStack({
  toasts,
  toneClassName = defaultToneClassName,
  className = "",
}: ToastStackProps) {
  return (
    <div
      className={`pointer-events-none fixed top-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-1.5 ${className}`}
    >
      {toasts.map((t) => (
        <div key={t.id} className={toneClassName(t.tone)}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
