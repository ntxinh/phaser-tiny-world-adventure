import Phaser from 'phaser';
export class RewardScene extends Phaser.Scene {
  constructor() { super({ key: 'RewardScene' }); }
  create(): void {
    this.add.text(512, 384, 'Reward!', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
  }
}
