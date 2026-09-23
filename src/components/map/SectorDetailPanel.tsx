import { RESOURCES } from "../../game/data";
import { DANGER_LEVELS, type DangerLevel } from "../../game/map/missions";
import {
  ENEMY_STRENGTH_LABELS,
  SECTORS,
  SECTOR_DANGER_TIERS,
  type SectorStatus,
  effectiveDangerTier,
} from "../../game/map/sectors";

export function SectorDetailPanel({
  sectorId,
  status,
  cleared,
  rescued,
  danger,
  onDangerChange,
}: {
  sectorId: string;
  status: SectorStatus;
  cleared: boolean;
  rescued: boolean;
  danger: DangerLevel;
  onDangerChange: (d: DangerLevel) => void;
}) {
  const def = SECTORS.find((s) => s.id === sectorId);
  if (!def) return null;
  const tier = SECTOR_DANGER_TIERS[effectiveDangerTier(def, cleared)];

  return (
    <div className="panel-dark px-3 py-2.5">
      {status === "reachable" && (
        <>
          <div className="font-display text-base text-white">❓ Unscouted sector</div>
          <p className="mt-0.5 text-xs font-bold text-white/55">
            Send a robot on a Scout Run to find out what's here. Scouting always carries some risk.
          </p>
        </>
      )}
      {status === "scouted" && (
        <>
          <div className="font-display text-base text-white">
            {def.icon} {def.name}{" "}
            <span className="text-xs font-extrabold text-white/50">· {tier.label}</span>
          </div>
          <p className="mt-0.5 text-xs font-bold text-white/55">{def.threatFlavor}</p>
          <p className="mt-1 text-xs font-extrabold text-lime-300">
            Rich in {RESOURCES.find((r) => r.key === def.materialBias)?.icon}{" "}
            {RESOURCES.find((r) => r.key === def.materialBias)?.name}
          </p>
          <p className="mt-0.5 text-xs font-extrabold">
            {cleared ? (
              <span className="text-cyan-300">⚔️ Enemies: Cleared</span>
            ) : def.enemyStrength > 0 ? (
              <span className="text-red-300">
                ⚔️ Enemies: {ENEMY_STRENGTH_LABELS[def.enemyStrength]} ({def.enemyName})
              </span>
            ) : (
              <span className="text-white/40">⚔️ No enemies detected</span>
            )}
          </p>
          {def.survivorCount > 0 && (
            <p className="mt-0.5 text-xs font-extrabold">
              {rescued ? (
                <span className="text-cyan-300">🏠 Survivors: Brought home</span>
              ) : def.enemyStrength > 0 && !cleared ? (
                <span className="text-amber-300">
                  🏠 Survivors: {def.survivorCount} detected — clear the enemies here first
                </span>
              ) : (
                <span className="text-lime-300">🏠 Survivors: {def.survivorCount} — ready for rescue</span>
              )}
            </p>
          )}
        </>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] font-extrabold tracking-wide text-amber-100/70">
          RUN DIFFICULTY
        </span>
        <div className="flex gap-1">
          {DANGER_LEVELS.map((d) => (
            <button
              key={d.level}
              onClick={() => onDangerChange(d.level)}
              className={`chip px-2 py-1 text-[11px] font-extrabold ${
                danger === d.level ? "ring-2 ring-white/70" : "opacity-60"
              }`}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
