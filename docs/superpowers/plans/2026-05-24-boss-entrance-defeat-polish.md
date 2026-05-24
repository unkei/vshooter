# Boss Entrance and Defeat Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make boss entrance less abrupt and boss defeat read as a longer falling destruction sequence instead of a zoom-and-tilt effect.

**Architecture:** Keep `GameScene` responsible for screen-flow timing and warning text. Keep boss visual state and defeat animation inside `BossController`/`bossState`. Preserve existing boss hit feedback stability guarantees and E2E debug hooks.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, Playwright.

---

## File Structure

- Modify: `docs/specs/game-design.md`
  - Document resolved boss entrance and defeat behavior.
- Modify: `src/game/bossState.ts`
  - Add constants for boss entrance grace timing and defeat fall timing.
  - Add testable defeat burst timing expectations.
- Modify: `src/game/BossController.ts`
  - Spawn boss above the play position and tween it into position before attacks
    start.
  - Replace the zoom-and-tilt defeat emphasis with a slower falling destruction
    body and longer explosion burst timing.
- Modify: `src/scenes/GameScene.ts`
  - Preserve enemy bullets briefly after the final regular wave before clearing
    them for the warning/entrance sequence.
- Modify: `src/test/BossState.test.ts`
  - Assert entrance and defeat timing constants.
  - Assert defeat bursts extend through most of the clear delay.
- Modify: `e2e/boss-clear.spec.ts`
  - Keep existing boss visual stability checks passing; add only small debug
    assertions if needed.

## Task 1: Boss Entrance Timing and Motion

**Files:**
- Modify: `src/game/bossState.ts`
- Modify: `src/game/BossController.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/test/BossState.test.ts`

- [x] Add constants:
  - `BOSS_PRE_WARNING_GRACE_MS = 650`
  - `BOSS_ENTRANCE_TRAVEL_MS = 900`
  - `BOSS_ENTRY_START_Y = -150`
  - `BOSS_ENTRY_TARGET_Y = 120`
- [x] Add tests that entrance grace and travel timings are positive and keep the
  total entrance sequence readable.
- [x] Change `GameScene.startBossEntrance()` so it:
  - Clears player bullets immediately.
  - Leaves enemy bullets visible during `BOSS_PRE_WARNING_GRACE_MS`.
  - Clears enemy bullets when the warning cue begins.
  - Starts warning text after the grace period.
  - Spawns the boss with an entrance animation before it starts firing.
- [x] Change `BossController.spawn()` to support entrance motion:
  - Create the boss at `BOSS_ENTRY_START_Y`.
  - Tween it to `BOSS_ENTRY_TARGET_Y`.
  - Do not fire until entrance travel completes.
  - Keep health bar creation stable.
- [x] Run `npm test -- src/test/BossState.test.ts`.

## Task 2: Boss Defeat Falling Destruction

**Files:**
- Modify: `src/game/bossState.ts`
- Modify: `src/game/BossController.ts`
- Modify: `src/test/BossState.test.ts`

- [x] Extend defeat reaction timing so explosions last longer:
  - Keep clear delay aligned with the defeat body lifetime.
  - Ensure the last burst starts after at least 70% of the defeat clear delay.
- [x] Replace defeat body tween:
  - Remove the large scale-up target.
  - Avoid the strong tilt emphasis.
  - Move the defeat body downward while keeping it visible and opaque.
  - Add a subtle wobble or small angle drift only if it does not dominate.
- [x] Keep existing guarantees:
  - Defeat body remains visible and opaque during late defeat explosion.
  - Boss hit flash stability tests continue to pass.
- [x] Run `npm test -- src/test/BossState.test.ts`.

## Task 3: Spec Update and Verification

**Files:**
- Modify: `docs/specs/game-design.md`
- Test: `npm test`
- Test: `npm run typecheck`
- Test: `npm run build`
- Test: `npm run e2e`

- [x] Update `Boss Entrance and Defeat` with resolved behavior:
  - Final regular wave leaves a short readable residual-bullet pause.
  - Warning cue clears enemy bullets and starts a staged boss entrance.
  - Boss moves into position before becoming attackable/firing.
  - Defeat uses longer explosions and a falling body instead of zoom-and-tilt.
- [x] Add regression expectations:
  - Enemy bullets are not cleared immediately at boss-ready moment.
  - Boss does not fire before entrance travel completes.
  - Defeat body remains visible and opaque while falling.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Run `npm run e2e`.
