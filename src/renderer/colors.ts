/**
 * Face colors for isometric cubes.
 *
 * Uses the design system accent color (#B8FF2C) as the base,
 * with progressively darker shading for left and right faces
 * to simulate directional lighting from the top.
 *
 * These are intentionally simple flat colors.
 * Lighting, textures, and gradients will be added in a later milestone.
 */
export const CUBE_COLORS = {
  /** Top face — brightest, receives most light. */
  top: '#B8FF2C',
  /** Right face — medium shadow. */
  right: '#8FBF23',
  /** Left face — deepest shadow. */
  left: '#6E921A',
  /** Thin outline between faces. */
  outline: '#4A6110',
} as const;

/**
 * Background color for the renderer canvas.
 */
export const RENDERER_BG = '#F7F7F7';

/**
 * Outline width in pixels.
 */
export const OUTLINE_WIDTH = 1;
