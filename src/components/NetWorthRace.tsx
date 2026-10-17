import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { PRESETS, PRESET_LABELS, cloneRules } from "../strategy";
import { fundsOverTime } from "../sim";
import { SIM_SEED } from "../types";
import type { PresetKey, Rule, StopRule } from "../types";

type StackOffset = "zero" | "normalize" | "center" | "wiggle";

const OFFSETS: { id: StackOffset; label: string; hint: string }[] = [
  { id: "zero", label: "Zero", hint: "layers stack from the baseline" },
  { id: "normalize", label: "Normalize", hint: "rescaled to shares of net worth" },
  { id: "center", label: "Center", hint: "stacks centered around zero" },
  { id: "wiggle", label: "Wiggle", hint: "streamgraph — minimizes slope" },
];

const GROUP_ORDER: PresetKey[] = ["balanced", "shipFast", "perfectionist", "cleanSchedule"];
const GROUP_COLORS: Record<PresetKey, string> = {
  balanced: "#3b82f6",
  shipFast: "#f97316",
  perfectionist: "#a855f7",
  cleanSchedule: "#10b981",
};
const MY_COMPANY_LABEL = "My Company";
const MY_COMPANY_COLOR = "#fbbf24";
/** Paired seeds: instance i of every preset shares a seed, like the Monte Carlo study. */
const RACE_SEED_BASE = 1000;

interface Props {
  rules: Rule[];
  days: number;
  fogOfWar: boolean;
  stopRule: StopRule | null;
}

interface Row {
  key: string;
  group: string;
  day: number;
  funds: number;
}

/** One stacked series per run, downsampled to at most ~400 points. */
function buildRows(
  rules: Rule[],
  days: number,
  fogOfWar: boolean,
  stopRule: StopRule | null,
  instances: number,
): Row[] {
  const stride = Math.max(1, Math.ceil(days / 400));
  const rows: Row[] = [];
  const push = (key: string, group: string, funds: number[]) => {
    for (let d = 0; d < funds.length; d += stride) {
      rows.push({ key, group, day: d + 1, funds: funds[d] });
    }
  };
  for (const g of GROUP_ORDER) {
    const presetRules = cloneRules(PRESETS[g]);
    for (let i = 0; i < instances; i++) {
      push(
        `${PRESET_LABELS[g]} #${i + 1}`,
        PRESET_LABELS[g],
        fundsOverTime(presetRules, {
          seed: RACE_SEED_BASE + i,
          days,
          fogOfWar,
          stopRule,
        }),
      );
    }
  }
  push(
    MY_COMPANY_LABEL,
    MY_COMPANY_LABEL,
    fundsOverTime(rules, { seed: SIM_SEED, days, fogOfWar, stopRule }),
  );
  return rows;
}

