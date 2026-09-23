import { applyBuildOrUpgrade } from "./src/game/buildings";
import { applyHireBot } from "./src/game/crew";
import { DAY_MS, deriveDayCount } from "./src/game/data";
import { applyStartMission, applyCollectMission, applyRepairBot } from "./src/game/map/actions";
import { initialSectorStatuses } from "./src/game/map/sectors";

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log("FAIL:", label);
  }
}

// ---- applyHireBot ----
{
  const r1 = applyHireBot({ bots: {}, credits: 0 }, "rusty");
  check("hire: insufficient credits fails", r1.ok === false && r1.tone === "bad");
  check("hire: insufficient credits leaves state untouched", r1.bots.rusty === undefined && r1.credits === 0);

  const r2 = applyHireBot({ bots: {}, credits: 1000 }, "rusty");
  check("hire: enough credits succeeds", r2.ok === true);
  check("hire: credits deducted by exact cost (900)", r2.credits === 100);
  check("hire: bot level set to 1", r2.bots.rusty === 1);

  const r3 = applyHireBot({ bots: { rusty: 1 }, credits: 10000 }, "rusty");
  check("hire: upgrade cost scales (900*1.75=1575)", r3.credits === 10000 - 1575);
  check("hire: upgrade increments level", r3.bots.rusty === 2);
}

// ---- applyBuildOrUpgrade ----
{
  const r1 = applyBuildOrUpgrade({ resources: { metal: 0, stone: 0, wood: 0, water: 0 }, buildings: { barracks: 0, kitchen: 0, waterStill: 0, workshop: 0 } }, "barracks");
  check("build: insufficient resources fails", r1.ok === false && r1.tone === "bad");

  const r2 = applyBuildOrUpgrade({ resources: { metal: 500, stone: 500, wood: 500, water: 500 }, buildings: { barracks: 0, kitchen: 0, waterStill: 0, workshop: 0 } }, "barracks");
  check("build: enough resources succeeds", r2.ok === true);
  check("build: level incremented", r2.buildings.barracks === 1);
  check("build: resources actually deducted", r2.resources.wood < 500 && r2.resources.metal < 500);
  check("build: unrelated resources untouched", r2.resources.stone === 500 && r2.resources.water === 500);

  const r3 = applyBuildOrUpgrade({ resources: { metal: 99999, stone: 99999, wood: 99999, water: 99999 }, buildings: { barracks: 6, kitchen: 0, waterStill: 0, workshop: 0 } }, "barracks");
  check("build: max level rejects with info tone", r3.ok === false && r3.tone === "info");
}

// ---- applyStartMission ----
{
  const sectors = initialSectorStatuses();
  const baseInput = {
    bots: { rusty: 1 },
    botDamagedUntil: {},
    activeMissions: [],
    sectors,
    sectorsCleared: {},
    sectorsRescued: {},
    energy: 100,
    tier: 0,
    population: 2,
    kitchenLevel: 1,
    waterStillLevel: 1,
    barracksLevel: 3, // capacity 2 + 3*4 = 14, plenty of room for these tests
  };

  const r1 = applyStartMission(baseInput, 1, "bolt", "scout", "n", "safe");
  check("mission: unhired robot rejected", r1.ok === false);

  const r2 = applyStartMission(baseInput, 1, "rusty", "scavenge", "n", "safe");
  check("mission: scavenge on unscouted sector rejected", r2.ok === false);

  const r3 = applyStartMission(baseInput, 1, "rusty", "scout", "n", "safe");
  check("mission: valid scout dispatch succeeds", r3.ok === true);
  check("mission: energy deducted", r3.energy === 100 - 15);
  check("mission: one active mission created", r3.activeMissions.length === 1);
  check("mission: mission carries the requested sector", r3.activeMissions[0]?.sectorId === "n");

  const lowEnergy = { ...baseInput, energy: 5 };
  const r4 = applyStartMission(lowEnergy, 1, "rusty", "scout", "n", "safe");
  check("mission: insufficient energy rejected", r4.ok === false);

  const busy = { ...baseInput, activeMissions: [{ id: 1, botId: "rusty", type: "scout" as const, danger: "safe" as const, sectorId: "n", startedAt: 0, endsAt: 999999999999, reward: {}, mishap: false, bonusCore: false }] };
  const r5 = applyStartMission(busy, 2, "rusty", "scout", "e", "safe");
  check("mission: already-busy robot rejected", r5.ok === false);

  // n (Rustfield) has enemyStrength 1; e (Flooded Channels) has enemyStrength 0
  const scouted = { ...baseInput, sectors: { ...sectors, n: "scouted" as const, e: "scouted" as const } };
  const r6 = applyStartMission(scouted, 1, "rusty", "clear", "n", "safe");
  check("clear: valid dispatch against a sector with enemies succeeds", r6.ok === true);

  const r7 = applyStartMission(scouted, 1, "rusty", "clear", "e", "safe");
  check("clear: rejected on a sector with no enemies", r7.ok === false);

  const r8 = applyStartMission(baseInput, 1, "rusty", "clear", "n", "safe");
  check("clear: rejected on an unscouted sector", r8.ok === false);

  const alreadyCleared = { ...scouted, sectorsCleared: { n: true } };
  const r9 = applyStartMission(alreadyCleared, 1, "rusty", "clear", "n", "safe");
  check("clear: rejected on an already-cleared sector", r9.ok === false);
}

