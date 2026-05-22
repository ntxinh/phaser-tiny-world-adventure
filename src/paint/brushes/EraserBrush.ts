import { PaintCanvas } from '../PaintCanvas';
import { IBrush } from './IBrush';

export class EraserBrush implements IBrush {
  draw(canvas: PaintCanvas, x: number, y: number, _color: number, size: number): void {
    canvas.eraseCircle(x, y, size * 1.5);
  }
}
