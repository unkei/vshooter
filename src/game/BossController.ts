import Phaser from 'phaser';
import { GAME_WIDTH } from './constants';
import { syncArcadeBody } from './physics';
import type { ProjectileManager } from './ProjectileManager';

type BossSprite = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

export class BossController {
  sprite: BossSprite | null = null;
  private hp = 0;
  private readonly maxHp = 280;
  private nextFireAtMs = 0;
  private healthBar: Phaser.GameObjects.Graphics | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly projectiles: ProjectileManager,
  ) {}

  spawn(): void {
    if (this.sprite !== null) {
      return;
    }

    this.hp = this.maxHp;
    this.sprite = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      -70,
      112,
      54,
      0xff3768,
      1,
    ) as BossSprite;
    this.sprite.setStrokeStyle(3, 0xffffff, 0.9);
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(112, 54);
    this.healthBar = this.scene.add.graphics();
  }

  update(timeMs: number, deltaMs: number): void {
    if (this.sprite === null) {
      return;
    }

    if (this.sprite.y < 95) {
      this.sprite.y += 40 * (deltaMs / 1000);
      syncArcadeBody(this.sprite);
    } else {
      this.sprite.x = GAME_WIDTH / 2 + Math.sin(timeMs / 900) * 120;
      syncArcadeBody(this.sprite);
    }

    if (timeMs >= this.nextFireAtMs && this.sprite.y > 60) {
      const phase = this.hp / this.maxHp > 0.5 ? 0 : 1;
      this.projectiles.fireRadialBurst(
        this.sprite.x,
        this.sprite.y + 28,
        phase === 0 ? 14 : 22,
        phase === 0 ? 140 : 170,
        timeMs / 700,
      );
      this.nextFireAtMs = timeMs + (phase === 0 ? 850 : 620);
    }

    this.drawHealthBar();
  }

  damage(amount: number): boolean {
    if (this.sprite === null) {
      return false;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.sprite.destroy();
      this.sprite = null;
      this.healthBar?.clear();
      return true;
    }
    return false;
  }

  isActive(): boolean {
    return this.sprite !== null;
  }

  private drawHealthBar(): void {
    if (this.healthBar === null) {
      return;
    }

    const width = 340;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.healthBar.clear();
    this.healthBar.fillStyle(0x1b2035, 1);
    this.healthBar.fillRect((GAME_WIDTH - width) / 2, 40, width, 8);
    this.healthBar.fillStyle(0xff3768, 1);
    this.healthBar.fillRect((GAME_WIDTH - width) / 2, 40, width * ratio, 8);
  }
}
