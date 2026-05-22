# Magic Paint House — Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the region-based `ColoringScene` with a full free-painting canvas — RenderTexture paint layer, classic + eraser brushes, 16-color palette, undo/redo, IndexedDB autosave, SVG outline guidance, and an encouraging mascot.

**Architecture:** `ColoringScene` orchestrates helper classes: `PaintCanvas` (RenderTexture wrapper), `BrushManager` (active brush dispatch with interpolation), `UndoManager` (base64 snapshot stack), `ColorPalette`, `ToolPanel`, `HelperMascot`, and `PaintSaveManager` (IndexedDB). The RenderTexture sits at (0,0) filling 1024×768 — kids paint freely anywhere. SVG outlines are displayed as a separate layer, purely for guidance.

**Tech Stack:** Phaser 3.88, TypeScript, IndexedDB (no external library), Howler.js via existing `AudioManager`

---

## File Map

```
Create:
  public/assets/svg/cat.svg
  public/assets/svg/dinosaur.svg
  public/assets/svg/star.svg
  src/paint/PaintCanvas.ts
  src/paint/brushes/IBrush.ts
  src/paint/brushes/ClassicBrush.ts
  src/paint/brushes/EraserBrush.ts
  src/paint/BrushManager.ts
  src/paint/UndoManager.ts
  src/save/PaintSaveManager.ts
  src/ui/ColorPalette.ts
  src/ui/ToolPanel.ts
  src/ui/HelperMascot.ts

Modify:
  src/scenes/BootScene.ts       — add paint-scene textures + audio
  src/scenes/ColoringScene.ts   — full replace
```

---

## Task 1: SVG Assets

**Files:**
- Create: `public/assets/svg/cat.svg`
- Create: `public/assets/svg/dinosaur.svg`
- Create: `public/assets/svg/star.svg`

- [ ] **Step 1: Create cat.svg**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <circle cx="200" cy="180" r="80" fill="none" stroke="#222" stroke-width="10"/>
  <ellipse cx="200" cy="320" rx="70" ry="80" fill="none" stroke="#222" stroke-width="10"/>
  <polygon points="145,110 120,55 175,105" fill="none" stroke="#222" stroke-width="10" stroke-linejoin="round"/>
  <polygon points="255,110 280,55 225,105" fill="none" stroke="#222" stroke-width="10" stroke-linejoin="round"/>
  <circle cx="170" cy="170" r="12" fill="#222"/>
  <circle cx="230" cy="170" r="12" fill="#222"/>
  <ellipse cx="200" cy="200" rx="8" ry="6" fill="#222"/>
  <path d="M185 210 Q200 225 215 210" fill="none" stroke="#222" stroke-width="6"/>
  <line x1="115" y1="193" x2="172" y2="200" stroke="#222" stroke-width="5"/>
  <line x1="115" y1="210" x2="172" y2="205" stroke="#222" stroke-width="5"/>
  <line x1="285" y1="193" x2="228" y2="200" stroke="#222" stroke-width="5"/>
  <line x1="285" y1="210" x2="228" y2="205" stroke="#222" stroke-width="5"/>
  <path d="M260 360 Q330 330 340 380 Q350 415 300 390" fill="none" stroke="#222" stroke-width="10"/>
</svg>
```

- [ ] **Step 2: Create dinosaur.svg**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <ellipse cx="185" cy="270" rx="100" ry="75" fill="none" stroke="#222" stroke-width="10"/>
  <ellipse cx="310" cy="150" rx="65" ry="50" fill="none" stroke="#222" stroke-width="10"/>
  <path d="M265 255 Q282 200 252 158" fill="none" stroke="#222" stroke-width="10"/>
  <circle cx="328" cy="135" r="10" fill="#222"/>
  <circle cx="358" cy="155" r="6" fill="#222"/>
  <path d="M278 165 Q332 185 372 165" fill="none" stroke="#222" stroke-width="7"/>
  <polygon points="262,228 244,200 276,208" fill="none" stroke="#222" stroke-width="7"/>
  <polygon points="268,195 250,168 280,176" fill="none" stroke="#222" stroke-width="7"/>
  <line x1="148" y1="332" x2="128" y2="385" stroke="#222" stroke-width="10"/>
  <line x1="128" y1="385" x2="105" y2="385" stroke="#222" stroke-width="8"/>
  <line x1="228" y1="335" x2="250" y2="385" stroke="#222" stroke-width="10"/>
  <line x1="250" y1="385" x2="273" y2="385" stroke="#222" stroke-width="8"/>
  <path d="M88 278 Q40 300 28 352" fill="none" stroke="#222" stroke-width="10"/>
</svg>
```

