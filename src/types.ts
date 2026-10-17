import type { ActionId, GameState } from "@gavmor/software-dev-sim";

export type { ActionId, GameState };

export type SensorId =
  | "net_new_features"
  | "bugs"
  | "coverage"
  | "day"
  | "cruft"
  | "profit";

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

/** Halt the run early when this condition becomes true. */
export interface StopRule {
  sensor: SensorId;
  operator: Operator;
  value: number;
}

export type RunMode = "instant" | "live";

export interface SimResult {
  log: DayLogEntry[];
  actionCounts: Record<ActionId, number>;
  finalState: GameState;
  /** Total contract revenue earned across the run, in cents. */
  totalRevenueCents: number;
  profitCents: number;
  /** Why the run ended early, if it did. */
  stopReason: string | null;
  daysSimulated: number;
  durationMs: number;
}

export type PresetKey = "balanced" | "shipFast" | "perfectionist" | "cleanSchedule";

export const SIM_SEED = 42;
export const SIM_DAYS = 100;
