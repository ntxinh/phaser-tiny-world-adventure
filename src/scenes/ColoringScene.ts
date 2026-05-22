import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { celebrationParticles } from '../animations/AnimationHelpers';
import { PaintCanvas, PAINT_DEPTH } from '../paint/PaintCanvas';
import { BrushManager } from '../paint/BrushManager';
import { UndoManager } from '../paint/UndoManager';
import { ColorPalette } from '../ui/ColorPalette';
import { ToolPanel } from '../ui/ToolPanel';
import { HelperMascot } from '../ui/HelperMascot';
import { PaintSaveManager } from '../save/PaintSaveManager';

interface SvgDef {
  id:    string;
  url:   string;
  label: string;
}

const SVG_DEFS: SvgDef[] = [
  { id: 'peacock',  url: 'assets/svg/peacock-cartoon-bird.svg', label: 'Bird'  },
  { id: 'cat',      url: 'assets/svg/cat.svg',                  label: 'Cat'   },
  { id: 'dinosaur', url: 'assets/svg/dinosaur.svg',             label: 'Dino'  },
  { id: 'star',     url: 'assets/svg/star.svg',                 label: 'Star'  },
];

const AUTOSAVE_INTERVAL = 5000;

export class ColoringScene extends Phaser.Scene {
  private paintCanvas!: PaintCanvas;
  private brushManager!: BrushManager;
  private undoManager!: UndoManager;
  private saveManager!: PaintSaveManager;
  private mascot!: HelperMascot;
  private toolPanel!: ToolPanel;
  private svgImage!: Phaser.GameObjects.Image;
  private activeSvgId: string = SVG_DEFS[0].id;
  private autosaveTimer!: Phaser.Time.TimerEvent;
  private isFirstStroke: boolean = true;

  constructor() { super({ key: 'ColoringScene' }); }

  preload(): void {
    SVG_DEFS.forEach(({ id, url }) => {
      this.load.svg(`svg_${id}`, url, { width: 700, height: 600 });
    });
  }

