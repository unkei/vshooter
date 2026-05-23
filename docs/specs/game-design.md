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
- Hybrid asset visuals: key craft art may use external assets, while bullets,
  background effects, explosions, and UI feedback may remain code-generated.
- Hybrid audio: BGM and key sound effects may use external assets, while Web
  Audio generated sounds remain available as fallback.
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
- Retry must require a fresh confirm press after entering the result screen. Held
  shot, pointer, keyboard, or gamepad buttons from gameplay must not immediately
  start a new run.

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

Movement feel:

- Keyboard and gamepad movement should ramp up instead of jumping immediately to
  maximum speed, so the player can make small line-up corrections.
- The ramp should be responsive, not sluggish. The initial acceleration should
  be high enough that the player can start moving quickly while still retaining
  finer control than instant full-speed movement.
- Releasing input should decelerate quickly enough to remain responsive.
- Pointer/touch movement may remain direct, but should still clamp to the play
  bounds and avoid overshooting the pointer target.
- On touch devices, the controlled player should appear slightly above the
  pressed finger position instead of directly under it. This keeps the ship
  visible during mobile play while preserving direct drag control. Regression
  expectation: mouse/pointer control continues to target the pointer position
  directly, while touch input offsets only the movement target upward.

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

Enemy positioning should be controlled by `EnemyManager`, not by Arcade Physics
velocity. Enemy Arcade bodies are collision shapes synchronized from scripted
positions. This avoids double movement and visual jitter, especially for sway
enemies.

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

Power-up drops should be deterministic stage design, not random chance. Each wave
may mark specific enemy indexes as carriers for a specific item type; only those
enemies drop items when defeated. Drops should appear at the defeated enemy
position, then flow downward with the stage scroll, remain collectible for a
short lifetime, blink near expiry, and disappear. The blink should warn the
player without changing the item type or collision.

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

Use Web Audio API to generate sounds in code as the fallback path. External BGM
and key sound effects may be added after the asset pipeline exists.

Initial sounds:

- Player shot.
- Enemy defeat.
- Boss explosion.
- Player damage.
- Item pickup.
- Boss warning or boss entrance.
- Short looping BGM.

Audio should be started only after user interaction to satisfy browser autoplay
restrictions.

External audio must preserve the same browser unlock expectations as generated
audio. If external BGM or sound effects are unavailable, fail to load, or cannot
start under browser autoplay rules, generated Web Audio playback should continue
to provide the playable fallback.

iOS Safari requires Web Audio unlock to happen inside the same user gesture that
starts the game. The title pointer/keyboard start path should start or resume the
shared audio manager before switching to gameplay, and gameplay should reuse that
manager. Regression expectation: starting from touch on iOS Safari unlocks BGM
and sound effects; entering gameplay still attempts a fallback start for
non-iOS/browser paths.

Safari compatibility requires both standard `AudioContext` and prefixed
`webkitAudioContext` support. Audio startup should schedule a tiny output pulse
and the BGM oscillator synchronously during the start gesture before awaiting
`resume()`, so iOS does not drop the unlock because no audio node was started
inside the gesture. Regression expectation: when `resume()` remains pending,
audio nodes have already been started; when only `webkitAudioContext` exists, the
game still creates an audio context.

Repeated sounds should be restrained:

- Player shot sound plays very frequently during hold-to-fire, so it should be
  short and softer than alert sounds such as player damage or boss warning, but
  still audible during normal play.
- Sound effects should remain clearly audible over the BGM on mobile speakers.
  The player shot should be louder than the original restrained prototype while
  staying short enough not to smear during hold-to-fire. Damage, pickup, enemy
  defeat, and boss warning sounds should sit above the music mix.
- BGM should sound like an intentional looping arcade track, not a barely audible
  single-note drone. It should start with the same unlocked audio context and use
  multiple generated layers such as bass, lead, and harmony.

### `VibrationManager`

Use the browser Vibration API and Gamepad Haptics API for tactile feedback when
the active device and browser support them. Vibration is optional feedback:
unsupported environments must continue silently without errors or gameplay
changes.

Initial vibration events:

- Player damage: vibrate only when damage is accepted after invincibility checks.
  The pattern should become stronger as remaining life decreases, so low-life
  damage feels more urgent than high-life damage.
- Power-up pickup: use a short double-click style pattern with a small pause
  between pulses.

Regression expectation: desktop browsers or devices without `navigator.vibrate`
or gamepad haptics continue to play normally; invincible hits do not vibrate;
power-up feedback is short and distinct from damage feedback.

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
- The boss should not enter while regular enemies from the final wave are still
  naturally on screen. Boss entry should be triggered after all regular waves
  have been issued and the active regular enemy count reaches zero, either
  because the player defeated them or because they left the play area. It should
  not rely on a fixed boss timestamp that creates a long wait after the player
  clears the final wave quickly.
- After the active regular enemy count reaches zero, boss entry should play a
  short warning/entrance animation before the boss becomes attackable. The pause
  should make the boss arrival feel deliberate without reintroducing a long fixed
  timeline wait.
- The boss should be durable enough to survive sustained upgraded fire for a
  meaningful fight; its current implementation target is 1890 HP, triple the
  previous 630 HP budget.
- Boss movement should be driven only by its scripted motion. Bullet hits should
  damage the boss without nudging or shaking its position.
- Normal boss hit feedback should use a short white flash overlay so hits are
  readable. The base boss sprite must remain visible and fully opaque underneath
  the overlay; the flash must not move, scale, hide, fade, or otherwise
  destabilize the boss sprite, and it should clear automatically. The flash
  overlay must be synchronized after the boss scripted movement for the current
  frame, so it cannot momentarily appear at a previous boss position.
