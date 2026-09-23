import { useMemo } from "react";
import { BOTS, CITY_TIERS, MAX_ENERGY, type ResKey } from "../data";
import { populationCapacity, sustainReady } from "../buildings";
import type { GameApi } from "../useGame";
import type { ActiveMission, DangerLevel, MissionType } from "./missions";
import type { SectorStatus } from "./sectors";

// Everything Map Mode is allowed to know about a robot. Notably absent:
// hire cost, upgrade cost — those are Crew's concern, not the map's.
export interface MapRobot {
  id: string;
  name: string;
  icon: string;
  role: string;
  target: ResKey | "all";
  scavenging: number;
  scouting: number;
  combat: number;
  rescue: number;
  level: number;
  busy: boolean;
  damagedUntil: number; // 0 if not damaged
}

// The full contract Map Mode depends on. Nothing in components/map/ should
// ever import GameApi or useGame directly — only this. If the economy,
// buildings, or crew systems change shape, as long as this interface's
// shape holds, Map Mode doesn't need to change at all.
export interface MapController {
  sectorStatuses: Record<string, SectorStatus>;
  sectorsCleared: Record<string, boolean>;
  sectorsRescued: Record<string, boolean>;
  activeMissions: ActiveMission[];
  robots: MapRobot[];
  energy: number;
  maxEnergy: number;
  tierMult: number;
  population: number;
  populationCap: number;
  rescueGateOpen: boolean; // Kitchen + Water Still built — survivors can come home
  startMission: (botId: string, type: MissionType, sectorId: string, danger: DangerLevel) => void;
  collectMission: (missionId: number) => void;
  repairBot: (botId: string) => void;
  refillEnergy: () => void;
}

export function useMapController(game: GameApi): MapController {
  const { state, actions } = game;

  const busyBotIds = useMemo(
    () => new Set(state.activeMissions.map((m) => m.botId)),
    [state.activeMissions],
  );

  const robots = useMemo<MapRobot[]>(
    () =>
      BOTS.filter((b) => (state.bots[b.id] ?? 0) > 0).map((b) => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        role: b.role,
        target: b.target,
        scavenging: b.scavenging,
        scouting: b.scouting,
        combat: b.combat,
        rescue: b.rescue,
        level: state.bots[b.id] ?? 0,
        busy: busyBotIds.has(b.id),
        damagedUntil: state.botDamagedUntil[b.id] ?? 0,
      })),
    [state.bots, state.botDamagedUntil, busyBotIds],
  );

  const tierMult = CITY_TIERS[Math.min(state.tier, CITY_TIERS.length - 1)].mult;

  return {
    sectorStatuses: state.sectors,
    sectorsCleared: state.sectorsCleared,
    sectorsRescued: state.sectorsRescued,
    activeMissions: state.activeMissions,
    robots,
    energy: state.energy,
    maxEnergy: MAX_ENERGY,
    tierMult,
    population: state.population,
    populationCap: populationCapacity(state.buildings.barracks),
    rescueGateOpen: sustainReady(state.buildings.kitchen, state.buildings.waterStill),
    startMission: actions.startMission,
    collectMission: actions.collectMission,
    repairBot: actions.repairBot,
    refillEnergy: actions.refillEnergy,
  };
}
