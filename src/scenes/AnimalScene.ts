import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';

interface AnimalConfig {
  texture: string;
  label: string;
  voiceKey: string;
  sfxKey: string;
}

export class AnimalScene extends Phaser.Scene {
  private tappedSet = new Set<string>();
  private animalImages: Phaser.GameObjects.Image[] = [];
  private readonly animals: AnimalConfig[] = [
    { texture: 'animal_lion',     label: 'Lion',     voiceKey: 'voice_lion',     sfxKey: 'sfx_roar'    },
    { texture: 'animal_elephant', label: 'Elephant', voiceKey: 'voice_elephant', sfxKey: 'sfx_trumpet' },
    { texture: 'animal_giraffe',  label: 'Giraffe',  voiceKey: 'voice_giraffe',  sfxKey: 'sfx_hee'     },
    { texture: 'animal_monkey',   label: 'Monkey',   voiceKey: 'voice_monkey',   sfxKey: 'sfx_chatter' },
    { texture: 'animal_tiger',    label: 'Tiger',    voiceKey: 'voice_tiger',    sfxKey: 'sfx_growl'   },
    { texture: 'animal_bunny',    label: 'Bunny',    voiceKey: 'voice_bunny',    sfxKey: 'sfx_squeak'  },
  ];

  constructor() { super({ key: 'AnimalScene' }); }

  create(): void {
    this.tappedSet.clear();
    this.animalImages = [];

    this.add.rectangle(512, 384, 1024, 768, 0xFFF8E7);

    this.add.text(512, 55, 'Animal Safari!', {
      fontSize: '52px',
      color: '#5D4037',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#FFF9C4',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const cols = 3;
    const startX = 210;
    const startY = 230;
    const spacingX = 220;
    const spacingY = 230;

    this.animals.forEach((animal, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const img = this.add.image(x, y, animal.texture)
        .setInteractive({ useHandCursor: true });
      this.animalImages.push(img);

      this.add.text(x, y + 70, animal.label, {
        fontSize: '28px',
        color: '#5D4037',
        fontFamily: 'Arial',
      }).setOrigin(0.5);

      img.on('pointerover', () => img.setScale(1.1));
      img.on('pointerout', () => {
        if (!this.tappedSet.has(animal.texture)) img.setScale(1.0);
      });
      img.on('pointerup', () => this.onAnimalTap(img, animal));
    });

    new BackButton(this, () => this.scene.start('HomeScene'));
  }

  private onAnimalTap(img: Phaser.GameObjects.Image, animal: AnimalConfig): void {
    AudioManager.playVoice(animal.voiceKey);
    AudioManager.playSfx(animal.sfxKey);

    this.tweens.add({
      targets: img,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: 'Back.Out',
    });

    this.tappedSet.add(animal.texture);

    if (this.tappedSet.size === this.animals.length) {
      this.animalImages.forEach(a => a.disableInteractive());
      this.time.delayedCall(600, () =>
        this.scene.launch('RewardScene', { caller: 'AnimalScene' }),
      );
    }
  }
}
