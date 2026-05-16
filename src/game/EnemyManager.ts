import Phaser from 'phaser';
import { GAME_WIDTH } from './constants';
import type { EnemyType } from './types';
import type { ProjectileManager } from './ProjectileManager';

type EnemySprite = Phaser.GameObjects.Rectangle & {
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
};

export class EnemyManager {
  readonly enemies: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly projectiles: ProjectileManager,
  ) {
    this.enemies = scene.physics.add.group();
  }

  spawnWave(type: EnemyType, count: number): void {
    const spacing = GAME_WIDTH / (count + 1);
    for (let i = 0; i < count; i += 1) {
      this.spawn(type, spacing * (i + 1), -40 - i * 18);
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
      enemy.body.updateFromGameObject();

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

  private spawn(type: EnemyType, x: number, y: number): void {
    const config: Record<EnemyType, { hp: number; speed: number; points: number }> = {
      straight: { hp: 2, speed: 80, points: 100 },
      sway: { hp: 3, speed: 65, points: 140 },
      heavy: { hp: 8, speed: 42, points: 300 },
    };
    const color: Record<EnemyType, number> = {
      straight: 0xff4f8b,
      sway: 0xffd24f,
      heavy: 0xa66bff,
    };
    const size = type === 'heavy' ? 34 : 24;
    const enemy = this.scene.add.rectangle(x, y, size, size, color[type], 1) as EnemySprite;
    enemy.setStrokeStyle(2, 0xffffff, 0.8);
    this.scene.physics.add.existing(enemy);
    enemy.body.setVelocityY(config[type].speed);
    enemy.body.setSize(size, size);
    enemy.setData('enemy', {
      type,
      hp: config[type].hp,
      points: config[type].points,
      fireEveryMs: type === 'heavy' ? 900 : 1300,
      nextFireAtMs: 800 + Math.random() * 700,
      originX: x,
      speed: config[type].speed,
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
      this.projectiles.fireRadialBurst(enemy.x, enemy.y, 10, 135, angle);
      return;
    }

    this.projectiles.fireEnemyShot(enemy.x, enemy.y, angle, 185);
  }
}
