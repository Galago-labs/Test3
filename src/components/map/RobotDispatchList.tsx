import { RESOURCES, type ResKey } from "../../game/data";
import { fmt, fmtTime } from "../../engine/format";
import {
  DANGER_LEVELS,
  MISSION_TYPES,
  type DangerLevel,
  type MissionType,
  effectiveCombatMishapChance,
  effectiveMishapChance,
  effectiveRescueMishapChance,
  previewClearReward,
  previewRescueReward,
  previewScavengeReward,
  previewScoutReward,
} from "../../game/map/missions";
import { SECTORS, SECTOR_DANGER_TIERS, type SectorStatus, effectiveDangerTier } from "../../game/map/sectors";
import type { MapRobot } from "../../game/map/useMapController";

function scavengePreviewLabel(
  robot: MapRobot,
  tierMult: number,
  materialBias: ResKey,
  sectorRewardMult: number,
  dangerRewardMult: number,
): string {
  const reward = previewScavengeReward(robot, robot.level, tierMult, materialBias, sectorRewardMult);
  return Object.entries(reward)
    .map(([k, v]) => {
      const r = RESOURCES.find((x) => x.key === k)!;
      return `+${fmt(Math.floor((v as number) * dangerRewardMult))} ${r.icon}`;
    })
    .join(" ");
}

