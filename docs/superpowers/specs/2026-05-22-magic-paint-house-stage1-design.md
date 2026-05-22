# Magic Paint House — Stage 1 Design

**Date:** 2026-05-22  
**Scope:** Stage 1 MVP — basic drawing, color palette, SVG loading, undo/redo, autosave  
**Replaces:** `src/scenes/ColoringScene.ts` (existing region-based tinting scene)  
**No testing required**

---

## Architecture

`ColoringScene` orchestrates all subsystems via helper classes. No monolithic scene.

```
ColoringScene (orchestrator)
  ├── PaintCanvas        — RenderTexture wrapper, draw operations
  ├── BrushManager       — active brush selection + draw dispatch
  │     ├── ClassicBrush — smooth circle stamps on pointer move
  │     └── EraserBrush  — same as classic, draws transparent
  ├── UndoManager        — PNG snapshot stack, 50 levels max
  ├── ColorPalette       — bottom UI, 16 large color buttons
  ├── ToolPanel          — left UI: brush, eraser, undo, redo buttons
  └── HelperMascot       — right side sprite + encouragement text
```

### Layer Order (bottom → top)

```
Background Layer     — solid color fill
SVG Outline Layer    — hardcoded SVG as Phaser image
Paint Layer          — RenderTexture (independent, free painting over/outside SVG)
Effect Layer         — particles on brush strokes
UI Layer             — palette, tools, mascot
```

Paint layer is fully independent from SVG — kids paint freely, no line restrictions.

---

## File Structure

```
src/scenes/ColoringScene.ts       (replaces existing)
src/paint/PaintCanvas.ts
src/paint/BrushManager.ts
src/paint/UndoManager.ts
src/paint/brushes/ClassicBrush.ts
src/paint/brushes/EraserBrush.ts
src/ui/ColorPalette.ts
src/ui/ToolPanel.ts
src/ui/HelperMascot.ts
src/save/PaintSaveManager.ts      (IndexedDB, separate from SaveManager.ts)
public/assets/svg/                (3–5 bundled SVGs: lion, cat, dinosaur)
```

---

## UI Layout (1024×768)

```
┌──────────────────────────────────────────────────────┐
│  [🏠 Home]   "Magic Paint House"         [💾 SAVE!]  │  ← top bar ~60px
├────────┬─────────────────────────────────┬────────────┤
│        │                                 │            │
│ [Brush]│                                 │  (mascot)  │
│ [Ersr] │        PAINT CANVAS             │   sprite   │
│ [Undo] │       (RenderTexture)           │   + text   │
│ [Redo] │        SVG outline below        │  balloon   │
│        │                                 │            │
│ ~80px  │          ~720px wide            │   ~150px   │
├────────┴─────────────────────────────────┴────────────┤
│   ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●   │
│                 16 colors, ~60px circles, ~100px tall  │
└──────────────────────────────────────────────────────┘
```

- All touch targets minimum 80×80px
- SVG selector: row of 3–5 thumbnails shown as initial modal before painting
- Brush size: single default size (no size picker in Stage 1)

---

## Data Flow

### Painting

```
Pointer down/move → BrushManager.draw(x, y)
  → ActiveBrush.stamp(renderTexture, x, y, color, size)
  → UndoManager.markDirty()
Pointer up → UndoManager.snapshot()    (capture PNG, push to stack)
```

### Undo/Redo

```
UndoManager stores: string[]           (base64 PNG snapshots, max 50)
Undo → pop undoStack → draw PNG onto RenderTexture → push to redoStack
Redo → pop redoStack → draw PNG onto RenderTexture → push to undoStack
Oldest snapshot dropped when stack full.
```

### SVG Selection

```
Scene init → load 3–5 SVG assets via Phaser loader
Player selects SVG thumbnail → image placed on SVG Outline Layer
Paint layer cleared → fresh RenderTexture canvas
```

### Autosave

```
Every 5s + scene shutdown event
→ PaintSaveManager.save(svgId, canvasPng)
→ IndexedDB write (key: "current")
On scene start → PaintSaveManager.load() → restore PNG to RenderTexture
```

### Mascot Encouragement

```
Every ~15s random timer → HelperMascot.cheer()
Also triggers on: first stroke, color change, undo
Messages: "Wow!", "Pretty!", "Amazing!", "Keep going!"
```

---

## Save System

### IndexedDB Schema

```
DB name:  "MagicPaintHouse"
Version:  1

Store: "autosave"
  key:   "current"
  value: {
    svgId:     string,    // e.g. "lion"
    canvasPng: string,    // base64 PNG from RenderTexture snapshot
    savedAt:   number     // Date.now()
  }
```

### PaintSaveManager API

```typescript
save(svgId: string, rt: Phaser.GameObjects.RenderTexture): Promise<void>
load(): Promise<{ svgId: string, canvasPng: string } | null>
clear(): Promise<void>
```

### Manual Save ("SAVE ART!" button)

- Calls `save()`
- Triggers: confetti particles + camera shutter sound via existing `AudioManager`
- Shows framed preview overlay for 2s then auto-dismisses

### Autosave Triggers

- `setInterval` every 5s while scene active
- `Scene.shutdown` event

`PaintSaveManager` is separate from existing `SaveManager.ts` (which handles pet/game state).

---

## Rendering Approach

**Phaser RenderTexture** for paint layer.

- `PaintCanvas` wraps `Phaser.GameObjects.RenderTexture`
- `ClassicBrush`: stamps filled circles at pointer position on `pointermove`
- `EraserBrush`: same stamp but drawn with `Phaser.BlendModes.ERASE` blend mode
- Particles spawned on `Effect Layer` on each stroke for visual feedback

---

## Bundled SVG Assets

3–5 simple outlines with thick black strokes, transparent fills, cartoon style:

- `public/assets/svg/lion.svg`
- `public/assets/svg/cat.svg`
- `public/assets/svg/dinosaur.svg`

SVG is guidance only — not a restriction. Kids paint freely over, outside, and around it.

---

## Out of Scope (Stage 1)

- Rainbow, glitter, neon, sticker, spray, pattern, animal trail brushes (Stage 2+)
- Gallery system (Stage 2)
- Admin SVG upload pipeline (Stage 2+)
- Animated brushes, replay, collaborative mode (Stage 3)
- Brush size picker
