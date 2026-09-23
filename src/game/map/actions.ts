import type { ActionOutcome } from "../actionResult";
import { BOTS, CITY_TIERS, type ResKey } from "../data";
import { populationCapacity, sustainReady, workshopDiscount } from "../buildings";
import {
  DANGER_LEVELS,
  MISSION_TYPES,
  type ActiveMission,
  type DangerLevel,
  type MissionType,
  rollMissionOutcome,
} from "./missions";
import { SECTORS, SECTOR_DANGER_TIERS, type SectorStatus, effectiveDangerTier, recomputeReachable } from "./sectors";

export interface StartMissionInput {
  bots: Record<string, number>;
  botDamagedUntil: Record<string, number>;
  activeMissions: ActiveMission[];
  sectors: Record<string, SectorStatus>;
  sectorsCleared: Record<string, boolean>;
  sectorsRescued: Record<string, boolean>;
  energy: number;
  tier: number;
  population: number;
  kitchenLevel: number;
  waterStillLevel: number;
  barracksLevel: number;
}

export interface StartMissionResult extends ActionOutcome {
  energy: number;
  activeMissions: ActiveMission[];
}

/** Pure state transition for dispatching a robot on a mission. */
export function applyStartMission(
  input: StartMissionInput,
  nextMissionId: number,
  botId: string,
  type: MissionType,
  sectorId: string,
  danger: DangerLevel,
): StartMissionResult {
  const unchanged = { energy: input.energy, activeMissions: input.activeMissions };

  const botLevel = input.bots[botId] ?? 0;
  if (botLevel <= 0) {
    return { ...unchanged, ok: false, message: "Hire this robot in the Crew tab first", tone: "bad" };
  }
  if ((input.botDamagedUntil[botId] ?? 0) > Date.now()) {
    return { ...unchanged, ok: false, message: "That robot is still being repaired", tone: "bad" };
  }
  if (input.activeMissions.some((m) => m.botId === botId)) {
    return { ...unchanged, ok: false, message: "That robot is already out on a mission", tone: "bad" };
  }

  const sectorDef = SECTORS.find((sec) => sec.id === sectorId);
  const status = input.sectors[sectorId] ?? "locked";
  if (!sectorDef || status === "locked") {
    return { ...unchanged, ok: false, message: "That sector hasn't been reached yet", tone: "bad" };
  }
  if (type === "scavenge" && status !== "scouted") {
    return { ...unchanged, ok: false, message: "Scout this sector before scavenging it", tone: "bad" };
  }
  if (type === "clear") {
    if (status !== "scouted") {
      return { ...unchanged, ok: false, message: "Scout this sector before clearing it", tone: "bad" };
    }
    if (sectorDef.enemyStrength <= 0) {
      return { ...unchanged, ok: false, message: "Nothing here to clear", tone: "info" };
    }
    if (input.sectorsCleared[sectorId]) {
      return { ...unchanged, ok: false, message: "This sector is already cleared", tone: "info" };
    }
  }
  if (type === "rescue") {
    if (status !== "scouted") {
      return { ...unchanged, ok: false, message: "Scout this sector before attempting a rescue", tone: "bad" };
    }
    if (sectorDef.survivorCount <= 0) {
      return { ...unchanged, ok: false, message: "Nobody here to rescue", tone: "info" };
    }
    if (input.sectorsRescued[sectorId]) {
      return { ...unchanged, ok: false, message: "Already brought everyone home from here", tone: "info" };
    }
    if (sectorDef.enemyStrength > 0 && !input.sectorsCleared[sectorId]) {
      return {
        ...unchanged,
        ok: false,
        message: "Clear this sector's enemies before attempting a rescue",
        tone: "bad",
      };
    }
    if (!sustainReady(input.kitchenLevel, input.waterStillLevel)) {
      return {
        ...unchanged,
        ok: false,
        message: "Build a Kitchen and a Water Still before you can bring survivors home",
        tone: "bad",
      };
    }
    const cap = populationCapacity(input.barracksLevel);
    if (input.population + sectorDef.survivorCount > cap) {
      return {
        ...unchanged,
        ok: false,
        message: "Not enough room in the Barracks for that many survivors — upgrade it first",
        tone: "bad",
      };
    }
  }

  const botDef = BOTS.find((b) => b.id === botId)!;
  const missionDef = MISSION_TYPES.find((m) => m.type === type)!;
  const dangerDef = DANGER_LEVELS.find((d) => d.level === danger)!;
  if (input.energy < missionDef.energyCost) {
    return { ...unchanged, ok: false, message: "Not enough energy", tone: "bad" };
  }

  const effTier = effectiveDangerTier(sectorDef, input.sectorsCleared[sectorId] ?? false);
  const tier = SECTOR_DANGER_TIERS[effTier];
  const tierMult = CITY_TIERS[Math.min(input.tier, CITY_TIERS.length - 1)].mult;
  const outcome = rollMissionOutcome(botDef, botLevel, tierMult, type, dangerDef, {
    materialBias: sectorDef.materialBias,
    mishapBonus: tier.mishapBonus,
    rewardMult: tier.rewardMult,
    enemyStrength: sectorDef.enemyStrength,
    survivorCount: sectorDef.survivorCount,
  });

  const now = Date.now();
  const mission: ActiveMission = {
    id: nextMissionId,
    botId,
    type,
    danger,
    sectorId,
    startedAt: now,
    endsAt: now + Math.round(missionDef.durationMs * dangerDef.durationMult),
    reward: outcome.reward,
    mishap: outcome.mishap,
    bonusCore: outcome.bonusCore,
  };

  return {
    ok: true,
    energy: input.energy - missionDef.energyCost,
    activeMissions: [...input.activeMissions, mission],
    message: `${botDef.name} heads into ${sectorDef.name} on a ${dangerDef.label} ${missionDef.name}`,
    tone: "info",
  };
}

