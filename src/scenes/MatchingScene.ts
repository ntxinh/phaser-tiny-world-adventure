import Phaser from 'phaser';
export class MatchingScene extends Phaser.Scene {
  constructor() { super({ key: 'MatchingScene' }); }
  create(): void {
    this.add.text(512, 384, 'Matching', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
  }
}
