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
        <h1 className="text-4xl font-bold tracking-tight uppercase text-black">
          {isPractice ? 'Practice Mode' : 'Play'}
        </h1>
        <p className="mt-2 text-gray-500 text-sm font-medium">
          {isPractice
            ? 'Train at your own pace.'
            : 'Head-to-head competition.'}
        </p>
      </div>

      <div className="geo-panel p-8 w-full max-w-sm space-y-6">
        {/* Difficulty */}
        <SettingRow 
          label={`${config.difficulty} DIFFICULTY`}
          hint={getDifficultyDescription(config.difficulty)}
        >
          <SegmentedControl
            options={[
              { label: 'EASY', value: Difficulty.EASY },
              { label: 'MED', value: Difficulty.MEDIUM },
              { label: 'HARD', value: Difficulty.HARD },
              { label: 'IMP', value: Difficulty.IMPOSSIBLE },
              { label: 'CUST', value: Difficulty.CUSTOM },
            ]}
            value={config.difficulty}
            onChange={(v) => {
              const diff = v as Difficulty;
              if (diff === Difficulty.CUSTOM) {
                updateConfig({ difficulty: diff });
                return;
              }
              const newTime =
                diff === Difficulty.EASY ? 5 :
                diff === Difficulty.MEDIUM ? 3.5 :
                diff === Difficulty.HARD ? 4 : 2.5;
              updateConfig({ difficulty: diff, initialDisplayTime: newTime });
            }}
          />
        </SettingRow>

        {/* Display Time */}
        <SettingRow
          label="Display Time"
          hint="How long the puzzle is shown"
        >
          <StepperControl
            value={config.initialDisplayTime}
            min={1}
            max={30}
            step={0.5}
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

        {config.difficulty === Difficulty.CUSTOM && (
          <>
            <div className="border-t-2 border-black pt-6 space-y-6">
              {/* Max Height */}
              <SettingRow
                label="Maximum Stack Height"
                hint="Tallest possible tower of cubes"
              >
                <StepperControl
                  value={config.maximumStackHeight ?? 3}
                  min={1}
                  max={3}
                  step={1}
                  unit=""
                  onChange={(v) => updateConfig({ maximumStackHeight: v })}
                />
              </SettingRow>

              {/* Puzzle Complexity */}
              <SettingRow
                label="Puzzle Complexity"
                hint="Visual occlusion and structural variance"
              >
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={config.customComplexity ?? 0.50}
                    onChange={(e) => updateConfig({ customComplexity: parseFloat(e.target.value) })}
                    className="w-full accent-black h-2 bg-gray-200 outline-none"
                  />
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Simple</span>
                    <span className="text-black tabular-nums">{config.customComplexity ?? 0.50}</span>
                    <span>Complex</span>
                  </div>
                </div>
              </SettingRow>

              {/* Early Progression */}
              <SettingRow
                label="Early Progression"
                hint="Simplify rounds 1-5 to ease players in"
              >
                <button
                  onClick={() => updateConfig({ enableEarlyProgression: !config.enableEarlyProgression })}
                  className={`w-full py-3 border-2 border-black font-bold uppercase transition-all duration-100 ${
                    config.enableEarlyProgression
                      ? 'bg-[#B8FF2C] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-500 hover:text-black'
                  }`}
                >
                  {config.enableEarlyProgression ? 'Enabled' : 'Disabled'}
                </button>
              </SettingRow>
            </div>
          </>
        )}
      </div>

      {/* Key bindings hint */}
      <div className="w-full max-w-[420px] border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 border-b-2 border-gray-200 pb-2 text-center">
          Controls
        </p>
        <div className={`flex ${isPractice ? 'justify-center' : 'justify-between'} gap-4`}>
          <div className="flex flex-col items-center">
            {!isPractice && <p className="font-bold text-black mb-4 uppercase text-xs">Player 1</p>}
            <MiniDPad
              up={{ key: 'W', action: '+1' }}
              left={{ key: 'A', action: '-10' }}
              right={{ key: 'D', action: '+10' }}
              down={{ key: 'S', action: '-1' }}
              submit={{ key: 'LShift', action: 'Submit' }}
            />
          </div>
          {!isPractice && (
            <div className="flex flex-col items-center">
              <p className="font-bold text-black mb-4 uppercase text-xs">Player 2</p>
              <MiniDPad
                up={{ key: '↑', action: '+1' }}
                left={{ key: '←', action: '-10' }}
                right={{ key: '→', action: '+10' }}
                down={{ key: '↓', action: '-1' }}
                submit={{ key: 'RShift', action: 'Submit' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-sm mt-2">
        <button
          onClick={startMatch}
          className="geo-button w-full py-4 uppercase text-lg"
        >
          {isPractice ? 'Start Practice' : 'Start Game'}
        </button>
        <button
          onClick={goToHome}
          className="geo-button-secondary w-full py-3 uppercase text-sm"
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

function getDifficultyDescription(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return 'A gentle introduction. Max height of 1, very simple layouts, and 5 seconds to memorize.';
    case Difficulty.MEDIUM:
      return 'The standard experience. Max height of 2, moderate complexity, and 3.5 seconds to memorize.';
    case Difficulty.HARD:
      return 'For experienced players. Max height of 3, dense layouts, hidden cubes, and 4 seconds to memorize.';
    case Difficulty.IMPOSSIBLE:
      return 'Brutal difficulty. Maximum occlusion, extreme complexity, and only 2.5 seconds to memorize.';
    case Difficulty.CUSTOM:
      return 'Tune every aspect of the puzzle generator to your exact preferences.';
  }
}

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
        <p className="text-sm font-bold text-black uppercase tracking-wide">{label}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5 font-medium">{hint}</p>}
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
    <div className="flex border-2 border-black bg-white p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-xs font-bold py-2 uppercase transition-all duration-100 ${
            value === opt.value
              ? 'bg-[#B8FF2C] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black'
              : 'text-gray-500 hover:text-black bg-gray-50 border-2 border-transparent'
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
  const decrement = () => {
    // avoid floating point precision issues
    const nv = Math.round((value - step) * 100) / 100;
    if (nv >= min) onChange(nv);
  };
  const increment = () => {
    const nv = Math.round((value + step) * 100) / 100;
    if (nv <= max) onChange(nv);
  };

  return (
    <div className="flex items-center gap-2 border-2 border-black bg-gray-50 p-1">
      <button
        onClick={decrement}
        disabled={value <= min}
        className="w-10 h-10 bg-white border-2 border-black text-black font-bold text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        aria-label={`Decrease ${unit}`}
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-bold text-black tabular-nums uppercase">
        {value}
        {unit}
      </span>
      <button
        onClick={increment}
        disabled={value >= max}
        className="w-10 h-10 bg-white border-2 border-black text-black font-bold text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        aria-label={`Increase ${unit}`}
      >
        +
      </button>
    </div>
  );
}

function MiniDPad({
  up,
  left,
  down,
  right,
  submit,
}: {
  up: { key: string; action: string };
  left: { key: string; action: string };
  down: { key: string; action: string };
  right: { key: string; action: string };
  submit: { key: string; action: string };
}) {
  const Key = ({ k, action }: { k: string; action: string }) => (
    <div className="w-12 h-12 border-2 border-black bg-gray-50 flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">{action}</span>
      <span className="text-sm font-bold text-black leading-none mt-1.5">{k}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        <div />
        <Key k={up.key} action={up.action} />
        <div />
        
        <Key k={left.key} action={left.action} />
        <div />
        <Key k={right.key} action={right.action} />
        
        <div />
        <Key k={down.key} action={down.action} />
        <div />
      </div>
      <div className="mt-4 text-center w-full max-w-[140px] bg-black text-[#B8FF2C] font-bold text-xs py-2 px-1 border-2 border-black">
        {submit.key} = {submit.action}
      </div>
    </div>
  );
}
