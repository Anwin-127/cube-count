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

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * SVG-based isometric puzzle renderer.
 *
 * Creates an inline SVG element and draws each cube face
 * as a <polygon> element. Supports CSS styling and DOM events
 * but may be slower for large numbers of elements.
 */
export class SvgRenderer implements PuzzleRenderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  private readonly config: RendererConfig;

  constructor(config: RendererConfig = DEFAULT_RENDERER_CONFIG) {
    this.config = config;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.style.display = 'block';
    container.appendChild(this.svg);
  }

  render(puzzle: Puzzle): void {
    if (!this.svg) return;

    // Clear previous render
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    const { width, height, originX, originY } = calculateCanvasSize(
      puzzle.boardSize,
      puzzle.maximumHeight,
      this.config,
    );

    this.svg.setAttribute('width', String(width));
    this.svg.setAttribute('height', String(height));
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Background
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', String(width));
    bg.setAttribute('height', String(height));
    bg.setAttribute('fill', RENDERER_BG);
    this.svg.appendChild(bg);

    // Draw cubes in painter's algorithm order
    for (const { col, row, stackIndex } of iterateCubesInDrawOrder(puzzle.heightMap)) {
      const center = gridToScreen(col, row, stackIndex, originX, originY, this.config);
      const faces = getCubeFaces(center, this.config);

      // Left face (draw first — behind)
      this.svg.appendChild(
        this.createPolygon(faces.left, CUBE_COLORS.left),
      );
      // Right face
      this.svg.appendChild(
        this.createPolygon(faces.right, CUBE_COLORS.right),
      );
      // Top face (draw last — on top)
      this.svg.appendChild(
        this.createPolygon(faces.top, CUBE_COLORS.top),
      );
    }
  }

  destroy(): void {
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
    }
    this.svg = null;
    this.container = null;
  }

  private createPolygon(
    points: readonly Point[],
    fill: string,
  ): SVGPolygonElement {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    const pointsStr = points
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', fill);
    polygon.setAttribute('stroke', CUBE_COLORS.outline);
    polygon.setAttribute('stroke-width', String(OUTLINE_WIDTH));
    polygon.setAttribute('stroke-linejoin', 'round');
    return polygon;
  }
}
