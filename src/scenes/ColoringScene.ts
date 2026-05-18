import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';
import { celebrationParticles } from '../animations/AnimationHelpers';

interface RegionDef {
  key: string;
  x: number;
  y: number;
  depth: number;
}

interface PaletteDef {
  key: string;
  color: number;
  x: number;
}

const REGIONS: RegionDef[] = [
  { key: 'lion_tail',  x: 655, y: 530, depth: 1 },
  { key: 'lion_body',  x: 512, y: 510, depth: 2 },
  { key: 'lion_mane',  x: 512, y: 395, depth: 3 },
  { key: 'lion_face',  x: 512, y: 305, depth: 4 },
  { key: 'lion_ears',  x: 512, y: 235, depth: 5 },
];

const PALETTE: PaletteDef[] = [
  { key: 'color_red',    color: 0xE53935, x: 237 },
  { key: 'color_yellow', color: 0xFDD835, x: 347 },
  { key: 'color_orange', color: 0xFF6D00, x: 457 },
  { key: 'color_green',  color: 0x43A047, x: 567 },
  { key: 'color_blue',   color: 0x1E88E5, x: 677 },
  { key: 'color_purple', color: 0x8E24AA, x: 787 },
];

const DEFAULT_TINT = 0xdddddd;

export class ColoringScene extends Phaser.Scene {
  private selectedColor = 0xE53935; // default: red
  private coloredSet = new Set<string>();
  private regionImages: Map<string, Phaser.GameObjects.Image> = new Map();
  private rewardLaunched = false;

  constructor() { super({ key: 'ColoringScene' }); }

  create(): void {
    this.coloredSet.clear();
    this.regionImages.clear();
    this.rewardLaunched = false;

    // Background
    this.add.rectangle(512, 384, 1024, 768, 0xFCE4EC);

    // Title
    this.add.text(512, 55, 'Color the Lion!', {
      fontSize: '48px',
      color: '#AD1457',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#FCE4EC',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Palette
    PALETTE.forEach(({ key, color, x }) => {
      const circle = this.add.image(x, 130, key)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);
      circle.on('pointerover', () => circle.setScale(1.15));
      circle.on('pointerout', () => circle.setScale(1.0));
      circle.on('pointerup', () => {
        this.selectedColor = color;
        AudioManager.playSfx('sfx_tap_color');
      });
    });

    // Lion regions
    REGIONS.forEach(({ key, x, y, depth }) => {
      const img = this.add.image(x, y, key)
        .setTint(DEFAULT_TINT)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth);
      this.regionImages.set(key, img);

      img.on('pointerover', () => img.setScale(1.05));
      img.on('pointerout', () => img.setScale(1.0));
      img.on('pointerup', () => this.onRegionTap(key, img));
    });

    // Outline drawn on top of all regions
    this.drawOutline();

    new BackButton(this, () => this.scene.start('HomeScene'));
  }

  private onRegionTap(key: string, img: Phaser.GameObjects.Image): void {
    img.setTint(this.selectedColor);
    this.coloredSet.add(key);
    AudioManager.playSfx('sfx_tap_color');

    this.tweens.add({
      targets: img,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Back.Out',
    });

    celebrationParticles(this, img.x, img.y);

    if (this.coloredSet.size === REGIONS.length && !this.rewardLaunched) {
      this.rewardLaunched = true;
      this.regionImages.forEach(r => r.disableInteractive());
      this.time.delayedCall(600, () =>
        this.scene.launch('RewardScene', { caller: 'coloring' }),
      );
    }
  }

  private drawOutline(): void {
    const gfx = this.add.graphics().setDepth(10);
    gfx.lineStyle(5, 0x5D4037, 1);
    // body
    gfx.strokeRoundedRect(412, 440, 200, 140, 10);
    // mane
    gfx.strokeCircle(512, 395, 80);
    // face
    gfx.strokeCircle(512, 305, 50);
    // ears
    gfx.strokeRoundedRect(432, 218, 160, 35, 8);
    // tail
    gfx.strokeRect(643, 490, 25, 80);
  }
}
