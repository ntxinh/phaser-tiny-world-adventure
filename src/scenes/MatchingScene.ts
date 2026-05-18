import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';
import { squashStretch, celebrationParticles } from '../animations/AnimationHelpers';

interface Pair {
  itemTexture: string;
  zoneTexture: string;
  zoneKey: string;
  itemLabel: string;
  zoneLabel: string;
}

export class MatchingScene extends Phaser.Scene {
  private matchedCount = 0;
  private readonly pairs: Pair[] = [
    { itemTexture: 'item_banana', zoneTexture: 'zone_yellowBasket', zoneKey: 'yellowBasket', itemLabel: 'Banana', zoneLabel: 'Basket' },
    { itemTexture: 'item_lion',   zoneTexture: 'zone_savanna',      zoneKey: 'savanna',      itemLabel: 'Lion',   zoneLabel: 'Savanna'},
    { itemTexture: 'item_fish',   zoneTexture: 'zone_water',        zoneKey: 'water',        itemLabel: 'Fish',   zoneLabel: 'Water'  },
  ];

  constructor() { super({ key: 'MatchingScene' }); }

  create(): void {
    this.matchedCount = 0;

    this.add.rectangle(512, 384, 1024, 768, 0xE3F2FD);

    this.add.text(512, 55, 'Match them!', {
      fontSize: '52px',
      color: '#1565C0',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.pairs.forEach((pair, i) => {
      const y = 220 + i * 175;
      const itemX = 260;
      const zoneX = 730;

      // Drop zone (right)
      const zone = this.add.zone(zoneX, y, 140, 140).setRectangleDropZone(140, 140);
      zone.name = pair.zoneKey;
      this.add.image(zoneX, y, pair.zoneTexture);
      this.add.text(zoneX, y + 80, pair.zoneLabel, {
        fontSize: '26px', color: '#1565C0', fontFamily: 'Arial',
      }).setOrigin(0.5);

      // Draggable item (left)
      const item = this.add.image(itemX, y, pair.itemTexture)
        .setInteractive()
        .setData('startX', itemX)
        .setData('startY', y)
        .setData('target', pair.zoneKey);

      this.add.text(itemX, y + 60, pair.itemLabel, {
        fontSize: '26px', color: '#1565C0', fontFamily: 'Arial',
      }).setOrigin(0.5);

      this.input.setDraggable(item);
    });

    this.setupDrag();
    new BackButton(this, () => this.scene.start('HomeScene'));
  }

  private setupDrag(): void {
    this.input.on('dragstart', (_p: unknown, go: Phaser.GameObjects.Image) => {
      this.children.bringToTop(go);
      go.setScale(1.15);
    });

    this.input.on('drag', (
      _p: unknown,
      go: Phaser.GameObjects.Image,
      x: number,
      y: number,
    ) => {
      go.x = x;
      go.y = y;
    });

    this.input.on('drop', (
      _p: unknown,
      go: Phaser.GameObjects.Image,
      dropZone: Phaser.GameObjects.Zone,
    ) => {
      if (dropZone.name === (go.getData('target') as string)) {
        go.x = dropZone.x;
        go.y = dropZone.y;
        go.setScale(1.0).disableInteractive();
        squashStretch(this, go);
        celebrationParticles(this, dropZone.x, dropZone.y);
        this.matchedCount++;
        AudioManager.playSfx('sfx_success');
        if (this.matchedCount === this.pairs.length) {
          this.time.delayedCall(800, () =>
            this.scene.launch('RewardScene', { caller: 'MatchingScene' }),
          );
        }
      } else {
        this.snapBack(go);
      }
    });

    this.input.on('dragend', (
      _p: unknown,
      go: Phaser.GameObjects.Image,
      dropped: boolean,
    ) => {
      go.setScale(1.0);
      if (!dropped) this.snapBack(go);
    });
  }

  private snapBack(item: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: item,
      x: item.getData('startX') as number,
      y: item.getData('startY') as number,
      duration: 300,
      ease: 'Back.Out',
    });
  }
}
