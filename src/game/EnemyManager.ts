import Phaser from 'phaser';
import { GAME_WIDTH } from './constants';
import {
  DEFAULT_HEAVY_BULLET_COUNT,
  DEFAULT_HEAVY_FIRE_INTERVAL_MS,
  FINAL_WAVE_HEAVY_BULLET_COUNT,
  FINAL_WAVE_HEAVY_FIRE_INTERVAL_MS,
  HEAVY_ENEMY_HP,
  REGULAR_ENEMY_FIRE_INTERVAL_MS,
  STRAIGHT_ENEMY_HP,
  SWAY_ENEMY_HP,
} from './enemyTuning';
import { configureManualArcadeBody, syncArcadeBody } from './physics';
import type { EnemyType, PowerUpType } from './types';
import type { ProjectileManager } from './ProjectileManager';
import {
  CHARACTER_ANIMATION_KEYS,
  ENEMY_TEXTURE_KEYS,
  playCharacterAnimation,
} from './visualAssets';

type EnemySprite = Phaser.GameObjects.Sprite & {
  body: Phaser.Physics.Arcade.Body;
};

type EnemyData = {
  type: EnemyType;
  hp: number;
  points: number;
  fireEveryMs: number;
  nextFireAtMs: number;
  originX: number;
  speed: number;
  bulletCount: number;
  powerUpDrop?: PowerUpType;
};

export class EnemyManager {
  readonly enemies: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly projectiles: ProjectileManager,
  ) {
    this.enemies = scene.physics.add.group();
  }

  spawnWave(
    type: EnemyType,
    count: number,
    options: {
      pressure?: 'normal' | 'reduced';
      drops?: Array<{ enemyIndex: number; type: PowerUpType }>;
    } = {},
  ): void {
    const spacing = GAME_WIDTH / (count + 1);
    for (let i = 0; i < count; i += 1) {
      this.spawn(type, spacing * (i + 1), -40 - i * 18, {
        pressure: options.pressure,
        powerUpDrop: options.drops?.find((drop) => drop.enemyIndex === i)?.type,
      });
    }
  }

  update(timeMs: number, deltaMs: number, playerX: number, playerY: number): void {
    const deltaSeconds = deltaMs / 1000;
    for (const child of this.enemies.getChildren()) {
      const enemy = child as EnemySprite;
      const data = enemy.getData('enemy') as EnemyData;
      enemy.y += data.speed * deltaSeconds;

      if (data.type === 'sway') {
        enemy.x = data.originX + Math.sin((timeMs + data.originX * 9) / 450) * 45;
      }
      syncArcadeBody(enemy);

      if (timeMs >= data.nextFireAtMs) {
        this.fire(enemy, data, playerX, playerY);
        data.nextFireAtMs = timeMs + data.fireEveryMs;
      }

      if (enemy.y > 780) {
        enemy.destroy();
      }
    }
  }

  damage(enemy: Phaser.GameObjects.GameObject, amount: number): boolean {
    const data = enemy.getData('enemy') as EnemyData;
    data.hp -= amount;
    if (data.hp <= 0) {
      enemy.destroy();
      return true;
    }
    return false;
  }

  getPoints(enemy: Phaser.GameObjects.GameObject): number {
    return (enemy.getData('enemy') as EnemyData).points;
  }

  getPowerUpDrop(enemy: Phaser.GameObjects.GameObject): PowerUpType | null {
    return (enemy.getData('enemy') as EnemyData).powerUpDrop ?? null;
  }

  clear(): void {
    this.enemies.clear(true, true);
  }

  activeCount(): number {
    return this.enemies.getChildren().length;
  }

  private spawn(
    type: EnemyType,
    x: number,
    y: number,
    options: { pressure?: 'normal' | 'reduced'; powerUpDrop?: PowerUpType },
  ): void {
    const config: Record<EnemyType, { hp: number; speed: number; points: number }> = {
      straight: { hp: STRAIGHT_ENEMY_HP, speed: 80, points: 100 },
      sway: { hp: SWAY_ENEMY_HP, speed: 65, points: 140 },
      heavy: { hp: HEAVY_ENEMY_HP, speed: 42, points: 300 },
    };
    const reducedPressure = options.pressure === 'reduced';
    const size = type === 'heavy' ? 34 : 24;
    const enemy = this.scene.add.sprite(x, y, ENEMY_TEXTURE_KEYS[type]) as EnemySprite;
    playCharacterAnimation(enemy, CHARACTER_ANIMATION_KEYS.enemy[type]);
    this.scene.physics.add.existing(enemy);
    enemy.body.setSize(size, size);
    configureManualArcadeBody(enemy.body);
    enemy.setData('enemy', {
      type,
      hp: config[type].hp,
      points: config[type].points,
      fireEveryMs:
        type === 'heavy'
          ? reducedPressure
            ? FINAL_WAVE_HEAVY_FIRE_INTERVAL_MS
            : DEFAULT_HEAVY_FIRE_INTERVAL_MS
          : REGULAR_ENEMY_FIRE_INTERVAL_MS,
      nextFireAtMs: 800 + Math.random() * 700,
      originX: x,
      speed: config[type].speed,
      powerUpDrop: options.powerUpDrop,
      bulletCount:
        type === 'heavy'
          ? reducedPressure
            ? FINAL_WAVE_HEAVY_BULLET_COUNT
            : DEFAULT_HEAVY_BULLET_COUNT
          : 1,
    } satisfies EnemyData);
    this.enemies.add(enemy);
  }

  private fire(
    enemy: EnemySprite,
    data: EnemyData,
    playerX: number,
    playerY: number,
  ): void {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerX, playerY);
    if (data.type === 'heavy') {
      const spacing = data.bulletCount === 3 ? 0.3 : 0.25;
      const center = (data.bulletCount - 1) / 2;
      for (let i = 0; i < data.bulletCount; i += 1) {
        const offset = (i - center) * spacing;
        this.projectiles.fireEnemyShot(enemy.x, enemy.y, angle + offset, 155);
      }
      return;
    }

    this.projectiles.fireEnemyShot(enemy.x, enemy.y, angle, 185);
  }
}
