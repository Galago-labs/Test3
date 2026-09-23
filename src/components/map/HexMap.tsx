import {
  MAP_IMAGE_HEIGHT,
  MAP_IMAGE_WIDTH,
  type HexLayout,
  hexCenter,
  hexPolygonPoints,
  offsetToAxial,
} from "../../engine/hexgrid/hexgrid";
import { type InitialFocus, Viewport } from "../../engine/viewport/Viewport";
import { SECTORS, type SectorDef, type SectorStatus } from "../../game/map/sectors";
import type { IconName } from "../../game/map/icons";
import { MapIcon } from "./MapIcon";

// Anchor point: the illustrated fortified outpost near the map's center —
// this is where the Home hex is pinned. Rough estimate for now; nudge
// anchorX/anchorY (and size/squash) to taste once you see it rendered.
const homeDef = SECTORS.find((s) => s.isHome)!;
const homeAxial = offsetToAxial(homeDef.gridX, homeDef.gridY);

const LAYOUT: HexLayout = {
  size: 68,
  squash: 0.82,
  originQ: homeAxial.q,
  originR: homeAxial.r,
  anchorX: 790,
  anchorY: 372,
};

const WORLD = { width: MAP_IMAGE_WIDTH, height: MAP_IMAGE_HEIGHT };

// The map is a real place you pan and zoom around in, not something that
// has to fit on screen all at once — this is deliberately a "standing near
// camp" framing, not an overview. One hex-column step is size*1.5 world px.
const START_HEX_COLUMNS_VISIBLE = 9;
const HOME_CENTER = hexCenter(homeAxial.q, homeAxial.r, LAYOUT);
const INITIAL_FOCUS: InitialFocus = {
  x: HOME_CENTER.x,
  y: HOME_CENTER.y,
  worldUnitsAcross: START_HEX_COLUMNS_VISIBLE * LAYOUT.size * 1.5,
};
// Flat screen-px-per-world-px cap (not column-relative, unlike the start
// framing above) — this bounds how visually large a hex can get regardless
// of device, since zoom already means the same physical hex size on any
// viewport. Tune to taste once you've seen it rendered.
const VIEWPORT_LIMITS = { maxZoom: 2.6, edgeBuffer: 0.03 };

function sectorIcons(def: SectorDef, status: SectorStatus, cleared: boolean, rescued: boolean): IconName[] {
  if (def.isHome) return ["home"];
  if (status === "locked") return [];
  if (status === "reachable") return ["unknown"];
  // Scouted: show every opportunity actually present, not just one — a
  // sector can genuinely have both active enemies and unrescued survivors
  // at once (see DESIGN.md 4.5), and hiding one behind the other was a real
  // gap, not just a simplification.
  const icons: IconName[] = [];
  if (def.enemyStrength > 0 && !cleared) icons.push("combat");
  if (def.survivorCount > 0 && !rescued) icons.push("survivors");
  if (icons.length === 0) icons.push("resources");
  return icons;
}

function statusColor(
  def: SectorDef,
  status: SectorStatus,
  selected: boolean,
  cleared: boolean,
  rescued: boolean,
): { fill: string; stroke: string } {
  if (def.isHome) return { fill: "rgba(255, 208, 92, 0.28)", stroke: "#ffd05c" };
  if (status === "locked") return { fill: "rgba(0,0,0,0.4)", stroke: "rgba(255,255,255,0.45)" };
  if (status === "reachable")
    return { fill: "rgba(56, 189, 248, 0.18)", stroke: selected ? "#e2f6ff" : "rgba(125, 211, 252, 0.65)" };
  // Scouted: the border color reflects what's actually there (matches the
  // legend: red = enemies, blue = survivors, green = clear/resources-only),
  // not a static danger-tier proxy that could disagree with the real data.
  const hasEnemies = def.enemyStrength > 0 && !cleared;
  const hasSurvivors = def.survivorCount > 0 && !rescued;
  const categoryStroke = hasEnemies ? "#f87171" : hasSurvivors ? "#7dd3fc" : "#a3e635";
  return { fill: "rgba(20, 30, 20, 0.15)", stroke: selected ? "#ffffff" : categoryStroke };
}

export function HexMap({
  sectorStatuses,
  sectorsCleared,
  sectorsRescued,
  selected,
  onSelect,
  className,
}: {
  sectorStatuses: Record<string, SectorStatus>;
  sectorsCleared: Record<string, boolean>;
  sectorsRescued: Record<string, boolean>;
  selected: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className ?? "absolute inset-0 overflow-hidden"}>
      <Viewport world={WORLD} initialFocus={INITIAL_FOCUS} limits={VIEWPORT_LIMITS} className="h-full w-full">
        <img
          src="/images/map/map01.jpg"
          alt="The scrapyard"
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          draggable={false}
        />

        {/* hex shapes + click targets */}
        <svg
          width={MAP_IMAGE_WIDTH}
          height={MAP_IMAGE_HEIGHT}
          viewBox={`0 0 ${MAP_IMAGE_WIDTH} ${MAP_IMAGE_HEIGHT}`}
          className="absolute inset-0"
        >
          {SECTORS.map((def) => {
            const axial = offsetToAxial(def.gridX, def.gridY);
            const { x, y } = hexCenter(axial.q, axial.r, LAYOUT);
            const status = sectorStatuses[def.id] ?? "locked";
            const isSelected = selected === def.id;
            const cleared = sectorsCleared[def.id] ?? false;
            const rescued = sectorsRescued[def.id] ?? false;
            const { fill, stroke } = statusColor(def, status, isSelected, cleared, rescued);
            const clickable = !def.isHome && status !== "locked";
            return (
              <polygon
                key={def.id}
                points={hexPolygonPoints(x, y, LAYOUT)}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 5 : 2.5}
                style={{ cursor: clickable ? "pointer" : "default" }}
                onClick={clickable ? () => onSelect(def.id) : undefined}
              />
            );
          })}
        </svg>

        {/* icon badges + robot marker, in a plain HTML layer for easy sprite positioning */}
        <div className="pointer-events-none absolute inset-0">
          {SECTORS.map((def) => {
            const axial = offsetToAxial(def.gridX, def.gridY);
            const { x, y } = hexCenter(axial.q, axial.r, LAYOUT);
            const status = sectorStatuses[def.id] ?? "locked";
            const cleared = sectorsCleared[def.id] ?? false;
            const rescued = sectorsRescued[def.id] ?? false;
            const icons = sectorIcons(def, status, cleared, rescued);
            if (icons.length === 0) return null;
            return (
              <div
                key={def.id}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1"
                style={{ left: x, top: y }}
              >
                {icons.map((icon) => (
                  <MapIcon key={icon} name={icon} size={def.isHome ? 34 : 22} className="drop-shadow-md" />
                ))}
              </div>
            );
          })}

          {/* robot marker — currently pinned at home; rough size per your note */}
          <img
            src="/images/map/robot-01.png"
            alt="Robot position"
            className="absolute -translate-x-1/2 -translate-y-[60%] drop-shadow-lg"
            style={{ left: HOME_CENTER.x, top: HOME_CENTER.y, width: LAYOUT.size * 1.8 }}
          />
        </div>
      </Viewport>
    </div>
  );
}
