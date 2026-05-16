import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { syncArcadeBody } from './physics';

type Projectile = Phaser.GameObjects.Arc & {
  body: Phaser.Physics.Arcade.Body;
};

export class ProjectileManager {
  readonly playerBullets: Phaser.Physics.Arcade.Group;
  readonly enemyBullets: Phaser.Physics.Arcade.Group;

  constructor(private readonly scene: Phaser.Scene) {
    this.playerBullets = scene.physics.add.group();
    this.enemyBullets = scene.physics.add.group();
  }

  firePlayerShot(x: number, y: number, shotLevel: number): void {
    const offsets = shotLevel === 1 ? [0] : [-10, 10];
    for (const offset of offsets) {
      this.createBullet(this.playerBullets, x + offset, y - 18, 0, -560, 0x6ffcff);
    }
    if (shotLevel >= 3) {
      this.createBullet(this.playerBullets, x - 16, y - 12, -90, -500, 0x6ffcff);
      this.createBullet(this.playerBullets, x + 16, y - 12, 90, -500, 0x6ffcff);
    }
    if (shotLevel >= 4) {
      this.createBullet(this.playerBullets, x, y - 24, 0, -680, 0xffffff);
    }
  }

  fireEnemyShot(x: number, y: number, angleRad: number, speed: number): void {
    this.createBullet(
      this.enemyBullets,
      x,
      y,
      Math.cos(angleRad) * speed,
      Math.sin(angleRad) * speed,
      0xff4fd8,
    );
  }

  fireRadialBurst(
    x: number,
    y: number,
    count: number,
    speed: number,
    angleOffset = 0,
  ): void {
    for (let i = 0; i < count; i += 1) {
      this.fireEnemyShot(x, y, angleOffset + (Math.PI * 2 * i) / count, speed);
    }
  }

  update(): void {
    this.moveGroup(this.playerBullets);
    this.moveGroup(this.enemyBullets);
    this.killOutOfBounds(this.playerBullets);
    this.killOutOfBounds(this.enemyBullets);
  }

  clearEnemyBullets(): void {
    this.enemyBullets.clear(true, true);
  }

  private createBullet(
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    color: number,
  ): void {
    const bullet = this.scene.add.circle(x, y, 4, color, 1) as Projectile;
    bullet.setStrokeStyle(1, 0xffffff, 0.75);
    bullet.setData('velocity', { x: velocityX, y: velocityY });
    this.scene.physics.add.existing(bullet);
    bullet.body.setCircle(4);
    bullet.body.setVelocity(velocityX, velocityY);
    group.add(bullet);
  }

  private moveGroup(group: Phaser.Physics.Arcade.Group): void {
    const deltaSeconds = this.scene.game.loop.delta / 1000;
    for (const child of group.getChildren()) {
      const object = child as Projectile;
      const velocity = object.getData('velocity') as { x: number; y: number };
      object.x += velocity.x * deltaSeconds;
      object.y += velocity.y * deltaSeconds;
      syncArcadeBody(object);
    }
  }

  private killOutOfBounds(group: Phaser.Physics.Arcade.Group): void {
    for (const child of group.getChildren()) {
      const object = child as Phaser.GameObjects.GameObject & {
        x: number;
        y: number;
        destroy: () => void;
      };
      if (
        object.x < -32 ||
        object.x > GAME_WIDTH + 32 ||
        object.y < -32 ||
        object.y > GAME_HEIGHT + 32
      ) {
        object.destroy();
      }
    }
  }
}
