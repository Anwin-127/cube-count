import { useGameStore } from '../store/gameStore';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';

/**
 * Practice settings screen.
 *
 * Allows the player to configure:
 *  - Starting difficulty
 *  - Display time (how long the puzzle is shown)
 *  - Maximum answer time
 *
 * Settings persist for the duration of the session via the game store.
 */
export function SettingsScreen() {
  const config = useGameStore((s) => s.config);
  const startMatch = useGameStore((s) => s.startMatch);
  const goToHome = useGameStore((s) => s.goToHome);
  const updateConfig = useGameStore((s) => s.updateConfig);

  const isPractice = config.gameMode === GameMode.PRACTICE;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          {isPractice ? 'Practice Mode' : 'Play'}
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          {isPractice
            ? 'Train at your own pace. Puzzle difficulty increases automatically.'
            : 'Head-to-head competition. Most correct answers wins.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm space-y-6">
        {/* Difficulty */}
        <SettingRow label="Starting Difficulty">
          <SegmentedControl
            options={[
              { label: 'Easy', value: Difficulty.EASY },
              { label: 'Medium', value: Difficulty.MEDIUM },
              { label: 'Hard', value: Difficulty.HARD },
            ]}
            value={config.difficulty}
            onChange={(v) =>
              updateConfig({ difficulty: v as Difficulty })
            }
          />
        </SettingRow>

        {/* Display Time */}
        <SettingRow
          label="Display Time"
          hint="How long the puzzle is shown"
        >
          <StepperControl
            value={config.initialDisplayTime}
            min={3}
            max={30}
            step={1}
            unit="s"
            onChange={(v) => updateConfig({ initialDisplayTime: v })}
          />
        </SettingRow>

        {/* Answer Time */}
        <SettingRow
          label="Answer Time"
          hint="Time allowed to submit an answer"
        >
          <StepperControl
            value={config.maximumAnswerTime}
            min={5}
            max={60}
            step={5}
            unit="s"
            onChange={(v) => updateConfig({ maximumAnswerTime: v })}
          />
        </SettingRow>
      </div>

      {/* Key bindings hint */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 w-full max-w-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Controls
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-gray-500">
          <KeyHint keyLabel="A" action="+1" />
          <KeyHint keyLabel="W" action="+10" />
          <KeyHint keyLabel="S" action="−1" />
          <KeyHint keyLabel="Shift" action="Submit" />
          <KeyHint keyLabel="Space" action="Continue" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={startMatch}
          className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl hover:bg-gray-700 active:scale-95 transition-all duration-150"
        >
          {isPractice ? 'Start Practice' : 'Start Game'}
        </button>
        <button
          onClick={goToHome}
          className="w-full bg-transparent text-gray-500 font-medium py-2.5 rounded-xl hover:text-gray-900 transition-colors duration-150"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all duration-150 ${
            value === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function StepperControl({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={decrement}
        disabled={value <= min}
        className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-100 active:scale-90"
        aria-label={`Decrease ${unit}`}
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-semibold text-gray-900 tabular-nums">
        {value}
        {unit}
      </span>
      <button
        onClick={increment}
        disabled={value >= max}
        className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-100 active:scale-90"
        aria-label={`Increase ${unit}`}
      >
        +
      </button>
    </div>
  );
}

function KeyHint({ keyLabel, action }: { keyLabel: string; action: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] font-mono text-gray-600 shadow-sm">
        {keyLabel}
      </kbd>
      <span>{action}</span>
    </div>
  );
}
