import * as R from "remeda";
import { profitCents, type PlayerView } from "@gavmor/software-dev-sim";
import type {
  ActionId,
  Operator,
  PresetKey,
  Rule,
  SensorId,
  SimContext,
  StopRule,
} from "./types";

export interface SensorMeta {
  label: string;
  icon: string;
  unit: string;
}

export const SENSOR_META: Record<SensorId, SensorMeta> = {
  net_new_features: { label: "New Features Ready", icon: "📦", unit: "" },
  bugs: { label: "Active Bugs", icon: "🐛", unit: "" },
  coverage: { label: "Test Coverage", icon: "🛡️", unit: "%" },
  day: { label: "Day Number", icon: "📅", unit: "" },
  cruft: { label: "Code Mess", icon: "🧹", unit: "" },
  profit: { label: "Profit", icon: "💵", unit: "$" },
};

export const OPERATORS: Operator[] = [">=", ">", "<=", "<", "=="];

export const OPERATOR_LABELS: Record<Operator, string> = {
  ">=": "is at least (>=)",
  ">": "is greater than (>)",
  "<=": "is at most (<=)",
  "<": "is less than (<)",
  "==": "is exactly (==)",
};

export interface ActionMeta {
  label: string;
  icon: string;
  badgeBg: string;
  border: string;
}

export const ACTION_META: Record<ActionId, ActionMeta> = {
  feature: {
    label: "Build Feature",
    icon: "🚀",
    badgeBg: "bg-blue-950/60 text-blue-300",
    border: "border-blue-500/70",
  },
  tests: {
    label: "Write Tests",
    icon: "🛡️",
    badgeBg: "bg-purple-950/60 text-purple-300",
    border: "border-purple-500/70",
  },
  refactor: {
    label: "Refactor Code",
    icon: "🧹",
    badgeBg: "bg-amber-950/60 text-amber-300",
    border: "border-amber-500/70",
  },
  release: {
    label: "Release to Users",
    icon: "💰",
    badgeBg: "bg-emerald-950/60 text-emerald-300",
    border: "border-emerald-500/70",
  },
};

/** Test coverage as a 0–100 percent number derived from the player-visible state. */
export function coveragePct(view: PlayerView): number {
  const size = view.features + view.cruft;
  if (size === 0) return view.unitTests > 0 ? 100 : 0;
  return Math.min(100, Math.round((view.unitTests / (size * 4)) * 100));
}

export function readSensor(
  sensor: SensorId,
  view: PlayerView,
  ctx: SimContext,
): number {
  switch (sensor) {
    case "net_new_features":
      return Math.max(0, view.features - ctx.featuresAtLastRelease);
    case "bugs":
      // The fog-of-war invariant is enforced by the type boundary:
      // strategies receive a PlayerView, whose `bugs` is the last
      // reported count. There is no live value to read here.
      return view.bugs;
    case "coverage":
      return coveragePct(view);
    case "day":
      return view.day;
    case "cruft":
      return view.cruft;
    case "profit":
      return profitCents(view) / 100;
  }
}

function compare(op: Operator, actual: number, expected: number): boolean {
  switch (op) {
    case ">=":
      return actual >= expected;
    case ">":
      return actual > expected;
    case "<=":
      return actual <= expected;
    case "<":
      return actual < expected;
    case "==":
      return actual === expected;
  }
}

export function ruleFires(
  rule: Rule,
  view: PlayerView,
  ctx: SimContext,
): boolean {
  if (rule.isDefault) return true;
  if (rule.sensor == null || rule.operator == null || rule.value == null) {
    return false;
  }
  return compare(
    rule.operator,
    readSensor(rule.sensor, view, ctx),
    rule.value,
  );
}

/**
 * Walk the priority stack top-down; the first firing rule wins.
 * Returns the action plus the 0-based index of the rule that fired.
 */
export function pickAction(
  rules: Rule[],
  view: PlayerView,
  ctx: SimContext,
): { action: ActionId; ruleIndex: number } {
  const ruleIndex = R.findIndex(rules, (r) => ruleFires(r, view, ctx));
  if (ruleIndex === -1) return { action: "feature", ruleIndex: -1 };
  return { action: rules[ruleIndex].action, ruleIndex };
}