export interface CollectMissionInput {
  activeMissions: ActiveMission[];
  resources: Record<ResKey, number>;
  credits: number;
  cores: number;
  population: number;
  botDamagedUntil: Record<string, number>;
  sectors: Record<string, SectorStatus>;
  sectorsCleared: Record<string, boolean>;
  sectorsRescued: Record<string, boolean>;
  missionsCompleted: number;
  workshopLevel: number;
  barracksLevel: number;
}

export interface CollectMissionResult extends ActionOutcome {
  resources: Record<ResKey, number>;
  credits: number;
  cores: number;
  population: number;
  activeMissions: ActiveMission[];
  botDamagedUntil: Record<string, number>;
  sectors: Record<string, SectorStatus>;
  sectorsCleared: Record<string, boolean>;
  sectorsRescued: Record<string, boolean>;
  missionsCompleted: number;
}

/** Pure state transition for collecting a finished mission. Empty message means "no-op, nothing to say." */
export function applyCollectMission(input: CollectMissionInput, missionId: number): CollectMissionResult {
  const unchanged = {
    resources: input.resources,
    credits: input.credits,
    cores: input.cores,
    population: input.population,
    activeMissions: input.activeMissions,
    botDamagedUntil: input.botDamagedUntil,
    sectors: input.sectors,
    sectorsCleared: input.sectorsCleared,
    sectorsRescued: input.sectorsRescued,
    missionsCompleted: input.missionsCompleted,
  };

  const mission = input.activeMissions.find((m) => m.id === missionId);
  if (!mission || Date.now() < mission.endsAt) {
    return { ...unchanged, ok: false, message: "", tone: "info" };
  }

  const botDef = BOTS.find((b) => b.id === mission.botId);
  const sectorDef = SECTORS.find((sec) => sec.id === mission.sectorId);
  const resources = { ...input.resources };
  for (const [k, v] of Object.entries(mission.reward.resources ?? {}))
    resources[k as ResKey] += v as number;

  const botDamagedUntil = { ...input.botDamagedUntil };
  let sectors = input.sectors;
  let sectorsCleared = input.sectorsCleared;
  let sectorsRescued = input.sectorsRescued;
  let population = input.population;
  let message: string;
  let tone: ActionOutcome["tone"];

  if (mission.mishap) {
    // Clear and Rescue both always run with danger="safe" (no risk selector —
    // the hazard comes from the sector itself, not a player choice), so the
    // usual danger-tier repair duration would always be zero. Base repair
    // time on the sector's own hazard instead for both.
    const repairBaseMs =
      mission.type === "clear"
        ? (sectorDef?.enemyStrength ?? 1) * 60_000
        : mission.type === "rescue"
          ? ((sectorDef?.dangerTier ?? 0) + 1) * 60_000
          : DANGER_LEVELS.find((d) => d.level === mission.danger)!.repairBaseMs;
    const repairMs = Math.round(repairBaseMs * (1 - workshopDiscount(input.workshopLevel)));
    if (repairMs > 0) botDamagedUntil[mission.botId] = Date.now() + repairMs;
    const verb =
      mission.type === "clear" ? "lost the fight in" : mission.type === "rescue" ? "had to turn back from" : "was ambushed in";
    const consequence =
      mission.type === "rescue"
        ? "Couldn't safely bring anyone out — needs repairs before trying again."
        : "Limped home light-handed and needs repairs.";
    message = `${botDef?.name ?? "Robot"} ${verb} ${sectorDef?.name ?? "the field"}! ${consequence}`;
    tone = "bad";
  } else if (mission.type === "scout" && sectorDef && input.sectors[sectorDef.id] !== "scouted") {
    sectors = recomputeReachable({ ...input.sectors, [sectorDef.id]: "scouted" });
    message = `${botDef?.name ?? "Robot"} scouted ${sectorDef.name}! New sectors revealed.`;
    tone = "good";
  } else if (mission.type === "clear" && sectorDef) {
    sectorsCleared = { ...input.sectorsCleared, [sectorDef.id]: true };
    message = `${botDef?.name ?? "Robot"} cleared ${sectorDef.name}! It's safer here now.`;
    tone = "good";
  } else if (mission.type === "rescue" && sectorDef) {
    sectorsRescued = { ...input.sectorsRescued, [sectorDef.id]: true };
    const gained = mission.reward.population ?? 0;
    const cap = populationCapacity(input.barracksLevel);
    population = Math.min(cap, input.population + gained);
    message = `${botDef?.name ?? "Robot"} brought ${gained} survivor${gained === 1 ? "" : "s"} home from ${sectorDef.name}!`;
    tone = "good";
  } else {
    message = mission.bonusCore
      ? `${botDef?.name ?? "Robot"} is back with a lucky find — bonus core!`
      : `${botDef?.name ?? "Robot"} is back — haul delivered!`;
    tone = "good";
  }

  return {
    ok: true,
    resources,
    credits: input.credits + (mission.reward.credits ?? 0),
    cores: input.cores + (mission.reward.cores ?? 0),
    population,
    activeMissions: input.activeMissions.filter((m) => m.id !== missionId),
    missionsCompleted: input.missionsCompleted + 1,
    botDamagedUntil,
    sectors,
    sectorsCleared,
    sectorsRescued,
    message,
    tone,
  };
}

export interface RepairActionInput {
  botDamagedUntil: Record<string, number>;
  credits: number;
}

export interface RepairActionResult extends ActionOutcome {
  botDamagedUntil: Record<string, number>;
  credits: number;
}

/** Pure state transition for rushing a robot's repair with credits. */
export function applyRepairBot(input: RepairActionInput, botId: string): RepairActionResult {
  const unchanged = { botDamagedUntil: input.botDamagedUntil, credits: input.credits };
  const until = input.botDamagedUntil[botId] ?? 0;
  const now = Date.now();
  if (until <= now) {
    return { ...unchanged, ok: false, message: "", tone: "info" };
  }
  const cost = Math.ceil((until - now) / 1000) * 2;
  if (input.credits < cost) {
    return { ...unchanged, ok: false, message: `Need ${cost} credits to rush repairs`, tone: "bad" };
  }
  return {
    ok: true,
    credits: input.credits - cost,
    botDamagedUntil: { ...input.botDamagedUntil, [botId]: 0 },
    message: "Repairs complete!",
    tone: "good",
  };
}
