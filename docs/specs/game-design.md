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

## Terminology

Use `docs/specs/glossary.md` as the shared glossary for design discussion,
implementation plans, playtest feedback, and code-facing names where practical.
When adding new gameplay concepts, update the glossary so future conversations
use the same terms consistently.

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
External audio should use stable logical keys for gameplay BGM, clear BGM, and
the core sound effects: player shot, enemy defeat, boss explosion, player damage,
item pickup, and boss warning. Phaser scenes may preload those files and attach a
scene-backed playback adapter to the shared audio manager, but the shared manager
must keep the generated Web Audio path as the fallback when a key is missing,
the browser rejects playback, or the scene adapter is not available.
Scene transitions must not leave external BGM playing through an old scene
adapter. Replacing the playback adapter should stop any music owned by the
previous adapter, and starting the same external music again should replace the
previous instance instead of layering another loop. Regression expectation:
entering game over stops the active gameplay BGM, and retrying from game over
does not produce doubled BGM from the previous run.

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

Audio settings should be shared by generated Web Audio fallback and external
Phaser audio. The shared audio manager owns master, BGM, SFX, and mute state,
clamps volume values to the 0-1 range, and persists settings with
`localStorage`. Title and result screens may expose a minimal mute toggle without
adding gameplay input complexity; gameplay input must remain focused on movement
and shooting. Regression expectation: changing mute or volume affects generated
BGM layers, generated sound effects, external BGM, and external sound effects
through the same effective-volume calculation.

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
under stable texture keys. The active source sheet should be a curated v2 sheet
containing only the frames used by gameplay, arranged into transparent cells with
stable spacing. This keeps runtime crop metadata simple and prevents slivers from
neighboring generated sprites from leaking into animation frames. Player, enemy,
and boss sprites may loop subtle idle/thruster animation frames. The animation
must not change gameplay collision bodies, boss opacity, boss scale, or bullet
readability. The boss runtime spritesheet should preserve the source art's tall
aspect ratio instead of stretching it into the previous wide generated-placeholder
shape, and should display the boss closer to the source sheet's large craft size
than the earlier small placeholder-sized runtime frame. Enemy-side sprites that
face the wrong vertical direction in the generated source sheet should be flipped
while generating the runtime spritesheets, not by changing gameplay movement.
Regression expectation: player, regular enemy, heavy enemy, and boss animation
frames should keep their visible body centered in the same runtime frame box, so
idle/thruster animation does not make the craft appear to jump or slide. Boss
animation frames should use all usable source-sheet boss patterns, equal source
crop dimensions that do not include neighboring sprites, and a larger tall
runtime frame. The boss crop should include enough source-sheet lower area to
preserve engine flames after vertical flipping, so display-time upper flames are
not clipped. If a safe crop avoids neighboring sprites but shifts a frame's
visual center, that frame may use a small runtime draw offset inside the fixed
frame box instead of widening the crop. Regression expectation: no boss
animation frame should show slivers from adjacent boss sprites at either edge. In
the curated v2 sheet, boss frames should not require runtime draw offsets because
the source cells already include the needed transparent padding. Boss cells in
the curated sheet should also align the rendered body center in the runtime
frame, so stronger flame frames do not make the ship appear to step sideways.
Enemy animation crop boxes should be rechecked against the source sheet when
changed so their visible centers remain consistent across all frames for each
enemy type.
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

## Near-Term Polish Goals

The next development phase should make stage 1 a polished baseline stage, then
move the current stronger bullet pressure into stage 2. The goal is to improve
feel, readability, and event pacing before expanding content broadly.

### Control Feel

Gamepad controls should support fine positioning. The player should be able to
make small alignment corrections to line up shots or avoid nearby bullets without
overshooting. Diagonal input must not feel faster than horizontal or vertical
input, so movement should normalize diagonal magnitude after analog/deadzone
processing.

The first control polish pass should resolve this by applying radial deadzone
scaling and a gentle response curve to analog stick input. Movement just beyond
the deadzone should produce a small movement value instead of jumping to the raw
axis value. Regression expectation: gamepad diagonal movement magnitude never
exceeds cardinal-direction movement, and a near-deadzone stick input can move the
player slowly enough for fine positioning.

Touch direct controls currently make the game too easy because the player ship
can chase the finger position too quickly. Touch control should be revisited with
touch virtual stick controls as the primary candidate: the initial touch point
acts as the stick center, and finger movement from that center drives movement
like a lever. If both touch direct controls and touch virtual stick controls are
kept, expose them as a simple option rather than mixing both behaviors
implicitly.

The first touch polish pass should make touch virtual stick controls the default
touch behavior while preserving direct pointer targeting for mouse input.
Regression expectation: touch input produces movement from the touch origin and
does not create a direct pointer target, while mouse input still targets the
pointer position directly.

The player hitbox, invincibility window, and shot fire rate are acceptable for
now and should not be changed heavily during the first polish pass unless
playtesting exposes a direct problem.

### Stage 1 Tuning

Stage 1 length and early-wave training value are broadly acceptable. The next
pass should lower stage 1 difficulty slightly by thinning bullet density and
reducing how sharply the stage diverges between upgraded and non-upgraded runs.
Missing an early shot upgrade should make the stage harder, but it should not
make the rest of the stage feel disproportionately punishing.

The stage 1 tuning pass should review shot upgrade placement, enemy durability,
and bullet density together. Regression expectation: a player who misses one
shot upgrade can still reasonably clear stage 1 with careful play, while a
player who collects upgrades still feels rewarded with a smoother clear.

After the final regular wave is cleared, the boss should not appear immediately.
The game should leave a short readable pause where remaining bullets and the
current screen state are still visible, then play a warning cue, then run a boss
entrance animation before the boss becomes attackable.

### Boss Entrance and Defeat

Boss entrance should be a staged sequence: warning cue, visible entrance motion,
then attack start. The transition should feel intentional instead of abruptly
replacing the final wave state.

Boss defeat should move away from the current zoom-and-tilt emphasis. The boss
body should stay readable, explosions should last longer, and the defeat should
feel like the boss is falling or breaking down before the clear bonus screen
starts.

### Stage 2 Direction

Add stage 2 after stage 1 has a stable polish baseline. Stage 2 should inherit
roughly the current stage 1 bullet pressure, while stage 1 becomes more
approachable.

Stage 2 boss design should add a boss rush attack. The boss occasionally moves
downward toward the player area at a moderately fast speed, attacks, then returns
to its normal position. This should be tested as a pressure spike, not a
near-unavoidable collision threat.

### Visual and UI Feedback

Life state is currently too hard to read. Improve the HUD life display, and add
damage smoke when the player takes accepted damage. Low-life state should be
readable without requiring the player to parse small text during dense action.

The title screen should look more like part of the same game world as the
character art. The title lettering and font treatment should become more
substantial and visually polished.

Player bullets, enemy bullets, and power-up items should receive stronger visual
assets or code-generated effects. They must remain highly readable at gameplay
speed and must not blend into the background or each other.

The clear warp-out should show a stronger warp route, gate, or path effect before
the player ship leaves. Clear bonus counting should use a more readable and
polished font treatment so the player understands how the bonus enters the final
score.

### Score Direction

The current score and bonus direction is acceptable. Near-term work should focus
on presentation clarity rather than changing score rules.

## Persistence

Persist at least:

- High score.
- Audio volume and mute state.

May persist later:

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
- Audio settings persistence and volume clamping.
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
