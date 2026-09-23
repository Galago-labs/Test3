// Flat-top hex grid, working in the background map art's native pixel space
// (see MAP_IMAGE_WIDTH/HEIGHT). An SVG with a matching viewBox scales this
// automatically, so nothing here needs to know about the rendered size.

export const MAP_IMAGE_WIDTH = 1536;
export const MAP_IMAGE_HEIGHT = 1024;

export interface AxialCoord {
  q: number;
  r: number;
}

// The sector data uses a column-major offset grid (gridX = column,
// gridY = row) designed for a square layout. This converts it to axial hex
// coordinates ("odd-q" offset scheme, the natural fit for flat-top hexes) so
// the same sector data can drive either a square grid or a hex grid.
export function offsetToAxial(col: number, row: number): AxialCoord {
  const q = col;
  const r = row - (col - (col & 1)) / 2;
  return { q, r };
}

export interface HexLayout {
  size: number; // center-to-corner distance, in map image px
  squash: number; // vertical compression, 1 = a regular hexagon
  originQ: number; // the axial coordinate that sits exactly at the anchor
  originR: number;
  anchorX: number; // map image px where the origin hex's center sits
  anchorY: number;
}

export function hexCenter(q: number, r: number, layout: HexLayout): { x: number; y: number } {
  const dq = q - layout.originQ;
  const dr = r - layout.originR;
  const x = layout.anchorX + layout.size * 1.5 * dq;
  const y = layout.anchorY + layout.size * Math.sqrt(3) * layout.squash * (dq / 2 + dr);
  return { x, y };
}

// Same as hexCenter, but as a percentage of the map image — convenient for
// positioning ordinary HTML elements (icons, sprites) over the art without
// going through SVG.
export function hexCenterPct(q: number, r: number, layout: HexLayout): { xPct: number; yPct: number } {
  const { x, y } = hexCenter(q, r, layout);
  return { xPct: (x / MAP_IMAGE_WIDTH) * 100, yPct: (y / MAP_IMAGE_HEIGHT) * 100 };
}

// Corner points of a flat-top hexagon centered at (cx, cy), as an SVG
// "points" attribute string, in the same px space as hexCenter.
export function hexPolygonPoints(cx: number, cy: number, layout: HexLayout): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    const x = cx + layout.size * Math.cos(angle);
    const y = cy + layout.size * Math.sin(angle) * layout.squash;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}
