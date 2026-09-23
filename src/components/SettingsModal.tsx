import { useState } from "react";
import type { GameApi } from "../game/useGame";
import { Modal } from "./Modal";
import { WoodTitle } from "./Ui";

const TABS = [
  { id: "sound", label: "Sound", icon: "🔊" },
  { id: "controls", label: "Controls", icon: "🎮" },
  { id: "graphics", label: "Graphics", icon: "🖥️" },
  { id: "other", label: "Other", icon: "⚙️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsModal({ game, onClose }: { game: GameApi; onClose: () => void }) {
  const { state, actions } = game;
  const s = state.settings;
  const [tab, setTab] = useState<TabId>("sound");
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Modal onClose={onClose}>
      <div className="mb-[-14px] flex justify-center">
        <WoodTitle title="Settings" className="z-10" />
      </div>
      <div className="panel-stone p-4 pt-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn flex-1 px-2 py-1.5 text-sm ${tab === t.id ? "btn-orange" : "btn-gray"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[230px] space-y-4 px-1 py-2">
          {tab === "sound" && (
            <>
              <Slider
                label="Music"
                value={s.music}
                on={s.musicOn}
                onValue={(v) => actions.setSettings({ music: v })}
                onToggle={() => actions.setSettings({ musicOn: !s.musicOn })}
              />
              <Slider
                label="Sounds"
                value={s.sfx}
                on={s.sfxOn}
                onValue={(v) => actions.setSettings({ sfx: v })}
                onToggle={() => actions.setSettings({ sfxOn: !s.sfxOn })}
              />
            </>
          )}

          {tab === "controls" && (
            <>
              <Toggle
                label="Toggle Vibration"
                on={s.vibration}
                onClick={() => actions.setSettings({ vibration: !s.vibration })}
              />
              <Toggle
                label="Screen Shake"
                on={s.shake}
                onClick={() => actions.setSettings({ shake: !s.shake })}
              />
              <p className="text-sm font-bold text-white/50">
                Tip: robots must be hired in the Crew tab before you can send them out from the
                Junkyard.
              </p>
            </>
          )}

          {tab === "graphics" && (
            <>
              <Toggle
                label="Particles & Shine"
                on={s.particles}
                onClick={() => actions.setSettings({ particles: !s.particles })}
              />
              <Toggle
                label="Large Text"
                on={s.bigText}
                onClick={() => actions.setSettings({ bigText: !s.bigText })}
              />
            </>
          )}

          {tab === "other" && (
            <div className="space-y-2">
              <Stat label="Base tier" value={`${state.tier + 1}`} />
              <Stat label="Missions completed" value={`${state.missionsCompleted}`} />
              <Stat
                label="Sectors scouted"
                value={`${Object.values(state.sectors).filter((s) => s === "scouted").length}`}
              />
              <Stat
                label="Robots hired"
                value={`${(Object.values(state.bots) as number[]).filter((lvl) => lvl > 0).length}`}
              />
              {confirmReset ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      actions.reset();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="btn btn-red flex-1"
                  >
                    Yes, wipe save
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="btn btn-gray flex-1">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmReset(true)} className="btn btn-red w-full">
                  Reset progress
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-center">
          <button onClick={onClose} className="btn btn-orange px-12 py-3 font-display text-xl">
            CLOSE
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Slider({
  label,
  value,
  on,
  onValue,
  onToggle,
}: {
  label: string;
  value: number;
  on: boolean;
  onValue: (v: number) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <div className="mb-1 font-display text-lg text-white">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => onValue(Number(e.target.value))}
          className="h-4 flex-1 cursor-pointer appearance-none rounded-full border-2 border-black/60 bg-black/60 accent-lime-400"
          style={{
            background: `linear-gradient(90deg,#7fd63a 0%, #4f9f16 ${value * 100}%, rgba(0,0,0,.6) ${value * 100}%)`,
          }}
        />
        <button
          onClick={onToggle}
          className={`btn h-9 w-11 text-lg ${on ? "btn-green" : "btn-gray"}`}
        >
          {on ? "✔" : "✕"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <span className="font-display text-lg text-white">{label}</span>
      <button
        onClick={onClick}
        className={`btn w-24 py-1.5 text-sm ${on ? "btn-green" : "btn-orange"}`}
      >
        {on ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="chip flex items-center justify-between px-3 py-1.5">
      <span className="text-sm font-bold text-white/70">{label}</span>
      <span className="font-display text-base text-amber-200">{value}</span>
    </div>
  );
}
