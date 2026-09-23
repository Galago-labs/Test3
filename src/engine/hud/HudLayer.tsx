import type { CSSProperties, ReactNode } from "react";
import { type AnchorPoint, anchorStyle } from "./anchor";

/**
 * A transparent layer stacked over a game viewport, for HUD widgets to live
 * in. Itself never intercepts pointer events (`pointer-events: none`) so the
 * viewport underneath stays fully interactive (pannable/zoomable); individual
 * widgets placed inside opt back into `pointer-events-auto` themselves (see
 * `Anchored`, which does this automatically).
 *
 * Direct parallel to a Godot `CanvasLayer` or a UMG widget drawn over the
 * game viewport. Knows nothing about what it's overlaying.
 */
export function HudLayer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ?? "pointer-events-none absolute inset-0"}>{children}</div>;
}

/**
 * Positions a child at one of 9 anchor points within its nearest positioned
 * ancestor (typically a `HudLayer`), with a configurable margin. Re-enables
 * pointer events for its contents, since it's meant to hold something
 * interactive sitting inside a `HudLayer`.
 *
 * Parallel to Godot/UMG anchor presets. Knows nothing about hexes, sectors,
 * or any specific game.
 */
export function Anchored({
  anchor,
  margin = 12,
  className,
  style,
  children,
}: {
  anchor: AnchorPoint;
  margin?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={className ?? "pointer-events-auto"} style={{ ...anchorStyle(anchor, margin), ...style }}>
      {children}
    </div>
  );
}
