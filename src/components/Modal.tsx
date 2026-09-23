import type { ReactNode } from "react";

export function Modal({
  children,
  onClose,
  wide,
}: {
  children: ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`animate-popin relative z-10 w-full ${wide ? "max-w-5xl" : "max-w-2xl"} max-h-full overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}
