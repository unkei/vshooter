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
type PowerUpVisualAttachment = {
  object: Phaser.GameObjects.Arc | Phaser.GameObjects.Text;
  offsetY: number;
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

export type PowerUpVisualStyle = {
  color: number;
  strokeColor: number;
  label: string;
};

export function powerUpVisualStyle(type: PowerUpType): PowerUpVisualStyle {
  switch (type) {
    case 'shot':
      return { color: 0x6ffcff, strokeColor: 0x102a3a, label: 'P' };
    case 'life':
      return { color: 0x61ff77, strokeColor: 0x123819, label: 'L' };
    case 'score':
      return { color: 0xfff06a, strokeColor: 0x3a3008, label: '$' };
  }
}

export function powerUpCollectionEnabledDuringInvincibility(): boolean {
  return true;
}

export class PowerUpDropManager {
  readonly items: Phaser.Physics.Arcade.Group;

  constructor(private readonly scene: Phaser.Scene) {
    this.items = scene.physics.add.group();
  }

  drop(type: PowerUpType, x: number, y: number): void {
    const style = powerUpVisualStyle(type);
    const spawnPoint = createPowerUpPosition(x, y);
    const ring = this.scene.add
      .circle(spawnPoint.x, spawnPoint.y, 14, style.color, 0.16)
      .setStrokeStyle(2, style.color, 0.9);
    const item = this.scene.add.circle(
      spawnPoint.x,
      spawnPoint.y,
      9,
      style.color,
      1,
    ) as PowerUpSprite;
    item.setStrokeStyle(3, style.strokeColor, 0.95);
    const label = this.scene.add
      .text(spawnPoint.x, spawnPoint.y + 1, style.label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    item.setData('type', type);
    item.setData('spawnedAtMs', this.scene.time.now);
    item.setData('visualAttachments', [
      { object: ring, offsetY: 0 },
      { object: label, offsetY: 1 },
    ]);
    item.once('destroy', () => {
      ring.destroy();
      label.destroy();
    });
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
      const attachments =
        (item.getData('visualAttachments') as PowerUpVisualAttachment[] | undefined) ?? [];
      for (const attachment of attachments) {
        attachment.object.setPosition(item.x, item.y + attachment.offsetY);
      }
      const spawnedAtMs = Number(item.getData('spawnedAtMs') ?? timeMs);
      const ageMs = timeMs - spawnedAtMs;
      const alpha = computePowerUpAlpha(ageMs);
      item.setAlpha(alpha);
      for (const attachment of attachments) {
        attachment.object.setAlpha(alpha);
      }
      if (alpha <= 0 || item.y > GAME_HEIGHT + 32) {
        item.destroy();
      }
    }
  }
}
