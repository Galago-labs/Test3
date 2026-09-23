import type { CSSProperties, ReactNode } from "react";

/**
 * A static illustrated backdrop, locked to its source image's native aspect
 * ratio so percentage-based child positions (see `Hotspot`) always line up
 * with the art underneath. Fills whichever axis of its parent is limiting
 * (letterboxing the *other* axis only as much as the aspect ratio strictly
 * requires) using CSS container query units — no JS measurement, and
 * critically, no crop: the map's own "black void on wide screens" bug
 * (DESIGN.md 7.2) was exactly this kind of sizing mistake, so this is done
 * via the actual limiting-dimension formula rather than a width-only cap.
 *
 * Unlike the map's `Viewport` (engine/viewport/), this never pans or zooms:
 * the whole scene is meant to be visible at once, like a diorama. Knows
 * nothing about buildings, camps, or any specific game — the map's hex
 * world uses its own layer (`engine/hexgrid/`) for the same reason:
 * different placement rules (a regular grid vs. arbitrary art-defined
 * points) need different primitives, not one primitive bent two ways.
 */
export function Scene({
  src,
  width,
  height,
  alt = "",
  className,
  children,
}: {
  src: string;
  width: number;
  height: number;
  alt?: string;
  className?: string;
  children?: ReactNode;
}) {
  const ratio = width / height;
  const outerStyle: CSSProperties = { containerType: "size" };
  // The limiting-dimension formula: fill 100% of whichever container axis
  // is tighter relative to the image's own ratio, derive the other axis
  // from it. Container query units (cqw/cqh) make this pure CSS.
  const boxStyle: CSSProperties = {
    width: `min(100cqw, 100cqh * ${ratio})`,
    height: `min(100cqh, 100cqw / ${ratio})`,
    margin: "auto",
  };

  return (
    <div className={className ?? "relative h-full w-full"} style={outerStyle}>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="relative" style={boxStyle}>
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-2xl object-cover"
          />
          {/* Hotspot layer: transparent, sits exactly over the image's own
              box so every child's xPct/yPct is relative to the art, not the
              viewport — same "overlay never reserves space, opts back into
              pointer events per-widget" rule as engine/hud/HudLayer. */}
          <div className="pointer-events-none absolute inset-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
