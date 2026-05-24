# Gameplay Visual Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve gameplay readability by making life state, damage, bullets, power-up items, and clear bonus presentation easier to read.

**Architecture:** Keep deterministic visual rules in small helpers where possible. Keep Phaser object creation inside existing managers/scenes. Avoid changing scoring rules or collision behavior.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest.

---

## File Structure

- Modify: `docs/specs/game-design.md`
  - Document resolved gameplay visual feedback behavior.
- Modify: `src/scenes/GameScene.ts`
  - Replace plain life text with clearer HUD life markers.
  - Add damage smoke on accepted player damage.
- Modify: `src/game/ProjectileManager.ts`
  - Improve bullet visuals without changing collision radius or speed.
- Modify: `src/systems/PowerUpManager.ts`
  - Improve power-up item visuals and add deterministic style helper.
- Modify: `src/test/PowerUpManager.test.ts`
  - Cover power-up visual style helper.
- Modify: `src/scenes/ClearBonusScene.ts`
  - Improve clear bonus display and warp route visual.
- Modify: `src/test/ClearBonusScene.test.ts`
  - Keep data/display tests passing.

## Task 1: HUD Life and Damage Smoke

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [x] Replace HUD text `LIFE n` with compact life markers.
- [x] Keep score, shot level, combo, and stage number readable in the HUD.
- [x] Add a short damage smoke effect when `player.damage()` accepts damage:
  - Spawn 5-7 gray/pink smoke circles around the player.
  - Fade and drift them over about 450ms.
  - Do not spawn smoke for invincible ignored hits.
- [x] Run `npm run typecheck`.

## Task 2: Bullet and Power-Up Readability

**Files:**
- Modify: `src/game/ProjectileManager.ts`
- Modify: `src/systems/PowerUpManager.ts`
- Modify: `src/test/PowerUpManager.test.ts`

- [x] Improve player bullet visual using a brighter core plus readable outline.
- [x] Improve enemy bullet visual using a distinct color/outline that remains
  readable over the starfield.
- [x] Keep bullet collision radius and projectile speed unchanged.
- [x] Add `powerUpVisualStyle(type)` helper returning color, stroke color, and
  label for each power-up type.
- [x] Render power-up items with a visible ring and a short label (`P`, `L`, `$`)
  so type can be read even when colors blend.
- [x] Add tests for `powerUpVisualStyle()`.
- [x] Run `npm test -- src/test/PowerUpManager.test.ts`.

## Task 3: Clear Bonus and Warp Route Readability

**Files:**
- Modify: `src/scenes/ClearBonusScene.ts`
- Modify: `src/test/ClearBonusScene.test.ts`

- [x] Improve clear bonus text font treatment with a stronger font family,
  stroke, and better line spacing.
- [x] Replace the simple rectangle warp with a more visible route/gate effect
  using multiple translucent rings or rails.
- [x] Keep `buildClearBonusLines()` output unchanged.
- [x] Run `npm test -- src/test/ClearBonusScene.test.ts`.

## Task 4: Spec Update and Verification

**Files:**
- Modify: `docs/specs/game-design.md`
- Test: `npm test`
- Test: `npm run typecheck`
- Test: `npm run build`
- Test: `npm run e2e`

- [x] Update `Visual and UI Feedback` with resolved behavior:
  - HUD life uses clear markers.
  - Accepted damage emits smoke.
  - Bullets and power-ups receive stronger code-generated visuals.
  - Clear bonus uses improved text and warp route visuals.
- [x] Add regression expectations:
  - Ignored invincible hits do not spawn damage smoke.
  - Bullet collision radius and speed remain unchanged.
  - Power-up type is readable by label as well as color.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Run `npm run e2e`.
