import { useEffect, useState } from "react";
import { Compass } from "../../engine/hud/Compass";
import { APP_SIDEBAR_CLEARANCE_LEFT_CLASS, APP_TOPBAR_CLEARANCE_CLASS } from "../../engine/hud/layout";
import { ResponsiveDrawer } from "../../engine/hud/ResponsiveDrawer";
import type { GameApi } from "../../game/useGame";
import { useMapController } from "../../game/map/useMapController";
import { type DangerLevel } from "../../game/map/missions";
import { SECTORS } from "../../game/map/sectors";
import { WoodTitle } from "../Ui";
import { HexMap } from "./HexMap";
import { MapLegend } from "./MapLegend";
import { SectorDetailPanel } from "./SectorDetailPanel";
import { RobotDispatchList } from "./RobotDispatchList";
import { MissionQueue } from "./MissionQueue";

// Drawer sizing: "peek" shows just enough to reveal there's more below
// without hiding much of the map; "expanded" gives the mission list real
// room while still leaving map visible above the drag handle.
const DRAWER_PEEK_PX = 232;
const DRAWER_EXPANDED_PX = 560;
const DRAWER_SIDEBAR_PX = 400;

export function MapMode({ game }: { game: GameApi }) {
  const map = useMapController(game);
  const [now, setNow] = useState(Date.now());
  const [danger, setDanger] = useState<DangerLevel>("safe");
  const [selected, setSelected] = useState<string | null>(
    () => SECTORS.find((s) => !s.isHome)?.id ?? null,
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const selectedStatus = selected ? (map.sectorStatuses[selected] ?? "locked") : null;

  return (
    <div className="relative h-full w-full bg-[#120f0c]">
      {/* The map itself: the full section, true edge to edge. Everything
          else here is an independent floating layer on top of it (fixed/
          absolute, never a flex sibling reserving space) — same principle
          as the app-level TopBar/nav, applied consistently within the map
          screen too, so nothing shrinks the actual playable area. */}
      <HexMap
        sectorStatuses={map.sectorStatuses}
        sectorsCleared={map.sectorsCleared}
        sectorsRescued={map.sectorsRescued}
        selected={selected}
        onSelect={setSelected}
      />

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center pb-1.5 ${APP_TOPBAR_CLEARANCE_CLASS}`}
      >
        <div className="pointer-events-auto">
          <WoodTitle
            title="Junkyard"
            subtitle="Send your crew into the ruins"
            icon={<span className="text-xl">🛠️</span>}
          />
        </div>
      </div>

      {/* Legend + compass, bottom-left per the reference. On narrow screens
          this has to clear the drawer's peek height (232px, see
          DRAWER_PEEK_PX) instead of sitting flush in the corner. On wide
          screens it has to clear the app's own persistent nav sidebar
          instead of sitting flush against the left edge — both are the same
          idea: a floating HUD widget has to dodge whatever *other* floating
          chrome shares its corner, not just the raw edge.
          The energy meter/refill button that used to live here was removed
          on explicit instruction — it isn't part of the reference's map HUD
          at all (the reference tracks energy per-robot, in the bottom
          roster, not as a settlement-wide pool shown on the map). The
          underlying `map.energy` value still exists and still gates
          mission afford-checks in RobotDispatchList below — only this
          display was removed, not the mechanic. */}
      <div
        className={`pointer-events-auto absolute left-3 bottom-[252px] flex flex-col items-start gap-2 ${APP_SIDEBAR_CLEARANCE_LEFT_CLASS} lg:bottom-3`}
      >
        <Compass size={56} />
        <MapLegend />
      </div>

      {/* Info panel — mission queue, sector detail, robot dispatch. A
          draggable bottom sheet floating over the map on narrow screens; a
          floating right-side panel on wide ones. Same component, same
          children, either way — see ResponsiveDrawer. */}
      <ResponsiveDrawer peekHeight={DRAWER_PEEK_PX} expandedHeight={DRAWER_EXPANDED_PX} sidebarWidth={DRAWER_SIDEBAR_PX}>
        <div className="flex flex-col gap-3">
          <MissionQueue missions={map.activeMissions} now={now} onCollect={map.collectMission} />

          {selected && selectedStatus && selectedStatus !== "locked" && (
            <SectorDetailPanel
              sectorId={selected}
              status={selectedStatus}
              cleared={map.sectorsCleared[selected] ?? false}
              rescued={map.sectorsRescued[selected] ?? false}
              danger={danger}
              onDangerChange={setDanger}
            />
          )}

          <RobotDispatchList
            robots={map.robots}
            sectorId={selected}
            sectorStatus={selectedStatus}
            sectorCleared={selected ? (map.sectorsCleared[selected] ?? false) : false}
            sectorRescued={selected ? (map.sectorsRescued[selected] ?? false) : false}
            rescueGateOpen={map.rescueGateOpen}
            population={map.population}
            populationCap={map.populationCap}
            danger={danger}
            tierMult={map.tierMult}
            energy={map.energy}
            now={now}
            onStartMission={map.startMission}
            onRepairBot={map.repairBot}
          />
        </div>
      </ResponsiveDrawer>
    </div>
  );
}
