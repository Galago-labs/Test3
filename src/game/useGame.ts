import { useCallback, useRef, useState } from "react";
import { vibrate } from "../engine/haptics";
import { clearPersisted, loadPersisted, useAutosave } from "../engine/persistence/usePersistedState";
import { useGameLoop } from "../engine/loop/useGameLoop";
import { useToasts, type Toast } from "../engine/notifications/useToasts";
import { AUTOSAVE_KEY, ENERGY_REGEN_SEC, MAX_ENERGY, type ResKey, deriveTier } from "./data";
import { type BuildingKey, applyBuildOrUpgrade } from "./buildings";
import { applyHireBot } from "./crew";
import type { ActiveMission, DangerLevel, MissionType } from "./map/missions";
import type { SectorStatus } from "./map/sectors";
import { initialSectorStatuses } from "./map/sectors";
import { applyCollectMission, applyRepairBot, applyStartMission } from "./map/actions";

export interface Settings {
  music: number;
  sfx: number;
  musicOn: boolean;
  sfxOn: boolean;
  vibration: boolean;
  shake: boolean;
  particles: boolean;
  bigText: boolean;
}

export interface GameState {
  resources: Record<ResKey, number>;
  credits: number;
  cores: number;
  energy: number;
  tier: number;
  bots: Record<string, number>;
  buildings: Record<BuildingKey, number>;
  population: number;
  activeMissions: ActiveMission[];
  missionsCompleted: number;
  botDamagedUntil: Record<string, number>;
  sectors: Record<string, SectorStatus>;
  sectorsCleared: Record<string, boolean>;
  sectorsRescued: Record<string, boolean>;
  lastSeen: number;
  startedAt: number;
  settings: Settings;
}

// Every resource in this game comes from one place: robots you send out from
// the Junkyard. Nothing accrues passively, and nothing appears without a
// mission behind it. See startMission/collectMission below.
const initialState = (): GameState => ({
  resources: { metal: 0, stone: 0, wood: 0, water: 0 },
  credits: 0,
  cores: 0,
  energy: MAX_ENERGY,
  tier: 0,
  // You start with one robot already active — RUSTY-01 — so there's always
  // a way to get moving. Everything else is earned from there.
  bots: { rusty: 1 },
  buildings: { barracks: 0, kitchen: 0, waterStill: 0, workshop: 0 },
  population: 2,
  activeMissions: [],
  missionsCompleted: 0,
  botDamagedUntil: {},
  sectors: initialSectorStatuses(),
  sectorsCleared: {},
  sectorsRescued: {},
  lastSeen: Date.now(),
  startedAt: Date.now(),
  settings: {
    music: 0.7,
    sfx: 0.8,
    musicOn: true,
    sfxOn: true,
    vibration: true,
    shake: true,
    particles: true,
    bigText: false,
  },
});

function mergeState(fresh: GameState, parsed: Partial<GameState>): GameState {
  return {
    ...fresh,
    ...parsed,
    settings: { ...fresh.settings, ...(parsed.settings ?? {}) },
  };
}

export type { Toast };

