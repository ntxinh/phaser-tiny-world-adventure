import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import SaveManager from '../save/SaveManager';

interface BuildingConfig {
  texture: string;
  x: number;
  y: number;
  label: string;
  targetScene: string | null;
}

export class HomeScene extends Phaser.Scene {
  constructor() { super({ key: 'HomeScene' }); }

  create(): void {
    this.add.rectangle(512, 384, 1024, 768, 0x87CEEB);

    this.add.text(512, 60, 'Tiny World', {
      fontSize: '56px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#0066AA',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const stars = SaveManager.getData().stars;
    this.add.text(970, 50, `★ ${stars}`, {
      fontSize: '40px',
      color: '#FFD700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const buildings: BuildingConfig[] = [
      { texture: 'building_zoo',          x: 280, y: 340, label: 'Zoo',        targetScene: 'AnimalScene'    },
      { texture: 'building_toyStore',     x: 500, y: 340, label: 'Toy Store',  targetScene: 'MatchingScene'  },
      { texture: 'building_paintHouse',   x: 720, y: 340, label: 'Paint',      targetScene: 'ColoringScene'  },
      { texture: 'building_basketball',   x: 280, y: 560, label: 'Basketball', targetScene: 'BasketballScene'},
      { texture: 'building_locked',       x: 500, y: 560, label: '?',          targetScene: null             },
      { texture: 'building_locked',       x: 720, y: 560, label: '?',          targetScene: null             },
    ];

    buildings.forEach(({ texture, x, y, label, targetScene }) => {
      const img = this.add.image(x, y, texture);

      if (targetScene) {
        img.setInteractive({ useHandCursor: true });
        img.on('pointerover', () => img.setScale(1.1));
        img.on('pointerout', () => img.setScale(1.0));
        img.on('pointerup', () => {
          AudioManager.playSfx('sfx_success');
          this.scene.start(targetScene);
        });
      }

      this.add.text(x, y + 95, label, {
        fontSize: '28px',
        color: '#333333',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
    });

    AudioManager.playBgm('bgm_home');
  }
}
