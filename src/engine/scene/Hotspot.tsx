import type { ReactNode } from "react";

/**
 * A clickable point anchored at (xPct, yPct) within its nearest `Scene`
 * ancestor. Purely a positioning primitive — content, color, and shape are
 * entirely up to the caller (see game/camp/CampBuildingMarker.tsx for this
 * game's actual building-marker look). Re-enables pointer events for itself,
 * same opt-in pattern as engine/hud/Anchored inside a HudLayer.
 */
export function Hotspot({
  xPct,
  yPct,
  onSelect,
  label,
  children,
}: {
  xPct: number;
  yPct: number;
  onSelect?: () => void;
  label?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      {children}
    </button>
  );
}
