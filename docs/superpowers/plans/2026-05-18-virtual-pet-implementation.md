# Virtual Pet Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Virtual Pet Companion (PetScene) to the Tiny World game — accessible as the last locked HomeScene building, unlocking at 10 stars — where children care for a chosen mascot through Feed, Wash, Sleep, Dance, and Learn activities.

**Architecture:** A `PetStateManager` class (pure logic, no Phaser) reads/writes `pet: PetState` in `SaveData` and handles decay, activity ticks, and mood text. `PetScene` is a standard Phaser scene that renders the pet room, wires activity buttons to `PetStateManager`, and owns a mascot-picker overlay built as a `Phaser.GameObjects.Container`.

**Tech Stack:** Phaser 3, TypeScript, Vitest (unit tests for logic layer), Vite dev server (visual verification for scene layer). No new npm dependencies.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/save/SaveManager.ts` | modify | Add `PetState` interface + `pet` field to `SaveData` |
| `src/pet/PetStateManager.ts` | create | Decay, activity ticks, mood text, mascot selection |
| `src/scenes/BootScene.ts` | modify | Add `building_petHouse` placeholder texture |
| `src/scenes/HomeScene.ts` | modify | Unlock Pet House at 10 stars, fire `unlockCelebration` |
| `src/main.ts` | modify | Register `PetScene` |
| `src/scenes/PetScene.ts` | create | Full pet room scene + mascot picker overlay |
| `tests/save/SaveManager.test.ts` | modify | Add pet-state persistence tests |
| `tests/pet/PetStateManager.test.ts` | create | Unit tests for all PetStateManager methods |

---

## Task 1: Extend SaveData with PetState

**Files:**
- Modify: `src/save/SaveManager.ts`
- Modify: `tests/save/SaveManager.test.ts`

- [ ] **Step 1: Write failing tests**

Add these three tests to the bottom of the `describe('SaveManager', ...)` block in `tests/save/SaveManager.test.ts`:

```ts
it('default save data includes pet state', () => {
  const data = sm.getData();
  expect(data.pet.mascot).toBeNull();
  expect(data.pet.hunger).toBe(80);
  expect(data.pet.energy).toBe(80);
  expect(data.pet.cleanliness).toBe(80);
  expect(data.pet.lastVisit).toBe(0);
});

it('pet state persists to localStorage', () => {
  sm.getData().pet.mascot = 'dino';
  sm.getData().pet.hunger = 50;
  sm.save();
  const restored = new SaveManager();
  expect(restored.getData().pet.mascot).toBe('dino');
  expect(restored.getData().pet.hunger).toBe(50);
});

