import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  PLAYER_MAX_LIVES,
  PLAYER_MAX_SHOT_LEVEL,
  SCORE_BONUS_ITEM_VALUE,
} from '../game/constants';
import type { PlayerStats, PowerUpType } from '../game/types';

export function applyPowerUp(
  stats: PlayerStats,
  type: PowerUpType,
): PlayerStats {
  switch (type) {
    case 'shot':
      return {
        ...stats,
        shotLevel: Math.min(PLAYER_MAX_SHOT_LEVEL, stats.shotLevel + 1),
      };
    case 'life':
      return {
        ...stats,
        lives: Math.min(PLAYER_MAX_LIVES, stats.lives + 1),
      };
    case 'score':
      return {
        ...stats,
        score: stats.score + SCORE_BONUS_ITEM_VALUE,
      };
  }
}

type PowerUpSprite = Phaser.GameObjects.Arc & {
  body: Phaser.Physics.Arcade.Body;
};

export const POWER_UP_SCROLL_SPEED = 70;
export const POWER_UP_LIFETIME_MS = 5600;
export const POWER_UP_BLINK_AFTER_MS = 3800;
export type PowerUpSpawnPoint = {
  x: number;
  y: number;
};

export function createPowerUpPosition(
  x: number,
  y: number,
): PowerUpSpawnPoint {
  return { x, y };
}

export function computePowerUpAlpha(ageMs: number): number {
  if (ageMs > POWER_UP_LIFETIME_MS) {
    return 0;
  }
  if (ageMs < POWER_UP_BLINK_AFTER_MS) {
    return 1;
  }

  return Math.floor(ageMs / 130) % 2 === 0 ? 0.35 : 1;
}

export class PowerUpDropManager {
  readonly items: Phaser.Physics.Arcade.Group;

  constructor(private readonly scene: Phaser.Scene) {
    this.items = scene.physics.add.group();
  }

  drop(type: PowerUpType, x: number, y: number): void {
    const color: Record<PowerUpType, number> = {
      shot: 0x6ffcff,
      life: 0x61ff77,
      score: 0xfff06a,
    };
    const spawnPoint = createPowerUpPosition(x, y);
    const item = this.scene.add.circle(
      spawnPoint.x,
      spawnPoint.y,
      9,
      color[type],
      1,
    ) as PowerUpSprite;
    item.setStrokeStyle(2, 0xffffff, 0.85);
    item.setData('type', type);
    item.setData('spawnedAtMs', this.scene.time.now);
    this.scene.physics.add.existing(item);
    item.body.setCircle(9);
    item.body.setVelocityY(0);
    this.items.add(item);
  }

  update(timeMs: number = this.scene.time.now, deltaMs = this.scene.game.loop.delta): void {
    const deltaSeconds = deltaMs / 1000;
    for (const child of this.items.getChildren()) {
      const item = child as PowerUpSprite;
      item.y += POWER_UP_SCROLL_SPEED * deltaSeconds;
      item.body.updateFromGameObject();
      const spawnedAtMs = Number(item.getData('spawnedAtMs') ?? timeMs);
      const ageMs = timeMs - spawnedAtMs;
      const alpha = computePowerUpAlpha(ageMs);
      item.setAlpha(alpha);
      if (alpha <= 0 || item.y > GAME_HEIGHT + 32) {
        item.destroy();
      }
    }
  }
}
