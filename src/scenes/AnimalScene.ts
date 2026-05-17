import Phaser from 'phaser';
export class AnimalScene extends Phaser.Scene {
  constructor() { super({ key: 'AnimalScene' }); }
  create(): void {
    this.add.text(512, 384, 'Animals', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
  }
}
