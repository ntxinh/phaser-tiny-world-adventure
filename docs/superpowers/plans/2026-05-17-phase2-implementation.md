# Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ColoringScene (region tap-to-fill), BasketballScene (drag-and-release with Matter.js physics), and sticker rewards to RewardScene.

**Architecture:** Two new scenes follow the Phase 1 scene pattern (BackButton, launch RewardScene on win). RewardScene extended with a STICKER_MAP keyed by `caller`. Matter.js physics added globally to `main.ts` (safe — other scenes don't use `this.matter`).

**Tech Stack:** Phaser 3.88, TypeScript, Matter.js (bundled with Phaser), Vitest + jsdom

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/save/SaveManager.ts` | Add `addSticker(key)` method |
| Modify | `tests/save/SaveManager.test.ts` | Tests for `addSticker` |
| Modify | `src/scenes/BootScene.ts` | Generate Phase 2 textures + register Phase 2 audio |
| Modify | `src/main.ts` | Register new scenes + enable Matter.js |
| Modify | `src/scenes/HomeScene.ts` | Unlock Paint House → ColoringScene, Basketball Court → BasketballScene |
| Modify | `src/scenes/RewardScene.ts` | Add sticker display + bounce tween + `addSticker` call |
| Create | `src/scenes/ColoringScene.ts` | Palette + lion regions + win detection |
| Create | `src/scenes/BasketballScene.ts` | Drag-release ball + Matter.js physics + scoring |

---

## Task 1: AddSticker to SaveManager

**Files:**
- Modify: `src/save/SaveManager.ts`
- Modify: `tests/save/SaveManager.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/save/SaveManager.test.ts`, inside the `describe('SaveManager', ...)` block:

```typescript
  it('addSticker adds key to stickers array', () => {
    sm.addSticker('paintbrush');
    expect(sm.getData().stickers).toContain('paintbrush');
  });

  it('addSticker persists to localStorage', () => {
    sm.addSticker('paintbrush');
    const restored = new SaveManager();
    expect(restored.getData().stickers).toContain('paintbrush');
  });

  it('addSticker does not duplicate keys', () => {
    sm.addSticker('paintbrush');
    sm.addSticker('paintbrush');
    expect(sm.getData().stickers.filter((k: string) => k === 'paintbrush').length).toBe(1);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: 3 new tests FAIL with `TypeError: sm.addSticker is not a function`

- [ ] **Step 3: Implement addSticker in SaveManager**

In `src/save/SaveManager.ts`, add after `unlockGame`:

```typescript
  addSticker(key: string): void {
    if (!this.data.stickers.includes(key)) {
      this.data.stickers.push(key);
      this.save();
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: All tests pass including the 3 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/save/SaveManager.ts tests/save/SaveManager.test.ts
git commit -m "feat: add SaveManager.addSticker method"
```

---

## Task 2: Phase 2 Textures and Audio in BootScene

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Add Phase 2 texture definitions**

In `src/scenes/BootScene.ts`, extend the `defs` array in `generateTextures()` by adding after the `// UI` entry:

```typescript
      // Phase 2 buildings
      { key: 'building_paintHouse',   width: 160, height: 160, color: 0xEC407A, radius: 20 },
      { key: 'building_basketball',   width: 160, height: 160, color: 0xFF7043, radius: 20 },
      // Coloring — lion regions (placeholder shapes)
      { key: 'lion_ears',  width: 160, height: 35,  color: 0xFFCC02, radius: 8  },
      { key: 'lion_face',  width: 100, height: 100, color: 0xFFCC02, radius: 50 },
      { key: 'lion_mane',  width: 160, height: 160, color: 0xFF8F00, radius: 80 },
      { key: 'lion_body',  width: 200, height: 140, color: 0xFFB300, radius: 10 },
      { key: 'lion_tail',  width: 25,  height: 80,  color: 0xFFB300, radius: 6  },
      // Coloring — palette circles
      { key: 'color_red',    width: 90, height: 90, color: 0xE53935, radius: 45 },
      { key: 'color_yellow', width: 90, height: 90, color: 0xFDD835, radius: 45 },
      { key: 'color_orange', width: 90, height: 90, color: 0xFF6D00, radius: 45 },
      { key: 'color_green',  width: 90, height: 90, color: 0x43A047, radius: 45 },
      { key: 'color_blue',   width: 90, height: 90, color: 0x1E88E5, radius: 45 },
      { key: 'color_purple', width: 90, height: 90, color: 0x8E24AA, radius: 45 },
      // Basketball
      { key: 'ball_basketball', width: 80, height: 80, color: 0xFF5722, radius: 40 },
      { key: 'hoop_back',       width: 160, height: 20, color: 0xBF360C, radius: 4 },
      // Stickers
      { key: 'sticker_lion',        width: 100, height: 100, color: 0xFFAA00, radius: 50 },
      { key: 'sticker_star',        width: 100, height: 100, color: 0xFFDD00, radius: 8  },
      { key: 'sticker_paintbrush',  width: 30,  height: 100, color: 0x884400, radius: 6  },
      { key: 'sticker_basketball',  width: 100, height: 100, color: 0xFF6600, radius: 50 },
```

- [ ] **Step 2: Register Phase 2 audio keys**

In `registerAudio()`, add to the `entries` array:

```typescript
      ['sfx_swish',         'assets/audio/sfx/swish.mp3'],
      ['sfx_bounce_ball',   'assets/audio/sfx/bounce_ball.mp3'],
      ['sfx_tap_color',     'assets/audio/sfx/tap_color.mp3'],
      ['voice_coloring',    'assets/audio/voice/coloring.mp3'],
      ['voice_basketball',  'assets/audio/voice/basketball.mp3'],
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: generate Phase 2 textures and register Phase 2 audio in BootScene"
```

---

## Task 3: Register New Scenes and Enable Matter.js

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update main.ts**

Replace the entire content of `src/main.ts`:

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { AnimalScene } from './scenes/AnimalScene';
import { MatchingScene } from './scenes/MatchingScene';
import { ColoringScene } from './scenes/ColoringScene';
import { BasketballScene } from './scenes/BasketballScene';
import { RewardScene } from './scenes/RewardScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, HomeScene, AnimalScene, MatchingScene, ColoringScene, BasketballScene, RewardScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
```

Note: `ColoringScene` and `BasketballScene` don't exist yet — TypeScript will error until Task 6 and 7 create them. You can create empty stub files to unblock:

```bash
echo 'import Phaser from "phaser"; export class ColoringScene extends Phaser.Scene { constructor() { super({ key: "ColoringScene" }); } create() {} }' > src/scenes/ColoringScene.ts
echo 'import Phaser from "phaser"; export class BasketballScene extends Phaser.Scene { constructor() { super({ key: "BasketballScene" }); } create() {} }' > src/scenes/BasketballScene.ts
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts src/scenes/ColoringScene.ts src/scenes/BasketballScene.ts
git commit -m "feat: register ColoringScene, BasketballScene, enable Matter.js physics"
```

---

## Task 4: Unlock Phase 2 Buildings in HomeScene

**Files:**
- Modify: `src/scenes/HomeScene.ts`

- [ ] **Step 1: Update the buildings array**

In `src/scenes/HomeScene.ts`, replace the `buildings` array (lines 36–43):

```typescript
    const buildings: BuildingConfig[] = [
      { texture: 'building_zoo',          x: 280, y: 340, label: 'Zoo',        targetScene: 'AnimalScene'    },
      { texture: 'building_toyStore',     x: 500, y: 340, label: 'Toy Store',  targetScene: 'MatchingScene'  },
      { texture: 'building_paintHouse',   x: 720, y: 340, label: 'Paint',      targetScene: 'ColoringScene'  },
      { texture: 'building_basketball',   x: 280, y: 560, label: 'Basketball', targetScene: 'BasketballScene'},
      { texture: 'building_locked',       x: 500, y: 560, label: '?',          targetScene: null             },
      { texture: 'building_locked',       x: 720, y: 560, label: '?',          targetScene: null             },
    ];
```

- [ ] **Step 2: Verify dev server shows 4 clickable buildings**

```bash
npm run dev
```

Open browser at the URL shown. HomeScene should display Zoo, Toy Store, Paint, and Basketball as interactive buildings. Two buildings remain locked (`?`). Clicking Paint and Basketball should navigate to empty scenes (stubs) without errors.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/HomeScene.ts
git commit -m "feat: unlock Paint House and Basketball Court buildings in HomeScene"
```

---

## Task 5: Extend RewardScene with Sticker Display

**Files:**
- Modify: `src/scenes/RewardScene.ts`

- [ ] **Step 1: Add STICKER_MAP and sticker display**

Replace the entire content of `src/scenes/RewardScene.ts`:

```typescript
import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import SaveManager from '../save/SaveManager';

interface StickerDef {
  texture: string;
  label: string;
}

const STICKER_MAP: Record<string, StickerDef> = {
  AnimalScene:    { texture: 'sticker_lion',       label: 'Lion!' },
  MatchingScene:  { texture: 'sticker_star',        label: 'Star!' },
  coloring:       { texture: 'sticker_paintbrush',  label: 'Artist!' },
  basketball:     { texture: 'sticker_basketball',  label: 'Champ!' },
};

export class RewardScene extends Phaser.Scene {
  private callerKey = '';

  constructor() { super({ key: 'RewardScene' }); }

  init(data: Record<string, unknown>): void {
    this.callerKey = (data['caller'] as string | undefined) ?? '';
  }

  create(): void {
    // Dimmed overlay
    this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.55);

    // Card
    this.add.rectangle(512, 384, 620, 420, 0xFFF9C4).setStrokeStyle(6, 0xFFD700);

    this.add.text(512, 265, 'Great Job!', {
      fontSize: '64px',
      color: '#FF6F00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#FFD700',
      strokeThickness: 4,
    }).setOrigin(0.5);

    SaveManager.addStars(3);
    const total = SaveManager.getData().stars;

    this.add.text(512, 355, `★ ${total} stars total!`, {
      fontSize: '38px',
      color: '#5D4037',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.showSticker();
    this.spawnConfetti();

    AudioManager.playVoice('voice_greatjob');
    AudioManager.playSfx('sfx_success');

    this.time.delayedCall(3000, () => {
      if (this.callerKey) this.scene.stop(this.callerKey);
      this.scene.stop('RewardScene');
      this.scene.start('HomeScene');
    });
  }

  private showSticker(): void {
    const def = STICKER_MAP[this.callerKey];
    if (!def) return;

    const sticker = this.add.image(512, 460, def.texture).setScale(0);
    this.add.text(512, 515, def.label, {
      fontSize: '32px',
      color: '#5D4037',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: sticker,
      scale: 1.3,
      duration: 200,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: sticker,
          scale: 1.0,
          duration: 200,
          ease: 'Sine.Out',
        });
      },
    });

    const data = SaveManager.getData();
    if (!data.stickers.includes(def.texture)) {
      SaveManager.addSticker(def.texture);
    }
  }

  private spawnConfetti(): void {
    const colors = [0xFFD700, 0xFF6B6B, 0x6BCB77, 0x4D96FF, 0xFF922B];
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(200, 820);
      const y = Phaser.Math.Between(160, 620);
      const color = colors[i % colors.length];
      const dot = this.add.rectangle(x, y, 18, 18, color)
        .setRotation(Phaser.Math.DegToRad(Phaser.Math.Between(0, 90)));
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(80, 220),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(1000, 2500),
        delay: Phaser.Math.Between(0, 800),
        ease: 'Power2',
      });
    }
  }
}
```

- [ ] **Step 2: Verify sticker appears in reward screen**

```bash
npm run dev
```

Navigate Zoo → tap all 6 animals → RewardScene should show a gold circle (lion sticker) with label "Lion!" below the star count. Auto-dismisses after 3s.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/RewardScene.ts
git commit -m "feat: extend RewardScene with themed sticker display and SaveManager.addSticker call"
```

---

## Task 6: Implement ColoringScene

**Files:**
- Create: `src/scenes/ColoringScene.ts` (replaces stub from Task 3)

- [ ] **Step 1: Write ColoringScene**

Replace `src/scenes/ColoringScene.ts` with:

```typescript
import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';

interface RegionDef {
  key: string;
  x: number;
  y: number;
  depth: number;
}

interface PaletteDef {
  key: string;
  color: number;
  x: number;
}

const REGIONS: RegionDef[] = [
  { key: 'lion_tail',  x: 655, y: 530, depth: 1 },
  { key: 'lion_body',  x: 512, y: 510, depth: 2 },
  { key: 'lion_mane',  x: 512, y: 395, depth: 3 },
  { key: 'lion_face',  x: 512, y: 305, depth: 4 },
  { key: 'lion_ears',  x: 512, y: 235, depth: 5 },
];

const PALETTE: PaletteDef[] = [
  { key: 'color_red',    color: 0xE53935, x: 237 },
  { key: 'color_yellow', color: 0xFDD835, x: 347 },
  { key: 'color_orange', color: 0xFF6D00, x: 457 },
  { key: 'color_green',  color: 0x43A047, x: 567 },
  { key: 'color_blue',   color: 0x1E88E5, x: 677 },
  { key: 'color_purple', color: 0x8E24AA, x: 787 },
];

const DEFAULT_TINT = 0xdddddd;

export class ColoringScene extends Phaser.Scene {
  private selectedColor = 0xE53935; // default: red
  private coloredSet = new Set<string>();
  private regionImages: Map<string, Phaser.GameObjects.Image> = new Map();
  private rewardLaunched = false;

  constructor() { super({ key: 'ColoringScene' }); }

  create(): void {
    this.coloredSet.clear();
    this.regionImages.clear();
    this.rewardLaunched = false;

    // Background
    this.add.rectangle(512, 384, 1024, 768, 0xFCE4EC);

    // Title
    this.add.text(512, 55, 'Color the Lion!', {
      fontSize: '48px',
      color: '#AD1457',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#FCE4EC',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Palette
    PALETTE.forEach(({ key, color, x }) => {
      const circle = this.add.image(x, 130, key)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);
      circle.on('pointerover', () => circle.setScale(1.15));
      circle.on('pointerout', () => circle.setScale(1.0));
      circle.on('pointerup', () => {
        this.selectedColor = color;
        AudioManager.playSfx('sfx_tap_color');
      });
    });

    // Lion regions
    REGIONS.forEach(({ key, x, y, depth }) => {
      const img = this.add.image(x, y, key)
        .setTint(DEFAULT_TINT)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth);
      this.regionImages.set(key, img);

      img.on('pointerover', () => img.setScale(1.05));
      img.on('pointerout', () => img.setScale(1.0));
      img.on('pointerup', () => this.onRegionTap(key, img));
    });

    // Outline drawn on top of all regions
    this.drawOutline();

    new BackButton(this, () => this.scene.start('HomeScene'));
  }

  private onRegionTap(key: string, img: Phaser.GameObjects.Image): void {
    img.setTint(this.selectedColor);
    this.coloredSet.add(key);
    AudioManager.playSfx('sfx_tap_color');

    this.tweens.add({
      targets: img,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Back.Out',
    });

    if (this.coloredSet.size === REGIONS.length && !this.rewardLaunched) {
      this.rewardLaunched = true;
      this.regionImages.forEach(r => r.disableInteractive());
      this.time.delayedCall(600, () =>
        this.scene.launch('RewardScene', { caller: 'coloring' }),
      );
    }
  }

  private drawOutline(): void {
    const gfx = this.add.graphics().setDepth(10);
    gfx.lineStyle(5, 0x5D4037, 1);
    // body
    gfx.strokeRoundedRect(412, 440, 200, 140, 10);
    // mane
    gfx.strokeCircle(512, 395, 80);
    // face
    gfx.strokeCircle(512, 305, 50);
    // ears
    gfx.strokeRoundedRect(432, 218, 160, 35, 8);
    // tail
    gfx.strokeRect(643, 490, 25, 80);
  }
}
```

- [ ] **Step 2: Verify coloring scene works end-to-end**

```bash
npm run dev
```

1. Click Paint House from HomeScene → ColoringScene loads
2. Tap a color circle → should highlight
3. Tap each lion region → region changes to selected color
4. Tap all 5 regions → RewardScene launches showing paintbrush sticker "Artist!"
5. Auto-dismiss returns to HomeScene; star count increased by 3

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ColoringScene.ts
git commit -m "feat: implement ColoringScene with region tap-to-fill and win detection"
```

---

## Task 7: Implement BasketballScene

**Files:**
- Create: `src/scenes/BasketballScene.ts` (replaces stub from Task 3)

- [ ] **Step 1: Write BasketballScene**

Replace `src/scenes/BasketballScene.ts` with:

```typescript
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
  private boundCheckEvent?: Phaser.Time.TimerEvent;

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
```

- [ ] **Step 2: Verify basketball scene works end-to-end**

```bash
npm run dev
```

1. Click Basketball Court from HomeScene → BasketballScene loads, green court background
2. Touch/click near ball (bottom-left) and drag upward-right toward hoop → 4 white dots show arc preview
3. Release → ball flies along arc with gravity
4. Ball through hoop → score increments `1 / 3`, score text bounces
5. Ball misses or exits screen → resets to start position, can shoot again
6. Score 3 → RewardScene shows basketball sticker "Champ!"
7. Auto-dismiss → HomeScene, star count +3

Physics tuning if needed (adjust in `BasketballScene.ts`):
- Ball too slow/fast: change `POWER_MULTIPLIER` (higher = more powerful)
- Ball drops too fast/slow: change `gravity.y` in `main.ts` (default `1`)
- Hoop too hard to hit: change rim body x-offsets (currently ±75 from `HOOP_X`)

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BasketballScene.ts
git commit -m "feat: implement BasketballScene with drag-release mechanics and Matter.js physics"
```

---

## Completion Checklist

- [ ] All 8 tests pass: `npm test`
- [ ] HomeScene shows 4 interactive buildings
- [ ] ColoringScene: all 5 regions tap-colorable, win → "Artist!" sticker in RewardScene
- [ ] BasketballScene: ball launches from drag, 3 scores → "Champ!" sticker in RewardScene
- [ ] RewardScene shows sticker for all 4 callers (Zoo, Toy Store, Paint, Basketball)
- [ ] Stars and stickers persist to localStorage across page reloads
- [ ] No console errors in browser