  create(): void {
    this.saveManager = new PaintSaveManager();
    this.isFirstStroke = true;

    // background
    this.add.rectangle(512, 384, 1024, 768, 0xFCE4EC).setDepth(PAINT_DEPTH.BACKGROUND);

    // title
    this.add.text(512, 32, 'Magic Paint House', {
      fontSize: '36px', color: '#880E4F',
      fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#FCE4EC', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(PAINT_DEPTH.UI + 1);

    // SVG outline image (placeholder until selection)
    this.svgImage = this.add.image(512, 370, `svg_${this.activeSvgId}`)
      .setDepth(PAINT_DEPTH.SVG_OUTLINE)
      .setAlpha(0.45);

    // paint canvas
    this.paintCanvas  = new PaintCanvas(this);
    this.brushManager = new BrushManager();
    this.undoManager  = new UndoManager(this.paintCanvas);

    // UI components — mascot must be created first (palette callback calls cheer())
    this.mascot = new HelperMascot(this);

    new ColorPalette(this, (color) => {
      this.brushManager.setColor(color);
      AudioManager.playSfx('sfx_brush');
      this.mascot.cheer();
    });

    this.toolPanel = new ToolPanel(this, {
      onBrush:  () => this.brushManager.setActiveBrush('classic'),
      onEraser: () => this.brushManager.setActiveBrush('eraser'),
      onUndo:   () => this.undoManager.undo(() => this.syncUndoButtons()),
      onRedo:   () => this.undoManager.redo(() => this.syncUndoButtons()),
    });
    this.toolPanel.setCanUndo(false);
    this.toolPanel.setCanRedo(false);

    // save button
    this.add.image(940, 32, 'btn_save_art')
      .setDepth(PAINT_DEPTH.UI + 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onManualSave());
    this.add.text(940, 32, 'SAVE ART!', {
      fontSize: '20px', color: '#ffffff',
      fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(PAINT_DEPTH.UI + 2);

    // pointer events — only in the canvas area (avoid tool/mascot panels)
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.isInCanvasArea(ptr.x, ptr.y)) {
        this.brushManager.onPointerDown(this.paintCanvas, ptr.x, ptr.y);
        if (this.isFirstStroke) {
          this.isFirstStroke = false;
          this.mascot.cheer();
        }
      }
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (ptr.isDown && this.isInCanvasArea(ptr.x, ptr.y)) {
        this.brushManager.onPointerMove(this.paintCanvas, ptr.x, ptr.y);
      }
    });
    this.input.on('pointerup', () => {
      this.brushManager.onPointerUp();
      this.undoManager.snapshot();
      this.syncUndoButtons();
    });

    // autosave timer
    this.autosaveTimer = this.time.addEvent({
      delay: AUTOSAVE_INTERVAL,
      loop: true,
      callback: () => this.autosave(),
    });

    // shutdown — clean up input listeners, timers, mascot
    this.events.once('shutdown', () => {
      this.input.off('pointerdown');
      this.input.off('pointermove');
      this.input.off('pointerup');
      this.autosave();
      this.mascot.destroy();
      this.autosaveTimer.remove();
    });

    // restore saved state or show SVG selector
    this.saveManager.load().then((saved) => {
      if (saved) {
        const def = SVG_DEFS.find(d => d.id === saved.svgId) ?? SVG_DEFS[0];
        this.activeSvgId = def.id;
        this.svgImage.setTexture(`svg_${def.id}`);
        this.paintCanvas.loadFromDataUrl(saved.canvasPng, () => {
          this.undoManager.snapshot();
          this.syncUndoButtons();
        });
      } else {
        this.showSvgSelector();
      }
    });

    AudioManager.playBgm('bgm_paint');
  }

  private isInCanvasArea(x: number, y: number): boolean {
    return x > 80 && x < 880 && y > 60 && y < 668;
  }

  private syncUndoButtons(): void {
    this.toolPanel.setCanUndo(this.undoManager.canUndo());
    this.toolPanel.setCanRedo(this.undoManager.canRedo());
  }

  private autosave(): void {
    this.paintCanvas.snapshot((dataUrl) => {
      this.saveManager.save(this.activeSvgId, dataUrl).catch((e) => console.warn('autosave failed', e));
    });
  }

  private onManualSave(): void {
    this.paintCanvas.snapshot((dataUrl) => {
      this.saveManager.save(this.activeSvgId, dataUrl).then(() => {
        AudioManager.playSfx('sfx_save_art');
        celebrationParticles(this, 940, 32);
        celebrationParticles(this, 512, 384);
        // framed preview flash
        const overlay = this.add.rectangle(512, 384, 900, 650, 0x000000, 0.5)
          .setDepth(50)
          .setStrokeStyle(8, 0xFFD700);
        const savedText = this.add.text(512, 384, '🎉 Saved!', {
          fontSize: '64px', color: '#FFD700',
          fontFamily: 'Arial', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(51);
        this.time.delayedCall(1800, () => {
          overlay.destroy();
          savedText.destroy();
        });
      }).catch(() => { /* silent */ });
    });
  }

  private showSvgSelector(): void {
    const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.7).setDepth(30);
    const title   = this.add.text(512, 180, 'Pick something to color!', {
      fontSize: '44px', color: '#FFFFFF',
      fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);

    const startX = 512 - ((SVG_DEFS.length - 1) * 180) / 2;
    const btns: Phaser.GameObjects.GameObject[] = [overlay, title];

    SVG_DEFS.forEach((def, i) => {
      const x   = startX + i * 180;
      const btn = this.add.image(x, 370, 'svg_thumb')
        .setDepth(31)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(x, 435, def.label, {
        fontSize: '24px', color: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);

      // show tiny SVG preview inside thumbnail
      const preview = this.add.image(x, 370, `svg_${def.id}`)
        .setDepth(32)
        .setDisplaySize(100, 100);

      btns.push(btn, label, preview);

      btn.on('pointerover',  () => btn.setScale(1.1));
      btn.on('pointerout',   () => btn.setScale(1.0));
      btn.on('pointerdown',  () => {
        this.activeSvgId = def.id;
        this.svgImage.setTexture(`svg_${def.id}`);
        this.paintCanvas.clear();
        this.undoManager.clear();
        this.syncUndoButtons();
        btns.forEach(b => (b as Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle).destroy());
        this.isFirstStroke = true;
        AudioManager.playSfx('sfx_brush');
      });
    });
  }
}
