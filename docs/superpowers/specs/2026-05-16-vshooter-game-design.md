# VShooter Game Design

This spec is mirrored from `docs/specs/game-design.md`.

Build a browser-based vertical scrolling shooter with Vite, TypeScript, and
Phaser. Use a system-first architecture: Phaser scenes coordinate lifecycle and
screen flow, while small managers/controllers own input, player behavior,
projectiles, enemies, boss behavior, power-ups, scoring, audio, and stage timing.

Core agreed scope:

- One-stage vertical scrolling shooter.
- Title, gameplay, and result scenes.
- Keyboard, mouse/touch, and gamepad support.
- Hold-to-fire shooting.
- Life-based casual difficulty with dense bullet patterns.
- Item-based power-ups.
- One boss at the end of the stage.
- Neon/vector-style visuals.
- Procedural BGM and SE through Web Audio API.
- Combo scoring and `localStorage` high score.

Primary systems:

- `InputManager`: normalizes keyboard, pointer/touch, and gamepad input.
- `PlayerController`: movement, life, damage, invincibility, shot timing.
- `ProjectileManager`: player bullets, enemy bullets, lifetime, cleanup, pooling if needed.
- `EnemyManager`: regular enemy spawn/update/health/defeat/drop events.
- `BossController`: boss health, health bar, phases, bullet patterns, clear signal.
- `PowerUpManager`: shot upgrade, life recovery, score bonus items.
- `ScoreManager`: score, combo, max combo, multiplier, high score persistence.
- `AudioManager`: generated BGM and SE, started after user interaction.
- `StageDirector`: one-stage wave timeline, boss entrance, clear condition.

Scenes:

- `TitleScene`: title, input hints, high score, start.
- `GameScene`: active play and manager coordination.
- `ResultScene`: clear/game over, score, max combo, high score, retry/title.
- `ResultScene` retry must require a fresh confirm press. Held keyboard, pointer,
  or gamepad input from gameplay must not immediately start or control the next run.

Initial enemies:

- Straight enemy: downward movement and simple shots.
- Sway enemy: horizontal drift and periodic fire.
- Heavy enemy: higher health and multi-direction patterns.

Current implementation notes:

- Keyboard/gamepad movement should use acceleration and deceleration instead of
  immediately snapping to full speed. The speed target is deliberately slower
  than the first prototype so keyboard control is manageable.
- Scripted movement owns player, enemy, projectile, and boss positions. Arcade
  Physics bodies are synchronized from those positions and must be guarded so
  missing or destroyed bodies do not crash the game loop.
- The boss must remain visibly renderable throughout the boss phase. If Phaser
  marks the boss object inactive or invisible while HP remains, the controller
  should restore the visible boss object instead of continuing with invisible
  bullet patterns.
- The boss must be practically defeatable in the first playable version. HP,
  player bullet damage, bullet density, and stage timing should be tuned together.
- The default stage should leave a clear gap before boss entry by clearing regular
  enemies and enemy bullets when the boss appears.

Initial power-ups:

- Shot upgrade.
- Life recovery.
- Score bonus.

Visual direction:

- Neon/vector style.
- Geometric player, enemies, bullets, items.
- High readability with many bullets on screen.
- Clear damage, invincibility, boss phase, and item feedback.

Difficulty direction:

- Life system instead of one-hit death.
- Short invincibility after damage.
- Dense but fair bullet patterns.
- Boss phase changes should be telegraphed.

Testing direction:

- Unit-test input normalization, score/combo rules, stage data, power-up effects,
  and high score persistence.
- Unit-test fresh input gates, body synchronization helpers, and boss renderable
  state checks.
- Manually verify keyboard, pointer/touch, gamepad, scene transitions, clear/game
  over, and audio startup behavior in browser.
- Manually verify retry after game over, especially keyboard input: movement and
  shot state must not carry over from the previous run.
- Browser automation should cover a boss-defeat clear flow.

Tuning values to decide during playtesting:

- Player speed.
- Shot interval.
- Bullet speed.
- Life count.
- Invincibility duration.
- Combo timeout.
- Enemy health.
- Boss health and phase thresholds.
- Bullet density.
- Item drop rates.
