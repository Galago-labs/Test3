export type ActionTone = "good" | "bad" | "info";

export interface ActionOutcome {
  ok: boolean;
  message: string;
  tone: ActionTone;
}
