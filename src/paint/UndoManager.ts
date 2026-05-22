import { PaintCanvas } from './PaintCanvas';

export class UndoManager {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private pending: boolean = false;
  private readonly maxSteps: number;

  constructor(private canvas: PaintCanvas, maxSteps = 50) {
    this.maxSteps = maxSteps;
  }

  snapshot(): void {
    if (this.pending) return;
    this.pending = true;
    this.canvas.snapshot((dataUrl) => {
      this.undoStack.push(dataUrl);
      if (this.undoStack.length > this.maxSteps) {
        this.undoStack.shift();
      }
      this.redoStack = [];
      this.pending = false;
    });
  }

  undo(onDone?: () => void): void {
    if (!this.canUndo() || this.pending) return;
    this.pending = true;
    // Current state becomes redo entry — snapshot before restoring
    this.canvas.snapshot((currentUrl) => {
      this.redoStack.push(currentUrl);
      const prev = this.undoStack.pop()!;
      this.canvas.loadFromDataUrl(prev, () => {
        this.pending = false;
        onDone?.();
      });
    });
  }

  redo(onDone?: () => void): void {
    if (!this.canRedo() || this.pending) return;
    this.pending = true;
    this.canvas.snapshot((currentUrl) => {
      this.undoStack.push(currentUrl);
      const next = this.redoStack.pop()!;
      this.canvas.loadFromDataUrl(next, () => {
        this.pending = false;
        onDone?.();
      });
    });
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.pending = false;
  }
}
