import Phaser from 'phaser';
import { GAME_WIDTH } from './constants';
import { BOSS_MAX_HP, configureBossBody, isRenderableBossSprite } from './bossState';
import { syncArcadeBody } from './physics';
import type { ProjectileManager } from './ProjectileManager';

type BossSprite = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

export class BossController {
  sprite: BossSprite | null = null;
  private hp = 0;
  private readonly maxHp = BOSS_MAX_HP;
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
    this.createSprite();
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(30);
  }

  update(timeMs: number, _deltaMs: number): void {
    if (this.hp <= 0) {
      return;
    }

    if (!isRenderableBossSprite(this.sprite)) {
      this.createSprite();
    }

    if (this.sprite === null) {
      return;
    }

    this.sprite.y = 120 + Math.sin(timeMs / 1200) * 12;
    this.sprite.x = GAME_WIDTH / 2 + Math.sin(timeMs / 900) * 120;
    syncArcadeBody(this.sprite);

    if (timeMs >= this.nextFireAtMs) {
      const phase = this.hp / this.maxHp > 0.5 ? 0 : 1;
      this.projectiles.fireRadialBurst(
        this.sprite.x,
        this.sprite.y + 28,
        phase === 0 ? 12 : 18,
        phase === 0 ? 120 : 145,
        timeMs / 700,
      );
      this.nextFireAtMs = timeMs + (phase === 0 ? 1000 : 780);
    }

    this.drawHealthBar();
  }

  damage(amount: number): boolean {
    if (this.hp <= 0) {
      return false;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.sprite?.destroy();
      this.sprite = null;
      this.healthBar?.clear();
      return true;
    }
    return false;
  }

  isActive(): boolean {
    return this.hp > 0;
  }

  private createSprite(): void {
    this.sprite?.destroy();
    this.sprite = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      120,
      136,
      64,
      0xff3768,
      1,
    ) as BossSprite;
    this.sprite.setStrokeStyle(3, 0xffffff, 0.9);
    this.sprite.setDepth(20);
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(136, 64);
    configureBossBody(this.sprite.body);
    syncArcadeBody(this.sprite);
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
    this.healthBar.lineStyle(1, 0xffffff, 0.8);
    this.healthBar.strokeRect((GAME_WIDTH - width) / 2, 40, width, 8);
  }
}
