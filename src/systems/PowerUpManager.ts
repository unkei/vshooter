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
const POWER_UP_SPAWN_SPREAD_X = 34;
const POWER_UP_SPAWN_LIFT_Y = 12;

export type PowerUpSpawnPoint = {
  x: number;
  y: number;
};

export function createPowerUpSpawnPoint(
  x: number,
  y: number,
  random: () => number = Math.random,
): PowerUpSpawnPoint {
  return {
    x: x + (random() - 0.5) * POWER_UP_SPAWN_SPREAD_X * 2,
    y: y - POWER_UP_SPAWN_LIFT_Y + (random() - 0.5) * 18,
  };
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

  maybeDrop(x: number, y: number): void {
    if (Math.random() > 0.35) {
      return;
    }

    const roll = Math.random();
    const type: PowerUpType = roll < 0.45 ? 'shot' : roll < 0.65 ? 'life' : 'score';
    const color: Record<PowerUpType, number> = {
      shot: 0x6ffcff,
      life: 0x61ff77,
      score: 0xfff06a,
    };
    const spawnPoint = createPowerUpSpawnPoint(x, y);
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
    item.body.setVelocityY(POWER_UP_SCROLL_SPEED);
    this.items.add(item);
  }

  update(timeMs: number = this.scene.time.now): void {
    for (const child of this.items.getChildren()) {
      const item = child as PowerUpSprite;
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
