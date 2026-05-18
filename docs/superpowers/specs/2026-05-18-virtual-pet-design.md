# Virtual Pet Companion — Design Spec

**Date:** 2026-05-18
**Scope:** PetScene + PetStateManager + SaveData extension
**Out of scope:** Real pet sprite assets (placeholders used), real-time decay while app is closed (decay applied on next visit only)

---

## 1. Architecture

### New files

| File | Purpose |
|---|---|
| `src/scenes/PetScene.ts` | Pet room — mascot display, activities, mascot picker overlay |
| `src/pet/PetStateManager.ts` | Pet state read/write, decay, mood text, activity ticks |

### Modified files

| File | Change |
|---|---|
| `src/save/SaveManager.ts` | Add `pet: PetState` field to `SaveData` |
| `src/scenes/HomeScene.ts` | 6th building slot unlocks at 10 stars → launches `PetScene` |
| `src/scenes/BootScene.ts` | Add placeholder textures for 4 mascots + pet UI assets |
| `src/main.ts` | Register `PetScene` |

No new npm dependencies. All animations use existing `AnimationHelpers`.

---

## 2. PetScene Layout & Flow

### Layout (1024×768)

```
┌─────────────────────────────────────┐
│  [←Back]          My Pet   [⚙ swap] │
│                                     │
│            [pet mascot]             │
│           [mood bubble]             │
│        "I'm a little hungry!"       │
│                                     │
│  [🍎Feed] [🛁Wash] [😴Sleep]        │
│       [💃Dance] [📚Learn]           │
│                                     │
│  hunger ████░░  energy █████░        │
│  clean  ███░░░                      │
└─────────────────────────────────────┘
```

### Flow

1. Child taps Pet House building on HomeScene (unlocked at 10 stars)
2. If `pet.mascot` is null → mascot picker overlay shown; child picks one; saved immediately
3. Pet Room shown: mascot, mood bubble, 5 activity buttons, 3 status bars
4. Child taps activity → animation plays + state ticks up + 1 star awarded
5. ⚙ button opens mascot picker overlay anytime → swap saved immediately
6. Back button → `PetStateManager.save()` updates `lastVisit` → HomeScene

### Mood bubble logic

| Condition | Bubble text |
|---|---|
| All needs ≥ 60 | "I'm so happy! 🌟" |
| hunger < 40 | "I'm a little hungry… could we eat?" |
| energy < 40 | "I'm getting sleepy… maybe naptime?" |
| cleanliness < 40 | "I could use a little bath 🛁" |
| Post-activity | "That was so fun! Thank you! 💕" |

Mood bubble is advisory only — never blocks interaction, never shows aggressive sad/angry state.

---

## 3. Pet State Model

### PetState interface

```ts
interface PetState {
  mascot: 'dino' | 'bunny' | 'panda' | 'alien' | null;
  hunger: number;      // 0–100
  energy: number;      // 0–100
  cleanliness: number; // 0–100
  lastVisit: number;   // Date.now() timestamp
}
```

Default: `{ mascot: null, hunger: 80, energy: 80, cleanliness: 80, lastVisit: 0 }`

Added to `SaveData` as `pet: PetState`.

### Gentle decay on visit

Applied once in `PetScene.create()` via `PetStateManager.applyDecay()`. Values floored at 20 — pet never reaches a desperate state.

Skip decay entirely when `lastVisit === 0` (first ever visit — pet starts fresh at defaults).

```
if lastVisit === 0: skip (first visit, no decay)
else:
  hoursElapsed = (Date.now() - lastVisit) / 3_600_000
  hunger      -= min(hoursElapsed * 5, 60)  → floor 20
  energy      -= min(hoursElapsed * 4, 60)  → floor 20
  cleanliness -= min(hoursElapsed * 3, 60)  → floor 20
```

### Activity ticks

