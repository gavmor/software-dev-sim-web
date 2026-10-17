import { useState } from "preact/hooks";
import * as R from "remeda";
import {
  ACTION_META,
  OPERATOR_LABELS,
  OPERATORS,
  SENSOR_META,
  newRuleId,
} from "../strategy";
import type { ActionId, Operator, Rule, SensorId } from "../types";

interface Props {
  /** The rule being edited, or null when adding a new one. */
  rule: Rule | null;
  onSave: (rule: Rule) => void;
  onClose: () => void;
}

type Kind = "condition" | "always";

const ACTION_IDS = R.keys(ACTION_META);
const SENSOR_IDS = R.keys(SENSOR_META);

export function RuleModal({ rule, onSave, onClose }: Props) {
  const [kind, setKind] = useState<Kind>(rule?.isDefault ? "always" : "condition");
  const [sensor, setSensor] = useState<SensorId>(rule?.sensor ?? "net_new_features");
  const [operator, setOperator] = useState<Operator>(rule?.operator ?? ">=");
  const [value, setValue] = useState<number>(rule?.value ?? 4);
  const [action, setAction] = useState<ActionId>(rule?.action ?? "release");

  const isDefault = kind === "always";

  const save = () => {
    const id = rule?.id ?? newRuleId();
    if (isDefault) {
      onSave({ id, isDefault: true, action, desc: rule?.desc ?? "Fallback default" });
    } else {
      const label = SENSOR_META[sensor].label;
      onSave({
        id,
        isDefault: false,
        sensor,
        operator,
        value: Number.isFinite(value) ? value : 0,
        action,
        desc: rule?.desc ?? `${label} ${operator} ${value}`,
      });
    }
  };

  const kindBtn = (k: Kind, emoji: string, title: string, hint: string) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      class={`py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition ${
        kind === k
          ? "border-cyan-500 bg-cyan-950/40 text-cyan-300"
          : "border-slate-800 bg-slate-800/40 text-slate-400"
      }`}
    >
      {emoji} {title}
      <span class="block text-[10px] font-normal text-slate-400 mt-0.5">{hint}</span>
    </button>
  );

  return (
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-100 relative">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 class="text-lg font-black text-white">
              {rule ? "Edit Rule" : "Add a New Rule"}
            </h3>
            <p class="text-xs text-slate-400">
              Configure what happens and under what conditions
            </p>
          </div>
          <button
            onClick={onClose}
            class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Rule Kind
            </label>
            <div class="grid grid-cols-2 gap-2">
              {kindBtn("condition", "⚡", "If Condition Met", 'e.g. "If bugs > 2"')}
              {kindBtn("always", "🔄", "Default Fallback", "Always do this if nothing else fired")}
            </div>
          </div>

          {!isDefault && (
            <div class="space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">
                When should this fire?
              </label>

              <div class="grid grid-cols-3 gap-2">
                <div>
                  <span class="text-[10px] font-semibold text-slate-500 block mb-1">
                    Check this:
                  </span>
                  <select
                    value={sensor}
                    onChange={(e) => setSensor((e.target as HTMLSelectElement).value as SensorId)}
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {SENSOR_IDS.map((id) => (
                      <option key={id} value={id}>
                        {SENSOR_META[id].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span class="text-[10px] font-semibold text-slate-500 block mb-1">
                    Comparison:
                  </span>
                  <select
                    value={operator}
                    onChange={(e) => setOperator((e.target as HTMLSelectElement).value as Operator)}
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span class="text-[10px] font-semibold text-slate-500 block mb-1">
                    Target Number:
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onInput={(e) =>
                      setValue(parseFloat((e.target as HTMLInputElement).value) || 0)
                    }
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Action to take
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTION_IDS.map((id) => {
                const meta = ACTION_META[id];
                const selected = action === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAction(id)}
                    class={`p-3 rounded-2xl border text-center transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-md"
                        : "border-slate-800 bg-slate-800/40 text-slate-400"
                    }`}
                  >
                    <span class="text-lg block">{meta.icon}</span>
                    <span class="text-xs font-bold block mt-1">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            class="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            class="px-5 py-2 text-xs font-extrabold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition active:scale-95"
          >
            {rule ? "Save Changes" : "Add Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
