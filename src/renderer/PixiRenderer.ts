import type { PuzzleRenderer, RendererConfig } from './types';
import { DEFAULT_RENDERER_CONFIG } from './types';
import type { Puzzle } from '../models/Puzzle';
import {
  gridToScreen,
  getCubeFaces,
  calculateCanvasSize,
  iterateCubesInDrawOrder,
} from './isometric';
import type { Point } from './isometric';
import { CUBE_COLORS, RENDERER_BG, OUTLINE_WIDTH } from './colors';
import { Application, Graphics } from 'pixi.js';

/**
 * PixiJS v8 isometric puzzle renderer.
 *
 * Uses the PixiJS WebGL/WebGPU renderer via the Application class.
 * Provides hardware-accelerated rendering and a rich scene graph
 * suitable for future animations and interactions.
 *
 * Note: PixiJS Application.init() is async, so the first render
 * may be delayed by a frame. Subsequent renders are synchronous.
 */
export class PixiRenderer implements PuzzleRenderer {
  private app: Application | null = null;
  private container: HTMLElement | null = null;
  private readonly config: RendererConfig;
  private initPromise: Promise<void> | null = null;
  private destroyed = false;

  constructor(config: RendererConfig = DEFAULT_RENDERER_CONFIG) {
    this.config = config;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.destroyed = false;
    this.app = new Application();
  }

  render(puzzle: Puzzle): void {
    if (!this.app || !this.container || this.destroyed) return;

    const { width, height, originX, originY } = calculateCanvasSize(
      puzzle.boardSize,
      puzzle.maximumHeight,
      this.config,
    );

    const drawScene = () => {
      if (!this.app || this.destroyed) return;

      // Clear previous render
      this.app.stage.removeChildren();

      const graphics = new Graphics();

      // Draw cubes in painter's algorithm order
      for (const { col, row, stackIndex } of iterateCubesInDrawOrder(puzzle.heightMap)) {
        const center = gridToScreen(col, row, stackIndex, originX, originY, this.config);
        const faces = getCubeFaces(center, this.config);

        // Left face (behind)
        this.drawFace(graphics, faces.left, CUBE_COLORS.left);
        // Right face
        this.drawFace(graphics, faces.right, CUBE_COLORS.right);
        // Top face (on top)
        this.drawFace(graphics, faces.top, CUBE_COLORS.top);
      }

      this.app.stage.addChild(graphics);
    };

    if (!this.initPromise) {
      // First render: initialize the PixiJS application
      this.initPromise = this.app
        .init({
          width,
          height,
          background: RENDERER_BG,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })
        .then(() => {
          if (!this.app || !this.container || this.destroyed) return;
          this.container.appendChild(this.app.canvas);
          drawScene();
        });
    } else {
      // Subsequent renders: resize if needed and redraw
      this.initPromise.then(() => {
        if (!this.app || this.destroyed) return;
        this.app.renderer.resize(width, height);
        drawScene();
      });
    }
  }

  destroy(): void {
    this.destroyed = true;
    const app = this.app;
    const promise = this.initPromise;

    // Clear references immediately to prevent further use
    this.app = null;
    this.container = null;
    this.initPromise = null;

    if (!app) return;

    if (promise) {
      // Init may or may not have completed — wait for it, then destroy
      promise
        .then(() => {
          try {
            app.destroy(true, { children: true });
          } catch {
            // Swallow: app may already be in a broken state
          }
        })
        .catch(() => {
          // Init itself failed — nothing to destroy
        });
    }
    // If no initPromise, app was created but never initialized — just drop it
  }

  private drawFace(
    graphics: Graphics,
    points: readonly Point[],
    fill: string,
  ): void {
    graphics
      .poly(points.map((p) => p.x).flatMap((x, i) => [x, points[i].y]))
      .fill(fill)
      .stroke({ color: CUBE_COLORS.outline, width: OUTLINE_WIDTH });
  }
}
