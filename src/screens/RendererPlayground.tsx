import { useState, useRef, useEffect, useCallback } from 'react';
import { createPuzzle, generateSeed } from '../puzzle';
import { SvgRenderer } from '../renderer/SvgRenderer';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { PixiRenderer } from '../renderer/PixiRenderer';
import type { PuzzleRenderer } from '../renderer/types';
import type { Puzzle } from '../models/Puzzle';
import { Difficulty } from '../models/Difficulty';
import { DIFFICULTY_MAX_HEIGHTS } from '../config/constants';
import { Button } from '../components/Button';

/**
 * Renderer Playground — compares SVG, Canvas, and PixiJS renderers
 * side-by-side using the same puzzle data.
 *
 * Displays render times for basic performance comparison.
 * This is a development-only page, not part of the game.
 */
export function RendererPlayground() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [renderTimes, setRenderTimes] = useState<Record<string, number>>({});

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  const svgRendererRef = useRef<PuzzleRenderer | null>(null);
  const canvasRendererRef = useRef<PuzzleRenderer | null>(null);
  const pixiRendererRef = useRef<PuzzleRenderer | null>(null);

  // Mount renderers on first render
  useEffect(() => {
    const svg = new SvgRenderer();
    const canvas = new CanvasRenderer();
    const pixi = new PixiRenderer();

    if (svgContainerRef.current) svg.mount(svgContainerRef.current);
    if (canvasContainerRef.current) canvas.mount(canvasContainerRef.current);
    if (pixiContainerRef.current) pixi.mount(pixiContainerRef.current);

    svgRendererRef.current = svg;
    canvasRendererRef.current = canvas;
    pixiRendererRef.current = pixi;

    return () => {
      svg.destroy();
      canvas.destroy();
      pixi.destroy();
    };
  }, []);

  const generateAndRender = useCallback(() => {
    const maxHeight = DIFFICULTY_MAX_HEIGHTS[difficulty];
    const newPuzzle = createPuzzle({
      seed: generateSeed(),
      difficulty,
      maxHeight,
    });
    setPuzzle(newPuzzle);

    const times: Record<string, number> = {};

    // Measure SVG render time
    const svgStart = performance.now();
    svgRendererRef.current?.render(newPuzzle);
    times['SVG'] = performance.now() - svgStart;

    // Measure Canvas render time
    const canvasStart = performance.now();
    canvasRendererRef.current?.render(newPuzzle);
    times['Canvas'] = performance.now() - canvasStart;

    // Measure PixiJS render time (async init may affect first render)
    const pixiStart = performance.now();
    pixiRendererRef.current?.render(newPuzzle);
    times['PixiJS'] = performance.now() - pixiStart;

    setRenderTimes(times);
  }, [difficulty]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🎨 Renderer Playground
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare SVG, Canvas 2D, and PixiJS renderers side-by-side
            </p>
          </div>
          <a
            href="#"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Difficulty
            </span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value={Difficulty.EASY}>Easy (max {DIFFICULTY_MAX_HEIGHTS[Difficulty.EASY]})</option>
              <option value={Difficulty.MEDIUM}>Medium (max {DIFFICULTY_MAX_HEIGHTS[Difficulty.MEDIUM]})</option>
              <option value={Difficulty.HARD}>Hard (max {DIFFICULTY_MAX_HEIGHTS[Difficulty.HARD]})</option>
            </select>
          </label>
          <Button onClick={generateAndRender}>Generate & Render</Button>
        </div>

        {/* Puzzle info */}
        {puzzle && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex gap-6 text-sm">
            <span className="text-gray-500">
              Cubes: <strong className="text-gray-900">{puzzle.totalCubes}</strong>
            </span>
            <span className="text-gray-500">
              Max Height: <strong className="text-gray-900">{puzzle.maximumHeight}</strong>
            </span>
            <span className="text-gray-500">
              Shape: <strong className="text-gray-900">{puzzle.metadata.shapeFamily}</strong>
            </span>
            <span className="text-gray-500">
              Complexity: <strong className="text-gray-900">{puzzle.metadata.complexityScore.toFixed(3)}</strong>
            </span>
          </div>
        )}

        {/* Renderers */}
        <div className="grid grid-cols-3 gap-6">
          <RendererPanel
            title="SVG"
            subtitle="Inline SVG — DOM elements"
            time={renderTimes['SVG']}
            ref={svgContainerRef}
          />
          <RendererPanel
            title="Canvas 2D"
            subtitle="HTML5 Canvas — 2D Context"
            time={renderTimes['Canvas']}
            ref={canvasContainerRef}
          />
          <RendererPanel
            title="PixiJS v8"
            subtitle="WebGL / WebGPU — Hardware"
            time={renderTimes['PixiJS']}
            ref={pixiContainerRef}
          />
        </div>

        {/* Comparison Table */}
        {Object.keys(renderTimes).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Render Time Comparison
            </h3>
            <div className="space-y-2">
              {Object.entries(renderTimes)
                .sort(([, a], [, b]) => a - b)
                .map(([name, time]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-16">{name}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (time / Math.max(...Object.values(renderTimes))) * 100)}%`,
                          backgroundColor: time === Math.min(...Object.values(renderTimes)) ? '#22c55e' : '#94a3b8',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-20 text-right">
                      {time.toFixed(2)} ms
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

import { forwardRef } from 'react';

const RendererPanel = forwardRef<
  HTMLDivElement,
  { title: string; subtitle: string; time?: number }
>(function RendererPanel({ title, subtitle, time }, ref) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
        {time !== undefined && (
          <p className="text-xs font-mono text-gray-400 mt-1">
            {time.toFixed(2)} ms
          </p>
        )}
      </div>
      <div
        ref={ref}
        className="flex items-center justify-center min-h-[300px] bg-[#F7F7F7]"
      />
    </div>
  );
});
