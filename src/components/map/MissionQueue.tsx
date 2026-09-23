import { BOTS } from "../../game/data";
import { fmtTime } from "../../engine/format";
import { MISSION_TYPES, type ActiveMission } from "../../game/map/missions";
import { SECTORS } from "../../game/map/sectors";

export function MissionQueue({
  missions,
  now,
  onCollect,
}: {
  missions: ActiveMission[];
  now: number;
  onCollect: (missionId: number) => void;
}) {
  if (missions.length === 0) return null;
  const sorted = [...missions].sort((a, b) => a.endsAt - b.endsAt);

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-extrabold tracking-wide text-amber-100/80">
        OUT IN THE FIELD
      </div>
      {sorted.map((m) => {
        const bot = BOTS.find((b) => b.id === m.botId)!;
        const def = MISSION_TYPES.find((x) => x.type === m.type)!;
        const sector = SECTORS.find((sec) => sec.id === m.sectorId);
        const ready = now >= m.endsAt;
        return (
          <div key={m.id} className="panel-dark flex flex-wrap items-center gap-3 px-3 py-2.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-black/50 text-2xl">
              {bot.icon}
            </div>
            <div className="min-w-[140px] flex-1">
              <div className="font-display text-base leading-tight text-white">{bot.name}</div>
              <div className="text-xs font-bold text-white/55">
                {def.icon} {def.name} · {sector?.icon} {sector?.name ?? "Unknown sector"}
              </div>
            </div>
            {ready ? (
              <button
                onClick={() => onCollect(m.id)}
                className="btn btn-green glow-gold px-4 py-2 text-sm"
              >
                Collect
              </button>
            ) : (
              <div className="chip px-3 py-1.5 font-display text-base text-amber-200">
                ⏱ {fmtTime(m.endsAt - now)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