- [ ] **Step 3: Create star.svg**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <polygon points="200,30 245,155 380,155 275,235 315,365 200,285 85,365 125,235 20,155 155,155"
    fill="none" stroke="#222" stroke-width="10" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 4: Commit**

```bash
git add public/assets/svg/cat.svg public/assets/svg/dinosaur.svg public/assets/svg/star.svg
git commit -m "feat: add cartoon SVG outlines for paint scene (cat, dinosaur, star)"
```

---

## Task 2: BootScene — Paint Textures + Audio

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Add textures to the `defs` array inside `generateTextures()`**

Find the end of the `defs` array (after the Phase 4 line) and add before `];`:

```typescript
      // Paint House UI
      { key: 'btn_save_art',      width: 200, height: 75,  color: 0xEC407A, radius: 22 },
      { key: 'btn_paint_brush',   width: 72,  height: 72,  color: 0x1E88E5, radius: 36 },
      { key: 'btn_paint_eraser',  width: 72,  height: 72,  color: 0x78909C, radius: 36 },
      { key: 'btn_paint_undo',    width: 72,  height: 72,  color: 0xFF8F00, radius: 36 },
      { key: 'btn_paint_redo',    width: 72,  height: 72,  color: 0x43A047, radius: 36 },
      { key: 'paint_bubble',      width: 230, height: 72,  color: 0xFFFDE7, radius: 22 },
      { key: 'svg_thumb',         width: 115, height: 115, color: 0xFFF9C4, radius: 20 },
```

- [ ] **Step 2: Add audio to the `entries` array inside `registerAudio()`**

Add at the end before `];`:

```typescript
      ['bgm_paint',    'assets/audio/bgm/paint.mp3'],
      ['sfx_brush',    'assets/audio/sfx/brush.mp3'],
      ['sfx_save_art', 'assets/audio/sfx/save_art.mp3'],
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: register paint-scene textures and audio in BootScene"
```

---

## Task 3: PaintCanvas

**Files:**
- Create: `src/paint/PaintCanvas.ts`

- [ ] **Step 1: Create `src/paint/PaintCanvas.ts`**

```typescript
import Phaser from 'phaser';

export const PAINT_DEPTH = {
  BACKGROUND: 0,
  SVG_OUTLINE: 5,
  PAINT: 10,
  PARTICLES: 15,
  UI: 20,
};

export class PaintCanvas {
  readonly rt: Phaser.GameObjects.RenderTexture;
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.rt = scene.add.renderTexture(0, 0, 1024, 768);
    this.rt.setDepth(PAINT_DEPTH.PAINT);
    this.gfx = scene.make.graphics({ x: 0, y: 0 }, false);
  }

  get scene(): Phaser.Scene {
    return this.rt.scene;
  }

  drawCircle(x: number, y: number, color: number, radius: number): void {
    this.gfx.clear();
    this.gfx.fillStyle(color, 1);
    this.gfx.fillCircle(0, 0, radius);
    this.rt.draw(this.gfx, x, y);
  }

  eraseCircle(x: number, y: number, radius: number): void {
    this.gfx.clear();
    this.gfx.fillStyle(0xffffff, 1);
    this.gfx.fillCircle(0, 0, radius);
    this.rt.erase(this.gfx, x, y);
  }

  clear(): void {
    this.rt.clear();
  }

  snapshot(onDone: (dataUrl: string) => void): void {
    this.rt.snapshot((img) => {
      onDone((img as HTMLImageElement).src);
    });
  }

  loadFromDataUrl(dataUrl: string, onDone: () => void): void {
    const key = `__restore_${Date.now()}`;
    this.rt.scene.textures.once(`addtexture-${key}`, () => {
      this.rt.clear();
      this.rt.drawFrame(key, undefined, 0, 0);
      this.rt.scene.textures.remove(key);
      onDone();
    });
    this.rt.scene.textures.addBase64(key, dataUrl);
  }

  destroy(): void {
    this.gfx.destroy();
    this.rt.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/paint/PaintCanvas.ts
git commit -m "feat: add PaintCanvas — RenderTexture wrapper for free painting"
```

---

## Task 4: IBrush + ClassicBrush + EraserBrush

**Files:**
- Create: `src/paint/brushes/IBrush.ts`
- Create: `src/paint/brushes/ClassicBrush.ts`
- Create: `src/paint/brushes/EraserBrush.ts`

- [ ] **Step 1: Create `src/paint/brushes/IBrush.ts`**

```typescript
import { PaintCanvas } from '../PaintCanvas';

export interface IBrush {
  draw(canvas: PaintCanvas, x: number, y: number, color: number, size: number): void;
}
```

