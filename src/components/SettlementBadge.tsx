import { CITY_TIERS, deriveDayCount } from "../game/data";
import { MapIcon } from "./map/MapIcon";
import type { GameApi } from "../game/useGame";

export function SettlementBadge({ game, className }: { game: GameApi; className?: string }) {
  const { state } = game;
  const tier = CITY_TIERS[Math.min(state.tier, CITY_TIERS.length - 1)];
  const day = deriveDayCount(state.startedAt, Date.now());

  return (
    <div className={className ?? "flex min-w-0 items-center gap-2"}>
      <div className="panel-dark grid h-11 w-11 shrink-0 place-items-center rounded-xl">
        <MapIcon name="home" size={22} />
      </div>
      <div className="panel-dark min-w-0 px-3 py-1.5">
        <div className="truncate font-display text-sm text-amber-100 sm:text-base">{tier.name}</div>
        <div className="text-[11px] font-bold text-white/50">Day {day}</div>
      </div>
    </div>
  );
}
