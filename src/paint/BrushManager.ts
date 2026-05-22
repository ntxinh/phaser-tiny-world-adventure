import { PaintCanvas } from './PaintCanvas';
import { IBrush } from './brushes/IBrush';
import { ClassicBrush } from './brushes/ClassicBrush';
import { EraserBrush } from './brushes/EraserBrush';

export type BrushType = 'classic' | 'eraser';

export class BrushManager {
  private brushes: Record<BrushType, IBrush> = {
    classic: new ClassicBrush(),
    eraser:  new EraserBrush(),
  };
  private activeBrushType: BrushType = 'classic';
  private color: number = 0xFF0000;
  private size: number = 18;
  private lastX: number = -1;
  private lastY: number = -1;
  private painting: boolean = false;

  setActiveBrush(type: BrushType): void {
    this.activeBrushType = type;
  }

  getActiveBrush(): BrushType {
    return this.activeBrushType;
  }

  setColor(color: number): void {
    this.color = color;
    this.activeBrushType = 'classic';
  }

  setSize(size: number): void {
    this.size = size;
  }

  onPointerDown(canvas: PaintCanvas, x: number, y: number): void {
    this.painting = true;
    this.lastX = x;
    this.lastY = y;
    this.brushes[this.activeBrushType].draw(canvas, x, y, this.color, this.size);
  }

  onPointerMove(canvas: PaintCanvas, x: number, y: number): void {
    if (!this.painting) return;
    this.interpolate(canvas, this.lastX, this.lastY, x, y);
    this.lastX = x;
    this.lastY = y;
  }

  onPointerUp(): void {
    this.painting = false;
    this.lastX = -1;
    this.lastY = -1;
  }

  private interpolate(
    canvas: PaintCanvas,
    x0: number, y0: number,
    x1: number, y1: number,
  ): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = Math.max(1, this.size * 0.4);
    const steps = Math.ceil(dist / step);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.brushes[this.activeBrushType].draw(
        canvas,
        x0 + dx * t,
        y0 + dy * t,
        this.color,
        this.size,
      );
    }
  }
}
