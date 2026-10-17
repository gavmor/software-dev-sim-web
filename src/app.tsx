import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as R from "remeda";
import { createGame, profitCents } from "@gavmor/software-dev-sim";
import { Header } from "./components/Header";
import { RunBar } from "./components/RunBar";
import { RuleStack } from "./components/RuleStack";
import { RuleModal } from "./components/RuleModal";
import { Scorecard } from "./components/Scorecard";
import { Dashboard } from "./components/Dashboard";
import { PRESETS, cloneRules, describeStopShort } from "./strategy";
import { createRunner, runSimulation, type Runner } from "./sim";
import type {
  ActionId,
  PresetKey,
  Rule,
  RunMode,
  SimResult,
  StopRule,
} from "./types";
import { SIM_SEED } from "./types";

const SPEEDS = [2, 10, 50];
const MAX_DAYS = 10000;
const TICK_MS = 500;

const ZERO_COUNTS: Record<ActionId, number> = {
  feature: 0,
  tests: 0,
  refactor: 0,
  release: 0,
};

function emptyResult(days: number): SimResult {
  return {
    log: [],
    actionCounts: { ...ZERO_COUNTS },
    finalState: createGame({ seed: SIM_SEED, days }),
    totalRevenueCents: 0,
    profitCents: 0,
    stopReason: null,
    daysSimulated: 0,
    durationMs: 0,
  };
}

