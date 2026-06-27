import type { PuzzleRenderer, RendererConfig, RenderInfo } from './types';
import {
  DEFAULT_RENDERER_CONFIG,
  MIN_SCENE_PADDING,
  MAX_SCALE_FACTOR,
} from './types';
import type { Puzzle } from '../models/Puzzle';
import {
  gridToScreen,
  getCubeFaces,
  calculateCanvasSize,
  iterateCubesInDrawOrder,
} from './isometric';
import type { Point } from './isometric';
import { CUBE_COLORS, RENDERER_BG, OUTLINE_WIDTH } from './colors';

/**
 * Production-quality HTML5 Canvas 2D isometric puzzle renderer.
 *
 * Features:
 *   - Responsive: automatically scales to fit its container
 *   - HiDPI: renders at devicePixelRatio for crisp output
 *   - Centered: scene is always centered within the viewport
 *   - Performant: draws only when render() is called
 *   - No dependencies: uses native Canvas 2D API
 *
 * The renderer reads its container's dimensions on each render()
 * call and scales the isometric scene to fit with proper padding.
 */
export class CanvasRenderer implements PuzzleRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private readonly config: RendererConfig;

  /** Information from the most recent render pass. */
  private _lastRenderInfo: RenderInfo | null = null;

  constructor(config: RendererConfig = DEFAULT_RENDERER_CONFIG) {
    this.config = config;
  }

  /** Returns info from the last render pass, or null if not yet rendered. */
  get lastRenderInfo(): RenderInfo | null {
    return this._lastRenderInfo;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';

    // Accessibility: canvas gets a role and fallback text
    this.canvas.setAttribute('role', 'img');
    this.canvas.textContent = 'Isometric puzzle — a 3D arrangement of cubes';

    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);
  }

  render(puzzle: Puzzle): void {
    if (!this.canvas || !this.ctx || !this.container) return;

    const startTime = performance.now();

    // ── 1. Calculate natural scene dimensions ──────────────────────
    const natural = calculateCanvasSize(
      puzzle.boardSize,
      puzzle.maximumHeight,
      this.config,
    );

    // ── 2. Measure viewport (container size) ──────────────────────
    const viewW = this.container.clientWidth;
    const viewH = this.container.clientHeight;

    // Guard against zero-size container (e.g., hidden element)
    if (viewW === 0 || viewH === 0) return;

    // ── 3. Calculate scale factor ─────────────────────────────────
    const availableW = viewW - MIN_SCENE_PADDING * 2;
    const availableH = viewH - MIN_SCENE_PADDING * 2;
    const scale = Math.min(
      availableW / natural.width,
      availableH / natural.height,
      MAX_SCALE_FACTOR,
    );

    // ── 4. Calculate centering offset ─────────────────────────────
    const scaledW = natural.width * scale;
    const scaledH = natural.height * scale;
    const offsetX = (viewW - scaledW) / 2;
    const offsetY = (viewH - scaledH) / 2;

    // ── 5. Set canvas pixel dimensions (HiDPI) ───────────────────
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = viewW * dpr;
    this.canvas.height = viewH * dpr;
    this.canvas.style.width = `${viewW}px`;
    this.canvas.style.height = `${viewH}px`;

    // Update ARIA label with puzzle info
    this.canvas.setAttribute(
      'aria-label',
      `Isometric puzzle with ${puzzle.totalCubes} cubes, ` +
        `maximum height ${puzzle.maximumHeight}, ` +
        `shape: ${puzzle.metadata.shapeFamily}`,
    );

    const ctx = this.ctx;

    // ── 6. Clear entire canvas ────────────────────────────────────
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = RENDERER_BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // ── 7. Apply viewport transform ──────────────────────────────
    // Combines: DPR scaling → centering offset → scene scaling
    ctx.setTransform(
      scale * dpr,
      0,
      0,
      scale * dpr,
      offsetX * dpr,
      offsetY * dpr,
    );

    // ── 8. Configure drawing style ───────────────────────────────
    ctx.strokeStyle = CUBE_COLORS.outline;
    ctx.lineWidth = OUTLINE_WIDTH / scale; // Keep outline 1px regardless of scale
    ctx.lineJoin = 'round';

    // ── 9. Draw cubes in painter's algorithm order ───────────────
    let cubeCount = 0;
    for (const { col, row, stackIndex } of iterateCubesInDrawOrder(
      puzzle.heightMap,
    )) {
      const center = gridToScreen(
        col,
        row,
        stackIndex,
        natural.originX,
        natural.originY,
        this.config,
      );
      const faces = getCubeFaces(center, this.config);

      // Left face (behind)
      this.drawFace(ctx, faces.left, CUBE_COLORS.left);
      // Right face
      this.drawFace(ctx, faces.right, CUBE_COLORS.right);
      // Top face (on top)
      this.drawFace(ctx, faces.top, CUBE_COLORS.top);

      cubeCount++;
    }

    // ── 10. Store render info ────────────────────────────────────
    const renderTimeMs = performance.now() - startTime;
    this._lastRenderInfo = {
      renderTimeMs,
      cubeCount,
      polygonCount: cubeCount * 3,
      canvasWidth: viewW,
      canvasHeight: viewH,
      scaleFactor: scale,
      devicePixelRatio: dpr,
    };
  }

  destroy(): void {
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this._lastRenderInfo = null;
  }

  private drawFace(
    ctx: CanvasRenderingContext2D,
    points: readonly Point[],
    fill: string,
  ): void {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  }
}