| Activity | Effect |
|---|---|
| Feed | hunger +30 (cap 100) |
| Wash | cleanliness +30 (cap 100) |
| Sleep | energy +40 (cap 100) |
| Dance | hunger +10, energy +10, cleanliness +10 |
| Learn | launches SpeechScene — no direct state tick |

Each activity (including Learn on launch) awards `SaveManager.addStars(1)`.

---

## 4. Activity Mechanics & Mascot Picker

### Activity animations

All use existing `AnimationHelpers`.

| Activity | Mascot animation | Extra effect |
|---|---|---|
| Feed | `bounceIn` | food particle burst at mascot mouth position |
| Wash | `squashStretch` | bubble particles scattered around mascot |
| Sleep | alpha 1→0.5→1 pulse × 3 (1.5s tween) | "Zzz" text floats up and fades |
| Dance | `squashStretch` × 3 rapid alternating | `celebrationParticles` at mascot center |
| Learn | `bounceIn` + mood bubble "Let's go learn! 📚" | then `this.scene.start('SpeechScene')` |

Activity buttons disabled for 1.5s after tap to prevent double-fire.

### Mascot picker overlay

Implemented as `Phaser.GameObjects.Container`.

- **Trigger:** first visit (mascot is null) OR ⚙ button tap
- Semi-transparent dark backdrop (alpha 0.7)
- 4 large mascot cards: dino / bunny / panda / alien (colored placeholder rectangles)
- Tap card → `bounceIn` on card → `PetStateManager.setMascot(key)` → overlay hides
- On first visit: overlay cannot be dismissed without picking a mascot
- On ⚙ tap: overlay dismissible (child already has a mascot)

### PetStateManager interface

```ts
type ActivityType = 'feed' | 'wash' | 'sleep' | 'dance' | 'learn';

class PetStateManager {
  getState(): PetState
  applyDecay(): void
  applyActivity(type: ActivityType): void
  setMascot(key: PetState['mascot']): void
  getMoodText(): string
  save(): void
}
```

`save()` delegates to `SaveManager` and updates `lastVisit` to `Date.now()`.

---

## 5. Data Flow

```
HomeScene (stars ≥ 10)
  └─ tap Pet House → PetScene.create()
       ├─ PetStateManager.applyDecay()
       ├─ pet.mascot === null → show mascot picker overlay
       ├─ render mascot + mood bubble + status bars
       ├─ tap Feed / Wash / Sleep / Dance
       │    ├─ AnimationHelpers animation
       │    ├─ PetStateManager.applyActivity(type)
       │    ├─ SaveManager.addStars(1)
       │    └─ refresh status bars + mood bubble
       ├─ tap Learn
       │    ├─ SaveManager.addStars(1)
       │    └─ this.scene.start('SpeechScene')
       ├─ tap ⚙ → mascot picker overlay
       └─ tap Back
            ├─ PetStateManager.save()
            └─ this.scene.start('HomeScene')
```

---

## 6. HomeScene Changes

6th building slot changes from permanently locked to:

```ts
{
  texture:     petUnlocked ? 'building_petHouse' : 'building_locked',
  x: 720, y: 560,
  label:       petUnlocked ? 'Pet House' : '?',
  targetScene: petUnlocked ? 'PetScene' : null,
}
```

`petUnlocked = stars >= 10`. First unlock fires `unlockCelebration(this)` (same pattern as Music Stage).

---

## 7. Success Criteria

- Pet Room unlocks at 10 stars; `unlockCelebration` fires exactly once on first unlock
- First visit shows mascot picker; child must pick before proceeding
- Subsequent visits skip picker and go straight to pet room
- Mascot swappable anytime via ⚙ — persists across sessions
- All 4 mascots render as distinct colored placeholder rectangles
- Status bars update correctly after each activity
- Decay floors at 20 on all three stats — pet never reaches 0
- Mood bubble text is always gentle; no angry/dying/punishing language
- "Learn" activity launches SpeechScene; Back from SpeechScene returns to HomeScene (existing behavior unchanged)
- Each activity awards +1 star
- No new npm dependencies
