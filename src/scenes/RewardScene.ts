import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import SaveManager from '../save/SaveManager';

export class RewardScene extends Phaser.Scene {
  private callerKey = '';

  constructor() { super({ key: 'RewardScene' }); }

  init(data: Record<string, unknown>): void {
    this.callerKey = (data['caller'] as string | undefined) ?? '';
  }

  create(): void {
    // Dimmed overlay
    this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.55);

    // Card
    this.add.rectangle(512, 384, 620, 380, 0xFFF9C4).setStrokeStyle(6, 0xFFD700);

    this.add.text(512, 300, 'Great Job!', {
      fontSize: '64px',
      color: '#FF6F00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#FFD700',
      strokeThickness: 4,
    }).setOrigin(0.5);

    SaveManager.addStars(3);
    const total = SaveManager.getData().stars;

    this.add.text(512, 395, `★ ${total} stars total!`, {
      fontSize: '38px',
      color: '#5D4037',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.spawnConfetti();

    AudioManager.playVoice('voice_greatjob');
    AudioManager.playSfx('sfx_success');

    this.time.delayedCall(3000, () => {
      if (this.callerKey) this.scene.stop(this.callerKey);
      this.scene.stop('RewardScene');
      this.scene.start('HomeScene');
    });
  }

  private spawnConfetti(): void {
    const colors = [0xFFD700, 0xFF6B6B, 0x6BCB77, 0x4D96FF, 0xFF922B];
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(200, 820);
      const y = Phaser.Math.Between(160, 620);
      const color = colors[i % colors.length];
      const dot = this.add.rectangle(x, y, 18, 18, color)
        .setRotation(Phaser.Math.DegToRad(Phaser.Math.Between(0, 90)));
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(80, 220),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(1000, 2500),
        delay: Phaser.Math.Between(0, 800),
        ease: 'Power2',
      });
    }
  }
}