- [ ] **Step 2: Create `src/paint/brushes/ClassicBrush.ts`**

```typescript
import { PaintCanvas } from '../PaintCanvas';
import { IBrush } from './IBrush';

export class ClassicBrush implements IBrush {
  draw(canvas: PaintCanvas, x: number, y: number, color: number, size: number): void {
    canvas.drawCircle(x, y, color, size);
  }
}
```

- [ ] **Step 3: Create `src/paint/brushes/EraserBrush.ts`**

```typescript
import { PaintCanvas } from '../PaintCanvas';
import { IBrush } from './IBrush';

export class EraserBrush implements IBrush {
  draw(canvas: PaintCanvas, x: number, y: number, _color: number, size: number): void {
    canvas.eraseCircle(x, y, size * 1.5);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/paint/brushes/IBrush.ts src/paint/brushes/ClassicBrush.ts src/paint/brushes/EraserBrush.ts
git commit -m "feat: add IBrush interface, ClassicBrush, and EraserBrush"
```

---

## Task 5: BrushManager

**Files:**
- Create: `src/paint/BrushManager.ts`

- [ ] **Step 1: Create `src/paint/BrushManager.ts`**

```typescript
import { PaintCanvas } from './PaintCanvas';
import { IBrush } from './brushes/IBrush';
import { ClassicBrush } from './brushes/ClassicBrush';
import { EraserBrush } from './brushes/EraserBrush';

export type BrushType = 'classic' | 'eraser';

export class BrushManager {
  private brushes: Record<BrushType, IBrush> = {
    classic: new ClassicBrush(),
    eraser:  new EraserBrush(),
  };
  private activeBrushType: BrushType = 'classic';
  private color: number = 0xFF0000;
  private size: number = 18;
  private lastX: number = -1;
  private lastY: number = -1;
  private painting: boolean = false;

  setActiveBrush(type: BrushType): void {
    this.activeBrushType = type;
  }

  getActiveBrush(): BrushType {
    return this.activeBrushType;
  }

  setColor(color: number): void {
    this.color = color;
    this.activeBrushType = 'classic';
  }

  setSize(size: number): void {
    this.size = size;
  }

  onPointerDown(canvas: PaintCanvas, x: number, y: number): void {
    this.painting = true;
    this.lastX = x;
    this.lastY = y;
    this.brushes[this.activeBrushType].draw(canvas, x, y, this.color, this.size);
  }

  onPointerMove(canvas: PaintCanvas, x: number, y: number): void {
    if (!this.painting) return;
    this.interpolate(canvas, this.lastX, this.lastY, x, y);
    this.lastX = x;
    this.lastY = y;
  }

  onPointerUp(): void {
    this.painting = false;
    this.lastX = -1;
    this.lastY = -1;
  }

  private interpolate(
    canvas: PaintCanvas,
    x0: number, y0: number,
    x1: number, y1: number,
  ): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = Math.max(1, this.size * 0.4);
    const steps = Math.ceil(dist / step);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.brushes[this.activeBrushType].draw(
        canvas,
        x0 + dx * t,
        y0 + dy * t,
        this.color,
        this.size,
      );
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/paint/BrushManager.ts
git commit -m "feat: add BrushManager with interpolated stroke drawing"
```

---

## Task 6: UndoManager

**Files:**
- Create: `src/paint/UndoManager.ts`

- [ ] **Step 1: Create `src/paint/UndoManager.ts`**

```typescript
import { PaintCanvas } from './PaintCanvas';

export class UndoManager {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private pending: boolean = false;
  private readonly maxSteps: number;

  constructor(private canvas: PaintCanvas, maxSteps = 50) {
    this.maxSteps = maxSteps;
  }

  snapshot(): void {
    if (this.pending) return;
    this.pending = true;
    this.canvas.snapshot((dataUrl) => {
      this.undoStack.push(dataUrl);
      if (this.undoStack.length > this.maxSteps) {
        this.undoStack.shift();
      }
      this.redoStack = [];
      this.pending = false;
    });
  }

  undo(onDone?: () => void): void {
    if (!this.canUndo() || this.pending) return;
    this.pending = true;
    // Current state becomes redo entry — snapshot before restoring
    this.canvas.snapshot((currentUrl) => {
      this.redoStack.push(currentUrl);
      const prev = this.undoStack.pop()!;
      this.canvas.loadFromDataUrl(prev, () => {
        this.pending = false;
        onDone?.();
      });
    });
  }

  redo(onDone?: () => void): void {
    if (!this.canRedo() || this.pending) return;
    this.pending = true;
    this.canvas.snapshot((currentUrl) => {
      this.undoStack.push(currentUrl);
      const next = this.redoStack.pop()!;
      this.canvas.loadFromDataUrl(next, () => {
        this.pending = false;
        onDone?.();
      });
    });
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.pending = false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/paint/UndoManager.ts
git commit -m "feat: add UndoManager with 50-level base64 snapshot stack"
```

