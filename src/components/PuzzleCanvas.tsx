import { useEffect, useRef, memo } from 'react';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import type { RenderInfo } from '../renderer/types';
import type { Puzzle } from '../models/Puzzle';

/**
 * Props for the PuzzleCanvas component.
 */
export interface PuzzleCanvasProps {
  /** The puzzle to render. Pass null to show a blank canvas. */
  puzzle: Puzzle | null;
  /** Optional CSS class name for the container div. */
  className?: string;
  /** Callback fired after each render with timing data. */
  onRenderInfo?: (info: RenderInfo) => void;
}

/**
 * React wrapper component for the Canvas 2D puzzle renderer.
 *
 * This is the ONLY component that directly communicates with
 * the CanvasRenderer class. All other components interact with
 * the puzzle through React state.
 *
 * Responsibilities:
 *   - Mounts and destroys the renderer with React lifecycle
 *   - Re-renders when the puzzle reference changes
 *   - Handles responsive resizing via ResizeObserver
 *   - Maintains proper devicePixelRatio scaling
 *   - Avoids unnecessary re-renders via React.memo
 *
 * The container div fills its parent — the parent controls sizing.
 */
function PuzzleCanvasInner({
  puzzle,
  className,
  onRenderInfo,
}: PuzzleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const puzzleRef = useRef<Puzzle | null>(null);
  const onRenderInfoRef = useRef(onRenderInfo);

  // Sync the callback ref in an effect (not during render)
  useEffect(() => {
    onRenderInfoRef.current = onRenderInfo;
  }, [onRenderInfo]);

  // Mount the renderer once
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new CanvasRenderer();
    renderer.mount(containerRef.current);
    rendererRef.current = renderer;

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Re-render when puzzle changes
  useEffect(() => {
    puzzleRef.current = puzzle;

    if (!puzzle || !rendererRef.current) return;

    rendererRef.current.render(puzzle);

    if (rendererRef.current.lastRenderInfo && onRenderInfoRef.current) {
      onRenderInfoRef.current(rendererRef.current.lastRenderInfo);
    }
  }, [puzzle]);

  // Handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      const currentPuzzle = puzzleRef.current;
      if (!currentPuzzle || !rendererRef.current) return;

      rendererRef.current.render(currentPuzzle);

      if (rendererRef.current.lastRenderInfo && onRenderInfoRef.current) {
        onRenderInfoRef.current(rendererRef.current.lastRenderInfo);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
      tabIndex={-1}
      role="figure"
      aria-label="Isometric puzzle display"
    >
      {/* Fallback text if canvas fails to initialize */}
      <noscript>
        <p>JavaScript is required to display the puzzle.</p>
      </noscript>
    </div>
  );
}

/**
 * Memoized PuzzleCanvas — only re-renders when the puzzle
 * reference or className changes. onRenderInfo is excluded
 * from the comparison because it's stored in a ref.
 */
export const PuzzleCanvas = memo(PuzzleCanvasInner, (prev, next) => {
  return prev.puzzle === next.puzzle && prev.className === next.className;
});

PuzzleCanvas.displayName = 'PuzzleCanvas';
