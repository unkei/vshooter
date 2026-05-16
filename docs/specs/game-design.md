# VShooter Game Design

## Purpose

Build a browser-based vertical scrolling shooter with Vite, TypeScript, and Phaser.
The first version should prioritize a reusable game system architecture over a
one-off prototype, while still defining a complete playable target.

## Current Product Scope

The game is a general vertical scrolling shooter with:

- One complete stage.
- Title, gameplay, and result screens.
- Keyboard, mouse/touch, and gamepad controls.
- Hold-to-fire shooting.
- Casual life-based difficulty with dense bullet patterns.
- Item-based power-ups.
- One boss at the end of the stage.
- Neon/vector-style visuals without external art assets as a hard requirement.
- Procedural BGM and sound effects generated with Web Audio API.
- Combo-based scoring and local high score persistence.

## Technical Direction

Use Vite, TypeScript, and Phaser.

The implementation should favor a system-first architecture. Phaser scenes should
coordinate screens and lifecycle events, while gameplay responsibilities should
live in small focused managers/controllers. This keeps the first stage simple but
makes later stages, enemy patterns, and UI expansion easier.

## Scenes

### `TitleScene`

Responsibilities:

- Show the title.
- Show basic input hints.
- Show the saved high score.
- Start the game from keyboard, pointer, or gamepad input.

### `GameScene`

Responsibilities:

- Run the active stage.
- Own Phaser groups and scene lifecycle.
- Coordinate the gameplay managers.
- Transition to `ResultScene` on clear or game over.

### `ResultScene`

Responsibilities:

- Show clear or game-over result.
- Show score, max combo, and high score.
- Allow retry and return to title.

## Gameplay Systems

### `InputManager`

Converts all supported devices into one normalized input state.

Supported devices:

- Keyboard: arrow keys or WASD for movement, Space for shot.
- Mouse/touch: pointer movement or drag for movement, pointer hold for shot.
- Gamepad: left stick or D-pad for movement, primary face button or shoulder for shot,
  Start/Menu-equivalent for start and retry.

The rest of the game should consume normalized actions, not raw device events.

### `PlayerController`

Responsibilities:

- Player movement.
- Boundary clamping.
- Life count.
- Damage handling.
- Temporary invincibility after being hit.
- Shot request timing for hold-to-fire behavior.

The player should not die from one hit. The target feel is approachable, but the
screen should still contain enough bullets to require active dodging.

### `ProjectileManager`

Responsibilities:

- Player bullets.
- Enemy bullets.
- Bullet speed, direction, and lifetime.
- Screen bounds cleanup.
- Bullet pooling if useful for performance.

The initial design should support many bullets on screen, so avoid creating
unnecessary garbage every frame.

### `EnemyManager`

Responsibilities:

- Spawn regular enemies.
- Update enemy movement.
- Track enemy health.
- Handle enemy defeat.
- Request item drops and score events.

Initial enemy types:

- Straight enemy: moves downward and fires simple aimed or straight shots.
- Sway enemy: moves downward while drifting horizontally and fires periodically.
- Heavy enemy: higher health and fires multi-direction patterns.

### `BossController`

Responsibilities:

- Spawn the stage boss.
- Track boss health.
- Show boss health bar.
- Switch attack phases based on remaining health.
- Signal stage clear when defeated.

Initial boss shape:

- One boss at the end of the stage.
- Multiple bullet patterns.
- Phase changes based on health thresholds.

### `PowerUpManager`

Uses item drops from defeated enemies.

Initial item types:

- Shot upgrade.
- Life recovery.
- Score bonus.

Power-ups should create risk/reward: the player may need to move into danger to
collect them.

### `ScoreManager`

Responsibilities:

- Score from enemy defeats.
- Score from boss defeat.
- Score from score bonus items.
- Combo count and combo multiplier.
- Max combo tracking.
- High score persistence with `localStorage`.

Combo direction:

- Consecutive enemy defeats increase combo.
- Combo affects score multiplier.
- Combo resets or decays on damage and/or after a timeout.

The exact decay timing can be tuned during implementation.

### `AudioManager`

Use Web Audio API to generate sounds in code instead of requiring external audio
files for the first version.

Initial sounds:

- Player shot.
- Enemy defeat.
- Player damage.
- Item pickup.
- Boss warning or boss entrance.
- Short looping BGM.

Audio should be started only after user interaction to satisfy browser autoplay
restrictions.

### `StageDirector`

Responsibilities:

- Drive the one-stage timeline.
- Spawn waves over time.
- Increase pressure from early to mid to late stage.
- Trigger boss entrance.
- Signal clear conditions.

Initial stage structure:

- Early: small enemy groups and readable bullet patterns.
- Middle: denser waves and more overlapping enemy fire.
- Late: heavy enemies and higher bullet density.
- Boss: one boss with phase-based patterns.

Current tuning target:

- The default stage should include several waves before the boss, with early
  straight enemies, middle sway enemies, and late heavy enemies before the boss
  appears.
- The boss should be durable enough to survive sustained upgraded fire for a
  meaningful fight; its first implementation target is at least triple the
  original 60 HP budget.
- Boss movement should be driven only by its scripted motion. Bullet hits should
  damage the boss without nudging or shaking its position.

## Visual Direction

Use a neon/vector style. Favor simple geometric shapes, glow-like colors, and clear
silhouettes. The first version should not depend on hand-authored sprite assets.

Visibility matters more than decoration:

- Player bullets, enemy bullets, enemies, items, and the player must be clearly distinct.
- Enemy bullets should be readable even when many are on screen.
- Damage and invincibility states should be visually obvious.
- Boss attacks should feel intense but still fair.

## Difficulty Direction

The game should be casual in punishment but tense in moment-to-moment dodging.

Rules:

- Use a life system, not one-hit death.
- On hit, reduce life and grant brief invincibility.
- Keep bullet density relatively high.
- Avoid unavoidable patterns.
- Use clear telegraphing for boss phase changes and dangerous attacks.

## Persistence

Persist at least:

- High score.

May persist later:

- Audio volume.
- Last selected input preference.
- Best clear time.

## Testing Direction

Because Phaser gameplay is visual and interactive, testing should mix unit tests
and browser verification.

Recommended testable units:

- Input normalization.
- Score and combo rules.
- Stage timeline data.
- Power-up effects.
- High score persistence wrapper.

Manual/browser checks:

- Keyboard movement and shooting.
- Mouse/touch movement and shooting.
- Gamepad movement and shooting when available.
- Scene transitions.
- Game over and clear results.
- Audio starts after interaction.

## Open Tuning Decisions

These should be decided during implementation playtesting:

- Exact player speed.
- Shot interval and bullet speed.
- Player life count.
- Invincibility duration.
- Combo timeout.
- Enemy health values.
- Boss health and phase thresholds.
- Bullet pattern density.
- Item drop rates.

These are tuning values, not blockers for the initial architecture.
