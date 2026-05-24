# Title Screen Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the title screen title treatment feel more substantial and consistent with the arcade character art.

**Architecture:** Keep title screen flow and input behavior unchanged. Add code-generated title framing, layered title text, and subtle visual accents inside `TitleScene`.

**Tech Stack:** Vite, TypeScript, Phaser.

---

## File Structure

- Modify: `docs/specs/game-design.md`
  - Document resolved title screen treatment.
- Modify: `src/scenes/TitleScene.ts`
  - Add a stronger title lockup and visual frame.
  - Keep input/start/audio behavior unchanged.

## Task 1: Title Lockup

**Files:**
- Modify: `src/scenes/TitleScene.ts`

- [x] Replace the single flat title text with layered title text:
  - shadow/depth layer.
  - bright main layer.
  - small subtitle/tagline layer.
- [x] Add a simple code-generated neon frame or wing-like accent around the title.
- [x] Keep high score, input prompt, and audio mute text readable.
- [x] Do not change start input behavior.
- [x] Run `npm run typecheck`.

## Task 2: Spec Update and Verification

**Files:**
- Modify: `docs/specs/game-design.md`
- Test: `npm test`
- Test: `npm run typecheck`
- Test: `npm run build`
- Test: `npm run e2e`

- [x] Update `Visual and UI Feedback` with resolved behavior:
  - Title screen uses layered arcade title text and a code-generated frame/accent.
  - Input behavior remains unchanged.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Run `npm run e2e`.
