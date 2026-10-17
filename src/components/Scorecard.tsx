import { dollars } from "@gavmor/software-dev-sim";
import { gradeFor } from "../sim";
import { coveragePct } from "../strategy";
import type { SimResult } from "../types";
import { SIM_DAYS, SIM_SEED } from "../types";

interface Props {
  result: SimResult;
}

function MetricCard({
  label,
  icon,
  value,
  color,
  sub,
}: {
  label: string;
  icon: string;
  value: string;
  color: string;
  sub: string;
}) {
  return (
    <div class="bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5">
      <div class="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wide">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <div class={`text-2xl font-black ${color} mt-1 font-mono`}>{value}</div>
      <div class="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

export function Scorecard({ result }: Props) {
  const { finalState, totalRevenueCents, actionCounts, profitCents } = result;
  const profitDollars = profitCents / 100;
  const grade = gradeFor(profitDollars);
  const cov = coveragePct(finalState);

  const effort = (n: number) => `${n}d`;

  return (
    <div class="p-5 border-b border-slate-800 bg-slate-900/50">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Scorecard ({SIM_DAYS} Days)
          </span>
          <span class={grade.className}>Grade: {grade.label}</span>
        </div>
        <span class="text-xs text-slate-400 font-mono">Seed: #{SIM_SEED}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Value Earned"
          icon="💰"
          value={`$${dollars(totalRevenueCents)}`}
          color="text-emerald-400"
          sub="from released contracts"
        />
        <MetricCard
          label="Features"
          icon="🚀"
          value={`${finalState.features}`}
          color="text-blue-400"
          sub="shipped & surviving"
        />
        <MetricCard
          label="Tests Built"
          icon="🛡️"
          value={`${cov}%`}
          color="text-purple-400"
          sub="shield against bugs"
        />
        <MetricCard
          label="Bug Count"
          icon="🐛"
          value={`${finalState.bugs}`}
          color="text-rose-400"
          sub="active issues"
        />
      </div>

      <div class="mt-3 text-xs text-slate-400">
        Final profit:{" "}
        <span
          class={`font-mono font-bold ${profitDollars >= 0 ? "text-emerald-400" : "text-rose-400"}`}
        >
          ${dollars(profitCents)}
        </span>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-800/80">
        <div class="flex items-center justify-between text-xs mb-1.5 font-bold">
          <span class="text-slate-400">Team Effort Breakdown:</span>
          <span class="text-[11px] text-slate-300 font-mono">
            🚀 Build: {effort(actionCounts.feature)} | 🛡️ Test: {effort(actionCounts.tests)} | 🧹
            Polish: {effort(actionCounts.refactor)} | 💰 Ship: {effort(actionCounts.release)}
          </span>
        </div>
        <div class="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div
            class="bg-blue-500 h-full"
            style={{ width: `${actionCounts.feature}%` }}
            title={`Features: ${actionCounts.feature} days`}
          ></div>
          <div
            class="bg-purple-500 h-full"
            style={{ width: `${actionCounts.tests}%` }}
            title={`Tests: ${actionCounts.tests} days`}
          ></div>
          <div
            class="bg-amber-500 h-full"
            style={{ width: `${actionCounts.refactor}%` }}
            title={`Refactor: ${actionCounts.refactor} days`}
          ></div>
          <div
            class="bg-emerald-500 h-full"
            style={{ width: `${actionCounts.release}%` }}
            title={`Release: ${actionCounts.release} days`}
          ></div>
        </div>
      </div>
    </div>
  );
}
