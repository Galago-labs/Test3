export const ICON_SHEET_SRC = "/images/map/icons-sheet.png";
export const ICON_SHEET_COLS = 5;
export const ICON_SHEET_ROWS = 4;

export type IconName =
  | "check"
  | "cross"
  | "survivors"
  | "combat"
  | "shield"
  | "map"
  | "robot"
  | "tools"
  | "research"
  | "journal"
  | "resources"
  | "settings"
  | "info"
  | "unknown"
  | "search"
  | "home"
  | "missions"
  | "mail"
  | "pause"
  | "skip";

// [column, row], 0-indexed, matching the provided sprite sheet layout.
export const ICON_POSITIONS: Record<IconName, [number, number]> = {
  check: [0, 0],
  cross: [1, 0],
  survivors: [2, 0],
  combat: [3, 0],
  shield: [4, 0],
  map: [0, 1],
  robot: [1, 1],
  tools: [2, 1],
  research: [3, 1],
  journal: [4, 1],
  resources: [0, 2],
  settings: [1, 2],
  info: [2, 2],
  unknown: [3, 2],
  search: [4, 2],
  home: [0, 3],
  missions: [1, 3],
  mail: [2, 3],
  pause: [3, 3],
  skip: [4, 3],
};

// The icons that actually appear on the hex map itself (see `sectorIcons()`
// in `HexMap.tsx`), in the order the legend should list them — the single
// source of truth for both, so they can't silently drift apart.
export const MAP_LEGEND: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Your settlement" },
  { icon: "combat", label: "Enemies" },
  { icon: "survivors", label: "Survivors" },
  { icon: "resources", label: "Resources" },
  { icon: "unknown", label: "Unknown" },
];
