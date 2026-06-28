import { useGameStore } from '../store/gameStore';
import { GameMode } from '../models/GameMode';

/**
 * Home screen — the application's main entry point.
 *
 * Provides two paths:
 *   - Practice: solo mode with unlimited rounds and difficulty progression
 *   - Play: local multiplayer (coming soon)
 *
 * Dev-only playground links are preserved for development access.
 */
export function HomeScreen() {
  const goToSettings = useGameStore((s) => s.goToSettings);
  const updateConfig = useGameStore((s) => s.updateConfig);

  const handlePractice = () => {
    updateConfig({ gameMode: GameMode.PRACTICE });
    goToSettings();
  };

  const handlePlay = () => {
    updateConfig({ gameMode: GameMode.LOCAL_MULTIPLAYER });
    goToSettings();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-10">
      {/* Logo / wordmark */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Stylised cube mark */}
          <IsoCubeMark />
        </div>
        <h1 className="text-5xl font-bold text-black tracking-tight leading-none uppercase">
          Cube Count
        </h1>
        <p className="mt-4 text-base text-gray-500 font-medium tracking-wide">
          Train your spatial reasoning
        </p>
      </div>

      {/* Main actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
        <button
          id="btn-practice"
          onClick={handlePractice}
          className="geo-button w-full py-4 text-lg"
        >
          PRACTICE
        </button>
        <button
          id="btn-play"
          onClick={handlePlay}
          className="geo-button-secondary w-full py-4 text-lg"
        >
          PLAY
        </button>
      </div>

      {/* How to play — brief */}
      <div className="text-center text-xs text-gray-500 max-w-xs leading-relaxed mt-4">
        You'll see a 3D structure of cubes for a few seconds.
        Then count how many cubes are in the structure — including the hidden ones.
      </div>

      {/* Dev-only links — remove before production */}
      {import.meta.env.DEV && (
        <div className="flex gap-4">
          <a
            href="#playground"
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            🧪 Puzzle Playground
          </a>
          <a
            href="#game-playground"
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            🎮 Game Playground
          </a>
          <a
            href="#renderer-playground"
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            🎨 Renderer
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IsoCubeMark — tiny decorative isometric cube SVG
// ---------------------------------------------------------------------------

function IsoCubeMark() {
  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Top face */}
      <path
        d="M24 4 L44 16 L24 28 L4 16 Z"
        fill="#B8FF2C"
      />
      {/* Left face */}
      <path
        d="M4 16 L24 28 L24 44 L4 32 Z"
        fill="#98D622"
      />
      {/* Right face */}
      <path
        d="M44 16 L24 28 L24 44 L44 32 Z"
        fill="#77B011"
      />
    </svg>
  );
}
