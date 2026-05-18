import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import SaveManagerInstance from '../save/SaveManager';
import { SaveManager, PetState } from '../save/SaveManager';
import { BackButton } from '../ui/BackButton';
import {
  bounceIn,
  squashStretch,
  celebrationParticles,
} from '../animations/AnimationHelpers';
import { PetStateManager, ActivityType } from '../pet/PetStateManager';

const MASCOT_COLORS: Record<string, number> = {
  dino:  0x66BB6A,
  bunny: 0xF8BBD9,
  panda: 0xE0E0E0,
  alien: 0x80DEEA,
};

const MASCOT_LABELS: Record<string, string> = {
  dino:  'Dino 🦕',
  bunny: 'Bunny 🐰',
  panda: 'Panda 🐼',
  alien: 'Alien 👾',
};

type BarKey = 'hunger' | 'energy' | 'cleanliness';

interface BarConfig {
  key: BarKey;
  label: string;
  color: number;
  cx: number;
}

const BAR_CONFIGS: BarConfig[] = [
  { key: 'hunger',      label: 'hunger',  color: 0xFF7043, cx: 220 },
  { key: 'energy',      label: 'energy',  color: 0xFFCA28, cx: 512 },
  { key: 'cleanliness', label: 'clean',   color: 0x42A5F5, cx: 800 },
];

const BAR_Y = 700;
const BAR_W = 160;
const BAR_H = 20;

