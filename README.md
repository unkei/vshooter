# VShooter

VShooter is a planned browser-based vertical scrolling shooter built with Vite,
TypeScript, and Phaser.

The project has an initial playable implementation. The direction is a
system-first implementation: Phaser scenes handle screen flow, while gameplay
logic is split into focused managers and controllers.

## Game

- One-stage vertical scrolling shooter.
- Title, gameplay, and result screens.
- Keyboard, mouse/touch, and gamepad controls.
- Hold-to-fire shooting.
- Life-based casual difficulty with dense bullet patterns.
- Item-based power-ups.
- One boss at the end of the stage.
- Neon/vector-style visuals.
- Procedural BGM and sound effects with Web Audio API.
- Combo scoring and local high score persistence.

## Current Playability Notes

- Keyboard movement is intentionally slower than the first prototype and uses
  acceleration/deceleration for finer control.
- Retrying after game over requires fresh input. Held movement, shot, pointer, or
  gamepad buttons from the previous run should not carry into the next run.
- Boss entry clears regular enemies and enemy bullets so the boss is the clear
  target of the phase.
- The boss must remain visible while active and be defeatable in the first
  playable version.

## Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Deployment

The app is configured for free GitHub Pages hosting through GitHub Actions.

To publish:

1. Push the repository to GitHub.
2. In the GitHub repository settings, set Pages source to GitHub Actions.
3. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

The workflow builds with `VITE_BASE_PATH=/<repository-name>/`, so Vite asset
URLs work when the project is hosted from the normal GitHub Pages repository
subpath.

## Documentation

Start here:

- `docs/specs/game-design.md` - main game design specification.
- `AGENTS.md` - notes for future Codex sessions.

There is also a dated mirror of the design spec at:

- `docs/superpowers/specs/2026-05-16-vshooter-game-design.md`

## Next Step

Playtest and tune movement speed, shot cadence, enemy health, boss health, combo
timing, bullet density, and item drop rates.
