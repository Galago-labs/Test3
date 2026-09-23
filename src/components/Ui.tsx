import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function WoodTitle({
  title,
  subtitle,
  icon,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel-wood relative px-6 py-2 text-center", className)}>
      <div className="flex items-center justify-center gap-2">
        {icon}
        <h2 className="font-display text-2xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.5)] sm:text-3xl">
          {title}
        </h2>
      </div>
      {subtitle && (
        <div className="-mt-1 text-sm font-bold tracking-wide text-amber-200/90">{subtitle}</div>
      )}
      <span className="pointer-events-none absolute -top-2 -left-2 text-2xl">🌿</span>
      <span className="pointer-events-none absolute -right-2 -bottom-2 scale-x-[-1] text-2xl">
        🌿
      </span>
    </div>
  );
}

export function Bar({
  value,
  max,
  className,
  from = "#ffcf4a",
  to = "#f08113",
}: {
  value: number;
  max: number;
  className?: string;
  from?: string;
  to?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full border-2 border-black/60 bg-black/60",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${from}, ${to})` }}
      />
      <div className="shine pointer-events-none absolute inset-0 opacity-40" />
    </div>
  );
}

export function CostChip({
  icon,
  value,
  ok = true,
}: {
  icon: ReactNode;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="chip flex items-center gap-1 px-2 py-1">
      <span className="text-base leading-none">{icon}</span>
      <span className={cn("text-sm font-extrabold", ok ? "text-amber-300" : "text-red-400")}>
        {value}
      </span>
    </div>
  );
}

export function IconBtn({
  children,
  onClick,
  title,
  tone = "gray",
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  tone?: "gray" | "orange" | "green" | "red" | "blue";
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn("btn grid h-11 w-11 place-items-center text-xl", `btn-${tone}`)}
    >
      {children}
    </button>
  );
}
