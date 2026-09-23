import { useState } from "react";
import { BaseScreen } from "./components/BaseScreen";
import { CrewPanel } from "./components/CrewPanel";
import { MapIcon } from "./components/map/MapIcon";
import { MapMode } from "./components/map/MapMode";
import { LoadingScreen } from "./components/LoadingScreen";
import { SettingsModal } from "./components/SettingsModal";
import { TopBar } from "./components/TopBar";
import { SettlementBadge } from "./components/SettlementBadge";
import { APP_SIDEBAR_CLEARANCE_CLASS, APP_SIDEBAR_WIDTH_PX, APP_TOPBAR_CLEARANCE_CLASS } from "./engine/hud/layout";
import { OverlayPanel } from "./engine/hud/OverlayPanel";
import { ToastStack } from "./engine/notifications/ToastStack";
import type { IconName } from "./game/map/icons";
import { useGame } from "./game/useGame";

type Section = "base" | "map" | "crew";

// Icons here are the same sprite icons used everywhere else (see
// game/map/icons.ts) — "map"/"robot" were prepared specifically for a nav
// menu like this one, not picked freely, so they're used as given rather
// than substituted with arbitrary emoji.
const SECTIONS: { id: Section; label: string; icon: IconName }[] = [
  { id: "base", label: "Base", icon: "home" },
  { id: "map", label: "Junkyard", icon: "map" },
  { id: "crew", label: "Crew", icon: "robot" },
];

export default function App() {
  const game = useGame();
  const [booted, setBooted] = useState(false);
  const [section, setSection] = useState<Section>("base");
  const [navOpen, setNavOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!booted) return <LoadingScreen onPlay={() => setBooted(true)} />;

  const big = game.state.settings.bigText;

  function selectSection(s: Section) {
    setSection(s);
    setNavOpen(false);
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${big ? "text-[17px]" : ""}`}>
      <img
        src="/images/bg-city.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />

      {/* Content fills the ENTIRE viewport for every section — one layout
          model, not a special case for the map alone. TopBar and the nav
          below both FLOAT on top (fixed/absolute, out of normal flow)
          instead of reserving their own row/column, which is what makes
          this possible: nothing here shrinks to make room for chrome. Base
          now has its own full-bleed scene (CampScene) so it gets the exact
          same treatment as Map — no outer padding wrapper, full inset-0,
          clearance handled internally (see BaseScreen's own use of
          APP_TOPBAR_CLEARANCE_CLASS) — an outer padding wrapper here was
          exactly what left a gap around the scene revealing the app's own
          background through it. Crew is still a plain scrollable card list
          with no art of its own, so it keeps the simple padding treatment. */}
      <div className="absolute inset-0">
        {section === "base" && <BaseScreen game={game} />}
        {section === "map" && <MapMode game={game} />}
        {section === "crew" && (
          <div className={`h-full overflow-hidden px-2 pb-2 sm:px-4 ${APP_SIDEBAR_CLEARANCE_CLASS} ${APP_TOPBAR_CLEARANCE_CLASS}`}>
            <CrewPanel game={game} />
          </div>
        )}
      </div>

      {/* App chrome: floats on top, never reserves space. TopBar gets its
          own left clearance on wide screens so its currency cluster doesn't
          render underneath the persistent nav sidebar. */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-30 ${APP_SIDEBAR_CLEARANCE_CLASS}`}>
        <div className="pointer-events-auto">
          <TopBar game={game} onSettings={() => setShowSettings(true)} onMenu={() => setNavOpen(true)} />
        </div>
      </div>

      <OverlayPanel open={navOpen} onClose={() => setNavOpen(false)} side="left" widthPx={APP_SIDEBAR_WIDTH_PX}>
        <nav className="flex h-full flex-col gap-1 bg-gradient-to-r from-black/75 via-black/55 to-transparent p-3 lg:from-black/60 lg:via-black/35">
          {/* Settlement identity leads the sidebar column directly — it is
              part of this nav panel, not a separate top-bar element sitting
              beside it. Getting this relationship backwards (identity in
              the top bar, offset right to clear the sidebar) was the exact,
              specific complaint that triggered this rewrite: the reference
              has one left-hand column, not two unrelated floating pieces
              that happen to be near each other. */}
          <SettlementBadge game={game} className="mb-3 flex min-w-0 items-center gap-2" />
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => selectSection(s.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left font-display text-[22px] transition-colors ${
                  active ? "bg-amber-400/20 text-amber-100" : "text-white/75 hover:bg-white/5"
                }`}
              >
                <div
                  className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-lg ${
                    active ? "bg-black/40" : "bg-black/25"
                  }`}
                >
                  <MapIcon name={s.icon} size={40} />
                </div>
                {s.label}
              </button>
            );
          })}
        </nav>
      </OverlayPanel>

      {/* toasts — the engine owns layout/stacking, we supply the theme */}
      <ToastStack
        toasts={game.toasts}
        toneClassName={(tone) =>
          `animate-popin panel-dark px-4 py-1.5 font-display text-base ${
            tone === "good" ? "text-lime-300" : tone === "bad" ? "text-red-300" : "text-amber-200"
          }`
        }
      />

      {showSettings && <SettingsModal game={game} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
