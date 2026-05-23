import Phaser from 'phaser';
import { GAME_WIDTH } from './constants';
import {
  BOSS_HIT_FLASH_DURATION_MS,
  BOSS_HIT_FLASH_OVERLAY_ALPHA,
  BOSS_MAX_HP,
  BOSS_DEFEAT_SPRITE_DEPTH,
  BOSS_DEFEAT_SPRITE_DESTROY_DELAY_MS,
  configureBossBody,
  createBossDefeatBursts,
  disableBossBody,
  isRenderableBossSprite,
  shouldStartBossHitFlash,
} from './bossState';
import { syncArcadeBody } from './physics';
import type { ProjectileManager } from './ProjectileManager';
import {
  BOSS_TEXTURE_KEY,
  CHARACTER_ANIMATION_KEYS,
  playCharacterAnimation,
} from './visualAssets';

type BossSprite = Phaser.GameObjects.Sprite & {
  body: Phaser.Physics.Arcade.Body;
};

export class BossController {
  sprite: BossSprite | null = null;
  private hitFlashOverlay: Phaser.GameObjects.Sprite | null = null;
  private defeatBody: Phaser.GameObjects.Sprite | null = null;
  private hp = 0;
  private readonly maxHp = BOSS_MAX_HP;
  private nextFireAtMs = 0;
  private healthBar: Phaser.GameObjects.Graphics | null = null;
  private defeatStarted = false;
  private hitFlashUntilMs = 0;
  private lastHitFlashStartedAtMs = -Infinity;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly projectiles: ProjectileManager,
  ) {}

  spawn(): void {
    if (this.sprite !== null) {
      return;
    }

    this.hp = this.maxHp;
    this.defeatStarted = false;
    this.hitFlashUntilMs = 0;
    this.lastHitFlashStartedAtMs = -Infinity;
    this.createSprite();
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(30);
  }

  update(timeMs: number, _deltaMs: number): void {
    if (this.defeatStarted) {
      return;
    }

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
    this.lockVisualState();

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
      this.hp = 0;
      this.startDefeatReaction();
      return true;
    }
    const timeMs = this.scene.time.now;
    if (shouldStartBossHitFlash(this.lastHitFlashStartedAtMs, timeMs)) {
      this.lastHitFlashStartedAtMs = timeMs;
      this.hitFlashUntilMs = timeMs + BOSS_HIT_FLASH_DURATION_MS;
    }
    this.lockVisualState();
    return false;
  }

  isActive(): boolean {
    return this.hp > 0 && !this.defeatStarted;
  }

  debugVisualState(): {
    exists: boolean;
    visible: boolean;
    alpha: number;
    depth: number;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    flashActive: boolean;
    defeatBodyVisible: boolean;
    flashOverlay: {
      visible: boolean;
      alpha: number;
      x: number;
      y: number;
    } | null;
  } | null {
    const visualBody = this.defeatBody ?? this.sprite;
    if (visualBody === null) {
      return null;
    }

    return {
      exists: true,
      visible: visualBody.visible,
      alpha: visualBody.alpha,
      depth: visualBody.depth,
      x: visualBody.x,
      y: visualBody.y,
      scaleX: visualBody.scaleX,
      scaleY: visualBody.scaleY,
      flashActive: this.scene.time.now < this.hitFlashUntilMs,
      defeatBodyVisible: this.defeatBody?.visible === true,
      flashOverlay:
        this.hitFlashOverlay === null
          ? null
          : {
              visible: this.hitFlashOverlay.visible,
              alpha: this.hitFlashOverlay.alpha,
              x: this.hitFlashOverlay.x,
              y: this.hitFlashOverlay.y,
            },
    };
  }

  private createSprite(): void {
    this.sprite?.destroy();
    this.hitFlashOverlay?.destroy();
    this.defeatBody?.destroy();
    this.defeatBody = null;
    this.sprite = this.scene.add.sprite(
      GAME_WIDTH / 2,
      120,
      BOSS_TEXTURE_KEY,
    ) as BossSprite;
    playCharacterAnimation(this.sprite, CHARACTER_ANIMATION_KEYS.boss);
    this.sprite.setDepth(20);
    this.hitFlashOverlay = this.scene.add.sprite(
      this.sprite.x,
      this.sprite.y,
      BOSS_TEXTURE_KEY,
    );
    this.hitFlashOverlay.setDepth(21);
    this.hitFlashOverlay.setTintFill(0xffffff);
    this.hitFlashOverlay.setAlpha(0);
    this.hitFlashOverlay.setVisible(false);
    this.lockVisualState();
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(88, 116);
    configureBossBody(this.sprite.body);
    syncArcadeBody(this.sprite);
  }

  private lockVisualState(): void {
    if (this.sprite === null || this.defeatStarted) {
      return;
    }

    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.sprite.clearTint();
    this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
    this.sprite.setScale(1);

    if (this.hitFlashOverlay === null) {
      return;
    }

    this.hitFlashOverlay.setPosition(this.sprite.x, this.sprite.y);
    this.hitFlashOverlay.setAngle(this.sprite.angle);
    this.hitFlashOverlay.setScale(this.sprite.scaleX, this.sprite.scaleY);
    this.hitFlashOverlay.setBlendMode(Phaser.BlendModes.ADD);
    if (this.scene.time.now < this.hitFlashUntilMs) {
      this.hitFlashOverlay.setVisible(true);
      this.hitFlashOverlay.setAlpha(BOSS_HIT_FLASH_OVERLAY_ALPHA);
    } else {
      this.hitFlashOverlay.setAlpha(0);
      this.hitFlashOverlay.setVisible(false);
    }
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

  private startDefeatReaction(): void {
    if (this.defeatStarted) {
      return;
    }

    this.defeatStarted = true;
    this.healthBar?.clear();
    this.projectiles.clearEnemyBullets();
    this.hitFlashOverlay?.destroy();
    this.hitFlashOverlay = null;

    if (this.sprite === null) {
      return;
    }

    const { x, y, angle, scaleX, scaleY } = this.sprite;
    disableBossBody(this.sprite.body);
    this.sprite.destroy();
    this.sprite = null;

    this.defeatBody = this.scene.add.sprite(x, y, BOSS_TEXTURE_KEY);
    playCharacterAnimation(this.defeatBody, CHARACTER_ANIMATION_KEYS.boss);
    this.defeatBody.setDepth(BOSS_DEFEAT_SPRITE_DEPTH);
    this.defeatBody.setVisible(true);
    this.defeatBody.setAlpha(1);
    this.defeatBody.clearTint();
    this.defeatBody.setBlendMode(Phaser.BlendModes.NORMAL);
    this.defeatBody.setAngle(angle);
    this.defeatBody.setScale(scaleX, scaleY);
    this.scene.tweens.add({
      targets: this.defeatBody,
      angle: 18,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: BOSS_DEFEAT_SPRITE_DESTROY_DELAY_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.defeatBody?.destroy();
        this.defeatBody = null;
      },
    });

    for (const burst of createBossDefeatBursts(x, y)) {
      this.scene.time.delayedCall(burst.delayMs, () => {
        this.createDefeatBurst(burst.x, burst.y, burst.radius);
      });
    }
  }

  private createDefeatBurst(x: number, y: number, radius: number): void {
    const ring = this.scene.add.circle(x, y, 8, 0xfff27a, 0.22);
    ring.setStrokeStyle(3, 0xffffff, 0.95);
    ring.setDepth(35);
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      radius,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