export function useGame() {
  const [{ state: loaded }] = useState(() => loadPersisted(AUTOSAVE_KEY, initialState, mergeState));
  const [state, setState] = useState<GameState>(loaded);
  const { toasts, toast } = useToasts();
  const missionId = useRef(
    (loaded.activeMissions ?? []).reduce((max, m) => Math.max(max, m.id), 0),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  // tick: energy regen only. Population no longer grows with time — it only
  // moves via a successful Rescue mission (map/actions.ts). No resource,
  // credit, core, or population here ever gains value without a mission
  // behind it.
  useGameLoop((dt) => {
    setState((s) => {
      const energy = Math.min(MAX_ENERGY, s.energy + dt / ENERGY_REGEN_SEC);
      return { ...s, energy, lastSeen: Date.now() };
    });
  });

  useAutosave(AUTOSAVE_KEY, stateRef);

  const buzz = useCallback((ms = 12) => {
    vibrate(stateRef.current.settings.vibration, ms);
  }, []);

  const actions = {
    hireBot(id: string) {
      setState((s) => {
        const result = applyHireBot({ bots: s.bots, credits: s.credits }, id);
        toast(result.message, result.tone);
        if (!result.ok) return s;
        buzz();
        return { ...s, bots: result.bots, credits: result.credits };
      });
    },
    buildOrUpgrade(key: BuildingKey) {
      setState((s) => {
        const result = applyBuildOrUpgrade({ resources: s.resources, buildings: s.buildings }, key);
        toast(result.message, result.tone);
        if (!result.ok) return s;
        buzz();
        return { ...s, resources: result.resources, buildings: result.buildings };
      });
    },
    startMission(botId: string, type: MissionType, sectorId: string, danger: DangerLevel = "safe") {
      setState((s) => {
        const result = applyStartMission(
          {
            bots: s.bots,
            botDamagedUntil: s.botDamagedUntil,
            activeMissions: s.activeMissions,
            sectors: s.sectors,
            sectorsCleared: s.sectorsCleared,
            sectorsRescued: s.sectorsRescued,
            energy: s.energy,
            tier: s.tier,
            population: s.population,
            kitchenLevel: s.buildings.kitchen,
            waterStillLevel: s.buildings.waterStill,
            barracksLevel: s.buildings.barracks,
          },
          missionId.current + 1,
          botId,
          type,
          sectorId,
          danger,
        );
        toast(result.message, result.tone);
        if (!result.ok) return s;
        missionId.current += 1;
        buzz();
        return { ...s, energy: result.energy, activeMissions: result.activeMissions };
      });
    },
    collectMission(id: number) {
      setState((s) => {
        const result = applyCollectMission(
          {
            activeMissions: s.activeMissions,
            resources: s.resources,
            credits: s.credits,
            cores: s.cores,
            population: s.population,
            botDamagedUntil: s.botDamagedUntil,
            sectors: s.sectors,
            sectorsCleared: s.sectorsCleared,
            sectorsRescued: s.sectorsRescued,
            missionsCompleted: s.missionsCompleted,
            workshopLevel: s.buildings.workshop,
            barracksLevel: s.buildings.barracks,
          },
          id,
        );
        if (!result.ok) return s;
        buzz();
        if (result.message) toast(result.message, result.tone);
        return {
          ...s,
          resources: result.resources,
          credits: result.credits,
          cores: result.cores,
          population: result.population,
          tier: deriveTier(result.population),
          activeMissions: result.activeMissions,
          missionsCompleted: result.missionsCompleted,
          botDamagedUntil: result.botDamagedUntil,
          sectors: result.sectors,
          sectorsCleared: result.sectorsCleared,
          sectorsRescued: result.sectorsRescued,
        };
      });
    },
    repairBot(botId: string) {
      setState((s) => {
        const result = applyRepairBot({ botDamagedUntil: s.botDamagedUntil, credits: s.credits }, botId);
        if (!result.ok) {
          if (result.message) toast(result.message, result.tone);
          return s;
        }
        buzz();
        toast(result.message, result.tone);
        return { ...s, botDamagedUntil: result.botDamagedUntil, credits: result.credits };
      });
    },
    refillEnergy() {
      setState((s) => {
        if (s.cores < 5) {
          toast("Need 5 cores", "bad");
          return s;
        }
        toast("Energy refilled!", "good");
        return { ...s, cores: s.cores - 5, energy: MAX_ENERGY };
      });
    },
    setSettings(patch: Partial<Settings>) {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },
    reset() {
      clearPersisted(AUTOSAVE_KEY);
      setState(initialState());
      toast("Save wiped — fresh start", "info");
    },
  };

  return { state, actions, toasts, toast };
}

export type GameApi = ReturnType<typeof useGame>;
