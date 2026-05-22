import { PaintCanvas } from '../PaintCanvas';

export interface IBrush {
  draw(canvas: PaintCanvas, x: number, y: number, color: number, size: number): void;
}