- Boss-related events should avoid full-screen camera flashes and boss alpha
  fades because these read as boss flicker on mobile displays. Boss entrance,
  normal hits, and defeat should keep the boss sprite continuously opaque while
  using text, bursts, scale, or rotation for feedback instead.
- When player bullets hit the boss, the hit should destroy the bullet, reduce HP,
  and briefly flash the boss tint. Regression expectation: boss hit feedback is
  visible, while boss position, opacity, visibility, scale, and blend state remain
  stable.
- Sustained rapid-fire hits must not keep the boss in a permanent flash state.
  Normal boss tint should be visible between hit flashes even while bullets are
  landing continuously. Regression expectation: during continuous boss damage,
  E2E checks observe stable visible/opaque/scale-1 boss state and at least one
  non-flashing sample after the initial hit flash window.
- Defeating the boss should play a visible reaction before moving to the clear
  result screen, so the final hit has impact instead of cutting away instantly.
  The boss body should remain visible and opaque for the full defeat reaction
  while explosion bursts play around it, so the explosions clearly read as the
  boss being destroyed rather than effects in empty space. During the defeat
  reaction, a dedicated visible boss body should render on the defeat visual
  layer, just below the explosion rings, and remain visible until the clear
  transition begins. It should also play a distinct explosion sound effect. On
  boss entrance and on boss defeat, all active player bullets should be cleared
  and player firing should be paused until the transition has ended, so stale
  bullets cannot carry into the boss intro or clear sequence.
- Stage clear should not jump straight to the retry result screen. After the
  boss defeat reaction, show a clear bonus scene with score, clear bonus, combo
  bonus, and total score, then animate the player ship warping upward toward the
  next stage before entering the result/retry screen. The clear bonus scene
  should play a distinct clear BGM and count bonus displays upward from 0 to the
  awarded bonus values.
- The clear result screen should be temporary. After a readable delay it should
  stop any clear BGM and return to the title screen automatically. The title
  screen must remain silent until the next explicit start input. Regression
  expectation: clear BGM does not continue on the title screen, while starting
  from the title calls the shared audio manager from the user input handler so
  suspended Web Audio contexts can resume on iOS Safari.
- Chrome may expose connected gamepads in sparse `navigator.getGamepads()` slots
  such as index 1 with index 0 empty. Scene transitions must avoid Phaser
  shutdown errors from those sparse slots while preserving the original pad
  indexes, so replaying after a result screen keeps gamepad retry and gameplay
  movement working. Regression expectation: with a sparse Chrome-style gamepad,
  clearing or ending a run does not throw during scene shutdown, and after retry
  the same pad can still move the player.
- The final regular wave should use lower heavy-enemy bullet density than the
  earlier heavy wave to keep the boss approach readable.

## Visual Direction

Use a neon/vector arcade style. Character visuals may be loaded from external
assets for the player ship, distinct regular enemy craft, a heavier enemy craft,
and a large boss craft. Bullets, background effects, explosions, hit flashes, and
UI feedback may remain code-generated so readability and tuning stay easy.

External visual assets should be introduced in two steps:

1. Add a small placeholder asset pipeline with stable texture keys and paths.
2. Replace the placeholders with purpose-made assets after load behavior and
   scene integration are working.

Purpose-made character art should prefer one transparent source PNG sheet plus
crop metadata over many pre-cut files. At game startup, the visual asset system
may cut character-specific spritesheets from that source sheet and register them
under stable texture keys. Player, enemy, and boss sprites may loop subtle
idle/thruster animation frames. The animation must not change gameplay collision
bodies, boss opacity, boss scale, or bullet readability. The boss runtime
spritesheet should preserve the source art's tall aspect ratio instead of
stretching it into the previous wide generated-placeholder shape, and should
display the boss closer to the source sheet's large craft size than the earlier
small placeholder-sized runtime frame. Enemy-side sprites that face the wrong
vertical direction in the generated source sheet should be flipped while
generating the runtime spritesheets, not by changing gameplay movement.
Regression expectation: player, regular enemy, heavy enemy, and boss animation
frames should keep their visible body centered in the same runtime frame box, so
idle/thruster animation does not make the craft appear to jump or slide. Boss
animation frames should use equal source crop dimensions and a larger tall
runtime frame, so thruster-frame differences do not cause horizontal sliding or
aspect-ratio changes.
When generated boss frames differ too much in silhouette or scale, use only the
matching frames that preserve a stable tall boss body, even if that means a
shorter two-frame boss animation.

If an external character asset is missing or fails to load, the game should fall
back to the generated game-like texture for that character. The game should
remain playable without downloaded or hand-authored art files.

Visibility matters more than decoration:

- Player bullets, enemy bullets, enemies, items, and the player must be clearly distinct.
- Enemy bullets should be readable even when many are on screen.
- Projectile visuals should be large enough to read at speed; current tuning uses
  bullets 1.5x larger than the original radius and applies a 30% speed reduction
  to projectile movement.
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
- Fresh-press/release gating for retry and restart input.
- Score and combo rules.
- Stage timeline data.
- Power-up effects.
- High score persistence wrapper.
- Scripted movement helpers and Arcade body synchronization wrappers.

Manual/browser checks:

- Keyboard movement and shooting.
- Keyboard state after game over and retry; held movement or shot keys from the
  previous run must not carry into the next run.
- Mouse/touch movement and shooting.
- Gamepad movement and shooting when available.
- Scene transitions.
- Game over and clear results.
- Boss appearance, persistence, damage, defeat, and transition to clear result.
- Audio starts after interaction.

CI browser checks:

- Playwright should run the boss defeat clear flow from the command line with
  `npm run e2e`.
- Browser-only test helpers must be gated behind a local/debug flag so normal
  play is unaffected.

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
