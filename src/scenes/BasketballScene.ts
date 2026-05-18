import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';

const HOOP_X = 770;
const HOOP_Y = 210;
const BALL_START_X = 300;
const BALL_START_Y = 600;
const POWER_MULTIPLIER = 0.12;
const MAX_VELOCITY = 20;
const WIN_SCORE = 3;
const GRAVITY = 1;

export class BasketballScene extends Phaser.Scene {
  private ball!: Phaser.Physics.Matter.Image;
  private scoreCount = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private previewDots: Phaser.GameObjects.Arc[] = [];
  private inputEnabled = true;
  private ballInFlight = false;
  private scored = false;
  private rewardLaunched = false;

  constructor() { super({ key: 'BasketballScene' }); }

  create(): void {
    this.scoreCount = 0;
    this.inputEnabled = true;
    this.ballInFlight = false;
    this.scored = false;
    this.rewardLaunched = false;
    this.previewDots = [];

    // Background
    this.add.rectangle(512, 384, 1024, 768, 0x1B5E20);

    // Title
    this.add.text(512, 50, 'Basketball!', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#1B5E20',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(512, 105, `${this.scoreCount} / ${WIN_SCORE}`, {
      fontSize: '42px',
      color: '#FFD700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Hoop visual
    this.add.image(HOOP_X, HOOP_Y, 'hoop_back').setDepth(5);

    // Rim physics bodies (invisible — ball bounces off them)
    this.matter.add.rectangle(HOOP_X - 75, HOOP_Y + 5, 15, 25, { isStatic: true, label: 'rim' });
    this.matter.add.rectangle(HOOP_X + 75, HOOP_Y + 5, 15, 25, { isStatic: true, label: 'rim' });

    // Ball
    this.ball = this.matter.add.image(BALL_START_X, BALL_START_Y, 'ball_basketball');
    this.ball.setCircle(38);
    this.ball.setStatic(true);
    this.ball.setBounce(0.45);
    this.ball.setFriction(0.05);
    this.ball.setDepth(6);

    // Trajectory preview dots
    for (let i = 0; i < 4; i++) {
      this.previewDots.push(
        this.add.circle(0, 0, 9, 0xffffff, 0.5).setVisible(false).setDepth(7),
      );
    }

    // Input handlers
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    new BackButton(this, () => this.scene.start('HomeScene'));
  }

  update(): void {
    if (!this.ballInFlight) return;

    // Scoring zone: ball passes through hoop opening
    if (
      !this.scored &&
      this.ball.y > HOOP_Y &&
      this.ball.y < HOOP_Y + 55 &&
      Math.abs(this.ball.x - HOOP_X) < 62
    ) {
      this.scored = true;
      this.onScore();
    }

    // Out of bounds reset
    if (this.ball.y > 840 || this.ball.x < -60 || this.ball.x > 1084) {
      this.resetBall();
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.inputEnabled || this.ballInFlight) return;
    const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, BALL_START_X, BALL_START_Y);
    if (dist < 90) {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging) return;
    this.updatePreview(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.previewDots.forEach(d => d.setVisible(false));
    this.shoot(pointer);
  }

  private updatePreview(pointer: Phaser.Input.Pointer): void {
    let vx = (this.dragStartX - pointer.x) * POWER_MULTIPLIER;
    let vy = (this.dragStartY - pointer.y) * POWER_MULTIPLIER;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > MAX_VELOCITY) {
      vx = (vx / speed) * MAX_VELOCITY;
      vy = (vy / speed) * MAX_VELOCITY;
    }

    for (let i = 0; i < 4; i++) {
      const t = (i + 1) * 12;
      const px = BALL_START_X + vx * t;
      const py = BALL_START_Y + vy * t + 0.5 * GRAVITY * 0.002 * t * t;
      this.previewDots[i].setPosition(px, py).setVisible(true);
    }
  }

  private shoot(pointer: Phaser.Input.Pointer): void {
    let vx = (this.dragStartX - pointer.x) * POWER_MULTIPLIER;
    let vy = (this.dragStartY - pointer.y) * POWER_MULTIPLIER;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > MAX_VELOCITY) {
      vx = (vx / speed) * MAX_VELOCITY;
      vy = (vy / speed) * MAX_VELOCITY;
    }

    if (speed < 0.5) return; // ignore accidental micro-taps

    this.ball.setStatic(false);
    this.ball.setVelocity(vx, vy);
    this.ballInFlight = true;
    this.scored = false;
    this.inputEnabled = false;
  }

  private onScore(): void {
    this.scoreCount++;
    this.scoreText.setText(`${this.scoreCount} / ${WIN_SCORE}`);
    AudioManager.playSfx('sfx_swish');

    this.tweens.add({
      targets: this.scoreText,
      scale: 1.4,
      duration: 150,
      yoyo: true,
      ease: 'Back.Out',
    });

    if (this.scoreCount >= WIN_SCORE && !this.rewardLaunched) {
      this.rewardLaunched = true;
      this.inputEnabled = false;
      this.time.delayedCall(800, () =>
        this.scene.launch('RewardScene', { caller: 'basketball' }),
      );
      return;
    }

    this.time.delayedCall(900, () => this.resetBall());
  }

  private resetBall(): void {
    this.ballInFlight = false;
    this.scored = false;
    this.ball.setStatic(true);
    this.ball.setPosition(BALL_START_X, BALL_START_Y);
    this.ball.setVelocity(0, 0);
    this.ball.setAngularVelocity(0);
    this.inputEnabled = true;
  }
}
