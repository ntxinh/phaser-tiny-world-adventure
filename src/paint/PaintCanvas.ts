import Phaser from 'phaser';

export const PAINT_DEPTH = {
  BACKGROUND: 0,
  SVG_OUTLINE: 5,
  PAINT: 10,
  PARTICLES: 15,
  UI: 20,
};

export class PaintCanvas {
  readonly rt: Phaser.GameObjects.RenderTexture;
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.rt = scene.add.renderTexture(0, 0, 1024, 768);
    this.rt.setDepth(PAINT_DEPTH.PAINT);
    this.gfx = scene.make.graphics({ x: 0, y: 0 }, false);
  }

  get scene(): Phaser.Scene {
    return this.rt.scene;
  }

  drawCircle(x: number, y: number, color: number, radius: number): void {
    this.gfx.clear();
    this.gfx.fillStyle(color, 1);
    this.gfx.fillCircle(0, 0, radius);
    this.rt.draw(this.gfx, x, y);
  }

  eraseCircle(x: number, y: number, radius: number): void {
    this.gfx.clear();
    this.gfx.fillStyle(0xffffff, 1);
    this.gfx.fillCircle(0, 0, radius);
    this.rt.erase(this.gfx, x, y);
  }

  clear(): void {
    this.rt.clear();
  }

  snapshot(onDone: (dataUrl: string) => void): void {
    this.rt.snapshot((img) => {
      onDone((img as HTMLImageElement).src);
    });
  }

  loadFromDataUrl(dataUrl: string, onDone: () => void): void {
    const key = `__restore_${Date.now()}`;
    this.rt.scene.textures.once(`addtexture-${key}`, () => {
      this.rt.clear();
      this.rt.drawFrame(key, undefined, 0, 0);
      this.rt.scene.textures.remove(key);
      onDone();
    });
    this.rt.scene.textures.addBase64(key, dataUrl);
  }

  destroy(): void {
    this.gfx.destroy();
    this.rt.destroy();
  }
}
