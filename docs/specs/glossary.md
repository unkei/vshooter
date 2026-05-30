# VShooter Glossary

This glossary defines the terms used in design notes, implementation plans, and
playtest feedback. Use these terms consistently when discussing gameplay,
screens, enemies, controls, and visual feedback.

## Screens and Flow

- Title screen: The pre-game screen. It shows the game title, high score, basic
  input hints, and lightweight audio settings.
- Game screen: The active play screen. It runs stage progression, enemies,
  bullets, the player, power-ups, and boss fights.
- Clear bonus screen: The post-boss screen that shows score breakdown, clear
  bonuses, and the player warp-out sequence.
- Ending screen: The final story screen after clearing the last stage. It shows
  the resolved story message and staff roll before returning to the title.
- Result screen: The final result screen after game over or clear flow. It shows
  score, max combo, high score, and retry/title choices.
- Stage: A complete playable sequence of waves followed by a boss.
- Wave: A timed group of regular enemies spawned during a stage.
- Boss entrance: The warning and animation sequence before a boss becomes
  attackable.
- Boss defeat sequence: The visual reaction after the boss HP reaches zero and
  before the clear bonus screen starts.

## Player

- Player ship: The craft controlled by the player.
- Shot: The player's normal hold-to-fire attack.
- Shot level: The current strength level of the player shot after shot upgrade
  items.
- Life: The player's remaining durability.
- Invincibility window: The temporary period after accepted damage during which
  additional hits are ignored.
- Hitbox: The collision area that determines whether the player is hit. It may
  be smaller than the visible ship for fair dodging.
- Damage feedback: The visual, audio, and haptic feedback shown when the player
  takes damage.

## Enemies

- Regular enemy: Any non-boss enemy.
- Straight enemy: A basic regular enemy that moves downward and fires simple
  shots.
- Sway enemy: A regular enemy that moves downward while drifting horizontally.
- Heavy enemy: A durable regular enemy that creates stronger bullet pressure.
- Boss: The large enemy at the end of a stage.
- Boss phase: A boss behavior state selected by boss HP or stage rules.
- Boss rush attack: A boss action where the boss moves downward toward the player
  area, attacks, then returns to its normal position.

## Bullets and Items

- Player bullet: A projectile fired by the player ship.
- Enemy bullet: A projectile fired by a regular enemy or boss.
- Bullet pattern: A specific arrangement, speed, direction, and timing of enemy
  bullets.
- Bullet density: The amount of enemy bullet pressure on screen.
- Bullet curtain: The overall field of enemy bullets that the player must dodge.
- Power-up item: A collectible item that improves survival or attack strength.
- Shot upgrade item: A power-up item that raises shot level.
- Life recovery item: A power-up item that restores one life, up to the maximum.
- Score item: A collectible item that grants score without changing combat
  strength.

## Controls

- Keyboard controls: Arrow keys or WASD for movement, Space for shot, and Enter
  for confirm/start/retry.
- Gamepad controls: Stick or D-pad movement, primary face button or shoulder for
  shot, and Start/Menu-equivalent for confirm/start/retry.
- Touch direct controls: A touch control mode where the player ship follows the
  touch position.
- Touch virtual stick controls: A touch control mode where the initial touch
  point acts as the stick center, and finger movement from that center becomes
  directional movement.
- Fine positioning: Small, deliberate player movement used to line up shots or
  narrowly avoid enemies and bullets.
- Diagonal normalization: Movement handling that prevents diagonal input from
  becoming faster than cardinal-direction movement.

## Scoring and Rewards

- Score: The current run's points.
- High score: The best locally saved score.
- Combo: A chain of enemy defeats that increases scoring value while maintained.
- Max combo: The highest combo reached in the current run.
- Clear bonus: A score award granted after clearing a stage.
- Combo bonus: A score award based on max combo during the clear bonus sequence.

## Visual and Audio Feedback

- HUD: The gameplay status display for life, shot level, score, combo, and other
  immediate state.
- Damage smoke: A short smoke-like effect emitted from the player ship when
  damage is accepted.
- Warning cue: The audio and visual warning used before major events such as boss
  entrance.
- Warp route: A visible route, gate, or path effect used during the clear warp-out
  sequence.
- External asset: A loaded image or audio file used when available.
- Generated fallback: A code-generated visual or audio effect used when an
  external asset is unavailable.
