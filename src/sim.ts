import * as R from "remeda";
import {
  createGame,
  step,
  profitCents,
  dollars,
  createKnowledge,
  updateKnowledge,
  playerView,
  type ActionId,
  type GameState,
  type StepEvent,
} from "@gavmor/software-dev-sim";
import {
  coveragePct,
  pickAction,
  stopRuleFires,
  describeStop,
  ACTION_META,
} from "./strategy";
import type {
  DayLogEntry,
  Rule,
  SimContext,
  SimResult,
  StopRule,
} from "./types";
import { SIM_SEED } from "./types";

function storyFor(
  events: StepEvent[],
  state: GameState,
  action: ActionId,
  totalFeaturesBuilt: number,
  fogOfWar: boolean,
): string {
  const types = new Set(R.map(events, (e) => e.type));
  const released = R.find(events, (e) => e.type === "released");
  const bugsReported = R.find(events, (e) => e.type === "bugs_reported");

  if (types.has("feature_failed")) {
    return "Got stuck on crufty code — no feature today.";
  }
  if (released) {
    // The reveal moment: this is when you learn about your bugs.
    const n = released.type === "released" ? released.features : 0;
    const bugNote =
      bugsReported && bugsReported.type === "bugs_reported"
        ? ` (customers found ${bugsReported.count} bug${bugsReported.count === 1 ? "" : "s"}!)`
        : "";
    return `🎉 RELEASED ${n} feature${n === 1 ? "" : "s"}! +$${dollars(state.releasedValueCents * 20)}/mo contracts${bugNote}`;
  }
  if (action === "feature") {
    // Under fog of war, bug slips are silent — you won't know until release.
    const bugNote =
      !fogOfWar && types.has("bug_introduced") ? " Slipped in a bug!" : "";
    return `Built feature #${totalFeaturesBuilt}.${bugNote}`;
  }
  if (action === "tests") {
    if (fogOfWar) return "Wrote tests.";
    const bugNote = types.has("bug_introduced")
      ? " (and introduced a bug — ouch)"
      : "";
    return `Wrote tests. Coverage now ${coveragePct(state)}%.${bugNote}`;
  }
  if (action === "refactor") {
    const bugNote =
      !fogOfWar && types.has("bug_introduced")
        ? " Slipped in a bug while tidying!"
        : "";
    return `Refactored messy code to stay nimble.${bugNote}`;
  }
  return ACTION_META[action].label;
}

export interface RunOptions {
  seed?: number;
  days?: number;
  stopRule?: StopRule | null;
  /** Hide bugs and test quality until release, like the original game. */
  fogOfWar?: boolean;
}

/**
 * An incremental simulation: call stepDay() to advance one day at a time.
 * Powers both the instant full-run and the live ticking mode.
 */
export interface Runner {
  /** Advance one day; returns null when the run is already over. */
  stepDay(): DayLogEntry | null;
  readonly done: boolean;
  readonly state: GameState;
  readonly log: DayLogEntry[];
  readonly actionCounts: Record<ActionId, number>;
  readonly totalRevenueCents: number;
  readonly stopReason: string | null;
}

export function createRunner(rules: Rule[], opts: RunOptions = {}): Runner {
  const { seed = SIM_SEED, days = 100, stopRule = null, fogOfWar = true } = opts;
  let game = createGame({ seed, days });
  // The driver holds the full GameState (for step()) and the player's
  // knowledge. The strategy below only ever receives the projected
  // PlayerView — the live bug count never crosses that boundary.
  let knowledge = createKnowledge();
  const ctx: SimContext = { featuresAtLastRelease: 0 };
  const xray = !fogOfWar;
  const log: DayLogEntry[] = [];
  const actionCounts: Record<ActionId, number> = {
    feature: 0,
    tests: 0,
    refactor: 0,
    release: 0,
  };
  let totalRevenueCents = 0;
  let totalFeaturesBuilt = 0;
  let stopReason: string | null = null;

  function stepDay(): DayLogEntry | null {
    if (game.done || stopReason !== null) return null;
    const view = playerView(game, knowledge, { xray });
    const { action, ruleIndex } = pickAction(rules, view, ctx);
    const { state: next, events } = step(game, action);
    totalRevenueCents += next.releasedValueCents;
    if (events.some((e) => e.type === "feature_added")) totalFeaturesBuilt += 1;
    knowledge = updateKnowledge(knowledge, events);
    if (action === "release") ctx.featuresAtLastRelease = next.features;
    actionCounts[action] += 1;
    const entry: DayLogEntry = {
      day: game.day,
      action,
      ruleNum: ruleIndex + 1,
      story: storyFor(events, next, action, totalFeaturesBuilt, fogOfWar),
      features: next.features,
      bugs: next.bugs,
      coveragePct: coveragePct(next),
      releasedValueCents: next.releasedValueCents,
    };
    log.push(entry);
    game = next;
    if (stopRule !== null && stopRuleFires(stopRule, playerView(game, knowledge, { xray }), ctx)) {
      stopReason = describeStop(stopRule, game.day);
    }
    return entry;
  }

  return {
    stepDay,
    get done() {
      return game.done || stopReason !== null;
    },
    get state() {
      return game;
    },
    get log() {
      return log;
    },
    get actionCounts() {
      return actionCounts;
    },
    get totalRevenueCents() {
      return totalRevenueCents;
    },
    get stopReason() {
      return stopReason;
    },
  };
}

/** Run the whole simulation synchronously. Deterministic for a fixed seed. */
export function runSimulation(rules: Rule[], opts: RunOptions = {}): SimResult {
  const t0 = performance.now();
  const runner = createRunner(rules, opts);
  while (!runner.done) runner.stepDay();
  return {
    log: runner.log,
    actionCounts: runner.actionCounts,
    finalState: runner.state,
    totalRevenueCents: runner.totalRevenueCents,
    profitCents: profitCents(runner.state),
    stopReason: runner.stopReason,
    daysSimulated: runner.log.length,
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
