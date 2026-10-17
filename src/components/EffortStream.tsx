import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { ACTIONS, type ActionId } from "@gavmor/software-dev-sim";
import { ACTION_META } from "../strategy";
import type { DayLogEntry } from "../types";

type StackOffset = "zero" | "normalize" | "center" | "wiggle";

const OFFSETS: { id: StackOffset; label: string; hint: string }[] = [
  { id: "zero", label: "Zero", hint: "layers stack from the baseline" },
  { id: "normalize", label: "Normalize", hint: "rescaled to shares of effort" },
  { id: "center", label: "Center", hint: "stacks centered around zero" },
  { id: "wiggle", label: "Wiggle", hint: "streamgraph — minimizes slope" },
];

const ACTION_COLORS: Record<ActionId, string> = {
  feature: "#3b82f6",
  tests: "#a855f7",
  refactor: "#f59e0b",
  release: "#10b981",
};

const ACTION_IDS = [...ACTIONS];

interface Row {
  day: number;
  action: string;
  value: number;
}

/** Cumulative per-action series, downsampled to at most ~1000 days. */
function buildRows(log: DayLogEntry[]): Row[] {
  if (log.length === 0) return [];
  const stride = Math.max(1, Math.ceil(log.length / 1000));
  const counts: Record<ActionId, number> = {
    feature: 0,
    tests: 0,
    refactor: 0,
    release: 0,
  };
  const rows: Row[] = [];
  log.forEach((e, i) => {
    counts[e.action] += 1;
    if (i % stride === 0 || i === log.length - 1) {
      for (const a of ACTION_IDS) {
        rows.push({ day: e.day, action: ACTION_META[a].label, value: counts[a] });
      }
    }
  });
  return rows;
}

export function EffortStream({ log }: { log: DayLogEntry[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<StackOffset>("zero");

  // Rebuild when the log grows (the array is mutated in place during live runs).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => buildRows(log), [log.length]);
  const activeHint = OFFSETS.find((o) => o.id === offset)?.hint ?? "";

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;
    host.replaceChildren();
    if (rows.length === 0) return;

    const chart = Plot.plot({
      style: { background: "transparent", color: "#cbd5e1", fontSize: "11px" },
      marginLeft: 44,
      marginRight: 12,
      marginBottom: 36,
      x: { label: "Day →" },
      y:
        offset === "normalize"
          ? { label: "Share of effort →", tickFormat: "%", grid: true }
          : { label: "Cumulative action-days →", grid: true },
      color: {
        domain: ACTION_IDS.map((a) => ACTION_META[a].label),
        range: ACTION_IDS.map((a) => ACTION_COLORS[a]),
        legend: true,
      },
      marks: [
        Plot.areaY(rows, {
          x: "day",
          y: "value",
          fill: "action",
          // "zero" is the default stacking — omit the option for it
          offset: offset === "zero" ? undefined : offset,
          // inside-out ordering is recommended for streamgraphs
          order: offset === "wiggle" ? "inside-out" : undefined,
          curve: "monotone-x",
          title: (d: Row) => `${d.action}\nDay ${d.day}: ${d.value}`,
        }),
        Plot.ruleY([0]),
      ],
    });
    host.append(chart);
    return () => {
      chart.remove();
    };
  }, [rows, offset]);

  return (
    <div class="flex-1 p-5 overflow-y-auto space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Stack offset:
        </span>
        <div class="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 gap-1">
          {OFFSETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOffset(o.id)}
              title={o.hint}
              class={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                offset === o.id
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span class="text-[11px] text-slate-500">{activeHint}</span>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        {rows.length === 0 ? (
          <p class="text-xs text-slate-500">
            Run the simulation to see the effort stream.
          </p>
        ) : (
          <div ref={hostRef} class="[&_svg]:w-full [&_svg]:h-auto" />
        )}
      </div>

      <p class="text-[11px] text-slate-500">
        Cumulative team effort per action, day by day — the same four colors as
        the breakdown bar. Switch offsets to compare absolute effort (zero),
        relative shares (normalize), or the classic streamgraph look (wiggle).
      </p>
    </div>
  );
}
