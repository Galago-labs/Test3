// Pure logic for a drawer that's a draggable bottom sheet on narrow screens
// and a fixed sidebar on wide ones (see ResponsiveDrawer.tsx for the CSS side
// of that split — this file only knows about the bottom-sheet height math,
// since the sidebar case needs no state at all).

export type DrawerSnap = "peek" | "expanded";

export interface DrawerLimits {
  peekHeight: number; // px
  expandedHeight: number; // px
}

export function heightForSnap(snap: DrawerSnap, limits: DrawerLimits): number {
  return snap === "expanded" ? limits.expandedHeight : limits.peekHeight;
}

// Clamps a raw drag height to the drawer's valid range.
export function clampDrawerHeight(height: number, limits: DrawerLimits): number {
  return Math.min(limits.expandedHeight, Math.max(limits.peekHeight, height));
}

// Given the drawer's height at drag-release, which snap point should it
// settle on? Simple midpoint rule — past the halfway mark between peek and
// expanded, settle expanded; short of it, settle peek.
export function nearestSnap(height: number, limits: DrawerLimits): DrawerSnap {
  const mid = (limits.peekHeight + limits.expandedHeight) / 2;
  return height >= mid ? "expanded" : "peek";
}