/** Plain-English one-liner for the "How the Engine Sees This" tab. */
export function describeRule(rule: Rule, index: number): string {
  const act = ACTION_META[rule.action].label;
  if (rule.isDefault) return `#${index + 1} Fallback → ${act}`;
  const sensor = SENSOR_META[rule.sensor ?? "day"].label;
  return `#${index + 1} If ${sensor} ${rule.operator} ${rule.value} → ${act}`;
}

/** Does the stop condition hold right now? */
export function stopRuleFires(
  rule: StopRule,
  view: PlayerView,
  ctx: SimContext,
): boolean {
  return compare(rule.operator, readSensor(rule.sensor, view, ctx), rule.value);
}

export function describeStop(rule: StopRule, day: number): string {
  const meta = SENSOR_META[rule.sensor];
  return `Stopped: ${meta.label} ${rule.operator} ${meta.unit}${rule.value} on day ${day}`;
}

export function describeStopShort(rule: StopRule): string {
  const meta = SENSOR_META[rule.sensor];
  return `${meta.label} ${rule.operator} ${meta.unit}${rule.value}`;
}

const mkRule = (
  id: string,
  desc: string,
  action: ActionId,
  cond?: { sensor: SensorId; operator: Operator; value: number },
): Rule =>
  cond == null
    ? { id, isDefault: true, action, desc }
    : { id, isDefault: false, action, desc, ...cond };

export const PRESETS: Record<PresetKey, Rule[]> = {
  balanced: [
    mkRule("r1", "Final Day Release", "release", {
      sensor: "day",
      operator: "==",
      value: 99,
    }),
    mkRule("r2", "Batch release 4 features", "release", {
      sensor: "net_new_features",
      operator: ">=",
      value: 4,
    }),
    mkRule("r3", "Maintain 75% coverage", "tests", {
      sensor: "coverage",
      operator: "<",
      value: 75,
    }),
    mkRule("r4", "Default feature work", "feature"),
  ],
  shipFast: [
    mkRule("r1", "Continuous fast release", "release", {
      sensor: "net_new_features",
      operator: ">=",
      value: 2,
    }),
    mkRule("r2", "Fix bugs if piling up", "tests", {
      sensor: "bugs",
      operator: ">=",
      value: 3,
    }),
    mkRule("r3", "Sprint on features", "feature"),
  ],
  perfectionist: [
    mkRule("r1", "Finale Ship", "release", {
      sensor: "day",
      operator: "==",
      value: 99,
    }),
    mkRule("r2", "Zero bug tolerance", "tests", {
      sensor: "bugs",
      operator: ">",
      value: 0,
    }),
    mkRule("r3", "High 90% test coverage", "tests", {
      sensor: "coverage",
      operator: "<",
      value: 90,
    }),
    mkRule("r4", "Ship large polished pack", "release", {
      sensor: "net_new_features",
      operator: ">=",
      value: 5,
    }),
    mkRule("r5", "Default feature work", "feature"),
  ],
  cleanSchedule: [
    mkRule("r1", "Day 99 finish", "release", {
      sensor: "day",
      operator: "==",
      value: 99,
    }),
    mkRule("r2", "Release after 6 features", "release", {
      sensor: "net_new_features",
      operator: ">=",
      value: 6,
    }),
    mkRule("r3", "Clean up code when messy", "refactor", {
      sensor: "cruft",
      operator: ">=",
      value: 8,
    }),
    mkRule("r4", "Basic test baseline", "tests", {
      sensor: "coverage",
      operator: "<",
      value: 60,
    }),
    mkRule("r5", "Build features", "feature"),
  ],
};

export const PRESET_LABELS: Record<PresetKey, string> = {
  balanced: "Balanced",
  shipFast: "Ship Fast",
  perfectionist: "Bug Fixer",
  cleanSchedule: "Sprint Cycle",
};

export function cloneRules(rules: Rule[]): Rule[] {
  return R.map(rules, (r) => ({ ...r }));
}

/** Fresh unique rule id. */
export function newRuleId(): string {
  return `r_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
