import { RESOURCES, type ResKey } from "../../game/data";
import { fmt } from "../../engine/format";
import { type BuildingDef, buildingCost, populationCapacity, workshopDiscount } from "../../game/buildings";
import { CostChip } from "../Ui";

function effectLine(def: BuildingDef, level: number, nextLevel: number): string {
  switch (def.key) {
    case "barracks":
      return `Houses ${populationCapacity(level)} → ${populationCapacity(nextLevel)} survivors`;
    case "kitchen":
    case "waterStill":
      return level === 0
        ? "Not built — Rescue missions can't bring anyone home yet"
        : "Built — Rescue missions can bring survivors home";
    case "workshop":
      return `${Math.round(workshopDiscount(level) * 100)}% → ${Math.round(
        workshopDiscount(nextLevel) * 100,
      )}% cheaper builds`;
  }
}

export function CampBuildingPanel({
  def,
  level,
  resources,
  discount,
  onBuildOrUpgrade,
}: {
  def: BuildingDef;
  level: number;
  resources: Record<ResKey, number>;
  discount: number;
  onBuildOrUpgrade: () => void;
}) {
  const maxed = level >= def.maxLevel;
  const cost = maxed ? null : buildingCost(def, level, discount);
  const afford = cost && Object.entries(cost).every(([k, v]) => resources[k as ResKey] >= (v as number));

  return (
    <div className="panel-dark px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-black/50 text-2xl">
          {def.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-tight text-white">
            {def.name} {level > 0 && <span className="text-cyan-200">· Lv {level}</span>}
          </div>
          <div className="text-xs font-bold text-white/55">{def.tagline}</div>
        </div>
      </div>

      {!maxed && (
        <div className="mt-2 text-xs font-extrabold text-lime-300">{effectLine(def, level, level + 1)}</div>
      )}

      {cost && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {Object.entries(cost).map(([k, v]) => {
            const r = RESOURCES.find((x) => x.key === k)!;
            return (
              <CostChip
                key={k}
                icon={r.icon}
                value={fmt(v as number)}
                ok={resources[k as ResKey] >= (v as number)}
              />
            );
          })}
        </div>
      )}

      <button
        disabled={maxed || !afford}
        onClick={onBuildOrUpgrade}
        className={`btn mt-2.5 w-full ${
          maxed ? "btn-gray" : afford ? (level === 0 ? "btn-orange" : "btn-green") : "btn-gray"
        }`}
      >
        {maxed ? "Maxed" : level === 0 ? "Build" : "Upgrade"}
      </button>
    </div>
  );
}