it('reset restores default pet state', () => {
  sm.getData().pet.mascot = 'bunny';
  sm.getData().pet.hunger = 30;
  sm.save();
  sm.reset();
  expect(sm.getData().pet.mascot).toBeNull();
  expect(sm.getData().pet.hunger).toBe(80);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A2 'pet'
```

Expected: 3 failures — `Cannot read properties of undefined (reading 'mascot')`

- [ ] **Step 3: Implement PetState in SaveManager**

Replace the contents of `src/save/SaveManager.ts` with:

```ts
export interface PetState {
  mascot: 'dino' | 'bunny' | 'panda' | 'alien' | null;
  hunger: number;
  energy: number;
  cleanliness: number;
  lastVisit: number;
}

export interface SaveData {
  stars: number;
  stickers: string[];
  gamesUnlocked: string[];
  settings: {
    bgmVolume: number;
    sfxVolume: number;
  };
  pet: PetState;
}

const SAVE_KEY = 'twa_save';

const DEFAULT_SAVE: SaveData = {
  stars: 0,
  stickers: [],
  gamesUnlocked: ['zoo', 'toyStore'],
  settings: { bgmVolume: 0.5, sfxVolume: 1.0 },
  pet: { mascot: null, hunger: 80, energy: 80, cleanliness: 80, lastVisit: 0 },
};

function cloneDefault(): SaveData {
  return {
    ...DEFAULT_SAVE,
    stickers: [],
    gamesUnlocked: [...DEFAULT_SAVE.gamesUnlocked],
    settings: { ...DEFAULT_SAVE.settings },
    pet: { ...DEFAULT_SAVE.pet },
  };
}

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  load(): SaveData {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return cloneDefault();
    try {
      const parsed = JSON.parse(raw) as SaveData;
      if (!parsed.pet) parsed.pet = { ...DEFAULT_SAVE.pet };
      return parsed;
    } catch {
      return cloneDefault();
    }
  }

  save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  getData(): SaveData {
    return this.data;
  }

  addStars(n: number): void {
    this.data.stars += n;
    this.save();
  }

  unlockGame(key: string): void {
    if (!this.data.gamesUnlocked.includes(key)) {
      this.data.gamesUnlocked.push(key);
      this.save();
    }
  }

  addSticker(key: string): void {
    if (!this.data.stickers.includes(key)) {
      this.data.stickers.push(key);
      this.save();
    }
  }

  updateSettings(patch: Partial<SaveData['settings']>): void {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  }

  reset(): void {
    this.data = cloneDefault();
    this.save();
  }
}

export default new SaveManager();
```

Note: the `load()` method now patches in a default `pet` object for saves created before this feature.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all tests pass (existing + 3 new pet tests).

- [ ] **Step 5: Commit**

```bash
git add src/save/SaveManager.ts tests/save/SaveManager.test.ts
git commit -m "feat: add PetState to SaveData with persistence and migration"
```

---

## Task 2: Create PetStateManager

**Files:**
- Create: `src/pet/PetStateManager.ts`
- Create: `tests/pet/PetStateManager.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `tests/pet/PetStateManager.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../src/save/SaveManager';
import { PetStateManager } from '../../src/pet/PetStateManager';

describe('PetStateManager', () => {
  let sm: SaveManager;
  let mgr: PetStateManager;

  beforeEach(() => {
    localStorage.clear();
    sm = new SaveManager();
    mgr = new PetStateManager(sm);
  });

  it('getState returns default pet state', () => {
    const state = mgr.getState();
    expect(state.mascot).toBeNull();
    expect(state.hunger).toBe(80);
    expect(state.energy).toBe(80);
    expect(state.cleanliness).toBe(80);
    expect(state.lastVisit).toBe(0);
  });

  describe('applyDecay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does nothing when lastVisit is 0', () => {
      mgr.applyDecay();
      expect(mgr.getState().hunger).toBe(80);
      expect(mgr.getState().energy).toBe(80);
      expect(mgr.getState().cleanliness).toBe(80);
    });

    it('reduces hunger, energy, cleanliness by elapsed hours', () => {
      // 12 hours ago: hunger loses min(12*5,60)=60→20, energy loses min(12*4,60)=48→32, clean loses min(12*3,60)=36→44
      sm.getData().pet.lastVisit = new Date('2026-01-01T00:00:00.000Z').getTime();
      mgr.applyDecay();
      expect(mgr.getState().hunger).toBe(20);
      expect(mgr.getState().energy).toBe(32);
      expect(mgr.getState().cleanliness).toBe(44);
    });

    it('floors all values at 20 regardless of elapsed time', () => {
      // 48 hours: all lose min(48*rate, 60) = 60 → all = max(20, 80-60) = 20
      sm.getData().pet.lastVisit = new Date('2025-12-30T12:00:00.000Z').getTime();
      mgr.applyDecay();
      expect(mgr.getState().hunger).toBe(20);
      expect(mgr.getState().energy).toBe(20);
      expect(mgr.getState().cleanliness).toBe(20);
    });

    it('persists decayed values to localStorage', () => {
      sm.getData().pet.lastVisit = new Date('2026-01-01T00:00:00.000Z').getTime();
      mgr.applyDecay();
      const restored = new SaveManager();
      expect(restored.getData().pet.hunger).toBe(20);
    });
  });

  describe('applyActivity', () => {
    it('feed adds 30 to hunger', () => {
      sm.getData().pet.hunger = 50;
      mgr.applyActivity('feed');
      expect(mgr.getState().hunger).toBe(80);
    });

    it('feed caps hunger at 100', () => {
      sm.getData().pet.hunger = 90;
      mgr.applyActivity('feed');
      expect(mgr.getState().hunger).toBe(100);
    });

    it('wash adds 30 to cleanliness', () => {
      sm.getData().pet.cleanliness = 50;
      mgr.applyActivity('wash');
      expect(mgr.getState().cleanliness).toBe(80);
    });

    it('wash caps cleanliness at 100', () => {
      sm.getData().pet.cleanliness = 80;
      mgr.applyActivity('wash');
      expect(mgr.getState().cleanliness).toBe(100);
    });

    it('sleep adds 40 to energy', () => {
      sm.getData().pet.energy = 50;
      mgr.applyActivity('sleep');
      expect(mgr.getState().energy).toBe(90);
    });

    it('sleep caps energy at 100', () => {
      sm.getData().pet.energy = 70;
      mgr.applyActivity('sleep');
      expect(mgr.getState().energy).toBe(100);
    });

    it('dance adds 10 to all three needs', () => {
      sm.getData().pet.hunger = 60;
      sm.getData().pet.energy = 60;
      sm.getData().pet.cleanliness = 60;
      mgr.applyActivity('dance');
      expect(mgr.getState().hunger).toBe(70);
      expect(mgr.getState().energy).toBe(70);
      expect(mgr.getState().cleanliness).toBe(70);
    });

    it('dance caps all values at 100', () => {
      sm.getData().pet.hunger = 95;
      sm.getData().pet.energy = 95;
      sm.getData().pet.cleanliness = 95;
      mgr.applyActivity('dance');
      expect(mgr.getState().hunger).toBe(100);
      expect(mgr.getState().energy).toBe(100);
      expect(mgr.getState().cleanliness).toBe(100);
    });

    it('learn does not change any need values', () => {
      mgr.applyActivity('learn');
      expect(mgr.getState().hunger).toBe(80);
      expect(mgr.getState().energy).toBe(80);
      expect(mgr.getState().cleanliness).toBe(80);
    });

    it('activity persists to localStorage', () => {
      sm.getData().pet.hunger = 50;
      mgr.applyActivity('feed');
      const restored = new SaveManager();
      expect(restored.getData().pet.hunger).toBe(80);
    });
  });

  describe('setMascot', () => {
    it('saves mascot choice', () => {
      mgr.setMascot('dino');
      expect(mgr.getState().mascot).toBe('dino');
    });

    it('allows changing mascot', () => {
      mgr.setMascot('dino');
      mgr.setMascot('panda');
      expect(mgr.getState().mascot).toBe('panda');
    });

    it('persists mascot to localStorage', () => {
      mgr.setMascot('bunny');
      const restored = new SaveManager();
      expect(restored.getData().pet.mascot).toBe('bunny');
    });
  });

  describe('getMoodText', () => {
    it('returns happy text when all needs >= 60', () => {
      expect(mgr.getMoodText()).toBe("I'm so happy! 🌟");
    });

    it('returns hunger message when hunger < 40', () => {
      sm.getData().pet.hunger = 30;
      expect(mgr.getMoodText()).toBe("I'm a little hungry… could we eat?");
    });

    it('prioritises hunger message over energy when both low', () => {
      sm.getData().pet.hunger = 30;
      sm.getData().pet.energy = 30;
      expect(mgr.getMoodText()).toBe("I'm a little hungry… could we eat?");
    });

    it('returns energy message when energy < 40 and hunger >= 40', () => {
      sm.getData().pet.energy = 30;
      expect(mgr.getMoodText()).toBe("I'm getting sleepy… maybe naptime?");
    });

    it('returns cleanliness message when cleanliness < 40 and others >= 40', () => {
      sm.getData().pet.cleanliness = 30;
      expect(mgr.getMoodText()).toBe("I could use a little bath 🛁");
    });
  });

  describe('save', () => {
    it('updates lastVisit to current time', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T10:00:00.000Z'));
      mgr.save();
      expect(mgr.getState().lastVisit).toBe(new Date('2026-06-01T10:00:00.000Z').getTime());
      vi.useRealTimers();
    });

    it('persists lastVisit to localStorage', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T10:00:00.000Z'));
      mgr.save();
      const restored = new SaveManager();
      expect(restored.getData().pet.lastVisit).toBe(new Date('2026-06-01T10:00:00.000Z').getTime());
      vi.useRealTimers();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pet/PetStateManager.test.ts 2>&1 | head -20
```

Expected: `Cannot find module '../../src/pet/PetStateManager'`

- [ ] **Step 3: Create PetStateManager**

Create `src/pet/PetStateManager.ts`:

```ts
import { SaveManager, PetState } from '../save/SaveManager';

export type ActivityType = 'feed' | 'wash' | 'sleep' | 'dance' | 'learn';

export class PetStateManager {
  private sm: SaveManager;

  constructor(sm: SaveManager) {
    this.sm = sm;
  }

  getState(): PetState {
    return this.sm.getData().pet;
  }

  applyDecay(): void {
    const state = this.getState();
    if (state.lastVisit === 0) return;
    const hours = (Date.now() - state.lastVisit) / 3_600_000;
    state.hunger = Math.round(Math.max(20, state.hunger - Math.min(hours * 5, 60)));
    state.energy = Math.round(Math.max(20, state.energy - Math.min(hours * 4, 60)));
    state.cleanliness = Math.round(Math.max(20, state.cleanliness - Math.min(hours * 3, 60)));
    this.sm.save();
  }

  applyActivity(type: ActivityType): void {
    const state = this.getState();
    switch (type) {
      case 'feed':
        state.hunger = Math.min(100, state.hunger + 30);
        break;
      case 'wash':
        state.cleanliness = Math.min(100, state.cleanliness + 30);
        break;
      case 'sleep':
        state.energy = Math.min(100, state.energy + 40);
        break;
      case 'dance':
        state.hunger = Math.min(100, state.hunger + 10);
        state.energy = Math.min(100, state.energy + 10);
        state.cleanliness = Math.min(100, state.cleanliness + 10);
        break;
      case 'learn':
        break;
    }
    this.sm.save();
  }

  setMascot(key: PetState['mascot']): void {
    this.getState().mascot = key;
    this.sm.save();
  }

  getMoodText(): string {
    const { hunger, energy, cleanliness } = this.getState();
    if (hunger < 40) return "I'm a little hungry… could we eat?";
    if (energy < 40) return "I'm getting sleepy… maybe naptime?";
    if (cleanliness < 40) return "I could use a little bath 🛁";
    return "I'm so happy! 🌟";
  }

  save(): void {
    this.getState().lastVisit = Date.now();
    this.sm.save();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pet/PetStateManager.ts tests/pet/PetStateManager.test.ts
git commit -m "feat: add PetStateManager with decay, activity ticks, and mood logic"
```

---

## Task 3: Add Pet House Texture to BootScene

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Add building_petHouse to the defs array**

In `src/scenes/BootScene.ts`, find the `// Phase 3 textures` comment block and add `building_petHouse` after the existing entries:

```ts
// Phase 3 textures
{ key: 'building_musicStage', width: 160, height: 160, color: 0x7E57C2, radius: 20 },
{ key: 'btn_mic',             width: 140, height: 140, color: 0xE91E63, radius: 70 },
// Phase 4 textures
{ key: 'building_petHouse',   width: 160, height: 160, color: 0xFF8F00, radius: 20 },
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: add building_petHouse placeholder texture to BootScene"
```

---

## Task 4: HomeScene Pet House Unlock + Register PetScene

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Update HomeScene**

Replace the contents of `src/scenes/HomeScene.ts` with:

```ts
import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import SaveManager from '../save/SaveManager';
import { unlockCelebration } from '../animations/AnimationHelpers';

interface BuildingConfig {
  texture: string;
  x: number;
  y: number;
  label: string;
  targetScene: string | null;
}

export class HomeScene extends Phaser.Scene {
  constructor() { super({ key: 'HomeScene' }); }

  create(): void {
    this.add.rectangle(512, 384, 1024, 768, 0x87CEEB);

    this.add.text(512, 60, 'Tiny World', {
      fontSize: '56px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#0066AA',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const stars = SaveManager.getData().stars;
    this.add.text(970, 50, `★ ${stars}`, {
      fontSize: '40px',
      color: '#FFD700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const musicStageUnlocked = stars >= 5;
    const musicWasTracked = SaveManager.getData().gamesUnlocked.includes('musicStage');
    if (musicStageUnlocked && !musicWasTracked) {
      SaveManager.unlockGame('musicStage');
      this.time.delayedCall(400, () => unlockCelebration(this));
    }

    const petHouseUnlocked = stars >= 10;
    const petWasTracked = SaveManager.getData().gamesUnlocked.includes('petHouse');
    if (petHouseUnlocked && !petWasTracked) {
      SaveManager.unlockGame('petHouse');
      this.time.delayedCall(800, () => unlockCelebration(this));
    }

    const buildings: BuildingConfig[] = [
      { texture: 'building_zoo',        x: 280, y: 340, label: 'Zoo',        targetScene: 'AnimalScene'    },
      { texture: 'building_toyStore',   x: 500, y: 340, label: 'Toy Store',  targetScene: 'MatchingScene'  },
      { texture: 'building_paintHouse', x: 720, y: 340, label: 'Paint',      targetScene: 'ColoringScene'  },
      { texture: 'building_basketball', x: 280, y: 560, label: 'Basketball', targetScene: 'BasketballScene'},
      {
        texture:     musicStageUnlocked ? 'building_musicStage' : 'building_locked',
        x: 500, y: 560,
        label:       musicStageUnlocked ? 'Music Stage' : '?',
        targetScene: musicStageUnlocked ? 'SpeechScene' : null,
      },
      {
        texture:     petHouseUnlocked ? 'building_petHouse' : 'building_locked',
        x: 720, y: 560,
        label:       petHouseUnlocked ? 'Pet House' : '?',
        targetScene: petHouseUnlocked ? 'PetScene' : null,
      },
    ];

    buildings.forEach(({ texture, x, y, label, targetScene }) => {
      const img = this.add.image(x, y, texture);

      if (targetScene) {
        img.setInteractive({ useHandCursor: true });
        img.on('pointerover', () => img.setScale(1.1));
        img.on('pointerout', () => img.setScale(1.0));
        img.on('pointerup', () => {
          AudioManager.playSfx('sfx_success');
          this.scene.start(targetScene);
        });
      }

      this.add.text(x, y + 95, label, {
        fontSize: '28px',
        color: '#333333',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
    });

    AudioManager.playBgm('bgm_home');
  }
}
```

- [ ] **Step 2: Register PetScene in main.ts**

Replace the contents of `src/main.ts` with:

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { AnimalScene } from './scenes/AnimalScene';
import { MatchingScene } from './scenes/MatchingScene';
import { ColoringScene } from './scenes/ColoringScene';
import { BasketballScene } from './scenes/BasketballScene';
import { RewardScene } from './scenes/RewardScene';
import { SpeechScene } from './scenes/SpeechScene';
import { PetScene } from './scenes/PetScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, HomeScene, AnimalScene, MatchingScene, ColoringScene, BasketballScene, RewardScene, SpeechScene, PetScene],
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
      gravity: { x: 0, y: 1 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
```

- [ ] **Step 3: Run tests to verify nothing broke**

```bash
npm test
```

Expected: all tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/HomeScene.ts src/main.ts
git commit -m "feat: unlock Pet House at 10 stars in HomeScene and register PetScene"
```

---

## Task 5: Create PetScene

**Files:**
- Create: `src/scenes/PetScene.ts`

- [ ] **Step 1: Create PetScene**

Create `src/scenes/PetScene.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify nothing broke**

```bash
npm test
```

Expected: all tests still pass (PetScene has no unit tests — it's a Phaser scene).

- [ ] **Step 3: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173` in browser and verify:

- [ ] HomeScene shows 6th building as locked (`?`) with default 0 stars
- [ ] Open browser console → `localStorage.setItem('twa_save', JSON.stringify({stars:10,stickers:[],gamesUnlocked:['zoo','toyStore'],settings:{bgmVolume:0.5,sfxVolume:1.0},pet:{mascot:null,hunger:80,energy:80,cleanliness:80,lastVisit:0}}))` then refresh → 6th building shows "Pet House"
- [ ] Tap Pet House → PetScene loads
- [ ] Mascot picker overlay appears on first visit (mascot is null)
- [ ] Tap a mascot card → card bounces, overlay hides, mascot colored rectangle + label appears
- [ ] Mood text shows "I'm so happy! 🌟"
- [ ] All 3 status bars visible at ~80%
- [ ] All 5 activity buttons visible and respond to hover
- [ ] Tap Feed → mascot bounces + particle burst + "That was so fun!" bubble + hunger bar increases
- [ ] Tap Wash → mascot squashes + bubble particles + cleanliness bar increases
- [ ] Tap Sleep → Zzz text floats up + mascot pulses alpha + energy bar increases
- [ ] Tap Dance → 3 rapid squash-stretch + particles
- [ ] Tap Learn → mascot bounces + "Let's go learn!" → transitions to SpeechScene
- [ ] ⚙ button opens mascot picker with close button (✕)
- [ ] Back button → PetScene saves state → HomeScene

- [ ] **Step 4: Commit**

```bash
git add src/scenes/PetScene.ts
git commit -m "feat: add PetScene with mascot picker, activities, and status bars"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Unlocks at 10 stars | Task 4 (HomeScene) |
| `unlockCelebration` fires once on first unlock | Task 4 (HomeScene) |
| Dedicated PetScene (last building slot) | Task 4 + Task 5 |
| First visit shows mascot picker, must pick | Task 5 (`showMascotPicker(false)`) |
| Mascot swappable via ⚙ anytime | Task 5 (`showMascotPicker(true)`) |
| Mascot choice persists | Task 2 (`setMascot` → `sm.save()`) |
| Gentle decay on visit, floor at 20 | Task 2 (`applyDecay`) |
| Skip decay when `lastVisit === 0` | Task 2 (`if state.lastVisit === 0 return`) |
| Feed/Wash/Sleep/Dance state ticks | Task 2 (`applyActivity`) |
| Learn launches SpeechScene | Task 5 (`handleActivity('learn')`) |
| Each activity awards +1 star | Task 5 (`SaveManagerInstance.addStars(1)`) |
| Mood bubble always gentle | Task 2 (`getMoodText`) + Task 5 (text strings) |
| Status bars update after activity | Task 5 (`refreshStatusBars`) |
| Pet state persists via SaveManager | Task 1 + Task 2 |
| `building_petHouse` texture | Task 3 |
| Register PetScene in main.ts | Task 4 |
| No new npm dependencies | All tasks |

All requirements covered.
