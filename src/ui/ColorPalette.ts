import Phaser from 'phaser';

const COLORS: number[] = [
  0xE53935, // red
  0xF4511E, // deep orange
  0xFB8C00, // orange
  0xFDD835, // yellow
  0xC0CA33, // lime
  0x43A047, // green
  0x00897B, // teal
  0x039BE5, // light blue
  0x1E88E5, // blue
  0x3949AB, // indigo
  0x8E24AA, // purple
  0xD81B60, // pink
  0x795548, // brown
  0x000000, // black
  0x9E9E9E, // grey
  0xFFFFFF, // white
];

const SWATCH_RADIUS = 26;
const SWATCH_Y      = 718;

export class ColorPalette {
  constructor(scene: Phaser.Scene, onColorChange: (color: number) => void) {
    const totalWidth = COLORS.length * (SWATCH_RADIUS * 2 + 8) - 8;
    const startX     = (1024 - totalWidth) / 2 + SWATCH_RADIUS;

    // palette background bar
    scene.add.rectangle(512, SWATCH_Y, 1024, 100, 0x212121, 0.85).setDepth(18);

    COLORS.forEach((color, i) => {
      const x = startX + i * (SWATCH_RADIUS * 2 + 8);

      if (color === 0xFFFFFF) {
        // white needs a visible border
        scene.add.circle(x, SWATCH_Y, SWATCH_RADIUS + 3, 0xCCCCCC).setDepth(19);
      }

      const swatch = scene.add.circle(x, SWATCH_Y, SWATCH_RADIUS, color)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });

      swatch.on('pointerover',  () => swatch.setScale(1.2));
      swatch.on('pointerout',   () => swatch.setScale(1.0));
      swatch.on('pointerdown',  () => {
        swatch.setScale(0.9);
        onColorChange(color);
      });
      swatch.on('pointerup',    () => swatch.setScale(1.2));
    });
  }
}