export function App() {
  const [rules, setRules] = useState<Rule[]>(() => cloneRules(PRESETS.balanced));
  const [modalRule, setModalRule] = useState<Rule | null | undefined>(undefined);
  const [mode, setMode] = useState<RunMode>("instant");
  const [days, setDaysState] = useState(100);
  const [stopRule, setStopRule] = useState<StopRule | null>(null);
  const [speed, setSpeed] = useState(10);
  const [fogOfWar, setFogOfWar] = useState(true);
  const [runId, setRunId] = useState(0);

  const runnerRef = useRef<Runner | null>(null);
  const [, setLiveTick] = useState(0);
  const [liveRunning, setLiveRunning] = useState(false);

  const setDays = (n: number) => {
    if (!Number.isFinite(n)) return;
    setDaysState(Math.min(MAX_DAYS, Math.max(1, Math.round(n))));
  };

  // Instant mode: re-run the whole sim whenever inputs change.
  const instantResult = useMemo(
    () => runSimulation(rules, { seed: SIM_SEED, days, stopRule, fogOfWar }),
    // runId lets the button force a re-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, days, stopRule, fogOfWar, runId],
  );

  // A new strategy or run configuration resets any live run.
  useEffect(() => {
    runnerRef.current = null;
    setLiveRunning(false);
    setLiveTick(0);
  }, [rules, days, stopRule, fogOfWar, mode]);

  // Live ticking.
  useEffect(() => {
    if (!liveRunning) return;
    const id = setInterval(() => {
      const r = runnerRef.current;
      if (r === null) {
        setLiveRunning(false);
        return;
      }
      const chunk = Math.max(1, Math.round(speed / (1000 / TICK_MS)));
      for (let i = 0; i < chunk && !r.done; i++) r.stepDay();
      setLiveTick((t) => t + 1);
      if (r.done) setLiveRunning(false);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [liveRunning, speed]);

  const startLive = () => {
    runnerRef.current = createRunner(rules, { seed: SIM_SEED, days, stopRule, fogOfWar });
    setLiveTick(0);
    setLiveRunning(true);
  };

  const onPrimary = () => {
    if (mode === "instant") {
      setRunId((n) => n + 1);
      return;
    }
    const r = runnerRef.current;
    if (r === null || r.done) startLive();
    else setLiveRunning((v) => !v);
  };

  const loadPreset = (key: PresetKey) => setRules(cloneRules(PRESETS[key]));
  const resetRules = () => loadPreset("balanced");

  const moveRule = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rules.length) return;
    const next = [...rules];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setRules(next);
  };

  const deleteRule = (id: string) => {
    if (rules.length <= 1) return;
    setRules(R.filter(rules, (r) => r.id !== id));
  };

  /** Insert a new rule: non-default rules go right before the first default. */
  const saveRule = (rule: Rule) => {
    const existing = R.findIndex(rules, (r) => r.id === rule.id);
    if (existing !== -1) {
      setRules(R.map(rules, (r) => (r.id === rule.id ? rule : r)));
    } else if (rule.isDefault) {
      setRules([...rules, rule]);
    } else {
      const defaultIdx = R.findIndex(rules, (r) => r.isDefault);
      if (defaultIdx === -1) {
        setRules([...rules, rule]);
      } else {
        const next = [...rules];
        next.splice(defaultIdx, 0, rule);
        setRules(next);
      }
    }
    setModalRule(undefined);
  };

  // ---- display model ----
  const liveRunner = mode === "live" ? runnerRef.current : null;
  const result: SimResult =
    mode === "instant"
      ? instantResult
      : liveRunner !== null
        ? {
            log: liveRunner.log,
            actionCounts: liveRunner.actionCounts,
            finalState: liveRunner.state,
            totalRevenueCents: liveRunner.totalRevenueCents,
            profitCents: profitCents(liveRunner.state),
            stopReason: liveRunner.stopReason,
            daysSimulated: liveRunner.log.length,
            durationMs: 0,
          }
        : emptyResult(days);

  const primaryLabel =
    mode === "instant"
      ? `Test ${days} Day${days === 1 ? "" : "s"}`
      : liveRunner === null
        ? "Run live"
        : liveRunner.done
          ? "Run again"
          : liveRunning
            ? "Pause"
            : "Resume";

  let status: string;
  let scoreTitle: string;
  let scoreSubtitle: string | null = null;
  if (mode === "instant") {
    scoreTitle = `Scorecard (${result.daysSimulated} days)`;
    scoreSubtitle = result.stopReason ?? `simulated in ${result.durationMs.toFixed(0)}ms`;
    status = scoreSubtitle;
  } else if (liveRunner === null) {
    scoreTitle = "Scorecard (live)";
    status =
      `Ready — up to ${days} days` +
      (stopRule !== null ? ` · stop: ${describeStopShort(stopRule)}` : "");
    scoreSubtitle = status;
  } else if (liveRunner.done) {
    scoreTitle = "Scorecard (live)";
    status = liveRunner.stopReason ?? `Finished ${liveRunner.log.length} days`;
    scoreSubtitle = status;
  } else {
    scoreTitle = "Scorecard (live)";
    status =
      `Day ${liveRunner.log.length} / ${days}` +
      (stopRule !== null ? ` · stop: ${describeStopShort(stopRule)}` : "") +
      (liveRunning ? "" : " · paused");
    scoreSubtitle = status;
  }

  return (
    <div class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
      <Header onPreset={loadPreset} />
      <RunBar
        mode={mode}
        days={days}
        stopRule={stopRule}
        speed={speed}
        speeds={SPEEDS}
        fogOfWar={fogOfWar}
        primaryLabel={primaryLabel}
        liveRunning={liveRunning}
        status={status}
        onModeChange={setMode}
        onDaysChange={setDays}
        onStopRuleChange={setStopRule}
        onSpeedChange={setSpeed}
        onFogOfWarChange={setFogOfWar}
        onPrimary={onPrimary}
      />

      <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        <RuleStack
          rules={rules}
          onAdd={() => setModalRule(null)}
          onMove={moveRule}
          onEdit={(id) => setModalRule(rules.find((r) => r.id === id) ?? undefined)}
          onDelete={deleteRule}
          onReset={resetRules}
        />

        <section class="lg:col-span-6 xl:col-span-6 flex flex-col bg-slate-950 overflow-y-auto">
          <Scorecard
            result={result}
            title={scoreTitle}
            subtitle={scoreSubtitle}
            fogOfWar={fogOfWar}
          />
          <Dashboard
            result={result}
            rules={rules}
            days={days}
            fogOfWar={fogOfWar}
            stopRule={stopRule}
          />
        </section>
      </main>

      {modalRule !== undefined && (
        <RuleModal
          rule={modalRule}
          onSave={saveRule}
          onClose={() => setModalRule(undefined)}
        />
      )}
    </div>
  );
}
