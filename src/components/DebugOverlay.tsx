import { useEffect, useRef, useState } from 'react';
import type { Puzzle } from '../models/Puzzle';
import type { RenderInfo } from '../renderer/types';

interface DebugOverlayProps {
  puzzle: Puzzle | null;
  renderInfo: RenderInfo | null;
}

/**
 * Developer-only debug overlay for the puzzle renderer.
 *
 * Displays puzzle metadata, render performance, and canvas info.
 * Toggle with F2.
 *
 * This component should only be rendered when:
 *   1. import.meta.env.DEV is true
 *   2. useDebugOverlay() returns true (F2 toggled)
 */
export function DebugOverlay({ puzzle, renderInfo }: DebugOverlayProps) {
  const fps = useFpsCounter();

  return (
    <div
      className="absolute top-3 left-3 z-50 pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="bg-black/80 text-white text-[10px] leading-relaxed font-mono px-3 py-2 rounded-lg space-y-0.5 min-w-44">
        <OverlayHeading text="PUZZLE" />
        {puzzle ? (
          <>
            <OverlayRow label="Seed" value={puzzle.metadata.seed} />
            <OverlayRow label="Shape" value={puzzle.metadata.shapeFamily} />
            <OverlayRow label="Complexity" value={puzzle.metadata.complexityScore.toFixed(3)} />
            <OverlayRow label="Cubes" value={puzzle.totalCubes} />
            <OverlayRow label="Max Height" value={puzzle.maximumHeight} />
            <OverlayRow label="Hidden Est." value={puzzle.metadata.hiddenCubeEstimate} />
            <OverlayRow label="Board" value={`${puzzle.boardSize}×${puzzle.boardSize}`} />
          </>
        ) : (
          <OverlayRow label="State" value="No puzzle" />
        )}

        <OverlayHeading text="RENDER" />
        {renderInfo ? (
          <>
            <OverlayRow label="Render" value={`${renderInfo.renderTimeMs.toFixed(2)} ms`} />
            <OverlayRow label="Polygons" value={renderInfo.polygonCount} />
            <OverlayRow label="Scale" value={`${renderInfo.scaleFactor.toFixed(2)}×`} />
            <OverlayRow label="Canvas" value={`${renderInfo.canvasWidth}×${renderInfo.canvasHeight}`} />
            <OverlayRow label="DPR" value={renderInfo.devicePixelRatio.toFixed(1)} />
          </>
        ) : (
          <OverlayRow label="State" value="Not rendered" />
        )}

        <OverlayHeading text="PERF" />
        <OverlayRow label="FPS" value={fps} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OverlayHeading({ text }: { text: string }) {
  return (
    <p className="text-[9px] text-gray-400 uppercase tracking-widest pt-1 first:pt-0">
      {text}
    </p>
  );
}

function OverlayRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-green-400">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FPS counter hook
// ---------------------------------------------------------------------------

/**
 * Counts the number of animation frames per second.
 * Returns the current FPS as an integer, updated once per second.
 */
function useFpsCounter(): number {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    let rafId: number;
    lastTime.current = performance.now();

    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