export function RobotDispatchList({
  robots,
  sectorId,
  sectorStatus,
  sectorCleared,
  sectorRescued,
  rescueGateOpen,
  population,
  populationCap,
  danger,
  tierMult,
  energy,
  now,
  onStartMission,
  onRepairBot,
}: {
  robots: MapRobot[];
  sectorId: string | null;
  sectorStatus: SectorStatus | null;
  sectorCleared: boolean;
  sectorRescued: boolean;
  rescueGateOpen: boolean;
  population: number;
  populationCap: number;
  danger: DangerLevel;
  tierMult: number;
  energy: number;
  now: number;
  onStartMission: (botId: string, type: MissionType, sectorId: string, danger: DangerLevel) => void;
  onRepairBot: (botId: string) => void;
}) {
  const dangerDef = DANGER_LEVELS.find((d) => d.level === danger)!;
  const sectorDef = sectorId ? (SECTORS.find((s) => s.id === sectorId) ?? null) : null;
  const canScavenge = sectorStatus === "scouted";
  const canClear = sectorStatus === "scouted" && !!sectorDef && sectorDef.enemyStrength > 0 && !sectorCleared;
  const clearDef = MISSION_TYPES.find((m) => m.type === "clear")!;
  const rescueDef = MISSION_TYPES.find((m) => m.type === "rescue")!;

  const hasSurvivors = sectorStatus === "scouted" && !!sectorDef && sectorDef.survivorCount > 0;
  const enemiesBlockRescue = !!sectorDef && sectorDef.enemyStrength > 0 && !sectorCleared;
  const roomAvailable = !!sectorDef && population + sectorDef.survivorCount <= populationCap;
  const canRescue =
    hasSurvivors && !sectorRescued && !enemiesBlockRescue && rescueGateOpen && roomAvailable;
  // Rescue is otherwise ready but blocked by one specific thing — worth
  // telling the player which, rather than just hiding the button.
  const rescueBlockedReason =
    hasSurvivors && !sectorRescued
      ? enemiesBlockRescue
        ? "Clear this sector's enemies first"
        : !rescueGateOpen
          ? "Build a Kitchen and Water Still first"
          : !roomAvailable
            ? "Not enough room — upgrade the Barracks"
            : null
      : null;

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-extrabold tracking-wide text-amber-100/80">SEND A ROBOT</div>

      {robots.length === 0 && (
        <div className="panel-dark px-3 py-4 text-center text-sm font-bold text-white/60">
          You haven't hired any robots yet — head to the Crew tab first.
        </div>
      )}

      {robots.length > 0 && !sectorDef && (
        <div className="panel-dark px-3 py-4 text-center text-sm font-bold text-white/60">
          Tap a sector on the map above.
        </div>
      )}

      {sectorDef &&
        robots.map((robot) => {
          const selectedTier = SECTOR_DANGER_TIERS[effectiveDangerTier(sectorDef, sectorCleared)];
          const damaged = robot.damagedUntil > now;
          const scavengeLabel = canScavenge
            ? scavengePreviewLabel(
                robot,
                tierMult,
                sectorDef.materialBias,
                selectedTier.rewardMult,
                dangerDef.rewardMult,
              )
            : "";
          const scout = previewScoutReward(robot, robot.level, tierMult, selectedTier.rewardMult);
          const scavengeRisk = Math.round(
            effectiveMishapChance(robot, robot.level, "scavenging", dangerDef, selectedTier.mishapBonus) *
              100,
          );
          const scoutRisk = Math.round(
            effectiveMishapChance(robot, robot.level, "scouting", dangerDef, selectedTier.mishapBonus) *
              100,
          );
          const clear = canClear ? previewClearReward(robot, robot.level, tierMult, sectorDef.enemyStrength) : null;
          const clearRisk = canClear
            ? Math.round(effectiveCombatMishapChance(robot, robot.level, sectorDef.enemyStrength) * 100)
            : 0;
          const rescue = canRescue ? previewRescueReward(sectorDef.survivorCount) : null;
          const rescueRisk = canRescue
            ? Math.round(effectiveRescueMishapChance(robot, robot.level, selectedTier.mishapBonus) * 100)
            : 0;
          const repairCost = Math.ceil((robot.damagedUntil - now) / 1000) * 2;

          return (
            <div key={robot.id} className="panel-dark flex flex-wrap items-center gap-3 px-3 py-2.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-black/50 text-2xl">
                {damaged ? "🔧" : robot.icon}
              </div>
              <div className="min-w-[110px] flex-1">
                <div className="font-display text-base leading-tight text-white">{robot.name}</div>
                <div className="text-xs font-bold text-white/55">{robot.role}</div>
              </div>

              {damaged ? (
                <div className="flex items-center gap-1.5">
                  <div className="chip px-3 py-1.5 text-xs font-extrabold text-orange-300">
                    Repairs · {fmtTime(robot.damagedUntil - now)}
                  </div>
                  <button onClick={() => onRepairBot(robot.id)} className="btn btn-blue px-2.5 py-1.5 text-xs">
                    Rush · {repairCost} 💰
                  </button>
                </div>
              ) : robot.busy ? (
                <div className="chip px-3 py-1.5 text-xs font-extrabold text-white/50">
                  Out on a mission
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {canScavenge && (
                    <button
                      onClick={() => onStartMission(robot.id, "scavenge", sectorDef.id, danger)}
                      disabled={energy < MISSION_TYPES[0].energyCost}
                      className="btn btn-orange flex flex-col items-center px-2.5 py-1.5 leading-tight"
                    >
                      <span className="text-xs">🧲 Scavenge · {MISSION_TYPES[0].energyCost}⚡</span>
                      <span className="text-[10px] font-bold text-white/85">{scavengeLabel}</span>
                      {scavengeRisk > 0 && (
                        <span className="text-[10px] font-extrabold text-red-200">
                          ⚠ {scavengeRisk}% risk
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onStartMission(robot.id, "scout", sectorDef.id, danger)}
                    disabled={energy < MISSION_TYPES[1].energyCost}
                    className="btn btn-blue flex flex-col items-center px-2.5 py-1.5 leading-tight"
                  >
                    <span className="text-xs">
                      🔭 {sectorStatus === "scouted" ? "Scout" : "Scout & Reveal"} ·{" "}
                      {MISSION_TYPES[1].energyCost}⚡
                    </span>
                    <span className="text-[10px] font-bold text-white/85">
                      +{fmt(Math.floor(scout.credits * dangerDef.rewardMult))} 💰 ·{" "}
                      {Math.round(scout.coreChance * 100)}% 🔷
                    </span>
                    {scoutRisk > 0 && (
                      <span className="text-[10px] font-extrabold text-red-200">
                        ⚠ {scoutRisk}% risk
                      </span>
                    )}
                  </button>
                  {canClear && clear && (
                    <button
                      onClick={() => onStartMission(robot.id, "clear", sectorDef.id, "safe")}
                      disabled={energy < clearDef.energyCost}
                      className="btn btn-red flex flex-col items-center px-2.5 py-1.5 leading-tight"
                    >
                      <span className="text-xs">⚔️ Clear · {clearDef.energyCost}⚡</span>
                      <span className="text-[10px] font-bold text-white/85">+{fmt(clear.credits)} 💰</span>
                      <span className="text-[10px] font-extrabold text-red-200">⚠ {clearRisk}% risk</span>
                    </button>
                  )}
                  {canRescue && rescue && (
                    <button
                      onClick={() => onStartMission(robot.id, "rescue", sectorDef.id, "safe")}
                      disabled={energy < rescueDef.energyCost}
                      className="btn btn-green flex flex-col items-center px-2.5 py-1.5 leading-tight"
                    >
                      <span className="text-xs">🏠 Rescue · {rescueDef.energyCost}⚡</span>
                      <span className="text-[10px] font-bold text-white/85">
                        +{rescue.population} 👥
                      </span>
                      <span className="text-[10px] font-extrabold text-red-200">⚠ {rescueRisk}% risk</span>
                    </button>
                  )}
                  {rescueBlockedReason && !canRescue && (
                    <div className="chip flex flex-col items-center px-2.5 py-1.5 leading-tight text-center">
                      <span className="text-xs text-white/50">🏠 Rescue</span>
                      <span className="text-[10px] font-bold text-amber-200/80">{rescueBlockedReason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
