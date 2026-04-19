# Art assets

Drop WebP files here to populate the visual-novel heart-event scenes. Everything here is served as-is at `/Brackroot-Academy/art/...`.

## Character portraits

```
public/art/characters/<characterId>.webp
```

Character IDs: `marlow`, `brendan`, `diana`, `peter`, `richard`, `sophia`.

One portrait per character. Appears layered above the background in every heart event scene for that character. No expression variants — just one pose.

**Size guidance:** portrait-aspect (taller than wide), ~600–900px tall, transparent background. The overlay scales it responsively; the rendered height is roughly 55% of the viewport.

If the file is missing, the scene falls back to the character's emoji portrait (the same icon shown on the Map and Journal). Everything still works; it just looks less polished.

## Backgrounds

```
public/art/backgrounds/<key>.webp
```

Backgrounds are *keyed*, not per-character, so multiple heart events can reuse the same image. To associate a background with a scene, upgrade the heart event in `src/data/heartEvents/{character}.js` from a plain string to an object:

```js
// Before
1: `Three students. That's all Divines got this year...`,

// After
1: {
  text: `Three students. That's all Divines got this year...`,
  background: 'divines-common-room'
},
```

The app looks for `/art/backgrounds/divines-common-room.webp`. If missing, the scene falls back to a gradient.

Naming is freeform — use whatever makes sense to you. Suggested: `kebab-case` keyed by location, so reuse is easy (`courtyard`, `kitchens`, `rooftop-night`, `library-stacks`).

**Size guidance:** landscape 16:9 or 3:4, ~1200px wide, no transparency needed. Cropped to cover the viewport.

## Compression

Run WebP through `cwebp` or a GUI like [Squoosh](https://squoosh.app/) at ~80 quality. Aim for 40–150 KB per file. The whole project should stay under ~15 MB of art total, well within GitHub Pages limits.

## Fallbacks at a glance

| Missing | Looks like |
|---|---|
| Character portrait | Circular emoji badge (current behavior) |
| Background | Cozy autumn gradient |
| Heart event text | `[Character — Lv N heart event — to be written]` placeholder |
