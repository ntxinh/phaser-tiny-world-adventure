import Phaser from 'phaser';
import { bounceIn } from '../animations/AnimationHelpers';

export interface ToolPanelCallbacks {
  onBrush:  () => void;
  onEraser: () => void;
  onUndo:   () => void;
  onRedo:   () => void;
}

const BTN_X    = 40;
const BTN_SIZE = 72;
const START_Y  = 130;
const GAP      = 90;

const TOOLS = [
  { key: 'btn_paint_brush',  label: '🖌', cb: 'onBrush'  },
  { key: 'btn_paint_eraser', label: '🧽', cb: 'onEraser' },
  { key: 'btn_paint_undo',   label: '↩',  cb: 'onUndo'   },
  { key: 'btn_paint_redo',   label: '↪',  cb: 'onRedo'   },
] as const;

export class ToolPanel {
  private undoBtn!: Phaser.GameObjects.Image;
  private redoBtn!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, cbs: ToolPanelCallbacks) {
    // left panel background
    scene.add.rectangle(40, 384, 80, 768, 0x1A237E, 0.85).setDepth(19);

    TOOLS.forEach((tool, i) => {
      const y   = START_Y + i * GAP;
      const btn = scene.add.image(BTN_X, y, tool.key)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });

      if (tool.cb === 'onUndo') this.undoBtn = btn;
      if (tool.cb === 'onRedo') this.redoBtn = btn;

      btn.on('pointerover', () => btn.setScale(1.15));
      btn.on('pointerout',  () => btn.setScale(1.0));
      btn.on('pointerdown', () => {
        scene.tweens.add({
          targets: btn, scaleX: 0.85, scaleY: 0.85,
          duration: 80, yoyo: true, ease: 'Back.Out',
        });
        cbs[tool.cb]();
      });

      // label text under button
      scene.add.text(BTN_X, y + BTN_SIZE / 2 + 4, tool.label, {
        fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0.5, 0).setDepth(21);
    });

    const backBtn = scene.add.image(BTN_X, 70, 'btn_back')
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => scene.scene.start('HomeScene'));
    bounceIn(scene, backBtn);
  }

  setCanUndo(v: boolean): void {
    this.undoBtn?.setAlpha(v ? 1 : 0.35);
  }

  setCanRedo(v: boolean): void {
    this.redoBtn?.setAlpha(v ? 1 : 0.35);
  }
}
