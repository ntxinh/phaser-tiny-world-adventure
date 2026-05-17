import Phaser from 'phaser';

export class BackButton extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, onBack: () => void) {
    super(scene, 60, 60, 'btn_back');
    scene.add.existing(this);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setScale(1.15));
    this.on('pointerout', () => this.setScale(1.0));
    this.on('pointerup', onBack);
    this.setDepth(100);
  }
}
