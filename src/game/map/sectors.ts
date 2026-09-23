import type { ResKey } from "../data";

export type SectorStatus = "locked" | "reachable" | "scouted";
export type GridCoord = 0 | 1 | 2 | 3 | 4;

export interface SectorDef {
  id: string;
  name: string;
  icon: string;
  gridX: GridCoord;
  gridY: GridCoord;
  neighbors: string[]; // sector ids — becoming scouted on any of these makes this sector reachable
  dangerTier: 0 | 1 | 2; // Calm / Rough / Severe
  materialBias: ResKey; // dominant resource found via a Scavenge Run here
  threatFlavor: string; // revealed once scouted
  enemyStrength: 0 | 1 | 2 | 3; // 0 = no enemies here; 1-3 = Low/Medium/High
  enemyName: string; // empty when enemyStrength is 0
  survivorCount: 0 | 1 | 2 | 3; // 0 = nobody here to rescue
  survivorFlavor: string; // empty when survivorCount is 0
  isHome?: boolean;
}

export const SECTORS: SectorDef[] = [
  {
    id: "home",
    name: "The Camp",
    icon: "🏕️",
    gridX: 2,
    gridY: 2,
    neighbors: [],
    dangerTier: 0,
    materialBias: "metal",
    threatFlavor: "",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 0,
    survivorFlavor: "",
    isHome: true,
  },

  // ---- ring 1 (adjacent to home) ----
  {
    id: "n",
    name: "Rustfield",
    icon: "⚙️",
    gridX: 2,
    gridY: 1,
    neighbors: ["home"],
    dangerTier: 0,
    materialBias: "metal",
    threatFlavor: "Rusted chassis litter the open ground — mostly harmless, but scrap-hounds nest in the wrecks.",
    enemyStrength: 1,
    enemyName: "Scrap-Hounds",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "e",
    name: "Flooded Channels",
    icon: "💧",
    gridX: 3,
    gridY: 2,
    neighbors: ["home"],
    dangerTier: 0,
    materialBias: "water",
    threatFlavor: "Shallow, mostly-clean runoff pools. Calm water — just don't trust the algae.",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 2,
    survivorFlavor: "Voices echo up from a sealed cistern hatch nearby — someone's been surviving down there.",
  },
  {
    id: "s",
    name: "Stonebreak Quarry",
    icon: "⛏️",
    gridX: 2,
    gridY: 3,
    neighbors: ["home"],
    dangerTier: 1,
    materialBias: "stone",
    threatFlavor: "Loose rock and old blasting charges. Unstable footing has claimed more than one bot.",
    enemyStrength: 2,
    enemyName: "Rockslide Crawlers",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "w",
    name: "Drowned Grove",
    icon: "🌲",
    gridX: 1,
    gridY: 2,
    neighbors: ["home"],
    dangerTier: 1,
    materialBias: "wood",
    threatFlavor: "Waterlogged timber and thick roots. Something moves in the undergrowth.",
    enemyStrength: 2,
    enemyName: "Root Lurkers",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "nw",
    name: "Twisted Scrapline",
    icon: "🧲",
    gridX: 1,
    gridY: 1,
    neighbors: ["n", "w"],
    dangerTier: 2,
    materialBias: "metal",
    threatFlavor: "A collapsed rail yard folded in on itself. Old salvager drones still patrol on dead batteries — and some aren't so dead.",
    enemyStrength: 3,
    enemyName: "Rogue Salvage Drones",
    survivorCount: 2,
    survivorFlavor: "A signal flare went up from the collapsed rail cars, then stopped. Someone's still holding out.",
  },
  {
    id: "ne",
    name: "Cistern Ruins",
    icon: "🚰",
    gridX: 3,
    gridY: 1,
    neighbors: ["n", "e"],
    dangerTier: 1,
    materialBias: "water",
    threatFlavor: "A cracked reservoir complex. The lower levels are flooded and pitch dark.",
    enemyStrength: 2,
    enemyName: "Drowned Skulkers",
    survivorCount: 3,
    survivorFlavor: "The reservoir's lower level is sealed off but occupied — knocking answers from inside.",
  },
  {
    id: "sw",
    name: "Rotwood Thicket",
    icon: "🍂",
    gridX: 1,
    gridY: 3,
    neighbors: ["s", "w"],
    dangerTier: 2,
    materialBias: "wood",
    threatFlavor: "Dense, rotted canopy blocks the sky. Easy to get turned around in there — and you're not alone.",
    enemyStrength: 3,
    enemyName: "Thicket Stalkers",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "se",
    name: "Old Quarry Edge",
    icon: "⛰️",
    gridX: 3,
    gridY: 3,
    neighbors: ["s", "e"],
    dangerTier: 2,
    materialBias: "stone",
    threatFlavor: "The quarry's far rim, half-collapsed. Rich in stone, but the ground itself is the danger.",
    enemyStrength: 2,
    enemyName: "Scree Wraiths",
    survivorCount: 0,
    survivorFlavor: "",
  },

  // ---- ring 2 (outer rim) ----
  {
    id: "motorpool",
    name: "Silent Motorpool",
    icon: "🚗",
    gridX: 0,
    gridY: 0,
    neighbors: ["nw"],
    dangerTier: 1,
    materialBias: "metal",
    threatFlavor: "Rows of gutted vehicles, stripped down to their frames.",
    enemyStrength: 2,
    enemyName: "Chop-Shop Scavengers",
    survivorCount: 1,
    survivorFlavor: "Someone's rigged a stripped delivery van into a livable shelter.",
  },
  {
    id: "overpass",
    name: "Cracked Overpass",
    icon: "🛤️",
    gridX: 1,
    gridY: 0,
    neighbors: ["nw", "n"],
    dangerTier: 1,
    materialBias: "stone",
    threatFlavor: "A collapsed highway section, still standing — barely.",
    enemyStrength: 2,
    enemyName: "Overpass Snipers",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "staticfields",
    name: "Static Fields",
    icon: "⚡",
    gridX: 2,
    gridY: 0,
    neighbors: ["n"],
    dangerTier: 0,
    materialBias: "metal",
    threatFlavor: "Old power pylons hum faintly. Harmless, probably.",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 1,
    survivorFlavor: "A lone tech has been living off scavenged batteries under the pylons.",
  },
  {
    id: "foundry",
    name: "Burnt Foundry",
    icon: "🏭",
    gridX: 3,
    gridY: 0,
    neighbors: ["n", "ne"],
    dangerTier: 2,
    materialBias: "metal",
    threatFlavor: "A gutted factory floor, scorched black. Something still moves in the ash.",
    enemyStrength: 3,
    enemyName: "Ash-Choked Automatons",
    survivorCount: 3,
    survivorFlavor: "A foreman's bunker survives deep under the factory floor — sealed, but not silent.",
  },
  {
    id: "signalridge",
    name: "Signal Ridge",
    icon: "🌫️",
    gridX: 4,
    gridY: 0,
    neighbors: ["ne"],
    dangerTier: 1,
    materialBias: "water",
    threatFlavor: "Fog rolls thick along the ridge. Visibility near zero.",
    enemyStrength: 1,
    enemyName: "Fog Stalkers",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "sidings",
    name: "Rusted Sidings",
    icon: "🚂",
    gridX: 0,
    gridY: 1,
    neighbors: ["nw", "w"],
    dangerTier: 1,
    materialBias: "metal",
    threatFlavor: "A derailed freight line, cargo long since scattered.",
    enemyStrength: 1,
    enemyName: "Rail Vermin",
    survivorCount: 1,
    survivorFlavor: "A family's sheltering in a sealed boxcar, rationing what they salvaged.",
  },
  {
    id: "craneyard",
    name: "Crane Yard",
    icon: "🏗️",
    gridX: 4,
    gridY: 1,
    neighbors: ["e", "ne"],
    dangerTier: 2,
    materialBias: "metal",
    threatFlavor: "Massive loading cranes, frozen mid-lift for years.",
    enemyStrength: 3,
    enemyName: "Crane Sentinels",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "orchard",
    name: "Hollow Orchard",
    icon: "🌳",
    gridX: 0,
    gridY: 2,
    neighbors: ["w"],
    dangerTier: 0,
    materialBias: "wood",
    threatFlavor: "Dead fruit trees in neat, eerie rows.",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 2,
    survivorFlavor: "An old farming family is still tending the dead rows, refusing to leave.",
  },
  {
    id: "sunkenlocks",
    name: "Sunken Locks",
    icon: "🌊",
    gridX: 4,
    gridY: 2,
    neighbors: ["e"],
    dangerTier: 0,
    materialBias: "water",
    threatFlavor: "Old canal locks, still holding back the water — mostly.",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 1,
    survivorFlavor: "The lockkeeper never left his post — he's still up there, watching the water.",
  },
  {
    id: "spiderhollow",
    name: "Spider Hollow",
    icon: "🕸️",
    gridX: 0,
    gridY: 3,
    neighbors: ["w", "sw"],
    dangerTier: 2,
    materialBias: "wood",
    threatFlavor: "Thick webbing chokes the undergrowth. Best not to linger.",
    enemyStrength: 3,
    enemyName: "Broodmother Spiders",
    survivorCount: 2,
    survivorFlavor: "Someone's trapped behind the webbing, alive but starving and running out of time.",
  },
  {
    id: "vermindocks",
    name: "Vermin Docks",
    icon: "🐀",
    gridX: 4,
    gridY: 3,
    neighbors: ["se", "e"],
    dangerTier: 1,
    materialBias: "water",
    threatFlavor: "An old loading dock, overrun and squeaking in the dark.",
    enemyStrength: 1,
    enemyName: "Dock Rats",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "bonewash",
    name: "Bone Wash",
    icon: "🦴",
    gridX: 0,
    gridY: 4,
    neighbors: ["sw"],
    dangerTier: 1,
    materialBias: "stone",
    threatFlavor: "A dry riverbed littered with old remains.",
    enemyStrength: 1,
    enemyName: "Bone Pickers",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "scrapbasin",
    name: "Scrapheap Basin",
    icon: "🗑️",
    gridX: 1,
    gridY: 4,
    neighbors: ["sw", "s"],
    dangerTier: 0,
    materialBias: "metal",
    threatFlavor: "A low, sprawling dump. Picked over, but not empty.",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 1,
    survivorFlavor: "A scavenger has made a real home out of the dump — reluctant to be found.",
  },
  {
    id: "crackedflats",
    name: "Cracked Flats",
    icon: "🌵",
    gridX: 2,
    gridY: 4,
    neighbors: ["s"],
    dangerTier: 0,
    materialBias: "stone",
    threatFlavor: "Dry, sun-baked ground. Quiet — for now.",
    enemyStrength: 0,
    enemyName: "",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "scorpionwash",
    name: "Scorpion Wash",
    icon: "🦂",
    gridX: 3,
    gridY: 4,
    neighbors: ["s", "se"],
    dangerTier: 2,
    materialBias: "stone",
    threatFlavor: "Loose sand hides more than footing hazards out here.",
    enemyStrength: 3,
    enemyName: "Giant Scorpions",
    survivorCount: 0,
    survivorFlavor: "",
  },
  {
    id: "pumphouse",
    name: "Drowned Pumphouse",
    icon: "🛢️",
    gridX: 4,
    gridY: 4,
    neighbors: ["se"],
    dangerTier: 1,
    materialBias: "water",
    threatFlavor: "An old pumping station, half-submerged and leaking.",
    enemyStrength: 1,
    enemyName: "Leak Ghouls",
    survivorCount: 1,
    survivorFlavor: "An engineer is still keeping the old pumps running, alone, out of habit.",
  },
];