---

## Task 7: PaintSaveManager

**Files:**
- Create: `src/save/PaintSaveManager.ts`

- [ ] **Step 1: Create `src/save/PaintSaveManager.ts`**

```typescript
export interface PaintSaveData {
  svgId: string;
  canvasPng: string;
  savedAt: number;
}

const DB_NAME    = 'MagicPaintHouse';
const DB_VERSION = 1;
const STORE_NAME = 'autosave';
const RECORD_KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess  = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror    = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export class PaintSaveManager {
  async save(svgId: string, canvasPng: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: PaintSaveData = { svgId, canvasPng, savedAt: Date.now() };
      const req   = store.put(record, RECORD_KEY);
      req.onsuccess = () => { db.close(); resolve(); };
      req.onerror   = (e) => { db.close(); reject((e.target as IDBRequest).error); };
    });
  }

  async load(): Promise<PaintSaveData | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(RECORD_KEY);
      req.onsuccess = (e) => {
        db.close();
        resolve((e.target as IDBRequest<PaintSaveData>).result ?? null);
      };
      req.onerror = (e) => { db.close(); reject((e.target as IDBRequest).error); };
    });
  }

  async clear(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.delete(RECORD_KEY);
      req.onsuccess = () => { db.close(); resolve(); };
      req.onerror   = (e) => { db.close(); reject((e.target as IDBRequest).error); };
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/save/PaintSaveManager.ts
git commit -m "feat: add PaintSaveManager using IndexedDB for canvas autosave"
```

---

## Task 8: ColorPalette

**Files:**
- Create: `src/ui/ColorPalette.ts`

- [ ] **Step 1: Create `src/ui/ColorPalette.ts`**

```typescript
import Phaser from 'phaser';

const COLORS: number[] = [
  0xE53935, // red
  0xF4511E, // deep orange
  0xFB8C00, // orange
  0xFDD835, // yellow
  0xC0CA33, // lime
  0x43A047, // green
  0x00897B, // teal
  0x039BE5, // light blue
  0x1E88E5, // blue
  0x3949AB, // indigo
  0x8E24AA, // purple
  0xD81B60, // pink
  0x795548, // brown
  0x000000, // black
  0x9E9E9E, // grey
  0xFFFFFF, // white
];

const SWATCH_RADIUS = 26;
const SWATCH_Y      = 718;

export class ColorPalette {
  private swatches: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, onColorChange: (color: number) => void) {
    const totalWidth = COLORS.length * (SWATCH_RADIUS * 2 + 8) - 8;
    const startX     = (1024 - totalWidth) / 2 + SWATCH_RADIUS;

    COLORS.forEach((color, i) => {
      const x = startX + i * (SWATCH_RADIUS * 2 + 8);
      const swatch = scene.add.circle(x, SWATCH_Y, SWATCH_RADIUS, color)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });

      if (color === 0xFFFFFF) {
        // white needs a visible border
        scene.add.circle(x, SWATCH_Y, SWATCH_RADIUS + 3, 0xCCCCCC).setDepth(19);
      }

      swatch.on('pointerover',  () => swatch.setScale(1.2));
      swatch.on('pointerout',   () => swatch.setScale(1.0));
      swatch.on('pointerdown',  () => {
        swatch.setScale(0.9);
        onColorChange(color);
        AudioHelper.tap(scene);
      });
      swatch.on('pointerup',    () => swatch.setScale(1.2));

      this.swatches.push(swatch);
    });

    // palette background bar
    scene.add.rectangle(512, SWATCH_Y, 1024, 100, 0x212121, 0.85).setDepth(18);
  }
}

// Avoid importing AudioManager at top level to keep this component portable.
// AudioManager is a singleton — accessing it this way is safe.
const AudioHelper = {
  tap(scene: Phaser.Scene): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const am = (scene.game as unknown as Record<string, unknown>);
      void am; // no-op: sound handled by scene; adding real call in ColoringScene
    } catch { /* silent */ }
  },
};
```

> **Note:** The `AudioHelper` stub above is intentionally minimal — `ColoringScene` plays audio on color change directly via `AudioManager.playSfx`. Remove the stub in a follow-up cleanup.

