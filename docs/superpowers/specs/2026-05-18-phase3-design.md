# Phase 3 Design: English Speaking Game + Advanced Animations

**Date:** 2026-05-18
**Scope:** SpeechScene (microphone English game) + AnimationHelpers (polish + unlock celebrations)
**Out of scope:** Parent dashboard (deferred)

---

## 1. Architecture

### New files

| File | Purpose |
|---|---|
| `src/scenes/SpeechScene.ts` | English speaking mini game |
| `src/speech/SpeechRecognizer.ts` | Web Speech API wrapper with graceful fallback |
| `src/animations/AnimationHelpers.ts` | Shared tween/particle utility functions |

### Modified files

| File | Change |
|---|---|
| `src/scenes/HomeScene.ts` | Add Music Stage building (unlocks at 5 stars) |
| `src/scenes/AnimalScene.ts` | Add bounce + particles on tap |
| `src/scenes/MatchingScene.ts` | Add squash-stretch on correct match |
| `src/scenes/ColoringScene.ts` | Add particles on region fill |
| `src/scenes/BasketballScene.ts` | Add screen shake + particles on score |
| `src/scenes/RewardScene.ts` | Add bounceIn on sticker award |
| `src/main.ts` | Register SpeechScene |

No new dependencies. All animation effects use Phaser 3 built-in tweens and particles.

---

## 2. SpeechScene

### Flow

1. Child enters scene → category picker shown (5 large buttons)
2. Child picks category → random word displayed (big image + word text)
3. Mic button pulses → child speaks → Web Speech API recognition fires
4. Match check: transcript normalized to lowercase, `transcript.includes(targetWord)`, confidence ≥ 0.4
5. Pass → `bounceIn` on image + `celebrationParticles` + "Great job!" text → next random word
6. Back button → returns to HomeScene

### Graceful fallback

If `window.SpeechRecognition` and `window.webkitSpeechRecognition` are both absent:
- Mic button hidden entirely
- Speaker button shown instead
- Tap speaker → `window.speechSynthesis.speak(targetWord)` (hear-only mode)

### Word categories

```ts
const WORDS = {
  animals: ['lion', 'duck', 'fish', 'frog', 'bear', 'cat', 'dog', 'bird'],
  fruits:  ['apple', 'banana', 'mango', 'grape', 'orange', 'pear'],
  colors:  ['red', 'blue', 'green', 'yellow', 'purple', 'pink'],
  shapes:  ['circle', 'square', 'star', 'heart', 'triangle'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six'],
};
```

Words shown as large placeholder rectangles (color-coded by category) until real assets added.

### HomeScene unlock

Music Stage building added at position `x: 500, y: 560` (currently locked slot).
Unlocks when `SaveManager.getData().stars >= 5`.

---

## 3. SpeechRecognizer

**File:** `src/speech/SpeechRecognizer.ts`

```ts
interface SpeechRecognizer {
  isSupported(): boolean;
  startListening(target: string, onPass: () => void, onFail: () => void): void;
  stopListening(): void;
}
```

- `isSupported()` — returns `!!(window.SpeechRecognition || window.webkitSpeechRecognition)`
- `startListening` — single-shot recognition (`interimResults: false`, `maxAlternatives: 3`)
- Match logic: any of the 3 alternatives normalized to lowercase includes target word AND confidence ≥ 0.4
- `onFail` fires on recognition error or no match — scene shows gentle retry prompt, never punishment
- `stopListening` — calls `recognition.abort()`

---

## 4. AnimationHelpers

**File:** `src/animations/AnimationHelpers.ts`

All functions are pure, fire-and-forget, return `void`.

```ts
bounceIn(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void
// scale 0 → 1.2 → 1.0, 300ms total

squashStretch(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void
// scaleX 1.3 + scaleY 0.7 → snap back to 1.0, 200ms

pulseLoop(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void
// infinite yoyo tween, scale 1.0 ↔ 1.08, 800ms period

celebrationParticles(scene: Phaser.Scene, x: number, y: number): void
// 40 star particles, random velocity, 600ms lifespan, auto-destroy

screenShake(scene: Phaser.Scene): void
// camera shake, intensity 0.02, duration 300ms

unlockCelebration(scene: Phaser.Scene): void
// fullscreen fireworks: 3 particle bursts at random positions + screenShake
```

### Per-scene integration

| Scene | Trigger | Effects |
|---|---|---|
| AnimalScene | tap animal | `bounceIn` + `celebrationParticles` at animal position |
| MatchingScene | correct drop | `squashStretch` on matched object + `celebrationParticles` |
| ColoringScene | region fill | `celebrationParticles` at tap point |
| BasketballScene | ball scores | `screenShake` + `celebrationParticles` at hoop position |
| RewardScene | sticker awarded | `bounceIn` on sticker image |
| HomeScene | building unlocks | `unlockCelebration` |

`pulseLoop` applied to interactive objects that lack a hover/pointerover effect — SpeechScene category buttons and the newly unlocked Music Stage building in HomeScene. Existing scenes already use `pointerover` scale; adding `pulseLoop` there would conflict.

---

## 5. Data Flow

```
HomeScene
  └─ tap Music Stage (stars ≥ 5)
       └─ SpeechScene
            ├─ SpeechRecognizer.isSupported() → mic or speaker mode
            ├─ child speaks → SpeechRecognizer.startListening()
            ├─ pass → AnimationHelpers.bounceIn + celebrationParticles
            │         SaveManager.addStars(1)
            └─ back → HomeScene
```

---

## 6. Success Criteria

- SpeechScene playable with mic on Chrome desktop and Chrome Android
- Fallback (speaker-only) works on unsupported browsers without errors
- All 5 categories cycle through words without repetition until exhausted
- Each existing scene has at least one animation effect on correct interaction
- Unlock celebration fires when Music Stage unlocks in HomeScene
- No new npm dependencies introduced
