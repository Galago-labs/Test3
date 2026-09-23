import { useState } from "react";
import { CITY_TIERS } from "../game/data";
import {
  BUILDINGS,
  type BuildingKey,
  populationCapacity,
  sustainReady,
  workshopDiscount,
} from "../game/buildings";
import { OBJECTIVES, type ObjectiveContext } from "../game/objectives";
import type { GameApi } from "../game/useGame";
import { APP_TOPBAR_CLEARANCE_CLASS } from "../engine/hud/layout";
import { ResponsiveDrawer } from "../engine/hud/ResponsiveDrawer";
import { CampScene } from "./camp/CampScene";
import { CampBuildingPanel } from "./camp/CampBuildingPanel";
import { Bar, WoodTitle } from "./Ui";

// Same drawer sizing family as MapMode — peek shows just enough to reveal
// there's more below without hiding much of the scene, sized a bit smaller
// than the map's since the camp's content is shorter.
const DRAWER_PEEK_PX = 200;
const DRAWER_EXPANDED_PX = 480;
const DRAWER_SIDEBAR_PX = 380;

export function BaseScreen({ game }: { game: GameApi }) {
  const { state, actions } = game;
  const [selected, setSelected] = useState<BuildingKey | null>(null);

  const tier = CITY_TIERS[Math.min(state.tier, CITY_TIERS.length - 1)];
  const cap = populationCapacity(state.buildings.barracks);
  const ready = sustainReady(state.buildings.kitchen, state.buildings.waterStill);
  const discount = workshopDiscount(state.buildings.workshop);

  const objectiveCtx: ObjectiveContext = {
    botsOwned: Object.keys(state.bots).filter((id) => (state.bots[id] ?? 0) > 0).length,
    missionsCompleted: state.missionsCompleted,
    buildings: state.buildings,
    population: state.population,
    tier: state.tier,
  };
  const doneCount = OBJECTIVES.filter((o) => o.isDone(objectiveCtx)).length;
  const nextObjectives = OBJECTIVES.filter((o) => !o.isDone(objectiveCtx)).slice(0, 3);

  return (
    <div className="relative h-full w-full bg-[#120f0c]">
      {/* The camp itself: full section, edge to edge, same "everything else
          is an independent floating layer on top" rule as MapMode/HexMap —
          see DESIGN.md Section 8. */}
      <div className="absolute inset-0 overflow-hidden">
        <CampScene
          buildings={state.buildings}
          resources={state.resources}
          discount={discount}
          selected={selected}
          onSelect={(key) => setSelected((cur) => (cur === key ? null : key))}
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center pb-1.5 ${APP_TOPBAR_CLEARANCE_CLASS}`}
      >
        <div className="pointer-events-auto">
          <WoodTitle title={tier.name} subtitle="Your base" icon={<span className="text-xl">🏕️</span>} />
        </div>
      </div>

      <ResponsiveDrawer peekHeight={DRAWER_PEEK_PX} expandedHeight={DRAWER_EXPANDED_PX} sidebarWidth={DRAWER_SIDEBAR_PX}>
        <div className="flex flex-col gap-3">
          {/* Population + objectives: always visible, camp-wide status —
              same role MissionQueue plays at the top of the map's drawer. */}
          <div className="panel-dark px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-white">
                👥 {Math.floor(state.population)} / {cap} survivors
              </span>
              <span className="text-xs font-extrabold text-white/55">
                {ready ? "rescue-ready" : "gate closed"}
              </span>
            </div>
            <Bar value={state.population} max={cap} className="mt-1.5 h-3.5" from="#8ef0ff" to="#2b93de" />
            {!ready && (
              <p className="mt-1.5 text-xs font-bold text-amber-200/80">
                Build a Kitchen and a Water Still before Rescue missions can bring anyone home.
              </p>
            )}
          </div>

          {doneCount < OBJECTIVES.length && (
            <div className="panel-dark px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wide text-amber-100/80">WHAT'S NEXT</span>
                <span className="text-xs font-extrabold text-white/50">
                  {doneCount}/{OBJECTIVES.length}
                </span>
              </div>
              <div className="space-y-1">
                {nextObjectives.map((o) => (
                  <div key={o.id} className="flex items-center gap-2 text-sm font-bold text-white/85">
                    <span className="text-white/30">☐</span>
                    <span>{o.icon}</span>
                    <span>{o.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected-building detail — same role SectorDetailPanel plays on
              the map: only shown once something on the scene is picked. */}
          {selected ? (
            <CampBuildingPanel
              def={BUILDINGS.find((b) => b.key === selected)!}
              level={state.buildings[selected] ?? 0}
              resources={state.resources}
              discount={discount}
              onBuildOrUpgrade={() => actions.buildOrUpgrade(selected)}
            />
          ) : (
            <div className="panel-dark px-3 py-3 text-center text-xs font-bold text-white/45">
              Tap a building on the camp to inspect and build or upgrade it.
            </div>
          )}
        </div>
      </ResponsiveDrawer>
    </div>
  );
}
