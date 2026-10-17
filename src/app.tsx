import { useMemo, useState } from "preact/hooks";
import * as R from "remeda";
import { Header } from "./components/Header";
import { RuleStack } from "./components/RuleStack";
import { RuleModal } from "./components/RuleModal";
import { Scorecard } from "./components/Scorecard";
import { Dashboard } from "./components/Dashboard";
import { PRESETS, cloneRules } from "./strategy";
import { runSimulation } from "./sim";
import type { PresetKey, Rule } from "./types";
import { SIM_SEED } from "./types";

export function App() {
  const [rules, setRules] = useState<Rule[]>(() => cloneRules(PRESETS.balanced));
  const [modalRule, setModalRule] = useState<Rule | null | undefined>(undefined);
  const [runId, setRunId] = useState(0);

  // The sim is cheap (100 engine steps); re-run on every rule change.
  const result = useMemo(
    () => runSimulation(rules, SIM_SEED),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, runId],
  );

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

  return (
    <div class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
      <Header onPreset={loadPreset} onRun={() => setRunId((n) => n + 1)} />

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
          <Scorecard result={result} />
          <Dashboard result={result} rules={rules} />
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
