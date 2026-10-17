import * as R from "remeda";
import {
  createGame,
  step,
  profitCents,
  dollars,
  type ActionId,
  type GameState,
  type StepEvent,
} from "@gavmor/software-dev-sim";
import {
  coveragePct,
  pickAction,
  ACTION_META,
} from "./strategy";
import type {
  DayLogEntry,
  Rule,
  SimContext,
  SimResult,
} from "./types";
import { SIM_DAYS, SIM_SEED } from "./types";

function storyFor(
  events: StepEvent[],
  state: GameState,
  action: ActionId,
  totalFeaturesBuilt: number,
): string {
  const types = new Set(R.map(events, (e) => e.type));
  const released = R.find(events, (e) => e.type === "released");
  const bugsReported = R.find(events, (e) => e.type === "bugs_reported");

  if (types.has("feature_failed")) {
    return "Got stuck on crufty code — no feature today.";
  }
  if (released) {
    const n = released.type === "released" ? released.features : 0;
    const bugNote =
      bugsReported && bugsReported.type === "bugs_reported"
        ? ` (customers found ${bugsReported.count} bug${bugsReported.count === 1 ? "" : "s"}!)`
        : "";
    return `🎉 RELEASED ${n} feature${n === 1 ? "" : "s"}! +$${dollars(state.releasedValueCents * 20)}/mo contracts${bugNote}`;
  }
  if (action === "feature") {
    const bugNote = types.has("bug_introduced") ? " Slipped in a bug!" : "";
    return `Built feature #${totalFeaturesBuilt}.${bugNote}`;
  }
  if (action === "tests") {
    const bugNote = types.has("bug_introduced")
      ? " (and introduced a bug — ouch)"
      : "";
    return `Wrote tests. Coverage now ${coveragePct(state)}%.${bugNote}`;
  }
  if (action === "refactor") {
    const bugNote = types.has("bug_introduced")
      ? " Slipped in a bug while tidying!"
      : "";
    return `Refactored messy code to stay nimble.${bugNote}`;
  }
  return ACTION_META[action].label;
}

/**
 * Run a full 100-day game driving the real engine with the given rule stack.
 * Deterministic for a fixed seed.
 */
export function runSimulation(rules: Rule[], seed: number = SIM_SEED): SimResult {
  const t0 = performance.now();
  let game = createGame({ seed, days: SIM_DAYS });
  const ctx: SimContext = { featuresAtLastRelease: 0 };
  const log: DayLogEntry[] = [];
  const actionCounts: Record<ActionId, number> = {
    feature: 0,
    tests: 0,
    refactor: 0,
    release: 0,
  };
  let totalRevenueCents = 0;
  let totalFeaturesBuilt = 0;

  while (!game.done) {
    const { action, ruleIndex } = pickAction(rules, game, ctx);
    const { state: next, events } = step(game, action);
    totalRevenueCents += next.releasedValueCents;
    if (events.some((e) => e.type === "feature_added")) totalFeaturesBuilt += 1;
    if (action === "release") ctx.featuresAtLastRelease = next.features;
    actionCounts[action] += 1;
    log.push({
      day: game.day,
      action,
      ruleNum: ruleIndex + 1,
      story: storyFor(events, next, action, totalFeaturesBuilt),
      features: next.features,
      bugs: next.bugs,
      coveragePct: coveragePct(next),
      releasedValueCents: next.releasedValueCents,
    });
    game = next;
  }

  return {
    log,
    actionCounts,
    finalState: game,
    totalRevenueCents,
    profitCents: profitCents(game),
    durationMs: performance.now() - t0,
  };
}

/** Grade for the scorecard, based on final profit. */
export function gradeFor(profitDollars: number): {
  label: string;
  className: string;
} {
  if (profitDollars >= 5) {
    return {
      label: "🌟 Master Strategist!",
      className:
        "px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-700",
    };
  }
  if (profitDollars >= -15) {
    return {
      label: "👍 Solid Run",
      className:
        "px-2 py-0.5 rounded-lg text-xs font-black bg-cyan-950 text-cyan-300 border border-cyan-700",
    };
  }
  return {
    label: "⚠️ Could Be Better",
    className:
      "px-2 py-0.5 rounded-lg text-xs font-black bg-amber-950 text-amber-300 border border-amber-700",
  };
}

/** Last N log entries, most-recent-first — for the day-by-day tab. */
export function recentLogFirst(log: DayLogEntry[], n = 30): DayLogEntry[] {
  return R.pipe(log, R.takeLast(n), R.reverse());
}
