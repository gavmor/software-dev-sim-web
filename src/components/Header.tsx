import { PRESET_LABELS } from "../strategy";
import type { PresetKey } from "../types";
import * as R from "remeda";

interface Props {
  onPreset: (key: PresetKey) => void;
  onRun: () => void;
}

const PRESET_KEYS = R.keys(PRESET_LABELS);

export function Header({ onPreset, onRun }: Props) {
  return (
    <header class="border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20 text-lg">
          ⚡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-black tracking-tight text-white">
              StrategyKit
            </h1>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider">
              Visual Studio
            </span>
          </div>
          <p class="text-xs text-slate-400">
            Drag, bump, or click simple building blocks — top rule always wins!
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 gap-1">
          <span class="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">
            Presets:
          </span>
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => onPreset(key)}
              class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition"
            >
              {PRESET_LABELS[key]}
            </button>
          ))}
        </div>

        <button
          onClick={onRun}
          class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Test 100 Days</span>
        </button>
      </div>
    </header>
  );
}
