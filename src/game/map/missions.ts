import type { ResKey } from "../data";

export type MissionType = "scavenge" | "scout" | "clear" | "rescue";
export type Skill = "scavenging" | "scouting" | "combat" | "rescue";

// The only shape missions.ts needs from "a robot" — deliberately narrower
// than BotDef, so this module works equally well with the full crew data or
// with the map domain's own MapRobot, without either depending on the other.
export interface SkillProfile {
  target: ResKey | "all";
  scavenging: number;
  scouting: number;
  combat: number;
  rescue: number;
}

export interface MissionTypeDef {
  type: MissionType;
  name: string;
  icon: string;
  description: string;
  skill: Skill;
  durationMs: number;
  energyCost: number;
}

export const MISSION_TYPES: MissionTypeDef[] = [
  {
    type: "scavenge",
    name: "Scavenge Run",
    icon: "🧲",
    description: "Hauls raw materials back from the wreckage",
    skill: "scavenging",
    durationMs: 60_000,
    energyCost: 20,
  },
  {
    type: "scout",
    name: "Scout Run",
    icon: "🔭",
    description: "Searches the ruins for credits and cores",
    skill: "scouting",
    durationMs: 45_000,
    energyCost: 15,
  },
  {
    type: "clear",
    name: "Clear Sector",
    icon: "⚔️",
    description: "Fights through a sector's enemies to make it permanently safer",
    skill: "combat",
    durationMs: 75_000,
    energyCost: 30,
  },
  {
    type: "rescue",
    name: "Rescue Mission",
    icon: "🏠",
    description: "Brings survivors home — the only way your population grows",
    skill: "rescue",
    durationMs: 90_000,
    energyCost: 30,
  },
];

export interface MissionReward {
  credits?: number;
  cores?: number;
  resources?: Partial<Record<ResKey, number>>;
  population?: number;
}

export interface ActiveMission {
  id: number;
  botId: string;
  type: MissionType;
  danger: DangerLevel;
  sectorId: string;
  startedAt: number;
  endsAt: number;
  reward: MissionReward;
  mishap: boolean;
  bonusCore: boolean;
}

export type DangerLevel = "safe" | "risky" | "dangerous";

export interface DangerDef {
  level: DangerLevel;
  label: string;
  icon: string;
  durationMult: number;
  rewardMult: number;
  mishapChance: number; // base chance before skill reduces it
  repairBaseMs: number; // robot downtime if a mishap occurs
}

export const DANGER_LEVELS: DangerDef[] = [
  {
    level: "safe",
    label: "Safe",
    icon: "🟢",
    durationMult: 1,
    rewardMult: 1,
    mishapChance: 0,
    repairBaseMs: 0,
  },
  {
    level: "risky",
    label: "Risky",
    icon: "🟠",
    durationMult: 1.5,
    rewardMult: 1.7,
    mishapChance: 0.3,
    repairBaseMs: 90_000,
  },
  {
    level: "dangerous",
    label: "Dangerous",
    icon: "🔴",
    durationMult: 2.2,
    rewardMult: 2.6,
    mishapChance: 0.5,
    repairBaseMs: 150_000,
  },
];

const BONUS_CORE_CHANCE = 0.06;

export function effectiveSkill(bot: SkillProfile, level: number, skill: Skill): number {
  const base =
    skill === "scavenging"
      ? bot.scavenging
      : skill === "scouting"
        ? bot.scouting
        : skill === "combat"
          ? bot.combat
          : bot.rescue;
  return base * Math.max(1, level);
}

export function effectiveCombatMishapChance(
  bot: SkillProfile,
  level: number,
  enemyStrength: number,
): number {
  if (enemyStrength <= 0) return 0;
  const sk = effectiveSkill(bot, level, "combat");
  return Math.max(0.05, enemyStrength * 0.18 - sk * 0.025);
}

// Rescue has no Safe/Risky/Dangerous selector, same as Clear — you're not
// choosing how carefully to extract people, you're doing it as carefully as
// possible every time. The sector's own hazard (via its mishap bonus, which
// already reflects clearing) sets the floor; rescue skill brings it down.
export function effectiveRescueMishapChance(
  bot: SkillProfile,
  level: number,
  sectorMishapBonus: number,
): number {
  const sk = effectiveSkill(bot, level, "rescue");
  return Math.max(0.03, 0.1 + sectorMishapBonus - sk * 0.025);
}

