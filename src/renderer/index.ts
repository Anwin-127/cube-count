/**
 * Barrel export for the rendering system.
 *
 * Exposes the common PuzzleRenderer interface, configuration,
 * render info type, and all renderer implementations.
 *
 * The application should depend only on the PuzzleRenderer
 * interface, not specific classes.
 */

export type { PuzzleRenderer, RendererConfig, RenderInfo } from './types';
export {
  DEFAULT_RENDERER_CONFIG,
  MIN_SCENE_PADDING,
  MAX_SCALE_FACTOR,
} from './types';

export { SvgRenderer } from './SvgRenderer';
export { CanvasRenderer } from './CanvasRenderer';
export { PixiRenderer } from './PixiRenderer';
