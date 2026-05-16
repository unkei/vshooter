# VShooter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable Vite + TypeScript + Phaser vertical shooter from `docs/specs/game-design.md`.

**Architecture:** Use Phaser scenes for screen flow and focused TypeScript managers/controllers for gameplay systems. Keep deterministic rules such as scoring, input normalization, stage scheduling, and persistence testable outside Phaser.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, Web Audio API, browser `localStorage`, Gamepad API.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `index.html`: Vite entry HTML.
- `tsconfig.json`: TypeScript project settings.
- `vite.config.ts`: Vite/Vitest config.
- `src/main.ts`: Phaser game bootstrap.
- `src/scenes/TitleScene.ts`: title screen.
- `src/scenes/GameScene.ts`: gameplay orchestration.
- `src/scenes/ResultScene.ts`: result screen.
- `src/systems/InputManager.ts`: raw input to normalized state.
- `src/systems/ScoreManager.ts`: score, combo, high score.
- `src/systems/StageDirector.ts`: wave and boss timeline.
- `src/systems/AudioManager.ts`: procedural BGM and SE.
- `src/systems/PowerUpManager.ts`: item effects.
- `src/game/PlayerController.ts`: player state and shooting cadence.
- `src/game/ProjectileManager.ts`: player/enemy projectile groups.
- `src/game/EnemyManager.ts`: enemy spawning and updates.
- `src/game/BossController.ts`: boss state and attacks.
- `src/game/constants.ts`: shared tuning values.
- `src/game/types.ts`: shared TypeScript types.
- `src/test/*.test.ts`: unit tests for deterministic systems.

## Tasks

### Task 1: Scaffold Tooling

- [ ] Create `package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `src/main.ts`, and basic CSS.
- [ ] Install dependencies: `vite`, `typescript`, `phaser`, `vitest`, `jsdom`.
- [ ] Verify `npm run typecheck` and `npm test` can execute.
- [ ] Commit: `chore: scaffold vite phaser project`.

### Task 2: Test Deterministic Systems First

- [ ] Write failing tests for `ScoreManager`, `InputManager`, `StageDirector`, and `PowerUpManager`.
- [ ] Run tests and verify they fail because modules do not exist yet.
- [ ] Implement the smallest deterministic systems needed to pass.
- [ ] Run tests and typecheck.
- [ ] Commit: `feat: add core deterministic systems`.

### Task 3: Add Phaser Scenes and Controllers

- [ ] Implement `TitleScene`, `GameScene`, and `ResultScene`.
- [ ] Implement player, projectile, enemy, boss, power-up, score, stage, and audio wiring.
- [ ] Keep Phaser-dependent code thin and delegate rules to tested systems.
- [ ] Run tests and typecheck.
- [ ] Commit: `feat: add playable shooter loop`.

### Task 4: Browser Verification

- [ ] Run a production build.
- [ ] Start the Vite dev server.
- [ ] Open the game in browser and verify title, play, game over or clear, and retry flow.
- [ ] Commit any fixes.

## Self-Review

- Spec coverage: the plan covers scenes, supported inputs, hold-to-fire, life system,
  dense bullets, power-ups, boss, neon visuals, generated audio, combo scoring, and high score.
- Placeholders: no unresolved placeholders are intentionally left in this plan.
- Type consistency: manager and controller names match the game design spec.

