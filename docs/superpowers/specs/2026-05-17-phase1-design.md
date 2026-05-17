# Phase 1 Design — Tiny World Adventure

**Date:** 2026-05-17
**Scope:** MVP Phase 1 — Home world, Animal tap game, Drag & Drop matching game, Save progress, Audio system

---

## Stack

| Concern | Choice |
|---------|--------|
| Game engine | Phaser 3 + TypeScript |
| Bundler | Vite |
| Audio | Howler.js |
| Save (Phase 1) | localStorage |
| Save (future) | IndexedDB (same SaveManager interface) |
| Assets | Placeholder colored shapes + free CC0 sprites/audio |
| Target device | Tablet-first, landscape 1024×768+ |

---

## Folder Structure

```
src/
 ├── scenes/
 │    ├── BootScene.ts       — preload assets, init systems
 │    ├── HomeScene.ts       — tiny town map, tap buildings to launch games
 │    ├── AnimalScene.ts     — tap animals → voice + sound + animation
 │    ├── MatchingScene.ts   — drag & drop matching game
 │    └── RewardScene.ts     — celebration overlay (stars, balloons)
 ├── audio/
 │    └── AudioManager.ts   — Howler.js wrapper, bgm/sfx/voice channels
 ├── save/
 │    └── SaveManager.ts    — localStorage wrapper, stable interface
 ├── ui/
 │    └── BackButton.ts     — shared back-to-home button (100×100px, top-left)
 └── main.ts                — Phaser game config, scene registry
```

---

## Scene Flow

### BootScene
- Preload all Phase 1 assets (texture atlases, audio files)
- Initialize `AudioManager` and `SaveManager` singletons
- Transition to `HomeScene`

### HomeScene
- Display tiny town map (placeholder background)
- 2 tappable buildings: **Zoo** (AnimalScene) and **Toy Store** (MatchingScene)
- Remaining buildings shown as locked (padlock overlay) — Phase 2+
- Tap building → `scene.start('AnimalScene')` or `scene.start('MatchingScene')`

### AnimalScene
- Grid of ~6 animals (placeholder colored sprites with labels)
- Tap animal → play voice clip ("Lion!") + sfx (roar) + bounce tween
- `BackButton` → return to `HomeScene`
- After tapping all animals → launch `RewardScene`

### MatchingScene
- 3 item/target pairs (e.g. banana→yellow basket, lion→savanna, fish→water)
- Drag item over correct drop zone → magnetic snap (Phaser overlap + tween)
- Wrong drop zone → item bounces back, no punishment sound
- All 3 matched → launch `RewardScene`

### RewardScene
- Launched as overlay (`scene.launch`, not `scene.start`) over calling scene
- Particle burst: stars + balloons
- Voice: "Great job!"
- Calls `SaveManager.addStars(n)`
- Auto-dismisses after 3 seconds → `scene.start('HomeScene')`

---

## Save System

**Interface** (stable across localStorage → IndexedDB migration):

```typescript
interface SaveData {
  stars: number;
  stickers: string[];
  gamesUnlocked: string[];
  settings: {
    bgmVolume: number;  // 0–1
    sfxVolume: number;  // 0–1
  };
}
```

**Initial state:**
```json
{
  "stars": 0,
  "stickers": [],
  "gamesUnlocked": ["zoo", "toyStore"],
  "settings": { "bgmVolume": 0.5, "sfxVolume": 1.0 }
}
```

`SaveManager` exposes: `load()`, `save()`, `addStars(n)`, `unlockGame(key)`, `updateSettings(patch)`.

---

## Audio System

**AudioManager** — Howler.js singleton with 3 channels:

| Channel | Purpose | Behavior |
|---------|---------|---------|
| `bgm` | Background music | Looping, volume 0.5 default |
| `sfx` | Animal sounds, match success, bounce | Short clips |
| `voice` | Narration ("Lion!", "Great job!") | Never overlaps bgm; queues if busy |

Mobile audio unlock handled automatically by Howler.js on first user interaction.

**API:**
```typescript
AudioManager.playBgm(key: string): void
AudioManager.playSfx(key: string): void
AudioManager.playVoice(key: string): void
AudioManager.setVolume(channel: 'bgm' | 'sfx' | 'voice', value: number): void
```

---

## UI Rules

- Touch target minimum: **120px**
- Font minimum: **48px** (minimal text used)
- Back button: top-left, 100×100px, all game scenes
- All interactive objects: scale to 1.1 on `pointerover`
- No timers, no fail states, no score pressure
- Wrong answer → gentle bounce-back tween only, no negative audio

---

## Testing Approach

Manual test checklist (no unit tests — Phase 1 is highly visual/interactive):

- [ ] Tap all 6 animals in AnimalScene — verify correct voice + sfx + bounce anim per animal
- [ ] Drag all 3 correct pairs in MatchingScene — verify magnetic snap
- [ ] Drag items to wrong zones — verify bounce-back, no punishment sound
- [ ] Complete both games — verify RewardScene launches, stars/balloons appear
- [ ] Verify `SaveManager.addStars` called, stars persisted to localStorage
- [ ] Reload page — verify stars count restored from localStorage
- [ ] Tap BackButton from each scene — verify return to HomeScene
- [ ] Audio: verify bgm plays on HomeScene, sfx/voice play correctly
- [ ] Run on tablet viewport (1024×768) — verify touch targets ≥120px
