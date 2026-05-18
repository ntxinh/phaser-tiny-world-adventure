# Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an English speaking mini game (SpeechScene) and animation polish (AnimationHelpers) across all existing scenes.

**Architecture:** `SpeechRecognizer` is a plain TS class wrapping Web Speech API with graceful fallback; `AnimationHelpers` exports pure fire-and-forget functions that take a Phaser scene + target; `SpeechScene` is a new Phaser scene registered in `main.ts` and unlocked from `HomeScene` at 5 stars.

**Tech Stack:** Phaser 3.88, TypeScript 5, Vitest 1, jsdom, Web Speech API (`SpeechRecognition`), Web Speech Synthesis (`speechSynthesis`)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/speech/SpeechRecognizer.ts` | Web Speech API wrapper, match logic |
| Create | `src/animations/AnimationHelpers.ts` | Shared tween/particle utilities |
| Create | `src/scenes/SpeechScene.ts` | English speaking mini game |
| Create | `tests/speech/SpeechRecognizer.test.ts` | Tests for recognition logic |
| Create | `tests/animations/AnimationHelpers.test.ts` | Tests for animation helpers |
| Modify | `src/scenes/BootScene.ts` | Add `building_musicStage`, `btn_mic` textures + speech audio entries |
| Modify | `src/main.ts` | Register SpeechScene |
| Modify | `src/scenes/HomeScene.ts` | Add Music Stage unlock (≥5 stars) + unlockCelebration |
| Modify | `src/scenes/AnimalScene.ts` | Add celebrationParticles on tap |
| Modify | `src/scenes/MatchingScene.ts` | Add squashStretch + celebrationParticles on correct drop |
| Modify | `src/scenes/ColoringScene.ts` | Add celebrationParticles on region fill |
| Modify | `src/scenes/BasketballScene.ts` | Add screenShake + celebrationParticles on score |
| Modify | `src/scenes/RewardScene.ts` | Replace inline sticker tween with AnimationHelpers.bounceIn |

---

## Task 1: SpeechRecognizer

**Files:**
- Create: `src/speech/SpeechRecognizer.ts`
- Create: `tests/speech/SpeechRecognizer.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/speech/SpeechRecognizer.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeechRecognizer, matchesTarget } from '../../src/speech/SpeechRecognizer';

