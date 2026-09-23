import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import { clampDrawerHeight, type DrawerLimits, type DrawerSnap, heightForSnap, nearestSnap } from "./drawer";

/**
 * A panel that's a draggable bottom sheet on narrow screens and a right-side
 * panel on wide ones — same children, same component, no device fork. It
 * always **floats over the content** (fixed positioning at every breakpoint)
 * rather than reserving its own row/column, so whatever's behind it (the
 * map) can render truly full-bleed instead of shrinking to make room.
 * Position and height simply differ by breakpoint (Tailwind's `lg`), same
 * mechanism `<OverlayPanel>` uses for the nav sidebar.
 *
 * Narrow-screen behavior: starts at `peekHeight`; drag the handle to resize
 * anywhere between `peekHeight` and `expandedHeight`, and it snaps to
 * whichever is closer on release. Tapping the handle toggles between them.
 */
export function ResponsiveDrawer({
  peekHeight,
  expandedHeight,
  sidebarWidth = 400,
  defaultSnap = "peek",
  className,
  children,
}: {
  peekHeight: number;
  expandedHeight: number;
  sidebarWidth?: number;
  defaultSnap?: DrawerSnap;
  className?: string;
  children: ReactNode;
}) {
  const limits: DrawerLimits = { peekHeight, expandedHeight };
  const [snap, setSnap] = useState<DrawerSnap>(defaultSnap);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; height: number; moved: boolean } | null>(null);

  const currentHeight = dragHeight ?? heightForSnap(snap, limits);
  const dragging = dragHeight !== null;

  function onHandlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStart.current = { y: e.clientY, height: heightForSnap(snap, limits), moved: false };
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dy) > 3) dragStart.current.moved = true;
    // Dragging up (negative dy) should grow the sheet, hence the minus.
    setDragHeight(clampDrawerHeight(dragStart.current.height - dy, limits));
  }

  function onHandlePointerUp() {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;
    if (!start.moved) {
      // A tap on the handle, not a drag — toggle snap points.
      setSnap(snap === "peek" ? "expanded" : "peek");
      setDragHeight(null);
      return;
    }
    if (dragHeight !== null) setSnap(nearestSnap(dragHeight, limits));
    setDragHeight(null);
  }

  return (
    <div
      className={
        className ??
        "panel-hud pointer-events-auto fixed z-20 flex left-2 right-2 bottom-2 h-[var(--drawer-h)] flex-col overflow-hidden " +
          (dragging ? "" : "transition-[height] duration-200 ease-out ") +
          "lg:left-auto lg:right-3 lg:top-3 lg:bottom-3 lg:h-auto lg:transition-none"
      }
      style={
        {
          "--drawer-h": `${currentHeight}px`,
          "--drawer-sidebar-w": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <div
        className="flex shrink-0 cursor-grab touch-none justify-center py-2 active:cursor-grabbing lg:hidden"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <div className="h-1.5 w-12 rounded-full bg-white/30" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 lg:w-[var(--drawer-sidebar-w)] lg:p-3">
        {children}
      </div>
    </div>
  );
}
