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

## Documentation

Start here:

- `docs/specs/game-design.md` - main game design specification.
- `AGENTS.md` - notes for future Codex sessions.

There is also a dated mirror of the design spec at:

- `docs/superpowers/specs/2026-05-16-vshooter-game-design.md`

## Next Step

Playtest and tune movement speed, shot cadence, enemy health, boss health, combo
timing, bullet density, and item drop rates.
