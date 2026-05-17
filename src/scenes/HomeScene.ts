import Phaser from 'phaser';
export class HomeScene extends Phaser.Scene {
  constructor() { super({ key: 'HomeScene' }); }
  create(): void {
    this.add.text(512, 384, 'Home', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
  }
}
