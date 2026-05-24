import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  PLAYER_INITIAL_LIVES,
  PLAYER_INVINCIBLE_MS,
  PLAYER_SHOT_INTERVAL_MS,
  PLAYER_SPEED,
} from './constants';
import { approachVelocity, syncArcadeBody } from './physics';
import {
  CHARACTER_ANIMATION_KEYS,
  PLAYER_TEXTURE_KEY,
  playCharacterAnimation,
} from './visualAssets';
import type { NormalizedInputState } from '../systems/InputManager';

export class PlayerController {
  readonly sprite: Phaser.GameObjects.Sprite;
  lives = PLAYER_INITIAL_LIVES;
  shotLevel = 1;
  private lastShotAtMs = -Infinity;
  private invincibleUntilMs = 0;
  private velocityX = 0;
  private velocityY = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.sprite = scene.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 70,
      PLAYER_TEXTURE_KEY,
    );
    playCharacterAnimation(this.sprite, CHARACTER_ANIMATION_KEYS.player);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(11, 13, 8);
    body.setCollideWorldBounds(true);
  }

  update(input: NormalizedInputState, timeMs: number, deltaMs: number): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const deltaSeconds = deltaMs / 1000;

    if (input.pointerTarget !== null) {
      const dx = input.pointerTarget.x - this.sprite.x;
      const dy = input.pointerTarget.y - this.sprite.y;
      this.velocityX = 0;
      this.velocityY = 0;
      this.sprite.x +=
        Phaser.Math.Clamp(dx * 8, -PLAYER_SPEED, PLAYER_SPEED) * deltaSeconds;
      this.sprite.y +=
        Phaser.Math.Clamp(dy * 8, -PLAYER_SPEED, PLAYER_SPEED) * deltaSeconds;
    } else {
      this.velocityX = approachVelocity(
        this.velocityX,
        input.move.x * PLAYER_SPEED,
        PLAYER_ACCELERATION,
        PLAYER_DECELERATION,
        deltaSeconds,
      );
      this.velocityY = approachVelocity(
        this.velocityY,
        input.move.y * PLAYER_SPEED,
        PLAYER_ACCELERATION,
        PLAYER_DECELERATION,
        deltaSeconds,
      );
      this.sprite.x += this.velocityX * deltaSeconds;
      this.sprite.y += this.velocityY * deltaSeconds;
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
