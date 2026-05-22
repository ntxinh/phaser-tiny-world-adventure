import { PaintCanvas } from '../PaintCanvas';
import { IBrush } from './IBrush';

export class ClassicBrush implements IBrush {
  draw(canvas: PaintCanvas, x: number, y: number, color: number, size: number): void {
    canvas.drawCircle(x, y, color, size);
  }
}
