# Control Feel Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve gamepad fine positioning, prevent diagonal speed gain, and make touch play use virtual stick movement instead of fast direct chasing.

**Architecture:** Keep input normalization deterministic and unit-tested in `InputManager`. Keep Phaser pointer lifecycle state in `GameScene`, then pass explicit raw pointer mode/origin data into the normalizer. Keep player movement unchanged except where it consumes normalized move vectors or direct pointer targets.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, Playwright debug hooks where needed.

---

## File Structure

- Modify: `docs/specs/game-design.md`
  - Document the resolved control behavior and regression expectations.
- Modify: `src/systems/InputManager.ts`
  - Add gamepad radial deadzone scaling and response curve for fine positioning.
  - Add touch virtual stick raw pointer support.
  - Keep mouse direct pointer targeting.
- Modify: `src/test/InputManager.test.ts`
  - Cover gamepad fine positioning, diagonal normalization, mouse direct control,
    and touch virtual stick control.
- Modify: `src/scenes/GameScene.ts`
  - Track touch virtual stick origin during active touch input.
  - Pass virtual stick mode/origin for touch pointers and direct mode for mouse
    pointers.

## Task 1: Deterministic Input Normalization

**Files:**
- Modify: `src/systems/InputManager.ts`
- Modify: `src/test/InputManager.test.ts`

- [x] Add failing tests for gamepad radial deadzone scaling:
  - A small input just beyond the deadzone should produce a small movement value,
    not jump directly to the raw axis value.
  - A diagonal analog input should have magnitude no greater than `1`.
- [x] Add failing tests for pointer modes:
  - Mouse direct input should still return `pointerTarget`.
  - Touch virtual stick input should return a normalized `move` vector and
    `pointerTarget: null`.
- [x] Implement radial deadzone scaling and response curve:
  - Use a deadzone of `0.2`.
  - For analog stick vectors, compute magnitude, subtract the deadzone, rescale
    to `0..1`, apply a gentle response curve, then reapply direction.
  - Clamp final magnitude to `1`.
- [x] Implement touch virtual stick normalization:
  - Add pointer fields for `mode`, `originX`, and `originY`.
  - For `mode: "virtualStick"`, convert offset from origin into a move vector.
  - Keep mouse/direct pointer behavior unchanged.
- [x] Run `npm test -- src/test/InputManager.test.ts`.

## Task 2: GameScene Touch Virtual Stick Wiring

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/test/InputManager.test.ts` if type adjustments require it.

- [x] Add GameScene fields for active touch pointer id and touch origin.
- [x] When the active pointer is touch and pressed, set the origin on first
  active frame and keep it until release.
- [x] Pass `mode: "virtualStick"` plus origin coordinates for touch input.
- [x] Pass `mode: "direct"` for mouse input so mouse control remains direct.
- [x] Clear touch origin when the pointer is not active or source is mouse.
- [x] Run `npm run typecheck`.

## Task 3: Spec Update and Regression Coverage

**Files:**
- Modify: `docs/specs/game-design.md`
- Test: `npm test`
- Test: `npm run typecheck`

- [x] Update `Control Feel` in the Near-Term Polish Goals section with resolved
  behavior:
  - Gamepad uses radial deadzone scaling and response curve for fine positioning.
  - Diagonal movement is normalized after analog/deadzone processing.
  - Touch uses virtual stick movement by default; mouse remains direct.
- [x] Add regression expectations:
  - Gamepad diagonal magnitude does not exceed cardinal movement.
  - Near-deadzone stick movement produces small movement, not a sudden jump.
  - Touch virtual stick does not create a direct pointer target.
  - Mouse direct control still creates a pointer target.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