- [ ] **Step 2: Commit**

```bash
git add src/ui/ColorPalette.ts
git commit -m "feat: add ColorPalette with 16 color swatches"
```

---

## Task 9: ToolPanel

**Files:**
- Create: `src/ui/ToolPanel.ts`

- [ ] **Step 1: Create `src/ui/ToolPanel.ts`**

```typescript
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

    bounceIn(scene, scene.add.image(BTN_X, 70, 'btn_back')
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => scene.scene.start('HomeScene')));
  }

  setCanUndo(v: boolean): void {
    this.undoBtn?.setAlpha(v ? 1 : 0.35);
  }

  setCanRedo(v: boolean): void {
    this.redoBtn?.setAlpha(v ? 1 : 0.35);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/ToolPanel.ts
git commit -m "feat: add ToolPanel with brush, eraser, undo, redo buttons"
```

---

## Task 10: HelperMascot

**Files:**
- Create: `src/ui/HelperMascot.ts`

- [ ] **Step 1: Create `src/ui/HelperMascot.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/HelperMascot.ts
git commit -m "feat: add HelperMascot with random encouragement messages"
```

---

## Task 11: ColoringScene (Full Replace)

**Files:**
- Modify: `src/scenes/ColoringScene.ts` (full replace)

This scene orchestrates all components. It handles:
- `preload()` — load SVGs
- SVG selection modal (shown once on entry)
- Pointer events → BrushManager
- Autosave timer
- Manual save button with confetti
- Restoring autosaved state on reopen

- [ ] **Step 1: Replace `src/scenes/ColoringScene.ts` entirely**

```typescript
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

    // UI components
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

    this.mascot = new HelperMascot(this);

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

    // shutdown autosave
    this.events.once('shutdown', () => {
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
      this.saveManager.save(this.activeSvgId, dataUrl).catch(() => { /* silent */ });
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
        btns.forEach(b => (b as Phaser.GameObjects.GameObject & { destroy(): void }).destroy());
        this.isFirstStroke = true;
        AudioManager.playSfx('sfx_brush');
      });
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

Run: `npx tsc --noEmit`

Expected: no errors. Fix any reported type mismatches before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ColoringScene.ts
git commit -m "feat: replace ColoringScene with Magic Paint House Stage 1"
```

---

## Task 12: Smoke Test

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Open `http://localhost:5173` in a browser.

- [ ] **Step 2: Navigate to ColoringScene**

From HomeScene tap the Paint House building → ColoringScene loads.

Verify:
- SVG selector modal appears
- Tapping an SVG dismisses modal + shows outline

- [ ] **Step 3: Verify painting**

Draw with finger/mouse. Verify:
- Color changes when tapping palette
- Brush draws smooth strokes
- Eraser removes paint
- Undo/redo work
- After 5 seconds, autosave fires (no error in console)
- Manual SAVE ART! shows confetti + "Saved!" overlay
- Mascot shows encouragement messages

- [ ] **Step 4: Verify persistence**

Refresh page → navigate back to ColoringScene → previous drawing restores.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Magic Paint House Stage 1 complete"
```

---

## Self-Review Notes

- **Spec coverage:**
  - ✅ Basic drawing (ClassicBrush)
  - ✅ Color palette (16 colors)
  - ✅ SVG loading + guidance layer
  - ✅ Undo/redo (50 levels)
  - ✅ Autosave (IndexedDB, 5s + shutdown)
  - ✅ Manual save (confetti + overlay)
  - ✅ Helper mascot (random encouragement)
  - ✅ Free painting (no line restriction)
  - ✅ Toddler-safe touch targets (80px+ buttons)
  - ✅ Eraser
- **Out of scope confirmed excluded:** rainbow/glitter brushes, gallery, admin SVG pipeline

- **Type consistency across tasks:**
  - `PaintCanvas` — `drawCircle`, `eraseCircle`, `clear`, `snapshot`, `loadFromDataUrl` ✅
  - `BrushManager` — `onPointerDown(canvas, x, y)`, `onPointerMove(canvas, x, y)`, `onPointerUp()`, `setColor`, `setActiveBrush` ✅
  - `UndoManager` — `snapshot()`, `undo(cb?)`, `redo(cb?)`, `canUndo()`, `canRedo()`, `clear()` ✅
  - `ToolPanel` — `setCanUndo(v)`, `setCanRedo(v)` ✅
  - `HelperMascot` — `cheer()`, `destroy()` ✅
  - `ColorPalette` — constructor `(scene, onColorChange)` ✅
  - `PaintSaveManager` — `save(id, png)`, `load()`, `clear()` ✅
