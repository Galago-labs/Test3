import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  type CameraLimits,
  type CameraState,
  type Size,
  clampCamera,
  panByScreenDelta,
  zoomAround,
} from "./camera";

const DEFAULT_LIMITS: CameraLimits = { maxZoom: 3, edgeBuffer: 0.03 };

// A pointer that moves less than this many px total (across its whole
// down→up lifetime) is treated as a tap/click, not a pan — so a hex's own
// onClick still fires normally for an actual tap, and gets suppressed for
// anything that was really a drag.
const DRAG_THRESHOLD_PX = 6;

export interface InitialFocus {
  x: number; // world-space point to center on at mount
  y: number;
  // Zoom is derived from this on first measurement, not passed directly —
  // "how many world units should be visible across the viewport" is the
  // thing that actually stays meaningful across different screen sizes.
  worldUnitsAcross: number;
}

/**
 * A pannable, zoomable window onto a fixed-size world. Renders `children`
 * inside a `world.width` × `world.height` px layer that a CSS transform
 * pans and scales — children position themselves with plain world-space
 * pixel coordinates (e.g. via engine/hexgrid), same as if there were no
 * camera at all.
 *
 * Knows nothing about what it's showing — no hexes, no sectors, no game
 * state. Reusable for any pannable 2D scene.
 */
export function Viewport({
  world,
  initialFocus,
  limits = DEFAULT_LIMITS,
  className,
  children,
}: {
  world: Size;
  initialFocus: InitialFocus;
  limits?: CameraLimits;
  className?: string;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [camera, setCamera] = useState<CameraState>({ x: initialFocus.x, y: initialFocus.y, zoom: 1 });
  const didInitialFocus = useRef(false);

  // Measure the container and re-clamp whenever it resizes (rotating a
  // phone, resizing a desktop window, or a sidebar appearing all change how
  // much of the world fits). The very first measurement also resolves
  // `initialFocus`'s zoom, since that needs a real viewport size to mean
  // anything; later resizes just re-clamp the camera the player already set.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setViewport({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (viewport.width === 0 || viewport.height === 0) return;
    setCamera((c) => {
      if (!didInitialFocus.current) {
        didInitialFocus.current = true;
        const zoom = viewport.width / initialFocus.worldUnitsAcross;
        return clampCamera({ x: initialFocus.x, y: initialFocus.y, zoom }, world, viewport, limits);
      }
      return clampCamera(c, world, viewport, limits);
    });
    // initialFocus/limits are treated as fixed for the lifetime of one
    // Viewport instance — only viewport/world size changes re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width, viewport.height, world.width, world.height]);

  // --- pointer drag-to-pan + two-finger pinch-to-zoom ---
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragTotal = useRef(0);
  const lastPinchDist = useRef<number | null>(null);
  const suppressNextClick = useRef(false);

  function pinchDistance(): number {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) dragTotal.current = 0;
    if (pointers.current.size === 2) lastPinchDist.current = pinchDistance();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 2) {
      const dist = pinchDistance();
      if (lastPinchDist.current) {
        const factor = dist / lastPinchDist.current;
        const pts = [...pointers.current.values()];
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const rect = containerRef.current!.getBoundingClientRect();
        setCamera((c) =>
          zoomAround(c, factor, { x: mid.x - rect.left, y: mid.y - rect.top }, world, viewport, limits),
        );
      }
      lastPinchDist.current = dist;
      dragTotal.current += 999; // a pinch is never mistaken for a tap
      return;
    }

    if (pointers.current.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      dragTotal.current += Math.hypot(dx, dy);
      setCamera((c) => panByScreenDelta(c, { x: dx, y: dy }, world, viewport, limits));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    lastPinchDist.current = pointers.current.size === 2 ? pinchDistance() : null;
    if (dragTotal.current > DRAG_THRESHOLD_PX) suppressNextClick.current = true;
  }

  function onClickCapture(e: React.MouseEvent) {
    if (suppressNextClick.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressNextClick.current = false;
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const factor = Math.exp(-e.deltaY * 0.0015);
    setCamera((c) =>
      zoomAround(c, factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }, world, viewport, limits),
    );
  }

  const tx = viewport.width / 2 - camera.x * camera.zoom;
  const ty = viewport.height / 2 - camera.y * camera.zoom;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", touchAction: "none", cursor: "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: world.width,
          height: world.height,
          transform: `translate(${tx}px, ${ty}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
