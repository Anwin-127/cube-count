import type { Puzzle } from '../models/Puzzle';

/**
 * Common interface for all puzzle renderers.
 *
 * Implementations must be purely visual — they consume
 * immutable Puzzle data and produce graphics. They must never
 * contain gameplay logic, validate answers, or store state.
 *
 * The application is renderer-agnostic. Swapping implementations
 * requires only changing the factory function, not the calling code.
 */
export interface PuzzleRenderer {
  /** Mount the renderer into a DOM container element. */
  mount(container: HTMLElement): void;

  /** Render a puzzle, replacing any previous render. */
  render(puzzle: Puzzle): void;

  /** Clean up all resources and remove from DOM. */
  destroy(): void;
}

/**
 * Configuration for the isometric renderer.
 */
export interface RendererConfig {
  /** Width of a single isometric tile in pixels. */
  readonly tileWidth: number;
  /** Height of a single isometric tile base in pixels (typically tileWidth / 2). */
  readonly tileHeight: number;
  /** Vertical height of a single cube in pixels. */
  readonly cubeHeight: number;
}

/**
 * Default renderer configuration.
 * These values produce standard 2:1 isometric projection.
 */
export const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  tileWidth: 48,
  tileHeight: 24,
  cubeHeight: 24,
};

/**
 * Information about the most recent render pass.
 * Available after each call to render().
 */
export interface RenderInfo {
  /** Time spent rendering in milliseconds. */
  readonly renderTimeMs: number;
  /** Number of cubes drawn. */
  readonly cubeCount: number;
  /** Number of polygons drawn (3 per cube). */
  readonly polygonCount: number;
  /** Canvas pixel width (CSS pixels). */
  readonly canvasWidth: number;
  /** Canvas pixel height (CSS pixels). */
  readonly canvasHeight: number;
  /** Scale factor applied to fit the viewport. */
  readonly scaleFactor: number;
  /** Device pixel ratio used for HiDPI rendering. */
  readonly devicePixelRatio: number;
}

/**
 * Minimum padding (CSS pixels) around the rendered scene.
 */
export const MIN_SCENE_PADDING = 24;

/**
 * Maximum scale factor to prevent oversized rendering.
 */
export const MAX_SCALE_FACTOR = 4.0;
