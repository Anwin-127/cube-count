import { useState, useCallback } from 'react';
import { createPuzzle, generateSeed, validateHeightMap, analyzeComplexity } from '../puzzle';
import type { Puzzle } from '../models/Puzzle';
import { Difficulty } from '../models/Difficulty';
import { BOARD_SIZE, DIFFICULTY_MAX_HEIGHTS } from '../config/constants';
import { Button } from '../components/Button';

/**
 * Development-only Puzzle Playground.
 *
 * Allows manual puzzle generation and inspection before the
 * renderer is implemented. Displays raw puzzle data including
 * shape family, complexity analysis, connectivity, and validation
 * in a human-readable format.
 *
 * This screen is NOT part of the game FSM. It is accessed
 * via the Home screen's dev link or the #playground URL hash.
 */
export function PuzzlePlayground() {
  const [seed, setSeed] = useState<number>(generateSeed);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxHeight = DIFFICULTY_MAX_HEIGHTS[difficulty];

  const generate = useCallback(
    (newSeed: number) => {
      try {
        setSeed(newSeed);
        setError(null);
        const result = createPuzzle({
          seed: newSeed,
          difficulty,
          maxHeight,
        });
        setPuzzle(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPuzzle(null);
      }
    },
    [difficulty, maxHeight],
  );

  const handleGenerate = () => {
    generate(generateSeed());
  };

  const handleRegenerate = () => {
    generate(seed);
  };

  // Run validation on the current puzzle for display
  const validationResult = puzzle
    ? validateHeightMap(puzzle.heightMap, BOARD_SIZE, maxHeight)
    : null;

  // Run complexity analysis for detailed factors
  const complexityResult = puzzle
    ? analyzeComplexity(puzzle.heightMap, BOARD_SIZE, maxHeight)
    : null;

  return (
    <div className="min-h-screen bg-background-secondary p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              🧪 Puzzle Playground
            </h1>
            <p className="text-sm text-secondary mt-1">
              Development tool for validating puzzle generation
            </p>
          </div>
          <a
            href="#"
            className="text-sm text-secondary hover:text-primary transition-colors"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '';
              window.location.reload();
            }}
          >
            ← Back to Home
          </a>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">
                Difficulty
              </span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-white text-primary"
              >
                <option value={Difficulty.EASY}>Easy (max {DIFFICULTY_MAX_HEIGHTS[Difficulty.EASY]})</option>
                <option value={Difficulty.MEDIUM}>Medium (max {DIFFICULTY_MAX_HEIGHTS[Difficulty.MEDIUM]})</option>
                <option value={Difficulty.HARD}>Hard (max {DIFFICULTY_MAX_HEIGHTS[Difficulty.HARD]})</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 flex-1">
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">
                Seed
              </span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="rounded-lg border border-border px-3 py-2 text-sm font-mono bg-white text-primary"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerate}>Generate New Puzzle</Button>
            <Button variant="secondary" onClick={handleRegenerate}>
              Regenerate Same Seed
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Puzzle Data */}
        {puzzle && (
          <>
            {/* Primary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Seed" value={String(puzzle.metadata.seed)} mono />
              <StatCard label="Total Cubes" value={String(puzzle.totalCubes)} />
              <StatCard label="Max Height" value={String(puzzle.maximumHeight)} />
              <StatCard label="Shape" value={formatShapeFamily(puzzle.metadata.shapeFamily)} />
            </div>

            {/* Analysis Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Complexity"
                value={puzzle.metadata.complexityScore.toFixed(3)}
                color={complexityColor(puzzle.metadata.complexityScore)}
              />
              <StatCard
                label="Hidden Cubes"
                value={String(puzzle.metadata.hiddenCubeEstimate)}
              />
              <StatCard
                label="Attempts"
                value={String(puzzle.metadata.generationAttempts)}
              />
              <StatCard
                label="Connectivity"
                value={validationResult?.isValid ? '✓ Connected' : '✗ Invalid'}
                color={validationResult?.isValid ? '#22C55E' : '#EF4444'}
              />
            </div>

            {/* Complexity Factors */}
            {complexityResult && (
              <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-6">
                <h2 className="text-xs text-secondary font-medium uppercase tracking-wide mb-4">
                  Complexity Factors
                </h2>
                <div className="space-y-3">
                  <FactorBar label="Cube Count" value={complexityResult.factors.cubeCountFactor} />
                  <FactorBar label="Height Variation" value={complexityResult.factors.heightVariationFactor} />
                  <FactorBar label="Density" value={complexityResult.factors.densityFactor} />
                  <FactorBar label="Hidden Ratio" value={complexityResult.factors.hiddenRatioFactor} />
                </div>
              </div>
            )}

            {/* Validation */}
            {validationResult && !validationResult.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">
                  Validation Errors
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Height Map Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-6">
              <h2 className="text-xs text-secondary font-medium uppercase tracking-wide mb-4">
                Height Map ({puzzle.boardSize}×{puzzle.boardSize})
              </h2>
              <div className="inline-block">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${puzzle.boardSize}, 1fr)`,
                  }}
                >
                  {puzzle.heightMap.flatMap((row, r) =>
                    row.map((height, c) => (
                      <HeightCell key={`${r}-${c}`} height={height} maxHeight={maxHeight} />
                    )),
                  )}
                </div>
              </div>
            </div>

            {/* Puzzle JSON */}
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-sm font-medium text-primary hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setJsonExpanded(!jsonExpanded)}
              >
                <span>Puzzle JSON</span>
                <span className="text-secondary">
                  {jsonExpanded ? '▲ Collapse' : '▼ Expand'}
                </span>
              </button>
              {jsonExpanded && (
                <pre className="p-4 pt-0 text-xs font-mono text-secondary overflow-x-auto leading-relaxed">
                  {JSON.stringify(puzzle, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-4 text-center">
      <p className="text-xs text-secondary uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-bold ${mono ? 'font-mono text-sm' : ''}`}
        style={{ color: color ?? '#222222' }}
      >
        {value}
      </p>
    </div>
  );
}

function HeightCell({ height, maxHeight }: { height: number; maxHeight: number }) {
  const intensity = maxHeight > 0 ? height / maxHeight : 0;

  const backgroundColor =
    height === 0
      ? '#F7F7F7'
      : `color-mix(in srgb, #B8FF2C ${Math.round(intensity * 100)}%, #E8FFB3)`;

  return (
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border"
      style={{
        backgroundColor,
        borderColor: height > 0 ? '#B8FF2C' : '#EEEEEE',
        color: height > 0 ? '#222222' : '#CCCCCC',
      }}
    >
      {height}
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-secondary">{label}</span>
        <span className="font-mono text-primary">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: factorBarColor(value),
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatShapeFamily(family: string): string {
  return family
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function complexityColor(score: number): string {
  if (score < 0.25) return '#22C55E'; // green — easy
  if (score < 0.5) return '#F59E0B';  // amber — medium
  return '#EF4444';                    // red — hard
}

function factorBarColor(value: number): string {
  if (value < 0.33) return '#86EFAC';
  if (value < 0.66) return '#FCD34D';
  return '#FCA5A5';
}
