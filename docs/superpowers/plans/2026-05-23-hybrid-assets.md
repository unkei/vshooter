# Hybrid Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small external asset pipeline that can start with placeholder assets and later swap to purpose-made VShooter art and audio.

**Architecture:** Keep Phaser scenes responsible only for preload lifecycle. Asset keys and paths live in focused manifest modules, and generated visuals / Web Audio remain fallbacks.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest.

---

### Task 1: External Character Visuals

**Files:**
- Modify: `docs/specs/game-design.md`
- Modify: `src/game/visualAssets.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/ClearBonusScene.ts`
- Modify: `src/test/visualAssets.test.ts`
- Create: `public/assets/sprites/source/pixel-space-shooter-sheet.png`

- [x] Add the hybrid external asset direction to the game design spec.
- [x] Add a stable external visual asset manifest.
- [x] Queue the manifest from Phaser `preload()` methods.
- [x] Keep generated character textures as per-key fallback.
- [x] Add initial placeholder assets under `public/assets/visual/`.
- [x] Verify with unit tests, build, and browser smoke check.
- [x] Replace placeholder SVG assets with one transparent generated source sheet under `public/assets/sprites/source/`.
- [x] Generate character spritesheets dynamically at startup from source-sheet crop metadata.
- [x] Flip enemy-side source frames vertically during runtime spritesheet generation.
- [x] Add subtle looping animation playback for runtime character spritesheets.

### Task 2: External Audio Follow-Up

**Files:**
- Modify: `docs/specs/game-design.md`
- Modify: `src/systems/AudioManager.ts`
- Test: `src/test/AudioManager.test.ts`

- [ ] Add a small audio manifest for BGM and key sound effects.
- [ ] Keep Web Audio generated playback as fallback when external audio cannot start.
- [ ] Preserve the existing user-gesture unlock behavior on iOS Safari.
