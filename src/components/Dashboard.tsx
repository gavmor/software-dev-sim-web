import { useState } from "preact/hooks";
import { ACTION_META, SENSOR_META } from "../strategy";
import { recentLogFirst } from "../sim";
import type { Rule, SimResult } from "../types";

interface Props {
  result: SimResult;
  rules: Rule[];
}

type Tab = "log" | "summary";

const TIPS = [
  "Releasing features earns points, but bugs reduce earnings.",
  "Writing tests increases test coverage and keeps bugs low.",
  "Refactoring cleans up code so team moves smoothly.",
  "Don't forget a release rule near day 99 before time runs out!",
];

export function Dashboard({ result, rules }: Props) {
  const [tab, setTab] = useState<Tab>("log");

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      class={`px-4 py-3 border-b-2 transition ${
        tab === t
          ? "border-cyan-400 text-cyan-400"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div class="flex border-b border-slate-800 text-xs font-bold bg-slate-900/60 px-4">
        {tabBtn("log", "📖 Day-by-Day Story (100 Days)")}
        {tabBtn("summary", "🔍 How the Engine Sees This")}
      </div>

      {tab === "log" ? (
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="space-y-2">
            {recentLogFirst(result.log).map((item) => {
              const act = ACTION_META[item.action];
              const isRelease = item.action === "release";
              return (
                <div
                  key={item.day}
                  class={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                    isRelease
                      ? "bg-emerald-950/40 border-emerald-800/80 shadow-md shadow-emerald-950/30"
                      : "bg-slate-900/60 border-slate-800/80"
                  }`}
                >
                  <div class="flex items-center gap-2.5">
                    <span class="font-mono text-slate-500 text-[11px] w-12 font-bold">
                      Day {item.day}
                    </span>
                    <span
                      class={`px-2 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1 ${act.badgeBg} border ${act.border}`}
                    >
                      <span>{act.icon}</span>
                      <span>{act.label}</span>
                    </span>
                    <span class="text-slate-300 font-medium">{item.story}</span>
                  </div>
                  <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span class="text-slate-500">Triggered by Rule #{item.ruleNum}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div class="flex-1 p-5 overflow-y-auto space-y-4">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Plain English Execution Order
            </h3>
            <p class="text-xs text-slate-400 mb-3">
              Every single day, your strategy executes the first rule where all questions are
              YES:
            </p>
            <div class="space-y-2 font-mono text-xs">
              {rules.map((rule, idx) =>
                rule.isDefault ? (
                  <div
                    key={rule.id}
                    class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-400"
                  >
                    <strong class="text-slate-300">#{idx + 1}</strong> Fallback:{" "}
                    <span class="text-emerald-400 font-bold">
                      {ACTION_META[rule.action].label}
                    </span>
                  </div>
                ) : (
                  <div
                    key={rule.id}
                    class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-300"
                  >
                    <strong class="text-cyan-400">#{idx + 1}</strong> If{" "}
                    <em>
                      {SENSOR_META[rule.sensor ?? "day"].label} {rule.operator}{" "}
                      {rule.value}
                    </em>{" "}
                    <span class="text-emerald-400 font-bold">
                      → {ACTION_META[rule.action].label}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
            <h4 class="font-bold text-slate-200 mb-1">💡 Tips for Great Results</h4>
            <ul class="list-disc list-inside space-y-1 text-slate-400 mt-2">
              {TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
