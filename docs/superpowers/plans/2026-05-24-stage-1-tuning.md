# Stage 1 Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lower stage 1 bullet pressure and reduce the difficulty gap between upgraded and non-upgraded runs while keeping the current stage length and early-wave training value.

**Architecture:** Keep stage data in `StageDirector` and enemy pressure constants in `enemyTuning`. Avoid changing player hitbox, invincibility, or shot cadence for this pass. Use unit tests to lock the stage's upgrade opportunities and reduced bullet-pressure constants.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest.

---

## File Structure

- Modify: `docs/specs/game-design.md`
  - Document the resolved stage 1 tuning behavior and regression expectations.
- Modify: `src/game/enemyTuning.ts`
  - Add readable stage 1 pressure constants for regular enemy fire interval,
    heavy bullet counts, heavy fire intervals, and heavy HP.
- Modify: `src/game/EnemyManager.ts`
  - Consume the new tuning constants instead of inline HP/fire values.
- Modify: `src/systems/StageDirector.ts`
  - Add one more deterministic shot upgrade opportunity and mark heavy waves as
    reduced pressure for stage 1.
- Modify: `src/test/StageDirector.test.ts`
  - Assert stage 1 has multiple shot upgrade opportunities and preserves wave
    order/length.
- Modify: `src/test/tuning.test.ts`
  - Assert stage 1 pressure constants are lower than the previous stronger
    tuning budget.

## Task 1: Stage 1 Upgrade Safety Net

**Files:**
- Modify: `src/systems/StageDirector.ts`
- Modify: `src/test/StageDirector.test.ts`

- [x] Add a failing test that `createDefaultStage()` includes at least two shot
  upgrade drops before the boss.
- [x] Keep the six-wave stage structure and enemy type order unchanged.
- [x] Add a deterministic second shot upgrade carrier to a mid-stage wave so a
  player who misses the first shot upgrade has another reasonable chance before
  the heavy waves dominate the stage.
- [x] Run `npm test -- src/test/StageDirector.test.ts`.

## Task 2: Stage 1 Bullet Pressure Constants

**Files:**
- Modify: `src/game/enemyTuning.ts`
- Modify: `src/game/EnemyManager.ts`
- Modify: `src/test/tuning.test.ts`

- [x] Add failing tests for stage 1 pressure constants:
  - Default heavy bullet count should be below the previous stronger value of 5.
  - Final heavy bullet count should be no more than 3.
  - Heavy fire intervals should remain slower than the previous strongest heavy
    interval of 900ms.
- [x] Move regular enemy fire interval, heavy HP, heavy bullet count, and heavy
  fire interval values into named tuning constants.
- [x] Lower stage 1 heavy pressure:
  - Default heavy bullet count: `4`.
  - Final heavy bullet count: `3`.
  - Default heavy fire interval: `1050`.
  - Final heavy fire interval: `1350`.
  - Heavy HP: `7`.
- [x] Keep straight and sway enemy HP unchanged for the first pass.
- [x] Run `npm test -- src/test/tuning.test.ts`.

## Task 3: Spec Update and Verification

**Files:**
- Modify: `docs/specs/game-design.md`
- Test: `npm test`
- Test: `npm run typecheck`
- Test: `npm run build`

- [x] Update `Stage 1 Tuning` with resolved behavior:
  - Stage 1 keeps six waves and the current broad length.
  - Stage 1 gets a second deterministic shot upgrade opportunity.
  - Heavy enemy bullet pressure is reduced from the current stronger tuning.
  - Heavy enemy HP is slightly reduced to make non-upgraded runs less punishing.
- [x] Add regression expectations:
  - Stage 1 has at least two shot upgrade drops.
  - Default heavy bullet count stays below the previous stronger value of 5.
  - Final heavy wave remains lower pressure than the earlier heavy wave.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
