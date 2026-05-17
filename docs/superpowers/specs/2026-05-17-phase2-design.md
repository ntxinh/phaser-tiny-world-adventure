# Phase 2 Design: Coloring Game, Basketball Game, Reward Stickers

**Date:** 2026-05-17  
**Project:** Tiny World Adventure (Phaser 3 + TypeScript)  
**Scope:** Phase 2 — ColoringScene, BasketballScene, RewardScene sticker extension

---

## 1. Architecture Overview

Phase 2 adds 2 new scenes and extends 3 existing files. Follows Phase 1 conventions exactly (no new structural patterns).

### New files
- `src/scenes/ColoringScene.ts`
- `src/scenes/BasketballScene.ts`

### Modified files
| File | Change |
|------|--------|
| `src/scenes/BootScene.ts` | Register new scenes; generate coloring region textures + basketball textures + sticker textures |
| `src/scenes/HomeScene.ts` | Unlock Paint House → `ColoringScene`; unlock Basketball Court → `BasketballScene` |
| `src/scenes/RewardScene.ts` | Add sticker display + bounce tween, keyed by `caller` |
| `src/save/SaveManager.ts` | Add `addSticker(key: string)` method |

### Scene registry (`main.ts`)
```ts
scenes: [BootScene, HomeScene, AnimalScene, MatchingScene, ColoringScene, BasketballScene, RewardScene]
```

---

## 2. ColoringScene

### Layout
- **Top:** 6 color circles (~100px each), horizontally centered — color palette
- **Center:** outlined lion built from 5 region sprites + 1 outline sprite on top
- **Bottom-left:** `BackButton`

### BootScene-generated textures
| Key | Description |
|-----|-------------|
| `lion_body` | Solid rect, lion torso area |
| `lion_mane` | Solid circle/rect, mane area |
| `lion_face` | Solid circle, face |
| `lion_ears` | Two small solid rects |
| `lion_tail` | Thin rect, tail |
| `lion_outline` | Dark stroked Graphics path over all regions (depth +1) |
| `color_red`, `color_yellow`, `color_orange`, `color_green`, `color_blue`, `color_purple` | 100px circles |

### Interaction
1. Tap color circle → sets `selectedColor` (hex int, e.g. `0xFF4444`)
2. Tap region sprite → `setTint(selectedColor)` on that sprite
3. All 5 regions tinted (any color, not default grey) → win condition
4. Win: 600ms delay → `this.scene.launch('RewardScene', { caller: 'coloring' })`

### Default state
All region sprites tinted `0xdddddd` (uncolored grey). Outline sprite depth = regionDepth + 1, always on top.

### Win detection
```ts
private tintedRegions = new Set<string>();
// on tap: tintedRegions.add(regionKey)
// check: tintedRegions.size === 5
```

---

## 3. BasketballScene

### Layout
- **Top-right:** hoop sprite (~160px wide) + Matter.js sensor bodies
- **Bottom-center:** ball sprite (~80px), reset position after each shot
- **Top-left:** score counter `0 / 3`
- **Bottom-left:** `BackButton`

### Phaser config addition
```ts
physics: {
  default: 'matter',
  matter: {
    gravity: { y: 0.8 },
    debug: false,
  }
}
```

### Physics bodies
| Object | Body type | Notes |
|--------|-----------|-------|
| Ball | Dynamic circle | `isStatic: true` at rest; set `false` on release |
| Hoop left rim | Static rectangle | Collision body |
| Hoop right rim | Static rectangle | Collision body |
| Hoop sensor | Static sensor rectangle | Between rims; triggers score on ball overlap |

### Drag & release mechanic
1. `pointerdown` on ball → record `dragStart`, show trajectory preview (4 ghost dots)
2. `pointermove` → update drag vector, redraw trajectory arc
3. `pointerup` → compute velocity = `(dragStart - pointerPos) * POWER_MULTIPLIER`, clamp max magnitude, set ball `isStatic: false`, apply velocity, hide preview, disable input
4. Ball passes hoop sensor → score +1, play SFX, reset ball after 800ms, re-enable input
5. Ball exits screen bounds → immediate reset, no penalty, re-enable input
6. Score reaches 3 → `this.scene.launch('RewardScene', { caller: 'basketball' })`

### Trajectory preview
4 ghost circles along parabolic arc estimate:
```ts
// for t in [0.25, 0.5, 0.75, 1.0]:
//   x = ballX + vx * t * PREVIEW_SCALE
//   y = ballY + vy * t * PREVIEW_SCALE + 0.5 * gravity * (t * PREVIEW_SCALE)^2
```

### Constants
```ts
const POWER_MULTIPLIER = 0.015;
const MAX_VELOCITY = 18;
const WIN_SCORE = 3;
```

---

## 4. RewardScene Sticker Extension

### Sticker map
```ts
const STICKER_MAP: Record<string, { texture: string; label: string }> = {
  zoo:        { texture: 'sticker_lion',        label: 'Lion!' },
  toyStore:   { texture: 'sticker_star',         label: 'Star!' },
  coloring:   { texture: 'sticker_paintbrush',   label: 'Artist!' },
  basketball: { texture: 'sticker_basketball',   label: 'Champ!' },
};
```

### Card layout change
Existing card: `"Great Job!"` → star count.  
Extended card: `"Great Job!"` → star count → **sticker sprite + label** (new, below star count).

### Sticker animation
Scale bounce tween on sticker sprite: `1.0 → 1.3 → 1.0`, duration 400ms, ease `'Back.easeOut'`.

### SaveManager interaction
```ts
const sticker = STICKER_MAP[caller];
if (sticker && !saveData.stickers.includes(sticker.texture)) {
  SaveManager.getInstance().addSticker(sticker.texture);
}
```

### New SaveManager method
```ts
addSticker(key: string): void {
  const data = this.getData();
  if (!data.stickers.includes(key)) {
    data.stickers.push(key);
    this.save();
  }
}
```

### BootScene sticker textures
| Key | Shape | Color |
|-----|-------|-------|
| `sticker_lion` | Circle | `0xFFAA00` (gold) |
| `sticker_star` | Star polygon | `0xFFDD00` (yellow) |
| `sticker_paintbrush` | Thin rect | `0x884400` (brown) |
| `sticker_basketball` | Circle with lines | `0xFF6600` (orange) |

---

## 5. Data Flow Summary

```
HomeScene
  ├── Paint House tap → scene.start('ColoringScene')
  └── Basketball Court tap → scene.start('BasketballScene')

ColoringScene
  └── all 5 regions tinted → scene.launch('RewardScene', { caller: 'coloring' })

BasketballScene
  └── score === 3 → scene.launch('RewardScene', { caller: 'basketball' })

RewardScene
  ├── show sticker from STICKER_MAP[caller]
  ├── SaveManager.addSticker(texture)
  ├── SaveManager.addStars(3)
  └── 3s → scene.stop(caller), scene.stop('RewardScene'), scene.start('HomeScene')
```

---

## 6. Out of Scope (Phase 2)

- Sticker album / collection browser screen
- Multiple coloring subjects (lion only)
- Animated finished drawing (coloring)
- Ball powerups (rainbow ball, fire ball)
- Night/day mode
