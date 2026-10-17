import { ACTION_META, SENSOR_META } from "../strategy";
import type { Rule } from "../types";

interface Props {
  rule: Rule;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RuleCard({ rule, index, total, onMove, onEdit, onDelete }: Props) {
  const actInfo = ACTION_META[rule.action];
  const sensorInfo = rule.sensor ? SENSOR_META[rule.sensor] : null;

  return (
    <div class="rule-card bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative hover:border-slate-700 shadow-sm">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
            {index + 1}
          </span>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Priority #{index + 1}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            title="Bump Priority Up"
            class={
              index === 0
                ? "opacity-20 cursor-not-allowed p-1"
                : "p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            }
          >
            ▲
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            title="Bump Priority Down"
            class={
              index === total - 1
                ? "opacity-20 cursor-not-allowed p-1"
                : "p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            }
          >
            ▼
          </button>
          <button
            onClick={() => onEdit(rule.id)}
            class="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition"
            title="Edit Rule"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            class="p-1.5 hover:bg-rose-950/40 rounded-lg text-slate-500 hover:text-rose-400 transition"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
        <div>
          {rule.isDefault ? (
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                Default Fallback
              </span>
              <span class="text-xs text-slate-400">If no rule above matched</span>
            </div>
          ) : (
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="font-extrabold text-cyan-400 uppercase tracking-wider text-[11px]">
                When
              </span>
              <span class="px-2.5 py-1 rounded-xl bg-cyan-950/60 text-cyan-200 border border-cyan-800/80 font-bold flex items-center gap-1.5">
                <span>{sensorInfo?.icon}</span>
                <span>{sensorInfo?.label}</span>
              </span>
              <span class="px-2 py-0.5 rounded-lg bg-slate-800 font-mono font-bold text-slate-300 text-xs">
                {rule.operator}
              </span>
              <span class="px-2.5 py-1 rounded-xl bg-amber-950/50 text-amber-300 border border-amber-800/80 font-mono font-bold">
                {rule.value}
              </span>
            </div>
          )}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-bold text-slate-500 uppercase">➔ DO:</span>
          <span
            class={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 ${actInfo.badgeBg} border ${actInfo.border}`}
          >
            <span>{actInfo.icon}</span>
            <span>{actInfo.label}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
