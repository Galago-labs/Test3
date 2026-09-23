import { BOTS, RESOURCES, botCost } from "../game/data";
import { fmt } from "../engine/format";
import type { GameApi } from "../game/useGame";
import { WoodTitle } from "./Ui";

export function CrewPanel({ game }: { game: GameApi }) {
  const { state, actions } = game;
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex justify-center">
        <WoodTitle
          title="Robot Crew"
          subtitle="Hire & upgrade your salvage bots"
          icon={<span className="text-xl">🤖</span>}
        />
      </div>
      <div className="panel-stone min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {BOTS.map((def) => {
          const lvl = state.bots[def.id] ?? 0;
          const cost = botCost(def, lvl);
          const afford = state.credits >= cost;
          const targetName =
            def.target === "all"
              ? "ALL RESOURCES"
              : RESOURCES.find((r) => r.key === def.target)!.name.toUpperCase();
          return (
            <div
              key={def.id}
              className="panel-dark flex flex-wrap items-center gap-3 px-3 py-2.5"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-amber-700/70 bg-amber-100">
                <img
                  src="/images/robot.png"
                  alt=""
                  className={`h-full w-full scale-110 object-cover ${lvl === 0 ? "grayscale" : ""}`}
                />
                <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1 text-[10px] font-black text-cyan-300">
                  {lvl > 0 ? `Mk.${lvl}` : "—"}
                </span>
              </div>
              <div className="min-w-[140px] flex-1">
                <div className="font-display text-lg leading-tight text-white">
                  {def.icon} {def.name}
                </div>
                <div className="text-xs font-bold text-white/55">{def.role}</div>
                <div className="text-xs font-extrabold text-lime-300">
                  🎯 Specialist: {targetName}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-bold text-cyan-200/90">
                  <span>🧲 Scavenging {def.scavenging}</span>
                  <span>🔭 Scouting {def.scouting}</span>
                  <span>⚔️ Combat {def.combat}</span>
                  <span>🏠 Rescue {def.rescue}</span>
                </div>
              </div>
              <div className="chip flex items-center gap-1 px-2 py-1">
                <span>💰</span>
                <span
                  className={`text-sm font-extrabold ${afford ? "text-amber-300" : "text-red-400"}`}
                >
                  {fmt(cost)}
                </span>
              </div>
              <button
                disabled={!afford}
                onClick={() => actions.hireBot(def.id)}
                className={`btn ${afford ? (lvl === 0 ? "btn-orange" : "btn-green") : "btn-gray"} min-w-[110px] text-sm`}
              >
                {lvl === 0 ? "Activate" : "Upgrade"}
              </button>
            </div>
          );
        })}
        <div className="panel-dark px-3 py-2 text-center text-xs font-bold text-white/55">
          Only hired robots can be sent out from the Junkyard. A robot's specialty gives a bonus
          when scavenging a sector rich in that material.
        </div>
      </div>
    </div>
  );
}
