import * as R from "remeda";
import {
  OPERATOR_LABELS,
  OPERATORS,
  SENSOR_META,
  describeStopShort,
} from "../strategy";
import type {
  Operator,
  RunMode,
  SensorId,
  StopRule,
} from "../types";

interface Props {
  mode: RunMode;
  days: number;
  stopRule: StopRule | null;
  speed: number;
  speeds: number[];
  fogOfWar: boolean;
  primaryLabel: string;
  liveRunning: boolean;
  status: string;
  onModeChange: (m: RunMode) => void;
  onDaysChange: (n: number) => void;
  onStopRuleChange: (r: StopRule | null) => void;
  onSpeedChange: (n: number) => void;
  onFogOfWarChange: (v: boolean) => void;
  onPrimary: () => void;
}

const SENSOR_IDS = R.keys(SENSOR_META);
const DEFAULT_STOP: StopRule = { sensor: "profit", operator: ">=", value: 20 };

function patchStop(
  stopRule: StopRule | null,
  patch: Partial<StopRule>,
  onChange: (r: StopRule | null) => void,
) {
  onChange({ ...(stopRule ?? DEFAULT_STOP), ...patch });
}

export function RunBar(props: Props) {
  const {
    mode,
    days,
    stopRule,
    speed,
    speeds,
    fogOfWar,
    primaryLabel,
    liveRunning,
    status,
    onModeChange,
    onDaysChange,
    onStopRuleChange,
    onSpeedChange,
    onFogOfWarChange,
    onPrimary,
  } = props;

  const modeBtn = (m: RunMode, label: string) => (
    <button
      onClick={() => onModeChange(m)}
      class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
        mode === m
          ? "bg-cyan-500 text-slate-950 shadow"
          : "text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div class="border-b border-slate-800/90 bg-slate-900/70 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      <div class="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 gap-1">
        {modeBtn("instant", "⚡ Instant")}
        {modeBtn("live", "▶ Live")}
      </div>

      <button
        onClick={() => onFogOfWarChange(!fogOfWar)}
        title="Fog of war: hide bug counts and test quality until release, like the original game"
        class={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
          fogOfWar
            ? "bg-cyan-950/60 border-cyan-700 text-cyan-300"
            : "bg-slate-800/40 border-slate-700/80 text-slate-500 hover:text-slate-300"
        }`}
      >
        🌫️ Fog {fogOfWar ? "on" : "off"}
      </button>

      <label class="flex items-center gap-1.5 text-slate-400 font-bold">
        Days
        <input
          type="number"
          min={1}
          max={10000}
          value={days}
          onInput={(e) =>
            onDaysChange(parseInt((e.target as HTMLInputElement).value, 10))
          }
          class="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </label>

      <label class="flex items-center gap-1.5 text-slate-400 font-bold">
        <input
          type="checkbox"
          checked={stopRule !== null}
          onChange={(e) =>
            onStopRuleChange(
              (e.target as HTMLInputElement).checked ? (stopRule ?? DEFAULT_STOP) : null,
            )
          }
          class="accent-cyan-500 h-3.5 w-3.5"
        />
        Stop when
      </label>
      {stopRule !== null && (
        <span class="flex items-center gap-1.5">
          <select
            value={stopRule.sensor}
            onChange={(e) =>
              patchStop(stopRule, { sensor: (e.target as HTMLSelectElement).value as SensorId }, onStopRuleChange)
            }
            class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            title={describeStopShort(stopRule)}
          >
            {SENSOR_IDS.map((id) => (
              <option key={id} value={id}>
                {SENSOR_META[id].icon} {SENSOR_META[id].label}
              </option>
            ))}
          </select>
          <select
            value={stopRule.operator}
            onChange={(e) =>
              patchStop(stopRule, { operator: (e.target as HTMLSelectElement).value as Operator }, onStopRuleChange)
            }
            class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {OPERATORS.map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={stopRule.value}
            onInput={(e) =>
              patchStop(
                stopRule,
                { value: parseFloat((e.target as HTMLInputElement).value) || 0 },
                onStopRuleChange,
              )
            }
            class="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </span>
      )}

      <button
        onClick={onPrimary}
        class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
      >
        {liveRunning ? (
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        ) : (
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
        )}
        <span>{primaryLabel}</span>
      </button>

      {mode === "live" && (
        <label class="flex items-center gap-1.5 text-slate-400 font-bold">
          Speed
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseInt((e.target as HTMLSelectElement).value, 10))}
            class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {speeds.map((s) => (
              <option key={s} value={s}>
                {s}/s
              </option>
            ))}
          </select>
        </label>
      )}

      <span class="ml-auto text-slate-400 font-mono text-[11px]">{status}</span>
    </div>
  );
}