// ---- applyStartMission: rescue ----
{
  const sectors = initialSectorStatuses();
  const baseInput = {
    bots: { rusty: 1 },
    botDamagedUntil: {},
    activeMissions: [],
    sectors,
    sectorsCleared: {},
    sectorsRescued: {},
    energy: 100,
    tier: 0,
    population: 2,
    kitchenLevel: 1,
    waterStillLevel: 1,
    barracksLevel: 3, // capacity 2 + 3*4 = 14, plenty of room for these tests
  };
  // e (Flooded Channels): survivorCount 2, enemyStrength 0 — clean rescue.
  // nw (Twisted Scrapline): survivorCount 2, enemyStrength 3 — needs Clear first.
  const scouted = {
    ...baseInput,
    sectors: { ...sectors, e: "scouted" as const, nw: "scouted" as const, n: "scouted" as const },
  };

  const r1 = applyStartMission(scouted, 1, "rusty", "rescue", "e", "safe");
  check("rescue: valid dispatch against an enemy-free sector with survivors succeeds", r1.ok === true);

  const r2 = applyStartMission(scouted, 1, "rusty", "rescue", "n", "safe");
  check("rescue: rejected on a sector with no survivors", r2.ok === false);

  const r3 = applyStartMission(baseInput, 1, "rusty", "rescue", "e", "safe");
  check("rescue: rejected on an unscouted sector", r3.ok === false);

  const r4 = applyStartMission(scouted, 1, "rusty", "rescue", "nw", "safe");
  check("rescue: rejected on an uncleared sector with enemies", r4.ok === false);

  const nwCleared = { ...scouted, sectorsCleared: { nw: true } };
  const r5 = applyStartMission(nwCleared, 1, "rusty", "rescue", "nw", "safe");
  check("rescue: succeeds once a sector's enemies are cleared", r5.ok === true);

  const alreadyRescued = { ...scouted, sectorsRescued: { e: true } };
  const r6 = applyStartMission(alreadyRescued, 1, "rusty", "rescue", "e", "safe");
  check("rescue: rejected on an already-rescued sector", r6.ok === false);

  const noKitchen = { ...scouted, kitchenLevel: 0 };
  const r7 = applyStartMission(noKitchen, 1, "rusty", "rescue", "e", "safe");
  check("rescue: rejected when Kitchen/Water Still gate isn't open", r7.ok === false);

  const noRoom = { ...scouted, barracksLevel: 0, population: 2 }; // cap = 2, already full
  const r8 = applyStartMission(noRoom, 1, "rusty", "rescue", "e", "safe");
  check("rescue: rejected when Barracks has no room for the group", r8.ok === false);
}

