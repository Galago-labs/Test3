import type { BuildingKey } from "../buildings";

// The camp scene's source image — see engine/scene/Scene, which locks its
// container to this exact aspect ratio so xPct/yPct below line up with the
// art with no runtime measurement. Same dimensions as the map's own image
// (engine/hexgrid: MAP_IMAGE_WIDTH/HEIGHT), coincidentally — not required to
// match, just how both pieces of placeholder art happened to be sized.
export const CAMP_IMAGE_SRC = "/images/camp/camp-01.jpg";
export const CAMP_IMAGE_WIDTH = 1536;
export const CAMP_IMAGE_HEIGHT = 1024;

export interface CampHotspotDef {
  key: BuildingKey;
  xPct: number;
  yPct: number;
  color: string;
}

// Positions are hand-picked against the CURRENT placeholder art
// (Camp-01.png, provided 2026-09-22) by eye, using a 10% grid overlay for
// reference — an approximate match to that image's building clusters, not a
// traced footprint. These will need re-picking whenever the placeholder is
// replaced with final art; that's expected, not a bug to fix now. The
// image's central tower and the satellite-dish structure near (41%, 52%)
// are deliberately left unclaimed: the former reads as the camp's own core
// (already labeled by BaseScreen's WoodTitle, not a buildable slot), the
// latter is a natural home for a future Research building once DESIGN.md
// 4.6 exists — left empty on purpose rather than forced into use early.
export const CAMP_HOTSPOTS: CampHotspotDef[] = [
  { key: "barracks", xPct: 25, yPct: 24, color: "#4ade80" }, // top-left residential cluster
  { key: "workshop", xPct: 57, yPct: 22, color: "#f5b942" }, // top-right mechanical tower
  { key: "waterStill", xPct: 65, yPct: 33, color: "#38bdf8" }, // right-middle cluster, nearest the lake
  { key: "kitchen", xPct: 24, yPct: 42, color: "#fb923c" }, // left-middle cluster
];