export class PetScene extends Phaser.Scene {
  private petMgr!: PetStateManager;
  private mascotRect!: Phaser.GameObjects.Rectangle;
  private mascotLabel!: Phaser.GameObjects.Text;
  private moodText!: Phaser.GameObjects.Text;
  private barFills: Partial<Record<BarKey, Phaser.GameObjects.Rectangle>> = {};
  private pickerOverlay!: Phaser.GameObjects.Container;
  private pickerCloseBtn!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'PetScene' }); }

  create(): void {
    this.petMgr = new PetStateManager(SaveManagerInstance);
    this.petMgr.applyDecay();

    this.add.rectangle(512, 384, 1024, 768, 0xE8F5E9);

    this.add.text(512, 50, 'My Pet', {
      fontSize: '52px',
      color: '#2E7D32',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#C8E6C9',
      strokeThickness: 4,
    }).setOrigin(0.5);

    new BackButton(this, () => {
      this.petMgr.save();
      this.scene.start('HomeScene');
    });

    this.renderGearButton();
    this.renderMascot();
    this.renderMoodBubble();
    this.renderStatusBars();
    this.renderActivityButtons();
    this.buildMascotPickerOverlay();

    if (!this.petMgr.getState().mascot) {
      this.showMascotPicker(false);
    }

    AudioManager.playBgm('bgm_home');
  }

  private renderGearButton(): void {
    const btn = this.add.text(950, 50, '⚙', {
      fontSize: '44px',
      color: '#555555',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setScale(1.2));
    btn.on('pointerout', () => btn.setScale(1.0));
    btn.on('pointerup', () => this.showMascotPicker(true));
  }

  private renderMascot(): void {
    const { mascot } = this.petMgr.getState();
    const color = mascot ? MASCOT_COLORS[mascot] : 0xBDBDBD;
    this.mascotRect = this.add.rectangle(512, 280, 180, 180, color);
    this.mascotRect.setStrokeStyle(4, 0x888888);
    this.mascotLabel = this.add.text(512, 280, mascot ? MASCOT_LABELS[mascot] : '?', {
      fontSize: '42px',
      color: '#333333',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  private renderMoodBubble(): void {
    this.moodText = this.add.text(512, 390, this.petMgr.getMoodText(), {
      fontSize: '26px',
      color: '#388E3C',
      fontFamily: 'Arial',
      fontStyle: 'italic',
    }).setOrigin(0.5);
  }

  private renderStatusBars(): void {
    const state = this.petMgr.getState();
    BAR_CONFIGS.forEach(({ key, label, color, cx }) => {
      this.add.text(cx, BAR_Y - 24, label, {
        fontSize: '20px',
        color: '#555555',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.add.rectangle(cx, BAR_Y, BAR_W, BAR_H, 0xE0E0E0);
      const w = Math.max(4, (state[key] / 100) * BAR_W);
      const fill = this.add.rectangle(cx - BAR_W / 2 + w / 2, BAR_Y, w, BAR_H, color);
      this.barFills[key] = fill;
    });
  }

  private refreshStatusBars(): void {
    const state = this.petMgr.getState();
    BAR_CONFIGS.forEach(({ key, cx }) => {
      const fill = this.barFills[key];
      if (!fill) return;
      const w = Math.max(4, (state[key] / 100) * BAR_W);
      fill.setSize(w, BAR_H);
      fill.setX(cx - BAR_W / 2 + w / 2);
    });
  }

  private renderActivityButtons(): void {
    type BtnDef = { type: ActivityType; label: string; color: number };
    const row1: BtnDef[] = [
      { type: 'feed',  label: '🍎 Feed',  color: 0xFF8A65 },
      { type: 'wash',  label: '🛁 Wash',  color: 0x4FC3F7 },
      { type: 'sleep', label: '😴 Sleep', color: 0x9575CD },
    ];
    const row2: BtnDef[] = [
      { type: 'dance', label: '💃 Dance', color: 0xF06292 },
      { type: 'learn', label: '📚 Learn', color: 0x66BB6A },
    ];

    const makeRow = (defs: BtnDef[], y: number, xPositions: number[]) => {
      defs.forEach(({ type, label, color }, i) => {
        const x = xPositions[i];
        const bg = this.add.rectangle(x, y, 200, 70, color).setStrokeStyle(2, 0x555555);
        this.add.text(x, y, label, {
          fontSize: '26px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setScale(1.07));
        bg.on('pointerout', () => bg.setScale(1.0));
        bg.on('pointerup', () => this.handleActivity(type, bg));
      });
    };

    makeRow(row1, 490, [200, 512, 824]);
    makeRow(row2, 575, [356, 668]);
  }

  private handleActivity(type: ActivityType, btn: Phaser.GameObjects.Rectangle): void {
    btn.disableInteractive();
    this.time.delayedCall(1500, () => btn.setInteractive({ useHandCursor: true }));

    const mx = this.mascotRect.x;
    const my = this.mascotRect.y;

    if (type === 'feed') {
      bounceIn(this, this.mascotRect);
      celebrationParticles(this, mx, my + 70);
    } else if (type === 'wash') {
      squashStretch(this, this.mascotRect);
      celebrationParticles(this, mx - 70, my);
      celebrationParticles(this, mx + 70, my);
    } else if (type === 'sleep') {
      const zzz = this.add.text(mx + 70, my - 50, 'Zzz', {
        fontSize: '32px', color: '#9575CD', fontFamily: 'Arial',
      });
      this.tweens.add({
        targets: this.mascotRect,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: 2,
        onComplete: () => this.mascotRect.setAlpha(1),
      });
      this.tweens.add({
        targets: zzz,
        y: my - 130,
        alpha: 0,
        duration: 1500,
        onComplete: () => zzz.destroy(),
      });
    } else if (type === 'dance') {
      [0, 200, 400].forEach(delay => {
        this.time.delayedCall(delay, () => squashStretch(this, this.mascotRect));
      });
      celebrationParticles(this, mx, my);
    } else if (type === 'learn') {
      bounceIn(this, this.mascotRect);
      this.moodText.setText("Let's go learn! 📚");
      this.time.delayedCall(900, () => {
        this.petMgr.save();
        this.scene.start('SpeechScene');
      });
      SaveManagerInstance.addStars(1);
      AudioManager.playSfx('sfx_success');
      return;
    }

    this.petMgr.applyActivity(type);
    this.refreshStatusBars();
    this.moodText.setText("That was so fun! Thank you! 💕");
    this.time.delayedCall(2000, () => this.moodText.setText(this.petMgr.getMoodText()));

    SaveManagerInstance.addStars(1);
    AudioManager.playSfx('sfx_success');
  }

  private buildMascotPickerOverlay(): void {
    this.pickerOverlay = this.add.container(0, 0).setDepth(200).setVisible(false);

    const backdrop = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.75);
    const title = this.add.text(512, 160, 'Choose your pet!', {
      fontSize: '44px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.pickerCloseBtn = this.add.text(950, 120, '✕', {
      fontSize: '40px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.pickerCloseBtn.on('pointerup', () => this.pickerOverlay.setVisible(false));

    this.pickerOverlay.add([backdrop, title, this.pickerCloseBtn]);

    const mascots: Array<{ key: PetState['mascot']; label: string; color: number }> = [
      { key: 'dino',  label: 'Dino 🦕',  color: 0x66BB6A },
      { key: 'bunny', label: 'Bunny 🐰', color: 0xF8BBD9 },
      { key: 'panda', label: 'Panda 🐼', color: 0xE0E0E0 },
      { key: 'alien', label: 'Alien 👾', color: 0x80DEEA },
    ];

    mascots.forEach(({ key, label, color }, i) => {
      const x = 150 + i * 240;
      const y = 380;
      const card = this.add.rectangle(x, y, 200, 200, color).setStrokeStyle(4, 0x888888);
      const txt = this.add.text(x, y, label, {
        fontSize: '28px', color: '#333333', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.pickerOverlay.add([card, txt]);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setScale(1.07));
      card.on('pointerout', () => card.setScale(1.0));
      card.on('pointerup', () => {
        bounceIn(this, card);
        this.petMgr.setMascot(key);
        this.time.delayedCall(350, () => {
          this.pickerOverlay.setVisible(false);
          this.refreshMascotDisplay();
        });
      });
    });
  }

  private showMascotPicker(dismissible: boolean): void {
    this.pickerCloseBtn.setVisible(dismissible);
    this.pickerOverlay.setVisible(true);
  }

  private refreshMascotDisplay(): void {
    const { mascot } = this.petMgr.getState();
    if (!mascot) return;
    this.mascotRect.setFillStyle(MASCOT_COLORS[mascot]);
    this.mascotLabel.setText(MASCOT_LABELS[mascot]);
    this.moodText.setText(this.petMgr.getMoodText());
  }
}