describe('SpeechRecognizer.isSupported', () => {
  let sr: SpeechRecognizer;

  beforeEach(() => {
    sr = new SpeechRecognizer();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('returns false when no SpeechRecognition API', () => {
    expect(sr.isSupported()).toBe(false);
  });

  it('returns true when window.SpeechRecognition exists', () => {
    (window as any).SpeechRecognition = vi.fn();
    expect(sr.isSupported()).toBe(true);
  });

  it('returns true when window.webkitSpeechRecognition exists', () => {
    (window as any).webkitSpeechRecognition = vi.fn();
    expect(sr.isSupported()).toBe(true);
  });

  it('startListening calls onFail immediately when not supported', () => {
    const onPass = vi.fn();
    const onFail = vi.fn();
    sr.startListening('apple', onPass, onFail);
    expect(onFail).toHaveBeenCalledOnce();
    expect(onPass).not.toHaveBeenCalled();
  });
});

describe('matchesTarget', () => {
  it('returns true when transcript includes target and confidence >= 0.4', () => {
    const mockResult = [
      { transcript: 'apple', confidence: 0.8 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(true);
  });

  it('returns false when confidence below threshold', () => {
    const mockResult = [
      { transcript: 'apple', confidence: 0.3 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(false);
  });

  it('returns false when transcript does not include target', () => {
    const mockResult = [
      { transcript: 'banana', confidence: 0.9 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(false);
  });

  it('is case-insensitive', () => {
    const mockResult = [
      { transcript: 'APPLE', confidence: 0.7 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(true);
  });

  it('matches when any alternative passes', () => {
    const mockResult = [
      { transcript: 'banana', confidence: 0.9 },
      { transcript: 'apple', confidence: 0.5 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(true);
  });

  it('returns false when all alternatives fail confidence', () => {
    const mockResult = [
      { transcript: 'apple', confidence: 0.1 },
      { transcript: 'apple', confidence: 0.2 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/speech/SpeechRecognizer.test.ts
```

Expected: FAIL — `Cannot find module '../../src/speech/SpeechRecognizer'`

- [ ] **Step 3: Create SpeechRecognizer implementation**

```ts
// src/speech/SpeechRecognizer.ts

export function matchesTarget(
  results: SpeechRecognitionResult,
  target: string,
  threshold: number,
): boolean {
  return Array.from(results).some(
    r => r.confidence >= threshold && r.transcript.toLowerCase().includes(target.toLowerCase()),
  );
}

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;

  isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  startListening(target: string, onPass: () => void, onFail: () => void): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      onFail();
      return;
    }

    this.recognition = new SR() as SpeechRecognition;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const matched = matchesTarget(event.results[0], target, 0.4);
      matched ? onPass() : onFail();
    };

    this.recognition.onerror = () => onFail();
    this.recognition.onend = () => { this.recognition = null; };
    this.recognition.start();
  }

  stopListening(): void {
    this.recognition?.abort();
    this.recognition = null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/speech/SpeechRecognizer.test.ts
```

Expected: PASS — 9 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/speech/SpeechRecognizer.ts tests/speech/SpeechRecognizer.test.ts
git commit -m "feat: add SpeechRecognizer with Web Speech API support and graceful fallback"
```

---

## Task 2: AnimationHelpers

**Files:**
- Create: `src/animations/AnimationHelpers.ts`
- Create: `tests/animations/AnimationHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/animations/AnimationHelpers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  bounceIn,
  squashStretch,
  pulseLoop,
  celebrationParticles,
  screenShake,
  unlockCelebration,
} from '../../src/animations/AnimationHelpers';

function makeMockScene() {
  return {
    tweens: { add: vi.fn() },
    time: { delayedCall: vi.fn((_delay: number, fn: () => void) => fn()) },
    add: {
      circle: vi.fn().mockReturnValue({ destroy: vi.fn() }),
    },
    cameras: { main: { shake: vi.fn() } },
  };
}

function makeMockObj() {
  return { setScale: vi.fn().mockReturnThis() };
}

describe('bounceIn', () => {
  it('sets scale to 0 before tweening', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    bounceIn(scene as any, obj as any);
    expect(obj.setScale).toHaveBeenCalledWith(0);
  });

  it('tweens to scale 1.2', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    bounceIn(scene as any, obj as any);
    expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ scale: 1.2 }));
  });
});

describe('squashStretch', () => {
  it('calls tweens.add with scaleX: 1.3 and scaleY: 0.7', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    squashStretch(scene as any, obj as any);
    expect(scene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({ scaleX: 1.3, scaleY: 0.7 }),
    );
  });
});

describe('pulseLoop', () => {
  it('calls tweens.add with loop: -1', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    pulseLoop(scene as any, obj as any);
    expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ loop: -1 }));
  });
});

describe('screenShake', () => {
  it('calls cameras.main.shake with intensity 0.02 and duration 300', () => {
    const scene = makeMockScene();
    screenShake(scene as any);
    expect(scene.cameras.main.shake).toHaveBeenCalledWith(300, 0.02);
  });
});

describe('celebrationParticles', () => {
  it('creates 20 circles', () => {
    const scene = makeMockScene();
    celebrationParticles(scene as any, 100, 200);
    expect(scene.add.circle).toHaveBeenCalledTimes(20);
  });

  it('creates tweens for each circle', () => {
    const scene = makeMockScene();
    celebrationParticles(scene as any, 100, 200);
    expect(scene.tweens.add).toHaveBeenCalledTimes(20);
  });
});

describe('unlockCelebration', () => {
  it('calls screenShake', () => {
    const scene = makeMockScene();
    unlockCelebration(scene as any);
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });

  it('schedules 3 particle bursts via time.delayedCall', () => {
    const scene = makeMockScene();
    unlockCelebration(scene as any);
    expect(scene.time.delayedCall).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/animations/AnimationHelpers.test.ts
```

Expected: FAIL — `Cannot find module '../../src/animations/AnimationHelpers'`

- [ ] **Step 3: Create AnimationHelpers implementation**

```ts
// src/animations/AnimationHelpers.ts
import Phaser from 'phaser';

type ScalableGO = Phaser.GameObjects.GameObject & { setScale(v: number): unknown };

export function bounceIn(scene: Phaser.Scene, obj: ScalableGO): void {
  obj.setScale(0);
  scene.tweens.add({
    targets: obj,
    scale: 1.2,
    duration: 200,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({ targets: obj, scale: 1.0, duration: 150, ease: 'Sine.Out' });
    },
  });
}

export function squashStretch(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void {
  scene.tweens.add({
    targets: obj,
    scaleX: 1.3,
    scaleY: 0.7,
    duration: 100,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({ targets: obj, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Back.Out' });
    },
  });
}

export function pulseLoop(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void {
  scene.tweens.add({
    targets: obj,
    scale: 1.08,
    duration: 800,
    yoyo: true,
    loop: -1,
    ease: 'Sine.InOut',
  });
}

export function celebrationParticles(scene: Phaser.Scene, x: number, y: number): void {
  const colors = [0xFFD700, 0xFF6B6B, 0x6BCB77, 0x4D96FF, 0xFF922B];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const speed = 80 + (i % 5) * 30;
    const dot = scene.add.circle(x, y, 8, colors[i % colors.length]);
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => dot.destroy(),
    });
  }
}

export function screenShake(scene: Phaser.Scene): void {
  scene.cameras.main.shake(300, 0.02);
}

export function unlockCelebration(scene: Phaser.Scene): void {
  screenShake(scene);
  const positions = [{ x: 200, y: 200 }, { x: 512, y: 300 }, { x: 820, y: 200 }];
  positions.forEach(({ x, y }, i) => {
    scene.time.delayedCall(i * 200, () => celebrationParticles(scene, x, y));
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/animations/AnimationHelpers.test.ts
```

Expected: PASS — 11 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/animations/AnimationHelpers.ts tests/animations/AnimationHelpers.test.ts
git commit -m "feat: add AnimationHelpers with bounce, squash-stretch, particles, and screen shake"
```

---

## Task 3: BootScene additions

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Add building_musicStage and btn_mic to texture defs**

In `generateTextures()`, after the last sticker entry (`{ key: 'sticker_basketball', ... }`), add:

```ts
// Phase 3 textures
{ key: 'building_musicStage', width: 160, height: 160, color: 0x7E57C2, radius: 20 },
{ key: 'btn_mic',             width: 140, height: 140, color: 0xE91E63, radius: 70 },
```

- [ ] **Step 2: Add speech audio entries**

In `registerAudio()`, after the last entry (`['voice_basketball', ...]`), add:

```ts
['sfx_speech_pass',  'assets/audio/sfx/speech_pass.mp3'],
['sfx_mic_start',    'assets/audio/sfx/mic_start.mp3'],
```

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
npm test
```

Expected: all existing tests still pass

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: add musicStage/mic textures and speech audio entries to BootScene"
```

---

## Task 4: SpeechScene

**Files:**
- Create: `src/scenes/SpeechScene.ts`

- [ ] **Step 1: Create SpeechScene**

```ts
// src/scenes/SpeechScene.ts
import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';
import { SpeechRecognizer } from '../speech/SpeechRecognizer';
import { bounceIn, celebrationParticles, pulseLoop } from '../animations/AnimationHelpers';

type Category = 'animals' | 'fruits' | 'colors' | 'shapes' | 'numbers';

const WORDS: Record<Category, string[]> = {
  animals: ['lion', 'duck', 'fish', 'frog', 'bear', 'cat', 'dog', 'bird'],
  fruits:  ['apple', 'banana', 'mango', 'grape', 'orange', 'pear'],
  colors:  ['red', 'blue', 'green', 'yellow', 'purple', 'pink'],
  shapes:  ['circle', 'square', 'star', 'heart', 'triangle'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six'],
};

const CATEGORY_DEFS: Array<{ key: Category; label: string; color: number }> = [
  { key: 'animals', label: 'Animals', color: 0x66BB6A },
  { key: 'fruits',  label: 'Fruits',  color: 0xFFA726 },
  { key: 'colors',  label: 'Colors',  color: 0xEC407A },
  { key: 'shapes',  label: 'Shapes',  color: 0x42A5F5 },
  { key: 'numbers', label: 'Numbers', color: 0xAB47BC },
];

export class SpeechScene extends Phaser.Scene {
  private recognizer = new SpeechRecognizer();
  private currentCategory: Category = 'animals';
  private remainingWords: string[] = [];
  private currentWord = '';
  private isListening = false;

  private categoryObjects: Phaser.GameObjects.GameObject[] = [];
  private gameObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'SpeechScene' }); }

  create(): void {
    this.isListening = false;
    this.add.rectangle(512, 384, 1024, 768, 0x1A237E);
    this.add.text(512, 55, 'Say It!', {
      fontSize: '52px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#7C4DFF',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.showCategoryPicker();
    new BackButton(this, () => {
      this.recognizer.stopListening();
      this.scene.start('HomeScene');
    });
  }

  private showCategoryPicker(): void {
    this.clearObjects(this.categoryObjects);

    const row1 = CATEGORY_DEFS.slice(0, 3);
    const row2 = CATEGORY_DEFS.slice(3);

    row1.forEach(({ key, label, color }, i) => {
      this.addCategoryButton(key, label, color, 200 + i * 310, 300);
    });
    row2.forEach(({ key, label, color }, i) => {
      this.addCategoryButton(key, label, color, 360 + i * 310, 500);
    });
  }

  private addCategoryButton(key: Category, label: string, color: number, x: number, y: number): void {
    const rect = this.add.rectangle(x, y, 240, 140, color, 1).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '34px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    pulseLoop(this, rect);

    rect.on('pointerup', () => {
      AudioManager.playSfx('sfx_success');
      this.startCategory(key);
    });

    this.categoryObjects.push(rect, text);
  }

  private startCategory(key: Category): void {
    this.currentCategory = key;
    this.remainingWords = [...WORDS[key]];
    Phaser.Utils.Array.Shuffle(this.remainingWords);
    this.clearObjects(this.categoryObjects);
    this.nextWord();
  }

  private nextWord(): void {
    this.clearObjects(this.gameObjects);

    if (this.remainingWords.length === 0) {
      this.remainingWords = [...WORDS[this.currentCategory]];
      Phaser.Utils.Array.Shuffle(this.remainingWords);
    }

    this.currentWord = this.remainingWords.pop()!;
    const catDef = CATEGORY_DEFS.find(c => c.key === this.currentCategory)!;

    // Back to categories button
    const backBtn = this.add.text(110, 110, '← Categories', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerup', () => {
      this.recognizer.stopListening();
      this.isListening = false;
      this.showCategoryPicker();
    });

    // Word image placeholder
    const wordRect = this.add.rectangle(512, 300, 220, 220, catDef.color).setStrokeStyle(6, 0xffffff);

    // Word text
    const wordText = this.add.text(512, 450, this.currentWord.toUpperCase(), {
      fontSize: '56px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    bounceIn(this, wordRect);

    if (this.recognizer.isSupported()) {
      this.showMicButton(wordRect, wordText);
    } else {
      this.showSpeakerButton();
    }

    this.gameObjects.push(backBtn, wordRect, wordText);
  }

  private showMicButton(
    wordRect: Phaser.GameObjects.Rectangle,
    wordText: Phaser.GameObjects.Text,
  ): void {
    const micBtn = this.add.image(512, 600, 'btn_mic').setInteractive({ useHandCursor: true });
    const micLabel = this.add.text(512, 600, '🎤', {
      fontSize: '48px',
    }).setOrigin(0.5);
    const statusText = this.add.text(512, 680, 'Tap to speak', {
      fontSize: '28px', color: '#B0BEC5', fontFamily: 'Arial',
    }).setOrigin(0.5);

    pulseLoop(this, micBtn);

    micBtn.on('pointerup', () => {
      if (this.isListening) return;
      this.isListening = true;
      statusText.setText('Listening...').setColor('#69F0AE');
      AudioManager.playSfx('sfx_mic_start');

      this.recognizer.startListening(
        this.currentWord,
        () => {
          this.isListening = false;
          statusText.setText('').setColor('#B0BEC5');
          AudioManager.playSfx('sfx_speech_pass');
          celebrationParticles(this, wordRect.x, wordRect.y);
          bounceIn(this, wordText);
          this.time.delayedCall(800, () => this.nextWord());
        },
        () => {
          this.isListening = false;
          statusText.setText('Try again!').setColor('#FF5252');
          this.time.delayedCall(1200, () => {
            if (statusText.active) statusText.setText('Tap to speak').setColor('#B0BEC5');
          });
        },
      );
    });

    this.gameObjects.push(micBtn, micLabel, statusText);
  }

  private showSpeakerButton(): void {
    const speakerBtn = this.add.rectangle(512, 600, 220, 100, 0x546E7A)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const speakerLabel = this.add.text(512, 600, '🔊 Hear it', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    speakerBtn.on('pointerup', () => {
      const utt = new SpeechSynthesisUtterance(this.currentWord);
      utt.lang = 'en-US';
      utt.rate = 0.8;
      window.speechSynthesis.speak(utt);
    });

    this.gameObjects.push(speakerBtn, speakerLabel);
  }

  private clearObjects(arr: Phaser.GameObjects.GameObject[]): void {
    arr.forEach(o => o.destroy());
    arr.length = 0;
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass (SpeechScene has no unit tests — it's a Phaser scene; behavior verified manually)

- [ ] **Step 3: Commit**

```bash
git add src/scenes/SpeechScene.ts
git commit -m "feat: add SpeechScene with category picker, mic support, and fallback speaker mode"
```

---

## Task 5: Register SpeechScene + HomeScene Music Stage unlock

**Files:**
- Modify: `src/main.ts`
- Modify: `src/scenes/HomeScene.ts`

- [ ] **Step 1: Register SpeechScene in main.ts**

Replace the scene array line:

```ts
// Before:
import { RewardScene } from './scenes/RewardScene';

const config: Phaser.Types.Core.GameConfig = {
  // ...
  scene: [BootScene, HomeScene, AnimalScene, MatchingScene, ColoringScene, BasketballScene, RewardScene],
```

```ts
// After — add import after RewardScene import:
import { SpeechScene } from './scenes/SpeechScene';

// Update scene array:
  scene: [BootScene, HomeScene, AnimalScene, MatchingScene, ColoringScene, BasketballScene, RewardScene, SpeechScene],
```

- [ ] **Step 2: Update HomeScene to add Music Stage unlock**

Replace `HomeScene.ts` with this updated version (all changes marked):

```ts
// src/scenes/HomeScene.ts
import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import SaveManager from '../save/SaveManager';
import { unlockCelebration } from '../animations/AnimationHelpers';  // NEW

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

    // NEW: check Music Stage unlock
    const musicStageUnlocked = stars >= 5;
    const wasAlreadyTracked = SaveManager.getData().gamesUnlocked.includes('musicStage');

    if (musicStageUnlocked && !wasAlreadyTracked) {
      SaveManager.unlockGame('musicStage');
      this.time.delayedCall(400, () => unlockCelebration(this));
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
      { texture: 'building_locked', x: 720, y: 560, label: '?', targetScene: null },
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

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/main.ts src/scenes/HomeScene.ts
git commit -m "feat: register SpeechScene and add Music Stage unlock at 5 stars in HomeScene"
```

---

## Task 6: Animate AnimalScene

**Files:**
- Modify: `src/scenes/AnimalScene.ts`

- [ ] **Step 1: Add celebrationParticles import and call in onAnimalTap**

At the top of `AnimalScene.ts`, add import after `BackButton` import:

```ts
import { celebrationParticles } from '../animations/AnimationHelpers';
```

In `onAnimalTap`, after `this.tappedSet.add(animal.texture)`:

```ts
private onAnimalTap(img: Phaser.GameObjects.Image, animal: AnimalConfig): void {
  AudioManager.playVoice(animal.voiceKey);
  AudioManager.playSfx(animal.sfxKey);

  this.tweens.add({
    targets: img,
    scaleX: 1.3,
    scaleY: 1.3,
    duration: 150,
    yoyo: true,
    ease: 'Back.Out',
  });

  celebrationParticles(this, img.x, img.y);  // NEW

  this.tappedSet.add(animal.texture);

  if (this.tappedSet.size === this.animals.length) {
    this.animalImages.forEach(a => a.disableInteractive());
    this.time.delayedCall(600, () =>
      this.scene.launch('RewardScene', { caller: 'AnimalScene' }),
    );
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/scenes/AnimalScene.ts
git commit -m "feat: add celebration particles on animal tap in AnimalScene"
```

---

## Task 7: Animate MatchingScene

**Files:**
- Modify: `src/scenes/MatchingScene.ts`

- [ ] **Step 1: Add squashStretch + celebrationParticles on correct drop**

Add import after `BackButton` import:

```ts
import { squashStretch, celebrationParticles } from '../animations/AnimationHelpers';
```

In `setupDrag()`, replace the `'drop'` handler content for the correct-match branch:

```ts
this.input.on('drop', (
  _p: unknown,
  go: Phaser.GameObjects.Image,
  dropZone: Phaser.GameObjects.Zone,
) => {
  if (dropZone.name === (go.getData('target') as string)) {
    go.x = dropZone.x;
    go.y = dropZone.y;
    go.setScale(1.0).disableInteractive();
    squashStretch(this, go);                          // NEW
    celebrationParticles(this, dropZone.x, dropZone.y); // NEW
    this.matchedCount++;
    AudioManager.playSfx('sfx_success');
    if (this.matchedCount === this.pairs.length) {
      this.time.delayedCall(800, () =>
        this.scene.launch('RewardScene', { caller: 'MatchingScene' }),
      );
    }
  } else {
    this.snapBack(go);
  }
});
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/scenes/MatchingScene.ts
git commit -m "feat: add squash-stretch and particles on correct match in MatchingScene"
```

---

## Task 8: Animate ColoringScene

**Files:**
- Modify: `src/scenes/ColoringScene.ts`

- [ ] **Step 1: Add celebrationParticles on region fill**

Add import after `BackButton` import:

```ts
import { celebrationParticles } from '../animations/AnimationHelpers';
```

In `onRegionTap`, after the existing tween:

```ts
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

  celebrationParticles(this, img.x, img.y);  // NEW

  if (this.coloredSet.size === REGIONS.length && !this.rewardLaunched) {
    this.rewardLaunched = true;
    this.regionImages.forEach(r => r.disableInteractive());
    this.time.delayedCall(600, () =>
      this.scene.launch('RewardScene', { caller: 'coloring' }),
    );
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ColoringScene.ts
git commit -m "feat: add celebration particles on region fill in ColoringScene"
```

---

## Task 9: Animate BasketballScene

**Files:**
- Modify: `src/scenes/BasketballScene.ts`

- [ ] **Step 1: Add screenShake + celebrationParticles on score**

Add import after `BackButton` import:

```ts
import { screenShake, celebrationParticles } from '../animations/AnimationHelpers';
```

In `onScore()`, after `AudioManager.playSfx('sfx_swish')`:

```ts
private onScore(): void {
  this.scoreCount++;
  this.scoreText.setText(`${this.scoreCount} / ${WIN_SCORE}`);
  AudioManager.playSfx('sfx_swish');
  screenShake(this);                              // NEW
  celebrationParticles(this, HOOP_X, HOOP_Y);    // NEW

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
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BasketballScene.ts
git commit -m "feat: add screen shake and particles on score in BasketballScene"
```

---

## Task 10: Polish RewardScene sticker with AnimationHelpers

**Files:**
- Modify: `src/scenes/RewardScene.ts`

- [ ] **Step 1: Replace inline sticker tween with AnimationHelpers.bounceIn**

Add import after `SaveManager` import:

```ts
import { bounceIn } from '../animations/AnimationHelpers';
```

Replace `showSticker()` method:

```ts
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

  bounceIn(this, sticker);  // replaces the two chained tweens that were here

  const data = SaveManager.getData();
  if (!data.stickers.includes(def.texture)) {
    SaveManager.addSticker(def.texture);
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/scenes/RewardScene.ts
git commit -m "refactor: use AnimationHelpers.bounceIn for sticker animation in RewardScene"
```

---

## Task 11: Add pulseLoop to SpeechScene unlocked building in HomeScene

> Note: pulseLoop for HomeScene's Music Stage building is already handled — the building uses pointerover scale, and pulseLoop is used inside SpeechScene's category buttons instead.
> This task verifies the pulse behavior is working correctly in SpeechScene.

- [ ] **Step 1: Run full test suite one final time**

```bash
npm test
```

Expected: all tests pass — output should include tests from:
- `tests/save/SaveManager.test.ts`
- `tests/audio/AudioManager.test.ts`
- `tests/speech/SpeechRecognizer.test.ts`
- `tests/animations/AnimationHelpers.test.ts`

- [ ] **Step 2: Verify test count**

Expected: ~26+ tests passing, 0 failing

- [ ] **Step 3: Final commit if any loose ends**

If all is clean, no commit needed. Otherwise:

```bash
git add -p
git commit -m "chore: phase 3 cleanup"
```
