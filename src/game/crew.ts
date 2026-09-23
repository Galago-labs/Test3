import type { ActionOutcome } from "./actionResult";
import { BOTS, botCost } from "./data";

export interface HireActionInput {
  bots: Record<string, number>;
  credits: number;
}

export interface HireActionResult extends ActionOutcome {
  bots: Record<string, number>;
  credits: number;
}

/** Pure state transition for hiring/upgrading a robot. */
export function applyHireBot(input: HireActionInput, id: string): HireActionResult {
  const def = BOTS.find((b) => b.id === id)!;
  const lvl = input.bots[id] ?? 0;
  const cost = botCost(def, lvl);

  if (input.credits < cost) {
    return { bots: input.bots, credits: input.credits, ok: false, message: "Not enough credits!", tone: "bad" };
  }

  return {
    ok: true,
    credits: input.credits - cost,
    bots: { ...input.bots, [id]: lvl + 1 },
    message: `${def.name} ${lvl === 0 ? "activated" : `→ Mk.${lvl + 1}`}`,
    tone: "good",
  };
}
