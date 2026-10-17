import { RuleCard } from "./RuleCard";
import type { Rule } from "../types";

interface Props {
  rules: Rule[];
  onAdd: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
}

export function RuleStack({ rules, onAdd, onMove, onEdit, onDelete, onReset }: Props) {
  return (
    <section class="lg:col-span-6 xl:col-span-6 border-r border-slate-800/80 flex flex-col bg-slate-900/40">
      <div class="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <span>📋 Strategy Rule Priority Stack</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono font-bold">
              {rules.length} rules
            </span>
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Rules are checked from #1 down. The first one that is true happens!
          </p>
        </div>

        <button
          onClick={onAdd}
          class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 active:scale-95"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Rule
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
        {rules.map((rule, idx) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            index={idx}
            total={rules.length}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div class="p-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Safe Mode Active: Impossible syntax is prevented
        </span>
        <button
          onClick={onReset}
          class="hover:text-rose-400 transition font-medium text-[11px] underline"
        >
          Reset all rules
        </button>
      </div>
    </section>
  );
}
