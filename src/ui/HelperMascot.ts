import Phaser from 'phaser';
import { bounceIn } from '../animations/AnimationHelpers';

const MESSAGES = [
  'Wow!', 'Amazing!', 'Pretty!',
  'So cool!', 'Keep going!', 'Beautiful!',
  'You rock!', 'Love it!',
];

const MASCOT_X  = 955;
const MASCOT_Y  = 390;
const BUBBLE_Y  = 310;

export class HelperMascot {
  private scene: Phaser.Scene;
  private face!: Phaser.GameObjects.Arc;
  private bubbleText!: Phaser.GameObjects.Text;
  private bubbleBg!: Phaser.GameObjects.Image;
  private cheerTimer!: Phaser.Time.TimerEvent;
  private msgIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // right panel background
    scene.add.rectangle(955, 384, 150, 768, 0x1A237E, 0.85).setDepth(19);

    // mascot face — drawn as graphics
    this.face = scene.add.circle(MASCOT_X, MASCOT_Y, 52, 0xFFCC00).setDepth(20);
    // eyes
    scene.add.circle(MASCOT_X - 16, MASCOT_Y - 12, 7, 0x222222).setDepth(21);
    scene.add.circle(MASCOT_X + 16, MASCOT_Y - 12, 7, 0x222222).setDepth(21);
    // smile
    const smileGfx = scene.add.graphics().setDepth(21);
    smileGfx.lineStyle(4, 0x222222, 1);
    smileGfx.beginPath();
    smileGfx.arc(MASCOT_X, MASCOT_Y + 5, 20, 0.2, Math.PI - 0.2);
    smileGfx.strokePath();

    // speech bubble
    this.bubbleBg = scene.add.image(MASCOT_X, BUBBLE_Y, 'paint_bubble')
      .setDepth(20)
      .setAlpha(0);
    this.bubbleText = scene.add.text(MASCOT_X, BUBBLE_Y, '', {
      fontSize: '18px', color: '#333333',
      fontFamily: 'Arial', fontStyle: 'bold',
      wordWrap: { width: 200 },
    }).setOrigin(0.5).setDepth(21).setAlpha(0);

    // idle bounce
    scene.tweens.add({
      targets: this.face,
      y: MASCOT_Y - 6,
      duration: 900, yoyo: true, loop: -1, ease: 'Sine.InOut',
    });

    // random cheer timer: every 12–20 seconds
    this.scheduleCheer();
  }

  cheer(): void {
    const msg = MESSAGES[this.msgIndex % MESSAGES.length];
    this.msgIndex++;
    this.bubbleText.setText(msg).setAlpha(1);
    this.bubbleBg.setAlpha(1);
    bounceIn(this.scene, this.bubbleBg);

    this.scene.time.delayedCall(2200, () => {
      this.scene.tweens.add({
        targets: [this.bubbleBg, this.bubbleText],
        alpha: 0, duration: 400,
      });
    });
  }

  private scheduleCheer(): void {
    const delay = Phaser.Math.Between(12000, 20000);
    this.cheerTimer = this.scene.time.delayedCall(delay, () => {
      this.cheer();
      this.scheduleCheer();
    });
  }

  destroy(): void {
    this.cheerTimer?.remove();
  }
}
