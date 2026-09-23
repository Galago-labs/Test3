import { RESOURCES } from "../game/data";
import { populationCapacity } from "../game/buildings";
import { fmt } from "../engine/format";
import type { GameApi } from "../game/useGame";
import { SettlementBadge } from "./SettlementBadge";

export function TopBar({
  game,
  onSettings,
  onMenu,
}: {
  game: GameApi;
  onSettings: () => void;
  onMenu?: () => void;
}) {
  const { state } = game;
  const cap = populationCapacity(state.buildings.barracks);

  const resourceRow = (
    <div className="panel-dark flex max-w-full items-center gap-3 overflow-x-auto px-3 py-1.5 sm:gap-4">
      {RESOURCES.map((r) => (
        <Currency key={r.key} icon={r.icon} value={fmt(state.resources[r.key])} label={r.name} />
      ))}
      <div className="h-7 w-px shrink-0 bg-white/15" />
      <Currency icon="💰" value={fmt(state.credits)} label="credits" />
      <div className="h-7 w-px shrink-0 bg-white/15" />
      <Currency icon="🔷" value={fmt(state.cores)} label="cores" />
    </div>
  );

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3">
      <div className="flex items-start justify-between gap-2">
        {/* Left: menu button + settlement name/day, mobile only — on ≥lg
            the settlement badge leads the persistent sidebar instead (see
            App.tsx), not this bar; duplicating it here would put identity
            in two different places on the one screen where it's not needed
            in either. */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {onMenu && (
            <button
              onClick={onMenu}
              className="btn btn-gray grid h-11 w-11 shrink-0 place-items-center text-xl"
              title="Menu"
            >
              ☰
            </button>
          )}
          <SettlementBadge game={game} />
        </div>

        {/* Middle: every stockpiled currency at once — the 4 raw materials
            plus credits and cores. On a narrow phone there just isn't room
            for this alongside the settlement pill and the buttons on the
            right, so it drops to its own row below instead (still every
            currency, still one tap away, just not fighting for the same
            row) — shown here only from `sm` up. Content-width, not
            stretched to fill the row: the reference's currency pill hugs
            its own content with a real gap before the population/settings
            cluster, not a bar spanning the full remaining width. */}
        <div className="hidden min-w-0 sm:block">{resourceRow}</div>

        {/* Right: population, settings. */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="panel-dark flex items-center gap-1.5 px-3 py-1.5" title="Survivors">
            <span className="text-lg leading-none">👥</span>
            <span className="font-display text-base text-amber-100">
              {Math.floor(state.population)}/{cap}
            </span>
          </div>
          <button
            onClick={onSettings}
            className="btn btn-gray grid h-11 w-11 shrink-0 place-items-center text-xl"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Same resource row, mobile-only second line. */}
      <div className="sm:hidden">{resourceRow}</div>
    </div>
  );
}

function Currency({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5" title={label}>
      <span className="text-lg drop-shadow leading-none">{icon}</span>
      <span className="font-display text-lg text-amber-100 sm:text-xl">{value}</span>
    </div>
  );
}
