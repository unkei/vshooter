# Stage 2 Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a playable stage 2 that uses stronger bullet pressure and gives the stage 2 boss a downward rush attack.

**Architecture:** Introduce a small stage configuration layer around `StageDirector` instead of hard-coding only one stage in `GameScene`. Keep scene flow simple: title starts stage 1, stage 1 clear goes through `ClearBonusScene` into stage 2, and stage 2 clear goes to the final clear result. Keep the boss rush behavior inside `BossController` with explicit options from `GameScene`.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, Playwright.

---

## File Structure

- Modify: `docs/specs/game-design.md`
  - Document the resolved stage 2 flow and boss rush attack.
- Modify: `src/systems/StageDirector.ts`
  - Add `StageNumber`, `StageDefinition`, `createStageDefinition()`, and keep
    `createDefaultStage()` as stage 1 compatibility.
- Modify: `src/test/StageDirector.test.ts`
  - Cover stage 1 and stage 2 stage definitions.
- Modify: `src/scenes/GameScene.ts`
  - Accept `{ stageNumber }`, create the requested stage definition, pass boss
    options, and send the next stage to `ClearBonusScene` if one exists.
- Modify: `src/scenes/ClearBonusScene.ts`
  - Accept optional `nextStageNumber` and transition either to the next
    `GameScene` or to the final `ResultScene`.
- Modify: `src/test/ClearBonusScene.test.ts`
  - Cover clear bonus data carrying the next stage.
- Modify: `src/game/bossState.ts`
  - Add stage 2 boss rush timing constants.
- Modify: `src/game/BossController.ts`
  - Add optional rush attack behavior for stage 2.
- Modify: `src/test/BossState.test.ts`
  - Cover rush attack constants.

## Task 1: Stage Definitions

**Files:**
- Modify: `src/systems/StageDirector.ts`
- Modify: `src/test/StageDirector.test.ts`

- [x] Add `type StageNumber = 1 | 2`.
- [x] Add `type StageDefinition = { stageNumber: StageNumber; events: StageEvent[]; nextStageNumber: StageNumber | null; boss: { rushAttack: boolean } }`.
- [x] Add `createStageDefinition(stageNumber: StageNumber): StageDefinition`.
- [x] Keep `createDefaultStage()` returning stage 1 events for existing callers.
- [x] Define stage 2 with stronger pressure than stage 1:
  - Six waves.
  - Enemy order: straight, sway, sway, heavy, heavy, heavy.
  - At least one shot upgrade and one life recovery.
  - Earlier heavy pressure may use normal pressure more often than stage 1.
- [x] Add tests for stage 1 next stage and stage 2 final stage behavior.
- [x] Run `npm test -- src/test/StageDirector.test.ts`.

## Task 2: Scene Flow

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/ClearBonusScene.ts`
- Modify: `src/test/ClearBonusScene.test.ts`

- [x] Add `GameSceneData = { stageNumber?: StageNumber }`.
- [x] Default GameScene to stage 1 when no data is provided.
- [x] Create stage from `createStageDefinition(stageNumber)`.
- [x] Pass `nextStageNumber` to `ClearBonusScene` on clear.
- [x] Update `ClearBonusSceneData` to include `nextStageNumber?: StageNumber | null`.
- [x] In `ClearBonusScene`, after the warp-out delay:
  - If `nextStageNumber` exists, start `GameScene` with that stage.
  - Otherwise start `ResultScene` with clear status.
- [x] Add a deterministic test that clear bonus data can carry `nextStageNumber`.
- [x] Run `npm test -- src/test/ClearBonusScene.test.ts src/test/StageDirector.test.ts`.

## Task 3: Stage 2 Boss Rush Attack

**Files:**
- Modify: `src/game/bossState.ts`
- Modify: `src/game/BossController.ts`
- Modify: `src/test/BossState.test.ts`

- [x] Add constants:
  - `BOSS_RUSH_ATTACK_ENABLED_BY_DEFAULT = false`
  - `BOSS_RUSH_INTERVAL_MS = 5200`
  - `BOSS_RUSH_DURATION_MS = 1200`
  - `BOSS_RUSH_TARGET_Y = 260`
- [x] Add `BossController` options `{ rushAttack?: boolean }`.
- [x] When rush attack is enabled:
  - Start a rush periodically after entrance completes.
  - Move boss downward toward `BOSS_RUSH_TARGET_Y`, then return to normal target
    motion.
  - Fire an extra radial burst near the rush start or deepest point.
  - Keep movement scripted and synchronized with the Arcade body.
- [x] Keep rush disabled for stage 1.
- [x] Add tests for rush constants.
- [x] Run `npm test -- src/test/BossState.test.ts`.

## Task 4: Spec Update and Verification

**Files:**
- Modify: `docs/specs/game-design.md`
- Test: `npm test`
- Test: `npm run typecheck`
- Test: `npm run build`
- Test: `npm run e2e`

- [x] Update `Stage 2 Direction` with resolved behavior:
  - Stage 1 clear continues into stage 2.
  - Stage 2 clear enters the final clear result.
  - Stage 2 uses stronger bullet pressure than polished stage 1.
  - Stage 2 boss has a periodic downward rush attack.
- [x] Add regression expectations:
  - Stage 1 definition points to stage 2.
  - Stage 2 definition has no next stage.
  - Stage 1 boss rush is disabled and stage 2 boss rush is enabled.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Run `npm run e2e`.
