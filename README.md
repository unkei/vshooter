# VShooter

VShooter is a browser-based vertical scrolling shooter built with Vite,
TypeScript, and Phaser.

The project has a playable two-stage route. The implementation is system-first:
Phaser scenes handle screen flow, while gameplay logic is split into focused
managers and controllers.

## Game

- Two-stage vertical scrolling shooter.
- Title, gameplay, clear bonus, ending, and result screens.
- Keyboard, mouse/touch, and gamepad controls.
- Hold-to-fire shooting.
- Life-based casual difficulty with dense bullet patterns.
- Deterministic item drops for shot upgrades, life recovery, and score bonuses.
- Boss encounters at the end of each stage.
- External character sprite sheet support with generated visual fallbacks.
- External BGM and sound effects with generated Web Audio fallbacks.
- Combo scoring and local high score persistence.
- Persistent audio mute/volume settings.
- Optional browser vibration and gamepad haptics for major feedback events.

## Current Playability Notes

- Stage 1 routes through the clear bonus warp sequence into stage 2.
- Clearing stage 2 routes through the clear bonus screen into the ending staff
  roll.
- Keyboard movement is intentionally slower than the first prototype and uses
  acceleration/deceleration for finer control.
- Retrying after game over requires fresh input. Held movement, shot, pointer, or
  gamepad buttons from the previous run should not carry into the next run.
- Boss entry waits for regular enemies to leave or be defeated, then plays a
  warning, clears stale bullets, and moves the boss into position before attacks
  begin.
- Boss defeat keeps a visible boss body during the explosion sequence, shows a
  stage-clear overlay, then enters the clear bonus flow.
- Title and result screens expose an `M` key mute toggle.

## Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Run browser E2E tests:

```bash
npm run e2e
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

Playtest and tune stage readability, movement feel, shot cadence, enemy health,
boss health, combo timing, bullet density, deterministic item placement, and the
stage 1 to stage 2 difficulty curve.