export interface SectorDangerTierDef {
  tier: 0 | 1 | 2;
  label: string;
  mishapBonus: number;
  rewardMult: number;
}

export const SECTOR_DANGER_TIERS: SectorDangerTierDef[] = [
  { tier: 0, label: "Calm", mishapBonus: 0, rewardMult: 1 },
  { tier: 1, label: "Rough", mishapBonus: 0.1, rewardMult: 1.25 },
  { tier: 2, label: "Severe", mishapBonus: 0.2, rewardMult: 1.6 },
];

export function sectorDangerDef(sector: SectorDef): SectorDangerTierDef {
  return SECTOR_DANGER_TIERS[sector.dangerTier];
}

// A cleared sector steps down one danger tier (Severe -> Rough -> Calm) rather
// than dropping straight to Calm — clearing a sector should feel like real
// progress without instantly trivializing what used to be the map's hardest
// territory. This is the one line to change if that call turns out wrong in play.
export function effectiveDangerTier(def: SectorDef, cleared: boolean): 0 | 1 | 2 {
  if (!cleared) return def.dangerTier;
  return Math.max(0, def.dangerTier - 1) as 0 | 1 | 2;
}

export const ENEMY_STRENGTH_LABELS = ["None", "Low", "Medium", "High"] as const;

export function initialSectorStatuses(): Record<string, SectorStatus> {
  const out: Record<string, SectorStatus> = {};
  for (const s of SECTORS) {
    out[s.id] = s.isHome || s.neighbors.includes("home") ? (s.isHome ? "scouted" : "reachable") : "locked";
  }
  return out;
}

// Re-derives which locked sectors should now be reachable, given current statuses.
// Call this after any sector becomes "scouted".
export function recomputeReachable(
  statuses: Record<string, SectorStatus>,
): Record<string, SectorStatus> {
  const next = { ...statuses };
  for (const def of SECTORS) {
    if (next[def.id] === "locked" && def.neighbors.some((n) => next[n] === "scouted")) {
      next[def.id] = "reachable";
    }
  }
  return next;
}