export function NetWorthRace({ rules, days, fogOfWar, stopRule }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<StackOffset>("wiggle");
  const [instances, setInstances] = useState(12);

  const rulesKey = JSON.stringify(rules);
  const stopKey = JSON.stringify(stopRule);
  const rows = useMemo(
    () =>
      buildRows(
        JSON.parse(rulesKey) as Rule[],
        days,
        fogOfWar,
        JSON.parse(stopKey) as StopRule | null,
        instances,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rulesKey, days, fogOfWar, stopKey, instances],
  );

  const groups = [...GROUP_ORDER.map((g) => PRESET_LABELS[g]), MY_COMPANY_LABEL];
  const groupOf = (key: string) => key.replace(/ #\d+$/, "");
  // One contiguous band per strategy in every layout: the 12 instances of a
  // preset stay adjacent even in wiggle (no inside-out scattering), and My
  // Company rides on top of the stack.
  const order = rows
    .map((r) => r.key)
    .filter((k, i, a) => a.indexOf(k) === i)
    .sort((a, b) => groups.indexOf(groupOf(a)) - groups.indexOf(groupOf(b)));
  const colorOf = (key: string) => {
    const group = groupOf(key);
    if (group === MY_COMPANY_LABEL) return MY_COMPANY_COLOR;
    const g = GROUP_ORDER.find((gk) => PRESET_LABELS[gk] === group);
    return g ? GROUP_COLORS[g] : "#64748b";
  };
  const keys = rows
    .map((r) => r.key)
    .filter((k, i, a) => a.indexOf(k) === i);
  const activeHint = OFFSETS.find((o) => o.id === offset)?.hint ?? "";

  // Day -> rows, for the instant tooltip: with 49 overlapping series a
  // per-layer tooltip can't reliably pick a series, so hovering shows the
  // whole field's state at that day instead.
  const dayIndex = useMemo(() => {
    const m = new Map<number, Row[]>();
    for (const r of rows) {
      const arr = m.get(r.day);
      if (arr) arr.push(r);
      else m.set(r.day, [r]);
    }
    return m;
  }, [rows]);

  const tipTitle = (d: Row): string => {
    const dayRows = dayIndex.get(d.day) ?? [];
    const mean = (group: string): number => {
      let sum = 0;
      let n = 0;
      for (const r of dayRows) {
        if (r.group === group) {
          sum += r.funds;
          n += 1;
        }
      }
      return n > 0 ? sum / n : 0;
    };
    const mine =
      dayRows.find((r) => r.key === MY_COMPANY_LABEL)?.funds ?? 0;
    return [
      `Day ${d.day}`,
      `★ ${MY_COMPANY_LABEL}: $${mine.toFixed(2)}`,
      ...GROUP_ORDER.map(
        (g) =>
          `${PRESET_LABELS[g]} avg: $${mean(PRESET_LABELS[g]).toFixed(2)}`,
      ),
    ].join("\n");
  };

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;
    host.replaceChildren();
    if (rows.length === 0) return;

    const chart = Plot.plot({
      style: { background: "transparent", color: "#cbd5e1", fontSize: "11px" },
      marginLeft: 52,
      marginRight: 12,
      marginBottom: 36,
      x: { label: "Day →" },
      y:
        offset === "normalize"
          ? { label: "Share of net worth →", tickFormat: "%", grid: true }
          : offset === "zero"
            ? {
                label: "Net worth ($) →",
                grid: true,
                tickFormat: (d: number) => `$${d}`,
              }
            : // Center and wiggle shift the baseline, so absolute y positions
              // are meaningless — read each company's net worth from its
              // band's height instead.
              { label: "Net worth ($) · band height", ticks: [], grid: false },
      color: {
        domain: keys,
        range: keys.map(colorOf),
        legend: false,
      },
      marks: [
        Plot.areaY(rows, {
          x: "day",
          y: "funds",
          fill: "key",
          // "zero" is the default stacking — omit the option for it
          offset: offset === "zero" ? undefined : offset,
          order: order as never,
          curve: "monotone-x",
        }),
        // Instant (0-delay) tooltip: native <title> tooltips carry an
        // OS-level delay, so the hover readout is a Plot tip instead.
        // Anchored by day only — with 49 stacked series the vertical
        // position is read from band height, not the cursor.
        Plot.tip(
          rows,
          Plot.pointerX({
            x: "day",
            title: tipTitle,
            fill: "#0f172a",
            stroke: "#334155",
          }),
        ),
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
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div class="flex items-center gap-2">
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
        <label class="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Instances per preset
          <input
            type="number"
            min={1}
            max={24}
            value={instances}
            onInput={(e) =>
              setInstances(
                Math.min(24, Math.max(1, Number((e.target as HTMLInputElement).value) || 1)),
              )
            }
            class="w-16 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-100"
          />
        </label>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div ref={hostRef} class="[&_svg]:w-full [&_svg]:h-auto" />
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        {GROUP_ORDER.map((g) => (
          <span key={g} class="flex items-center gap-1.5">
            <span
              class="inline-block w-3 h-3 rounded-sm"
              style={{ background: GROUP_COLORS[g] }}
            />
            {PRESET_LABELS[g]} × {instances}
          </span>
        ))}
        <span class="flex items-center gap-1.5">
          <span
            class="inline-block w-3 h-3 rounded-sm"
            style={{ background: MY_COMPANY_COLOR }}
          />
          {MY_COMPANY_LABEL} (gold ribbon on top)
        </span>
      </div>

      <p class="text-[11px] text-slate-500">
        {instances} paired runs per preset (instance <em>n</em> of every preset
        shares seed {RACE_SEED_BASE}+<em>n</em>) race your current rules (seed{" "}
        {SIM_SEED}) over {days} days — same fog setting as the main run. Each
        layer is one company's net worth and each strategy keeps one
        contiguous band; in Center and Wiggle layouts vertical position is
        arbitrary, so read net worth from band height.
      </p>
    </div>
  );
}
