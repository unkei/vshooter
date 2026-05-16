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
    const item = this.scene.add.circle(x, y, 9, color[type], 1) as PowerUpSprite;
    item.setStrokeStyle(2, 0xffffff, 0.85);
    item.setData('type', type);
    this.scene.physics.add.existing(item);
    item.body.setCircle(9);
    item.body.setVelocityY(85);
    this.items.add(item);
  }

  update(): void {
    for (const child of this.items.getChildren()) {
      const item = child as PowerUpSprite;
      if (item.y > GAME_HEIGHT + 32) {
        item.destroy();
      }
    }
  }
}
