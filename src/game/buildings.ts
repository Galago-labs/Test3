import type { ResKey } from "./data";
import type { ActionOutcome } from "./actionResult";

export type BuildingKey = "barracks" | "kitchen" | "waterStill" | "workshop";

export interface BuildingDef {
  key: BuildingKey;
  name: string;
  icon: string;
  tagline: string;
  maxLevel: number;
  baseCost: Partial<Record<ResKey, number>>;
  costGrowth: number;
}

export const BUILDINGS: BuildingDef[] = [
  {
    key: "barracks",
    name: "Barracks",
    icon: "🛏️",
    tagline: "Shelter for survivors — more beds, more room to grow",
    maxLevel: 6,
    baseCost: { wood: 260, metal: 140 },
    costGrowth: 1.7,
  },
  {
    key: "kitchen",
    name: "Kitchen",
    icon: "🍲",
    tagline: "Feeds your people — required to sustain any population",
    maxLevel: 6,
    baseCost: { metal: 200, wood: 160 },
    costGrowth: 1.7,
  },
  {
    key: "waterStill",
    name: "Water Still",
    icon: "🚰",
    tagline: "Purifies water — required to sustain any population",
    maxLevel: 6,
    baseCost: { metal: 220, stone: 150 },
    costGrowth: 1.7,
  },
  {
    key: "workshop",
    name: "Workshop",
    icon: "🔧",
    tagline: "Robots patch gear here — cuts every build cost",
    maxLevel: 6,
    baseCost: { metal: 280, stone: 180 },
    costGrowth: 1.8,
  },
];

export const BARRACKS_BASE_CAPACITY = 2;
export const BARRACKS_CAPACITY_PER_LEVEL = 4;
export const WORKSHOP_DISCOUNT_PER_LEVEL = 0.05;
export const WORKSHOP_MAX_DISCOUNT = 0.3;

export function buildingLevel(buildings: Record<BuildingKey, number>, key: BuildingKey): number {
  return buildings[key] ?? 0;
}

export function workshopDiscount(workshopLevel: number): number {
  return Math.min(WORKSHOP_MAX_DISCOUNT, workshopLevel * WORKSHOP_DISCOUNT_PER_LEVEL);
}

export function buildingCost(
  def: BuildingDef,
  level: number,
  discount: number,
): Partial<Record<ResKey, number>> {
  const mult = Math.pow(def.costGrowth, level) * (1 - discount);
  const out: Partial<Record<ResKey, number>> = {};
  for (const [k, v] of Object.entries(def.baseCost)) {
    out[k as ResKey] = Math.max(1, Math.floor((v as number) * mult));
  }
  return out;
}

export function populationCapacity(barracksLevel: number): number {
  return BARRACKS_BASE_CAPACITY + barracksLevel * BARRACKS_CAPACITY_PER_LEVEL;
}

// Population does not grow on its own — Kitchen and Water Still are a gate,
// not a driver. Only a successful Rescue mission (map/actions.ts) brings
// survivors home, and only once this gate is open.
export function sustainReady(kitchenLevel: number, waterStillLevel: number): boolean {
  return kitchenLevel >= 1 && waterStillLevel >= 1;
}

export interface BuildActionInput {
  resources: Record<ResKey, number>;
  buildings: Record<BuildingKey, number>;
}

export interface BuildActionResult extends ActionOutcome {
  resources: Record<ResKey, number>;
  buildings: Record<BuildingKey, number>;
}

/** Pure state transition for building/upgrading — no React, no side effects. */
export function applyBuildOrUpgrade(input: BuildActionInput, key: BuildingKey): BuildActionResult {
  const def = BUILDINGS.find((b) => b.key === key)!;
  const level = input.buildings[key] ?? 0;
  const unchanged = { resources: input.resources, buildings: input.buildings };

  if (level >= def.maxLevel) {
    return { ...unchanged, ok: false, message: `${def.name} is already fully built`, tone: "info" };
  }

  const discount = workshopDiscount(input.buildings.workshop ?? 0);
  const cost = buildingCost(def, level, discount);
  for (const [k, v] of Object.entries(cost)) {
    if (input.resources[k as ResKey] < (v as number)) {
      return {
        ...unchanged,
        ok: false,
        message: "Not enough materials — send robots to gather more",
        tone: "bad",
      };
    }
  }

  const resources = { ...input.resources };
  for (const [k, v] of Object.entries(cost)) resources[k as ResKey] -= v as number;

  return {
    ok: true,
    resources,
    buildings: { ...input.buildings, [key]: level + 1 },
    message: level === 0 ? `${def.name} built!` : `${def.name} → Level ${level + 1}`,
    tone: "good",
  };
}
