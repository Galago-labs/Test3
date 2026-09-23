export type ResKey = "metal" | "stone" | "wood" | "water";

export interface ResourceDef {
  key: ResKey;
  name: string;
  icon: string;
}

export const RESOURCES: ResourceDef[] = [
  { key: "metal", name: "Metal", icon: "⚙️" },
  { key: "stone", name: "Stone", icon: "🧱" },
  { key: "wood", name: "Wood", icon: "🌳" },
  { key: "water", name: "Water", icon: "💧" },
];

export const CITY_TIERS = [
  { name: "Ashford Camp", label: "Tier 1 · First Sparks", mult: 1 },
  { name: "Ashford City", label: "Tier 2 · Industrial Recovery", mult: 2.2 },
  { name: "Ashford Works", label: "Tier 3 · Green Foundries", mult: 5 },
  { name: "New Ashford", label: "Tier 4 · Skyline Reborn", mult: 11 },
  { name: "Ashford Prime", label: "Tier 5 · Utopia Protocol", mult: 24 },
  { name: "Gaia Nexus", label: "Tier 6 · Planet Reclaimed", mult: 50 },
];

// Tier is derived from population, not bought — your camp's standing in the
// world reflects how many people actually live there. Index into CITY_TIERS.
export const TIER_POPULATION_THRESHOLDS = [0, 5, 10, 15, 20, 25];
export function deriveTier(population: number): number {
  let tier = 0;
  for (let i = 0; i < TIER_POPULATION_THRESHOLDS.length; i++) {
    if (population >= TIER_POPULATION_THRESHOLDS[i]) tier = i;
  }
  return tier;
}

// Day counter shown in the top bar — flavor/orientation only (elapsed real
// time since the save began), not tied to any mission timing or mechanic.
// Derived from `startedAt` rather than stored, same reasoning as `tier`.
export const DAY_MS = 24 * 60 * 60 * 1000;
export function deriveDayCount(startedAt: number, now: number): number {
  return Math.max(1, Math.floor((now - startedAt) / DAY_MS) + 1);
}

export interface BotDef {
  id: string;
  name: string;
  role: string;
  icon: string;
  target: ResKey | "all"; // specialty — bonus reward when sent to a matching sector
  baseCost: number;
  scavenging: number; // base skill rating for Scavenge missions (hauling materials)
  scouting: number; // base skill rating for Scout missions (finding credits & cores)
  combat: number; // base skill rating for Clear missions (fighting sector enemies)
  rescue: number; // base skill rating for Rescue missions (safely extracting survivors)
}

export const BOTS: BotDef[] = [
  {
    id: "rusty",
    name: "RUSTY-01",
    role: "Scrap Cutter",
    icon: "🤖",
    target: "metal",
    baseCost: 900,
    scavenging: 3,
    scouting: 1,
    combat: 2,
    rescue: 1,
  },
  {
    id: "bolt",
    name: "BOLT-7",
    role: "Rubble Crusher",
    icon: "🔩",
    target: "stone",
    baseCost: 1200,
    scavenging: 4,
    scouting: 1,
    combat: 3,
    rescue: 1,
  },
  {
    id: "sprout",
    name: "SPROUT-3",
    role: "Forest Keeper",
    icon: "🌿",
    target: "wood",
    baseCost: 1600,
    scavenging: 2,
    scouting: 3,
    combat: 1,
    rescue: 3,
  },
  {
    id: "drip",
    name: "DRIP-9",
    role: "Aqua Filter",
    icon: "🚰",
    target: "water",
    baseCost: 2100,
    scavenging: 2,
    scouting: 2,
    combat: 1,
    rescue: 3,
  },
  {
    id: "nova",
    name: "NOVA-X",
    role: "Fusion Overseer",
    icon: "✨",
    target: "all",
    baseCost: 5200,
    scavenging: 3,
    scouting: 4,
    combat: 4,
    rescue: 4,
  },
];

export const MAX_ENERGY = 100;
export const ENERGY_REGEN_SEC = 5; // seconds per 1 energy
export const AUTOSAVE_KEY = "robot-reclaim-save-v2";

export const botCost = (def: BotDef, level: number) =>
  Math.floor(def.baseCost * Math.pow(1.75, level));
