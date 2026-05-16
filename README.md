# VShooter

VShooter is a planned browser-based vertical scrolling shooter built with Vite,
TypeScript, and Phaser.

The project is currently in the specification stage. The agreed direction is a
system-first implementation: Phaser scenes handle screen flow, while gameplay
logic is split into focused managers and controllers.

## Planned Game

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

## Documentation

Start here:

- `docs/specs/game-design.md` - main game design specification.
- `AGENTS.md` - notes for future Codex sessions.

There is also a dated mirror of the design spec at:

- `docs/superpowers/specs/2026-05-16-vshooter-game-design.md`

## Next Step

Create an implementation plan from `docs/specs/game-design.md`, then scaffold the
Vite + TypeScript + Phaser project around the agreed architecture.

