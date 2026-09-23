import { useEffect, useState } from "react";
import { Bar } from "./Ui";

const TIPS = [
  "Scout a sector before sending robots to scavenge it — you can't gather what you haven't found.",
  "A robot's Scavenging and Scouting skills decide how a mission goes — match the robot to the job.",
  "Higher-danger missions pay more, but a mishap means a light haul and a robot that needs repairs.",
  "Build a Kitchen and a Water Still before a Rescue mission can bring survivors home.",
  "The Workshop cuts both build costs and repair times — always worth investing in.",
];

export function LoadingScreen({ onPlay }: { onPlay: () => void }) {
  const [p, setP] = useState(0);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setP((v) => {
        const next = v + 2 + Math.random() * 5;
        if (next >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, []);

  const done = p >= 100;

  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden">
      <img
        src="/images/bg-city.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />

      <div className="relative z-10 w-full max-w-2xl px-6 text-center">
        <div className="animate-floaty">
          <div className="font-display text-5xl leading-none text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.55)] sm:text-7xl">
            ROBOT
          </div>
          <div className="font-display bg-gradient-to-b from-amber-200 to-orange-500 bg-clip-text text-5xl leading-none text-transparent drop-shadow-[0_5px_0_rgba(0,0,0,0.4)] sm:text-7xl">
            RECLAIM
          </div>
          <div className="mt-1 text-sm font-extrabold tracking-[0.35em] text-amber-100/80">
            REBUILD THE WORLD
          </div>
        </div>

        <div className="mt-10">
          {done ? (
            <button
              onClick={onPlay}
              className="btn btn-green animate-pulse px-14 py-4 font-display text-2xl"
            >
              TAP TO PLAY
            </button>
          ) : (
            <>
              <div className="font-display text-xl text-white text-outline">LOADING...</div>
              <Bar value={p} max={100} className="mt-2 h-6" />
            </>
          )}
        </div>

        <p className="mt-6 text-sm font-bold text-amber-100/75 text-outline">💡 {tip}</p>
      </div>
    </div>
  );
}