export function effectiveMishapChance(
  bot: SkillProfile,
  level: number,
  skill: Skill,
  danger: DangerDef,
  sectorMishapBonus: number,
): number {
  const total = danger.mishapChance + sectorMishapBonus;
  if (total <= 0) return 0;
  const sk = effectiveSkill(bot, level, skill);
  return Math.max(0.03, total - sk * 0.025);
}

export function previewScavengeReward(
  bot: SkillProfile,
  level: number,
  tierMult: number,
  materialBias: ResKey,
  sectorRewardMult: number,
): Partial<Record<ResKey, number>> {
  const skill = effectiveSkill(bot, level, "scavenging");
  const specialistBonus = bot.target === materialBias || bot.target === "all" ? 1.25 : 1;
  const amount = Math.floor(
    240 * (1 + skill * 0.35) * tierMult * sectorRewardMult * specialistBonus,
  );
  return { [materialBias]: amount } as Partial<Record<ResKey, number>>;
}

export function previewScoutReward(
  bot: SkillProfile,
  level: number,
  tierMult: number,
  sectorRewardMult: number,
): { credits: number; coreChance: number } {
  const skill = effectiveSkill(bot, level, "scouting");
  const credits = Math.floor(170 * (1 + skill * 0.35) * tierMult * sectorRewardMult);
  const coreChance = Math.min(0.85, 0.12 + skill * 0.06);
  return { credits, coreChance };
}

export function previewClearReward(
  bot: SkillProfile,
  level: number,
  tierMult: number,
  enemyStrength: number,
): { credits: number } {
  const skill = effectiveSkill(bot, level, "combat");
  const credits = Math.floor(60 * Math.max(1, enemyStrength) * (1 + skill * 0.35) * tierMult);
  return { credits };
}

// Unlike other rewards, how many survivors come home isn't scaled by skill —
// that's just how many people are actually out there. Skill only affects
// whether the mission succeeds at all (see effectiveRescueMishapChance).
export function previewRescueReward(survivorCount: number): { population: number } {
  return { population: survivorCount };
}

export interface MissionOutcome {
  reward: MissionReward;
  mishap: boolean;
  bonusCore: boolean;
}

export interface SectorContext {
  materialBias: ResKey;
  mishapBonus: number;
  rewardMult: number;
  enemyStrength: number; // 0 if the sector has no enemies
  survivorCount: number; // 0 if the sector has nobody to rescue
}

export function rollMissionOutcome(
  bot: SkillProfile,
  level: number,
  tierMult: number,
  type: MissionType,
  danger: DangerDef,
  sector: SectorContext,
): MissionOutcome {
  if (type === "clear") {
    const mishap = Math.random() < effectiveCombatMishapChance(bot, level, sector.enemyStrength);
    const { credits } = previewClearReward(bot, level, tierMult, sector.enemyStrength);
    const scale = mishap ? 0.3 : 1;
    const reward: MissionReward = { credits: Math.max(1, Math.floor(credits * scale)) };
    const bonusCore = !mishap && Math.random() < BONUS_CORE_CHANCE;
    if (bonusCore) reward.cores = (reward.cores ?? 0) + 1;
    return { reward, mishap, bonusCore };
  }

  if (type === "rescue") {
    const mishap = Math.random() < effectiveRescueMishapChance(bot, level, sector.mishapBonus);
    // A botched extraction brings nobody home this attempt — the sector stays
    // available to try again, same shape as a failed Clear.
    const reward: MissionReward = mishap ? {} : previewRescueReward(sector.survivorCount);
    return { reward, mishap, bonusCore: false };
  }

  const skill: Skill = type === "scavenge" ? "scavenging" : "scouting";
  const mishap = Math.random() < effectiveMishapChance(bot, level, skill, danger, sector.mishapBonus);
  const scale = (mishap ? 0.3 : 1) * danger.rewardMult;

  let reward: MissionReward;
  if (type === "scavenge") {
    const base = previewScavengeReward(bot, level, tierMult, sector.materialBias, sector.rewardMult);
    const resources: Partial<Record<ResKey, number>> = {};
    for (const [k, v] of Object.entries(base)) {
      resources[k as ResKey] = Math.max(1, Math.floor((v as number) * scale));
    }
    reward = { resources };
  } else {
    const { credits, coreChance } = previewScoutReward(bot, level, tierMult, sector.rewardMult);
    const cores = mishap ? 0 : Math.random() < coreChance ? 1 : 0;
    reward = { credits: Math.max(1, Math.floor(credits * scale)), cores };
  }

  const bonusCore = !mishap && Math.random() < BONUS_CORE_CHANCE;
  if (bonusCore) reward.cores = (reward.cores ?? 0) + 1;

  return { reward, mishap, bonusCore };
}
