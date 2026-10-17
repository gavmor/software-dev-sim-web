import type { ActionId, GameState } from "@gavmor/software-dev-sim";

export type { ActionId, GameState };

export type SensorId =
  | "net_new_features"
  | "bugs"
  | "coverage"
  | "day"
  | "cruft";

export type Operator = ">=" | ">" | "<=" | "<" | "==";

export interface Rule {
  id: string;
  isDefault: boolean;
  sensor?: SensorId;
  operator?: Operator;
  value?: number;
  action: ActionId;
  desc: string;
}

/** Per-run memory for stateful sensors. */
export interface SimContext {
  featuresAtLastRelease: number;
}

export interface DayLogEntry {
  day: number;
  action: ActionId;
  /** 1-based priority number of the rule that fired. */
  ruleNum: number;
  story: string;
  features: number;
  bugs: number;
  coveragePct: number;
  releasedValueCents: number;
}

export interface SimResult {
  log: DayLogEntry[];
  actionCounts: Record<ActionId, number>;
  finalState: GameState;
  /** Total contract revenue earned across the run, in cents. */
  totalRevenueCents: number;
  profitCents: number;
  durationMs: number;
}

export type PresetKey = "balanced" | "shipFast" | "perfectionist" | "cleanSchedule";

export const SIM_SEED = 42;
export const SIM_DAYS = 100;
