/**
 * Type declarations for @gavmor/software-dev-sim.
 * The published package ships untranspiled ESM without bundled types,
 * so we declare its public API surface here (mirrors src/engine.js).
 */
declare module "@gavmor/software-dev-sim" {
  export const WAGE_CENTS: number;
  export const TIME_LIMIT_DAYS: number;
  export const STARTING_CENTS: number;
  export const DAYS_PER_MONTH: number;
  export const FEATURE_DAY_VALUE_CENTS: number;

  export type ActionId = "feature" | "refactor" | "tests" | "release";
  export const ACTIONS: readonly ActionId[];

  export interface ActionInfo {
    label: string;
    enactDescription: string;
    failureMessage?: string;
    bugsReportedMessage?: (n: number) => string;
  }
  export const ACTION_INFO: Record<ActionId, ActionInfo>;

  export interface GameState {
    day: number;
    daysLeft: number;
    daysTotal: number;
    cents: number;
    startingCents: number;
    features: number;
    bugs: number;
    cruft: number;
    unitTests: number;
    releasedValueCents: number;
    done: boolean;
    rngState: number;
  }

  export type StepEvent =
    | { type: "feature_failed" }
    | { type: "feature_added" }
    | { type: "bug_introduced" }
    | { type: "refactored" }
    | { type: "tests_added"; count: number }
    | { type: "bugs_reported"; count: number }
    | { type: "released"; features: number };

  export function createGame(opts?: {
    startingCents?: number;
    days?: number;
    seed?: number;
  }): GameState;

  /**
   * What a player is allowed to know between releases.
   * Strategies must observe the game through PlayerView, never GameState.
   */
  export interface PlayerKnowledge {
    knownBugs: number;
  }

  /**
   * The player's view of the game. `bugs` is the count last reported at a
   * release — never the live count, which does not appear on this type at
   * all. (With { xray: true } it carries the live count instead.)
   */
  export interface PlayerView {
    day: number;
    daysLeft: number;
    daysTotal: number;
    cents: number;
    startingCents: number;
    features: number;
    cruft: number;
    unitTests: number;
    releasedValueCents: number;
    done: boolean;
    bugs: number;
  }

  export function createKnowledge(): PlayerKnowledge;
  export function updateKnowledge(
    knowledge: PlayerKnowledge,
    events: StepEvent[],
  ): PlayerKnowledge;
  export function playerView(
    state: GameState,
    knowledge: PlayerKnowledge,
    opts?: { xray?: boolean },
  ): PlayerView;

  export function step(
    state: GameState,
    action: ActionId,
  ): { state: GameState; events: StepEvent[] };

  export function featureFailureProbability(cruft: number): number;
  export function bugProbability(s: {
    features: number;
    cruft: number;
    unitTests: number;
  }): number;
  export function codebaseLines(s: { features: number; cruft: number }): number;
  export function estimatedMonthlyRevenueCents(features: number): number;
  export function profitCents(state: {
    cents: number;
    startingCents: number;
  }): number;
  export function describe(state: GameState): string[];
  export function dollars(cents: number): string;
}