// ---- applyCollectMission ----
{
  const sectors = initialSectorStatuses();
  const notReadyMission = { id: 1, botId: "rusty", type: "scout" as const, danger: "safe" as const, sectorId: "n", startedAt: 0, endsAt: Date.now() + 999999, reward: { credits: 100 }, mishap: false, bonusCore: false };
  const input1 = { activeMissions: [notReadyMission], resources: { metal: 0, stone: 0, wood: 0, water: 0 }, credits: 0, cores: 0, population: 2, botDamagedUntil: {}, sectors, sectorsCleared: {}, sectorsRescued: {}, missionsCompleted: 0, workshopLevel: 0, barracksLevel: 3 };
  const r1 = applyCollectMission(input1, 1);
  check("collect: not-ready mission is a silent no-op", r1.ok === false && r1.message === "");

  const readyMission = { ...notReadyMission, endsAt: Date.now() - 1000 };
  const input2 = { ...input1, activeMissions: [readyMission] };
  const r2 = applyCollectMission(input2, 1);
  check("collect: ready mission succeeds", r2.ok === true);
  check("collect: credits reward applied", r2.credits === 100);
  check("collect: mission removed from active list", r2.activeMissions.length === 0);
  check("collect: missionsCompleted incremented", r2.missionsCompleted === 1);

  const scoutReveal = { ...readyMission, type: "scout" as const, sectorId: "nw" }; // nw starts locked
  const input3 = { ...input1, activeMissions: [scoutReveal], sectors: initialSectorStatuses() };
  const r3 = applyCollectMission(input3, 1);
  check("collect: scout of unscouted sector reveals it", r3.sectors.nw === "scouted" || r3.sectors.nw === "reachable");

  const mishapMission = { ...readyMission, mishap: true, danger: "risky" as const };
  const input4 = { ...input1, activeMissions: [mishapMission] };
  const r4 = applyCollectMission(input4, 1);
  check("collect: mishap sets bot damaged", (r4.botDamagedUntil["rusty"] ?? 0) > Date.now());
  check("collect: mishap toast is bad tone", r4.tone === "bad");

  const clearSuccess = { ...readyMission, type: "clear" as const, sectorId: "n", mishap: false };
  const input5 = { ...input1, activeMissions: [clearSuccess] };
  const r5 = applyCollectMission(input5, 1);
  check("collect: successful clear marks the sector cleared", r5.sectorsCleared.n === true);
  check("collect: successful clear is a good-tone message", r5.tone === "good");

  const clearMishap = { ...readyMission, type: "clear" as const, sectorId: "n", mishap: true };
  const input6 = { ...input1, activeMissions: [clearMishap] };
  const r6 = applyCollectMission(input6, 1);
  check("collect: failed clear does NOT mark the sector cleared", r6.sectorsCleared.n !== true);
  check("collect: failed clear still damages the bot", (r6.botDamagedUntil["rusty"] ?? 0) > Date.now());

  // e (Flooded Channels) has survivorCount 2
  const rescueSuccess = { ...readyMission, type: "rescue" as const, sectorId: "e", mishap: false, reward: { population: 2 } };
  const input7 = { ...input1, activeMissions: [rescueSuccess], population: 2 };
  const r7 = applyCollectMission(input7, 1);
  check("collect: successful rescue marks the sector rescued", r7.sectorsRescued.e === true);
  check("collect: successful rescue increases population", r7.population === 4);
  check("collect: successful rescue is a good-tone message", r7.tone === "good");

  const rescueOverCap = { ...input1, activeMissions: [rescueSuccess], population: 12, barracksLevel: 0 }; // cap 2
  const r8 = applyCollectMission(rescueOverCap, 1);
  check("collect: rescue population is clamped to Barracks capacity", r8.population === 2);

  const rescueMishap = { ...readyMission, type: "rescue" as const, sectorId: "e", mishap: true, reward: {} };
  const input9 = { ...input1, activeMissions: [rescueMishap], population: 2 };
  const r9 = applyCollectMission(input9, 1);
  check("collect: failed rescue does NOT mark the sector rescued", r9.sectorsRescued.e !== true);
  check("collect: failed rescue does NOT change population", r9.population === 2);
  check("collect: failed rescue still damages the bot", (r9.botDamagedUntil["rusty"] ?? 0) > Date.now());
}

// ---- applyRepairBot ----
{
  const r1 = applyRepairBot({ botDamagedUntil: {}, credits: 1000 }, "rusty");
  check("repair: undamaged bot is a silent no-op", r1.ok === false && r1.message === "");

  const damagedUntil = Date.now() + 60_000;
  const r2 = applyRepairBot({ botDamagedUntil: { rusty: damagedUntil }, credits: 0 }, "rusty");
  check("repair: insufficient credits fails with message", r2.ok === false && r2.message.length > 0);

  const r3 = applyRepairBot({ botDamagedUntil: { rusty: damagedUntil }, credits: 100000 }, "rusty");
  check("repair: enough credits succeeds", r3.ok === true);
  check("repair: bot damage cleared", r3.botDamagedUntil.rusty === 0);
}

// ---- deriveDayCount ----
{
  const start = 1_700_000_000_000;
  const r1 = deriveDayCount(start, start);
  check("deriveDayCount: day 1 at the moment a save begins", r1 === 1);

  const r2 = deriveDayCount(start, start + DAY_MS - 1);
  check("deriveDayCount: still day 1 right up until a full day has passed", r2 === 1);

  const r3 = deriveDayCount(start, start + DAY_MS);
  check("deriveDayCount: rolls over to day 2 exactly one day later", r3 === 2);

  const r4 = deriveDayCount(start, start + 5 * DAY_MS + 1000);
  check("deriveDayCount: counts multiple elapsed days correctly", r4 === 6);

  const r5 = deriveDayCount(start, start - 999_999);
  check("deriveDayCount: never reports less than day 1, even given a clock oddity", r5 === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
