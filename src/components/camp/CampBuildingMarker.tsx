import { cn } from "../../utils/cn";
import type { BuildingDef } from "../../game/buildings";

export function CampBuildingMarker({
  def,
  level,
  color,
  selected,
  affordable,
}: {
  def: BuildingDef;
  level: number;
  color: string;
  selected: boolean;
  affordable: boolean;
}) {
  const built = level > 0;
  const maxed = level >= def.maxLevel;

  return (
    <div className="group flex flex-col items-center">
      {/* Name + level tag — same idea as the reference's floating building
          labels ("Жилые блоки Ур.2"): what it is, at a glance, before you
          click in. Unbuilt slots read as a site, not a building. */}
      <div
        className={cn(
          "mb-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold shadow-[0_2px_0_rgba(0,0,0,0.5)] sm:text-xs",
          built ? "border-black/50 bg-black/70 text-white" : "border-dashed border-white/40 bg-black/50 text-white/60",
        )}
      >
        {def.icon} {def.name} {built ? `· Lv ${level}` : "· Site"}
      </div>

      <div className="relative">
        <div
          className={cn(
            "grid place-items-center rounded-full text-xl transition-transform sm:text-2xl",
            "h-11 w-11 sm:h-14 sm:w-14",
            built ? "bg-black/55" : "bg-black/35 grayscale",
            selected && "scale-110",
          )}
          style={{
            border: `3px solid ${built ? color : "rgba(255,255,255,0.35)"}`,
            borderStyle: built ? "solid" : "dashed",
            boxShadow: selected
              ? `0 0 0 4px rgba(255,255,255,0.55), 0 0 16px ${color}`
              : built
                ? `0 0 10px ${color}66`
                : "none",
          }}
        >
          {def.icon}
        </div>

        {/* Build/upgrade corner badge — always present unless fully maxed,
            same on/off-afford color convention as the rest of the UI
            (btn-orange/btn-green when affordable, muted gray otherwise). */}
        {!maxed && (
          <div
            className={cn(
              "absolute -right-1 -bottom-1 grid h-5 w-5 place-items-center rounded-full border-2 border-black/60 text-[11px] font-black text-white shadow sm:h-6 sm:w-6",
              affordable ? (built ? "bg-lime-500" : "bg-orange-500") : "bg-white/25",
            )}
          >
            {built ? "↑" : "+"}
          </div>
        )}
      </div>
    </div>
  );
}
