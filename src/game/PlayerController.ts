import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_INITIAL_LIVES,
  PLAYER_INVINCIBLE_MS,
  PLAYER_SHOT_INTERVAL_MS,
  PLAYER_SPEED,
} from './constants';
import { syncArcadeBody } from './physics';
import type { NormalizedInputState } from '../systems/InputManager';

export class PlayerController {
  readonly sprite: Phaser.GameObjects.Triangle;
  lives = PLAYER_INITIAL_LIVES;
  shotLevel = 1;
  private lastShotAtMs = -Infinity;
  private invincibleUntilMs = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.sprite = scene.add.triangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 70,
      0,
      22,
      14,
      0,
      28,
      22,
      0x4ffcff,
      1,
    );
    this.sprite.setStrokeStyle(2, 0xffffff, 0.9);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(10, 4, 2);
    body.setCollideWorldBounds(true);
  }

  update(input: NormalizedInputState, timeMs: number, deltaMs: number): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const deltaSeconds = deltaMs / 1000;

    if (input.pointerTarget !== null) {
      const dx = input.pointerTarget.x - this.sprite.x;
      const dy = input.pointerTarget.y - this.sprite.y;
      this.sprite.x +=
        Phaser.Math.Clamp(dx * 8, -PLAYER_SPEED, PLAYER_SPEED) * deltaSeconds;
      this.sprite.y +=
        Phaser.Math.Clamp(dy * 8, -PLAYER_SPEED, PLAYER_SPEED) * deltaSeconds;
    } else {
      this.sprite.x += input.move.x * PLAYER_SPEED * deltaSeconds;
      this.sprite.y += input.move.y * PLAYER_SPEED * deltaSeconds;
    }

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 18, GAME_WIDTH - 18);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 24, GAME_HEIGHT - 24);
    syncArcadeBody(this.sprite);
    this.sprite.setAlpha(timeMs < this.invincibleUntilMs ? 0.45 : 1);

    if (input.shoot && timeMs - this.lastShotAtMs >= PLAYER_SHOT_INTERVAL_MS) {
      this.lastShotAtMs = timeMs;
      return true;
    }

    return false;
  }

  damage(timeMs: number): boolean {
    if (timeMs < this.invincibleUntilMs) {
      return false;
    }

    this.lives -= 1;
    this.invincibleUntilMs = timeMs + PLAYER_INVINCIBLE_MS;
    return true;
  }

  recoverLife(maxLives: number): void {
    this.lives = Math.min(maxLives, this.lives + 1);
  }

  upgradeShot(maxShotLevel: number): void {
    this.shotLevel = Math.min(maxShotLevel, this.shotLevel + 1);
  }

  isDead(): boolean {
    return this.lives <= 0;
  }
}
