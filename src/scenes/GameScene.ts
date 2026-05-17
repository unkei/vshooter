import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_MAX_LIVES,
  PLAYER_MAX_SHOT_LEVEL,
} from '../game/constants';
import { BossController } from '../game/BossController';
import {
  BOSS_DEFEAT_CLEAR_DELAY_MS,
  BOSS_ENTRANCE_DELAY_MS,
} from '../game/bossState';
import { EnemyManager } from '../game/EnemyManager';
import { PlayerController } from '../game/PlayerController';
import { ProjectileManager } from '../game/ProjectileManager';
import type { PowerUpType } from '../game/types';
import { ensureGameTextures } from '../game/visualAssets';
import { getSharedAudioManager } from '../systems/AudioManager';
import { KeyboardReleaseGate } from '../systems/InputGate';
import { normalizeInput, type RawInputState } from '../systems/InputManager';
import { PowerUpDropManager } from '../systems/PowerUpManager';
import { ScoreManager } from '../systems/ScoreManager';
import { createDefaultStage, StageDirector } from '../systems/StageDirector';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export class GameScene extends Phaser.Scene {
  private cursors!: CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private player!: PlayerController;
  private projectiles!: ProjectileManager;
  private enemies!: EnemyManager;
  private boss!: BossController;
  private powerUps!: PowerUpDropManager;
  private score!: ScoreManager;
  private stage!: StageDirector;
  private audio = getSharedAudioManager();
  private startedAtMs: number | null = null;
  private hud!: Phaser.GameObjects.Text;
  private finished = false;
  private clearPending = false;
  private bossEntrancePending = false;
  private keyboardGate!: KeyboardReleaseGate;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.finished = false;
    this.clearPending = false;
    this.bossEntrancePending = false;
    this.startedAtMs = null;
    this.input.keyboard?.resetKeys();
    this.keyboardGate = new KeyboardReleaseGate();
    this.cameras.main.setBackgroundColor(0x050710);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ensureGameTextures(this);
    this.addStarfield();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ENTER') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    void this.audio.start();
    this.projectiles = new ProjectileManager(this);
    this.player = new PlayerController(this);
    this.enemies = new EnemyManager(this, this.projectiles);
    this.boss = new BossController(this, this.projectiles);
    this.powerUps = new PowerUpDropManager(this);
    this.score = new ScoreManager({ comboTimeoutMs: 1800 });
    this.stage = new StageDirector(createDefaultStage());

    this.hud = this.add.text(12, 12, '', {
      fontSize: '16px',
      color: '#ffffff',
    });

    this.physics.add.overlap(
      this.projectiles.playerBullets,
      this.enemies.enemies,
      (bullet, enemy) =>
        this.onEnemyHit(
          bullet as Phaser.Types.Physics.Arcade.GameObjectWithBody,
          enemy as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        ),
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.projectiles.enemyBullets,
      (_player, bullet) =>
        this.onPlayerHit(bullet as Phaser.Types.Physics.Arcade.GameObjectWithBody),
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.enemies.enemies,
      (_player, enemy) =>
        this.onPlayerHit(enemy as Phaser.Types.Physics.Arcade.GameObjectWithBody),
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.powerUps.items,
      (_player, item) =>
        this.onPowerUp(item as Phaser.Types.Physics.Arcade.GameObjectWithBody),
    );
  }

  update(timeMs: number, deltaMs: number): void {
    if (this.finished) {
      return;
    }
    if (this.clearPending) {
      return;
    }
    if (this.startedAtMs === null) {
      this.startedAtMs = timeMs;
    }

    const input = normalizeInput(this.readInput());
    if (this.player.update(input, timeMs, deltaMs)) {
      this.projectiles.firePlayerShot(
        this.player.sprite.x,
        this.player.sprite.y,
        this.player.shotLevel,
      );
      this.audio.play('shot');
    }

    const elapsedMs = timeMs - this.startedAtMs;
    for (const event of this.stage.update(elapsedMs)) {
      this.enemies.spawnWave(event.enemyType, event.count, {
        pressure: event.pressure,
      });
    }

    this.enemies.update(timeMs, deltaMs, this.player.sprite.x, this.player.sprite.y);
    if (this.stage.consumeBossReady(this.enemies.activeCount())) {
      this.startBossEntrance();
    }

    this.boss.update(timeMs, deltaMs);
    this.powerUps.update(timeMs);
    this.projectiles.update();
    this.checkBossHits();
    this.updateHud();
  }

  private readInput(): RawInputState {
    const pointer = this.input.activePointer;
    const pad = this.input.gamepad?.pad1;
    const axisX = pad?.axes[0]?.getValue() ?? 0;
    const axisY = pad?.axes[1]?.getValue() ?? 0;

    const keyboard = this.keyboardGate.filter({
      left: this.cursors.left.isDown || this.keys.A.isDown,
      right: this.cursors.right.isDown || this.keys.D.isDown,
      up: this.cursors.up.isDown || this.keys.W.isDown,
      down: this.cursors.down.isDown || this.keys.S.isDown,
      shoot: this.keys.SPACE.isDown,
      confirm: this.keys.ENTER.isDown,
    });

    return {
      keyboard,
      pointer: {
        active: pointer.isDown,
        x: pointer.x,
        y: pointer.y,
        shoot: pointer.isDown,
        source: pointer.wasTouch ? 'touch' : 'mouse',
      },
      gamepad: {
        axisX,
        axisY,
        shoot: Boolean(
          pad?.buttons[0]?.pressed ||
            pad?.buttons[5]?.pressed ||
            pad?.buttons[7]?.pressed,
        ),
        confirm: Boolean(pad?.buttons[9]?.pressed || pad?.buttons[0]?.pressed),
      },
    };
  }

  private onEnemyHit(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    bullet.destroy();
    const points = this.enemies.getPoints(enemy);
    const defeated = this.enemies.damage(enemy, 1);
    if (!defeated) {
      return;
    }

    this.audio.play('enemyDown');
    this.score.addEnemyDefeat(points, this.time.now);
    const enemyObject = enemy as unknown as { x: number; y: number };
    this.powerUps.maybeDrop(enemyObject.x, enemyObject.y);
  }

  private onPlayerHit(
    threat: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    threat.destroy();
    if (!this.player.damage(this.time.now)) {
      return;
    }

    this.audio.play('damage');
    this.score.registerDamage();
    if (this.player.isDead()) {
      this.finish('gameover');
    }
  }

  private onPowerUp(item: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    const type = item.getData('type') as PowerUpType;
    item.destroy();
    this.audio.play('pickup');

    if (type === 'shot') {
      this.player.upgradeShot(PLAYER_MAX_SHOT_LEVEL);
    } else if (type === 'life') {
      this.player.recoverLife(PLAYER_MAX_LIVES);
    } else {
      this.score.addScoreBonus(500);
    }
  }

  private checkBossHits(): void {
    if (!this.boss.isActive() || this.boss.sprite === null) {
      return;
    }

    this.physics.overlap(
      this.projectiles.playerBullets,
      this.boss.sprite,
      (bullet) => {
        bullet.destroy();
        if (this.boss.damage(3)) {
          this.audio.play('explosion');
          this.projectiles.clearEnemyBullets();
          this.score.addBossDefeat(2500);
          this.scheduleStageClear();
        }
      },
    );
  }

  debugDefeatBoss(): void {
    if (this.finished || this.clearPending) {
      return;
    }

    if (!this.boss.isActive()) {
      this.enemies.clear();
      this.projectiles.clearEnemyBullets();
      this.boss.spawn();
      this.boss.update(this.time.now, 0);
    }

    if (this.boss.damage(Number.MAX_SAFE_INTEGER)) {
      this.audio.play('explosion');
      this.projectiles.clearEnemyBullets();
      this.score.addBossDefeat(2500);
      this.scheduleStageClear();
    }
  }

  debugGameOver(): void {
    if (this.finished || this.clearPending) {
      return;
    }

    this.finish('gameover');
  }

  private scheduleStageClear(): void {
    if (this.clearPending) {
      return;
    }

    this.clearPending = true;
    this.time.delayedCall(BOSS_DEFEAT_CLEAR_DELAY_MS, () => this.finish('clear'));
  }

  private startBossEntrance(): void {
    if (this.bossEntrancePending || this.finished || this.clearPending) {
      return;
    }

    this.bossEntrancePending = true;
    this.audio.play('boss');
    this.projectiles.clearEnemyBullets();

    const warning = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 'WARNING', {
        fontSize: '34px',
        color: '#ff3768',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60);
    const subtext = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.36 + 42, 'BOSS APPROACHING', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(60);

    this.tweens.add({
      targets: [warning, subtext],
      alpha: 0.25,
      duration: 160,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(BOSS_ENTRANCE_DELAY_MS, () => {
      warning.destroy();
      subtext.destroy();
      if (this.finished || this.clearPending) {
        return;
      }

      this.bossEntrancePending = false;
      this.boss.spawn();
      this.cameras.main.shake(180, 0.006);
    });
  }

  private updateHud(): void {
    const snapshot = this.score.snapshot();
    this.hud.setText(
      `LIFE ${this.player.lives}  SHOT ${this.player.shotLevel}  SCORE ${snapshot.score}  COMBO ${snapshot.combo}`,
    );
  }

  private finish(status: 'clear' | 'gameover'): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.input.keyboard?.resetKeys();
    this.audio.stop();
    if (status === 'clear') {
      const bonuses = this.score.addStageClearBonuses();
      this.score.finishRun();
      const snapshot = this.score.snapshot();
      this.scene.start('ClearBonusScene', {
        score: snapshot.score,
        clearBonus: bonuses.clearBonus,
        comboBonus: bonuses.comboBonus,
        maxCombo: snapshot.maxCombo,
        highScore: snapshot.highScore,
      });
      return;
    }

    this.score.finishRun();
    const snapshot = this.score.snapshot();
    this.scene.start('ResultScene', {
      status,
      score: snapshot.score,
      maxCombo: snapshot.maxCombo,
      highScore: snapshot.highScore,
    });
  }

  private addStarfield(): void {
    for (let i = 0; i < 120; i += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.6, 1.7),
        0xffffff,
        Phaser.Math.FloatBetween(0.18, 0.75),
      );
      this.tweens.add({
        targets: star,
        y: GAME_HEIGHT + 10,
        duration: Phaser.Math.Between(4500, 9500),
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          star.y = -10;
          star.x = Phaser.Math.Between(0, GAME_WIDTH);
        },
      });
    }
  }
}
