// Camera math for a pannable, zoomable world. Engine-level: knows nothing
// about hexes, sectors, or any specific game — just a "world" rectangle of a
// given pixel size, and a "viewport" rectangle (the visible window into it).
//
// A camera is described by its center point in world-space plus a zoom
// factor (screen px per world px). World-space and screen-space share the
// same axes; only scale and origin differ.

export interface Size {
  width: number;
  height: number;
}

export interface CameraState {
  x: number; // world-space x at the viewport's center
  y: number; // world-space y at the viewport's center
  zoom: number; // screen px per world px
}

export interface CameraLimits {
  maxZoom: number;
  // Extra zoom-out margin beyond the exact "world fully covers viewport" fit,
  // as a fraction (0.03 = 3%). Without this, a one-pixel rounding mismatch
  // could expose a sliver of empty space at the world's edge — which is
  // exactly the "the world visually ended" situation this whole module
  // exists to prevent.
  edgeBuffer: number;
}

function clampNum(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// The smallest zoom at which the world still fully covers the viewport on
// both axes (plus edgeBuffer of margin). Below this, you'd see past the
// world's edge on at least one axis — so this is the hard floor for zoom.
export function minZoomFor(world: Size, viewport: Size, edgeBuffer: number): number {
  if (world.width <= 0 || world.height <= 0) return 1;
  if (viewport.width <= 0 || viewport.height <= 0) return 1;
  const exact = Math.max(viewport.width / world.width, viewport.height / world.height);
  return exact * (1 + Math.max(0, edgeBuffer));
}

// Clamps a candidate camera so the world always fully covers the viewport:
// zoom is clamped to [minZoomFor(...), limits.maxZoom], and the center is
// clamped so no edge of the viewport can show past the world's edge. On an
// axis where the world is exactly viewport-sized (no slack to pan within),
// the center is pinned to that axis's midpoint rather than left free to
// drift to one side.
export function clampCamera(
  camera: CameraState,
  world: Size,
  viewport: Size,
  limits: CameraLimits,
): CameraState {
  const minZoom = minZoomFor(world, viewport, limits.edgeBuffer);
  const maxZoom = Math.max(minZoom, limits.maxZoom);
  const zoom = clampNum(camera.zoom, minZoom, maxZoom);

  const halfW = viewport.width / 2 / zoom;
  const halfH = viewport.height / 2 / zoom;
  const x = halfW * 2 >= world.width ? world.width / 2 : clampNum(camera.x, halfW, world.width - halfW);
  const y = halfH * 2 >= world.height ? world.height / 2 : clampNum(camera.y, halfH, world.height - halfH);

  return { x, y, zoom };
}

export function screenToWorld(
  camera: CameraState,
  screen: { x: number; y: number },
  viewport: Size,
): { x: number; y: number } {
  return {
    x: camera.x + (screen.x - viewport.width / 2) / camera.zoom,
    y: camera.y + (screen.y - viewport.height / 2) / camera.zoom,
  };
}

// Zooms by `factor` (>1 = in, <1 = out) while keeping the world-space point
// currently under `aroundScreen` (screen px, relative to the viewport's own
// top-left corner) visually fixed in place — the natural feel for wheel-zoom
// and pinch-zoom. Clamps the result, so zooming out past the limit still
// feels like hitting a soft wall rather than snapping.
export function zoomAround(
  camera: CameraState,
  factor: number,
  aroundScreen: { x: number; y: number },
  world: Size,
  viewport: Size,
  limits: CameraLimits,
): CameraState {
  const worldPoint = screenToWorld(camera, aroundScreen, viewport);
  const rawZoom = camera.zoom * factor;
  const dxScreen = aroundScreen.x - viewport.width / 2;
  const dyScreen = aroundScreen.y - viewport.height / 2;
  const x = worldPoint.x - dxScreen / rawZoom;
  const y = worldPoint.y - dyScreen / rawZoom;
  return clampCamera({ x, y, zoom: rawZoom }, world, viewport, limits);
}

// Pans by a screen-space pixel delta (e.g. a pointer drag movement since the
// last frame), then clamps the result.
export function panByScreenDelta(
  camera: CameraState,
  deltaScreen: { x: number; y: number },
  world: Size,
  viewport: Size,
  limits: CameraLimits,
): CameraState {
  const next: CameraState = {
    x: camera.x - deltaScreen.x / camera.zoom,
    y: camera.y - deltaScreen.y / camera.zoom,
    zoom: camera.zoom,
  };
  return clampCamera(next, world, viewport, limits);
}
