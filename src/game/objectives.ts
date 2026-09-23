import type { BuildingKey } from "./buildings";

export interface ObjectiveContext {
  botsOwned: number;
  missionsCompleted: number;
  buildings: Record<BuildingKey, number>;
  population: number;
  tier: number;
}

export interface ObjectiveDef {
  id: string;
  label: string;
  icon: string;
  isDone: (ctx: ObjectiveContext) => boolean;
}

export const OBJECTIVES: ObjectiveDef[] = [
  { id: "hire", label: "Hire your first robot", icon: "🤖", isDone: (c) => c.botsOwned >= 1 },
  {
    id: "mission",
    label: "Send a robot out on a mission",
    icon: "🛠️",
    isDone: (c) => c.missionsCompleted >= 1,
  },
  { id: "kitchen", label: "Build a Kitchen", icon: "🍲", isDone: (c) => c.buildings.kitchen >= 1 },
  { id: "water", label: "Build a Water Still", icon: "🚰", isDone: (c) => c.buildings.waterStill >= 1 },
  { id: "barracks", label: "Build a Barracks", icon: "🛏️", isDone: (c) => c.buildings.barracks >= 1 },
  {
    id: "pop6",
    label: "Grow your camp to 6 survivors",
    icon: "👥",
    isDone: (c) => c.population >= 6,
  },
  {
    id: "tier2",
    label: "Rebuild into a bigger base",
    icon: "🏙️",
    isDone: (c) => c.tier >= 1,
  },
];
