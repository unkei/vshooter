import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_MAX_LIVES,
  PLAYER_MAX_SHOT_LEVEL,
} from '../game/constants';
import { BossController } from '../game/BossController';
import { EnemyManager } from '../game/EnemyManager';
import { PlayerController } from '../game/PlayerController';
import { ProjectileManager } from '../game/ProjectileManager';
import { syncArcadeBody } from '../game/physics';
import type { PowerUpType } from '../game/types';
import {
  createCharacterAnimations,
  ensureGameTextures,
  PLAYER_TEXTURE_KEY,
  preloadExternalVisualAssets,
} from '../game/visualAssets';
import {
  createPhaserExternalAudioPlayback,
  getSharedAudioManager,
  preloadExternalAudioAssets,
} from '../systems/AudioManager';
import { FreshPressGate, KeyboardReleaseGate } from '../systems/InputGate';
import {
  firstActiveGamepad,
  gamepadAxisValue,
  gamepadConfirmPressed,
  gamepadShotPressed,
} from '../systems/GamepadInput';
import {
  normalizeInput,
  touchPointerTargetOffsetY,
  type RawInputState,
} from '../systems/InputManager';
import { PowerUpDropManager } from '../systems/PowerUpManager';
import { ScoreManager } from '../systems/ScoreManager';
import {
  createStageDefinition,
  StageDefinition,
  StageNumber,
  StageDirector,
} from '../systems/StageDirector';
import { VibrationManager } from '../systems/VibrationManager';
import {
  BOSS_DEFEAT_BODY_DISAPPEAR_DELAY_MS,
  BOSS_ENTRANCE_TRAVEL_MS,
  BOSS_PRE_WARNING_GRACE_MS,
} from '../game/bossState';
import {
  gameplayResultOverlayConfig,
  type GameplayResultStatus,
} from './gameplayResultOverlay';
import {
  CLEAR_WARP_ORIGIN_X,
  CLEAR_WARP_ORIGIN_Y,
  preClearPlayerAlignDurationMs,
} from './clearWarp';
import { arcadeHeadingTextStyle } from './screenTextStyles';
import {
  STAGE_INTRO_WARP_DURATION_MS,
  stageIntroStartY,
} from './stageIntro';
import { buildGameplayHudLine } from './gameHud';
import { viewportPointToGamePoint } from './viewportTouch';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export type GameSceneData = {
  stageNumber?: StageNumber;
  initialScore?: number;
  initialMaxCombo?: number;
};

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
  private stageDefinition: StageDefinition = createStageDefinition(1);
  private vibration = new VibrationManager();
  private audio = getSharedAudioManager();
  private startedAtMs: number | null = null;
  private hud!: Phaser.GameObjects.Text;
  private finished = false;
  private clearPending = false;
  private bossEntrancePending = false;
  private keyboardGate!: KeyboardReleaseGate;
  private activeTouchPointerId: number | null = null;
  private touchOrigin: { x: number; y: number } | null = null;
  private viewportTouch: { id: number; x: number; y: number; active: boolean } | null =
    null;
  private dataFromRun: GameSceneData = {};
  private resultOverlayText: string | null = null;
  private resultOverlayStatus: GameplayResultStatus | null = null;
  private stageIntroPending = false;
  private gameOverReturnTimer: Phaser.Time.TimerEvent | null = null;
  private gameOverKeyboardGate = new FreshPressGate();
  private gameOverPointerGate = new FreshPressGate();
  private gameOverGamepadGate = new FreshPressGate();

  constructor() {
    super('GameScene');
  }

  preload(): void {
    preloadExternalVisualAssets(this);
    preloadExternalAudioAssets(this);
  }

  init(data: GameSceneData = {}): void {
    this.dataFromRun = data;
    this.stageDefinition = createStageDefinition(data.stageNumber ?? 1);
  }

  create(): void {
    this.finished = false;
    this.clearPending = false;
    this.bossEntrancePending = false;
    this.startedAtMs = null;
    this.activeTouchPointerId = null;
    this.touchOrigin = null;
    this.viewportTouch = null;
    this.resultOverlayText = null;
    this.resultOverlayStatus = null;
    this.stageIntroPending = false;
    this.gameOverReturnTimer = null;
    this.gameOverKeyboardGate = new FreshPressGate();
    this.gameOverPointerGate = new FreshPressGate();
    this.gameOverGamepadGate = new FreshPressGate();
    this.input.keyboard?.resetKeys();
    this.keyboardGate = new KeyboardReleaseGate();
    this.cameras.main.setBackgroundColor(0x050710);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ensureGameTextures(this);
    createCharacterAnimations(this);
    this.audio.setExternalPlayback(createPhaserExternalAudioPlayback(this));
    this.addStarfield();
    this.installViewportTouchInput();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ENTER') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    void this.audio.start();
    this.projectiles = new ProjectileManager(this);
    this.player = new PlayerController(this);
    this.startStageIntro();
    this.enemies = new EnemyManager(this, this.projectiles);
    this.boss = new BossController(this, this.projectiles, {
      rushAttack: this.stageDefinition.boss.rushAttack,
      maxHp: this.stageDefinition.boss.maxHp,
    });
    this.powerUps = new PowerUpDropManager(this);
    this.score = new ScoreManager({
      comboTimeoutMs: 1800,
      initialScore: this.dataFromRun.initialScore,
      initialMaxCombo: this.dataFromRun.initialMaxCombo,
    });
    this.stage = new StageDirector(this.stageDefinition.events);

    this.hud = this.add.text(12, 12, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(70);

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

    this.physics.add.overlap(
      this.projectiles.playerBullets,
      this.boss.group,
      (bullet) =>
        this.onBossBulletHit(
          bullet as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        ),
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.boss.group,
      () => this.onPlayerBossHit(),
    );
  }

  update(timeMs: number, deltaMs: number): void {
    if (this.finished) {
      if (this.resultOverlayStatus === 'gameover') {
        this.updateGameOverBackdrop(timeMs, deltaMs);
        this.handleGameOverReturnInput();
      }
      return;
    }
    if (this.clearPending) {
      return;
    }
    if (this.stageIntroPending) {
      this.updateHud();
      return;
    }
    if (this.startedAtMs === null) {
      this.startedAtMs = timeMs;
    }

    const elapsedMs = timeMs - this.startedAtMs!;
    const events = this.stage.update(elapsedMs);
    for (const event of events) {
      if (event.type === 'wave') {
        this.enemies.spawnWave(event.enemyType, event.count, {
          pressure: event.pressure,
          drops: event.drops,
        });
      }
    }

    const eventReady = this.stage.consumeBossReady(this.enemies.activeCount());
    if (eventReady) {
      this.startBossEntrance();
    }

    const rawInput = this.getRawInput();
    const input = normalizeInput({
      ...rawInput,
      keyboard: this.keyboardGate.filter(
        rawInput.keyboard ?? {
          left: false,
          right: false,
          up: false,
          down: false,
          shoot: false,
          confirm: false,
        },
      ),
    });

    const fired = this.player.update(input, timeMs, deltaMs);
    if (fired) {
      this.audio.play('shot');
      this.projectiles.firePlayerShot(
        this.player.sprite.x,
        this.player.sprite.y,
        this.player.shotLevel,
      );
    }

    this.enemies.update(
      timeMs,
      deltaMs,
      this.player.sprite.x,
      this.player.sprite.y,
    );
    this.boss.update(timeMs, deltaMs);
    this.projectiles.update();
    this.powerUps.update(timeMs, deltaMs);
    this.updateHud();
  }

  private getRawInput(): RawInputState {
    const pad = firstActiveGamepad(
      this.input.gamepad?.pad1,
      navigator.getGamepads?.() ?? [],
    );
    const activePointer = this.input.activePointer;
    const pointerIsTouch =
      activePointer.isDown &&
      this.activeTouchPointerId !== null &&
      activePointer.id === this.activeTouchPointerId;
    const viewportTouch = this.viewportTouch?.active === true ? this.viewportTouch : null;
    const isTouch = viewportTouch !== null || pointerIsTouch;
    const touchX = viewportTouch?.x ?? activePointer.x;
    const touchY = viewportTouch?.y ?? activePointer.y;

    if (activePointer.isDown && this.activeTouchPointerId === null) {
      this.activeTouchPointerId = activePointer.id;
      this.touchOrigin = { x: activePointer.x, y: activePointer.y };
    } else if (!activePointer.isDown && this.activeTouchPointerId !== null && viewportTouch === null) {
      this.activeTouchPointerId = null;
      this.touchOrigin = null;
    }
    if (viewportTouch !== null && this.touchOrigin === null) {
      this.touchOrigin = { x: viewportTouch.x, y: viewportTouch.y };
    }

    return {
      keyboard: {
        left: this.cursors.left.isDown || this.keys.A.isDown,
        right: this.cursors.right.isDown || this.keys.D.isDown,
        up: this.cursors.up.isDown || this.keys.W.isDown,
        down: this.cursors.down.isDown || this.keys.S.isDown,
        shoot: this.cursors.space.isDown || this.keys.SPACE.isDown,
        confirm: this.keys.ENTER.isDown,
      },
      pointer: {
        active: isTouch,
        x: touchX,
        y: touchY,
        shoot: isTouch,
        source: 'touch',
        mode: 'direct',
        originX: this.touchOrigin?.x,
        originY: this.touchOrigin?.y,
        targetOffsetY: touchPointerTargetOffsetY({
          displayHeightPx: this.game.canvas.getBoundingClientRect().height,
          gameHeight: GAME_HEIGHT,
        }),
      },
      gamepad: {
        axisX: gamepadAxisValue(pad, 0),
        axisY: gamepadAxisValue(pad, 1),
        shoot: gamepadShotPressed(pad),
        confirm: gamepadConfirmPressed(pad),
      },
    };
  }

  private installViewportTouchInput(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('pointerdown', this.handleViewportPointerDown, {
      passive: false,
    });
    window.addEventListener('pointermove', this.handleViewportPointerMove, {
      passive: false,
    });
    window.addEventListener('pointerup', this.handleViewportPointerUp);
    window.addEventListener('pointercancel', this.handleViewportPointerUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('pointerdown', this.handleViewportPointerDown);
      window.removeEventListener('pointermove', this.handleViewportPointerMove);
      window.removeEventListener('pointerup', this.handleViewportPointerUp);
      window.removeEventListener('pointercancel', this.handleViewportPointerUp);
    });
  }

  private readonly handleViewportPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') {
      return;
    }
    this.setViewportTouch(event);
  };

  private readonly handleViewportPointerMove = (event: PointerEvent): void => {
    if (this.viewportTouch?.active !== true || event.pointerId !== this.viewportTouch.id) {
      return;
    }
    this.setViewportTouch(event);
  };

  private readonly handleViewportPointerUp = (event: PointerEvent): void => {
    if (this.viewportTouch?.id !== event.pointerId) {
      return;
    }
    this.viewportTouch = null;
    this.activeTouchPointerId = null;
    this.touchOrigin = null;
  };

  private setViewportTouch(event: PointerEvent): void {
    const rect = this.game.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const point = viewportPointToGamePoint(
      { x: event.clientX, y: event.clientY },
      rect,
    );
    this.viewportTouch = {
      id: event.pointerId,
      x: point.x,
      y: point.y,
      active: true,
    };
    event.preventDefault();
  }

  private onEnemyHit(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    bullet.destroy();
    const points = this.enemies.getPoints(enemy);
    const powerUpDrop = this.enemies.getPowerUpDrop(enemy);
    const defeated = this.enemies.damage(enemy, 1);
    if (!defeated) {
      return;
    }

    this.audio.play('enemyDown');
    this.score.addEnemyDefeat(points, this.time.now);
    if (powerUpDrop !== null) {
      const enemyObject = enemy as unknown as { x: number; y: number };
      this.powerUps.drop(powerUpDrop, enemyObject.x, enemyObject.y);
    }
  }

  private onPlayerHit(
    threat: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.finished) {
      return;
    }

    threat.destroy();
    if (!this.player.damage(this.time.now)) {
      return;
    }

    this.emitDamageSmoke(this.player.sprite.x, this.player.sprite.y);
    this.audio.play('damage');
    this.vibration.damage(this.player.lives, PLAYER_MAX_LIVES);
    this.score.registerDamage();
    if (this.player.isDead()) {
      this.finish('gameover');
    }
  }

  private onPowerUp(item: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    if (this.finished) {
      return;
    }

    const type = item.getData('type') as PowerUpType;
    item.destroy();
    this.audio.play('pickup');
    this.vibration.powerUp();

    if (type === 'shot') {
      this.player.upgradeShot(PLAYER_MAX_SHOT_LEVEL);
    } else if (type === 'life') {
      this.player.recoverLife(PLAYER_MAX_LIVES);
    } else {
      this.score.addScoreBonus(500);
    }
  }

  private onBossBulletHit(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (!this.boss.isAttackable()) {
      return;
    }

    bullet.destroy();
    this.audio.play('bossHit');
    if (this.boss.damage(3)) {
      this.audio.play('explosion');
      this.vibration.bossDefeat();
      this.projectiles.clearPlayerBullets();
      this.projectiles.clearEnemyBullets();
      this.score.addBossDefeat(2500);
      this.scheduleStageClear();
    }
  }

  private onPlayerBossHit(): void {
    if (this.finished || !this.boss.isAttackable()) {
      return;
    }

    if (!this.player.damage(this.time.now)) {
      return;
    }

    this.emitDamageSmoke(this.player.sprite.x, this.player.sprite.y);
    this.audio.play('damage');
    this.vibration.damage(this.player.lives, PLAYER_MAX_LIVES);
    this.score.registerDamage();
    if (this.player.isDead()) {
      this.finish('gameover');
    }
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
      this.audio.play('bossHit');
      this.audio.play('explosion');
      this.vibration.bossDefeat();
      this.projectiles.clearPlayerBullets();
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

  debugSpawnBoss(): void {
    if (this.finished || this.clearPending) {
      return;
    }

    this.enemies.clear();
    this.projectiles.clearPlayerBullets();
    this.projectiles.clearEnemyBullets();
    this.boss.spawn();
    this.boss.update(this.time.now, 0);
  }

  debugDamageBoss(amount = 1): boolean {
    if (this.finished || this.clearPending || !this.boss.isActive()) {
      return false;
    }

    return this.boss.damage(amount);
  }

  debugBossVisualState(): ReturnType<BossController['debugVisualState']> {
    return this.boss.debugVisualState();
  }

  debugPlayerState(): { x: number; y: number; visible: boolean } | null {
    if (!this.player?.sprite) {
      return null;
    }
    return {
      x: this.player.sprite.x,
      y: this.player.sprite.y,
      visible: this.player.sprite.visible,
    };
  }

  debugBackdropState(): {
    playerVisible: boolean;
    enemyCount: number;
    firstEnemyY: number | null;
    enemyBulletCount: number;
  } | null {
    const firstEnemy = this.enemies.enemies.getChildren()[0] as
      | Phaser.GameObjects.Sprite
      | undefined;
    const firstEnemyY = firstEnemy !== undefined ? firstEnemy.y : null;

    return {
      playerVisible: this.player.sprite.visible,
      enemyCount: this.enemies.activeCount(),
      firstEnemyY,
      enemyBulletCount: this.projectiles.enemyBullets.getChildren().length,
    };
  }

  debugResultOverlayText(): string | null {
    return this.resultOverlayText;
  }

  private scheduleStageClear(): void {
    if (this.clearPending) {
      return;
    }

    this.clearPending = true;
    this.projectiles.clearPlayerBullets();
    this.time.delayedCall(BOSS_DEFEAT_BODY_DISAPPEAR_DELAY_MS, () => {
      const durationMs = this.movePlayerToClearWarpOrigin();
      this.time.delayedCall(durationMs, () => this.finish('clear'));
    });
  }

  private movePlayerToClearWarpOrigin(): number {
    const player = this.player.sprite;
    const durationMs = preClearPlayerAlignDurationMs(player.x, player.y);
    this.tweens.killTweensOf(player);
    player.setVisible(true);
    player.setAlpha(1);
    player.setScale(1);

    const body = player.body as Phaser.Physics.Arcade.Body | null;
    body?.setVelocity(0, 0);

    this.tweens.add({
      targets: player,
      x: CLEAR_WARP_ORIGIN_X,
      y: CLEAR_WARP_ORIGIN_Y,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: () => syncArcadeBody(player),
      onComplete: () => {
        player.x = CLEAR_WARP_ORIGIN_X;
        player.y = CLEAR_WARP_ORIGIN_Y;
        syncArcadeBody(player);
      },
    });
    return durationMs;
  }

  private startBossEntrance(): void {
    if (this.bossEntrancePending || this.finished || this.clearPending) {
      return;
    }

    this.bossEntrancePending = true;
    this.projectiles.clearPlayerBullets();

    this.time.delayedCall(BOSS_PRE_WARNING_GRACE_MS, () => {
      if (this.finished || this.clearPending) {
        return;
      }

      this.audio.play('boss');
      this.vibration.bossEntrance();
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

      this.boss.spawn();
      this.cameras.main.shake(180, 0.006);

      this.time.delayedCall(BOSS_ENTRANCE_TRAVEL_MS, () => {
        warning.destroy();
        subtext.destroy();
        if (this.finished || this.clearPending) {
          return;
        }

        this.bossEntrancePending = false;
      });
    });
  }

  private updateHud(): void {
    const snapshot = this.score.snapshot();
    this.hud.setText(
      buildGameplayHudLine({
        stageNumber: this.stageDefinition.stageNumber,
        lives: this.player.lives,
        maxLives: PLAYER_MAX_LIVES,
        shotLevel: this.player.shotLevel,
        score: snapshot.score,
        combo: snapshot.combo,
      }),
    );
  }

  private emitDamageSmoke(x: number, y: number): void {
    const smokeColors = [0xd8d2d8, 0xff9fb4, 0x8d8796];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const distance = Phaser.Math.Between(8, 18);
      const smoke = this.add
        .circle(
          x + Math.cos(angle) * distance,
          y + Math.sin(angle) * distance,
          Phaser.Math.Between(4, 8),
          smokeColors[i % smokeColors.length],
          0.72,
        )
        .setDepth(45);
      this.tweens.add({
        targets: smoke,
        x: smoke.x + Math.cos(angle) * Phaser.Math.Between(18, 34),
        y: smoke.y + Math.sin(angle) * Phaser.Math.Between(18, 34) + 8,
        alpha: 0,
        scale: 1.8,
        duration: 450,
        ease: 'Sine.easeOut',
        onComplete: () => smoke.destroy(),
      });
    }
  }

  private finish(status: GameplayResultStatus): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.input.keyboard?.resetKeys();
    this.audio.stop();
    this.projectiles.clearPlayerBullets();
    if (status === 'clear') {
      this.projectiles.clearEnemyBullets();
    }
    const overlay = gameplayResultOverlayConfig(status);
    this.showResultOverlay(overlay.text, overlay.color);

    if (status === 'clear') {
      const bonuses = this.score.addStageClearBonuses();
      const snapshot = this.score.snapshot();
      if (this.stageDefinition.nextStageNumber === null) {
        this.score.finishRun();
      }
      this.time.delayedCall(overlay.nextDelayMs, () => {
        this.scene.start('ClearBonusScene', {
          score: snapshot.score,
          clearBonus: bonuses.clearBonus,
          comboBonus: bonuses.comboBonus,
          maxCombo: snapshot.maxCombo,
          highScore:
            this.stageDefinition.nextStageNumber === null
              ? this.score.snapshot().highScore
              : snapshot.highScore,
          nextStageNumber: this.stageDefinition.nextStageNumber,
        });
      });
      return;
    }

    this.hidePlayerForGameOver();
    this.score.finishRun();
    this.gameOverKeyboardGate = new FreshPressGate();
    this.gameOverPointerGate = new FreshPressGate();
    this.gameOverGamepadGate = new FreshPressGate();
    this.gameOverReturnTimer = this.time.delayedCall(overlay.nextDelayMs, () =>
      this.returnToTitleFromGameOver(),
    );
  }

  private showResultOverlay(text: string, color: string): void {
    this.resultOverlayText = text;
    this.resultOverlayStatus = text === 'GAME OVER' ? 'gameover' : 'clear';
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02030a, 0.48)
      .setDepth(85);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, text, arcadeHeadingTextStyle(color, '46px'))
      .setOrigin(0.5)
      .setDepth(86);
  }

  private hidePlayerForGameOver(): void {
    this.player.sprite.setVisible(false);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
    }
  }

  private updateGameOverBackdrop(timeMs: number, deltaMs: number): void {
    this.enemies.update(timeMs, deltaMs, this.player.sprite.x, this.player.sprite.y);
    this.boss.update(timeMs, deltaMs);
    this.powerUps.update(timeMs, deltaMs);
    this.projectiles.update();
    this.updateHud();
  }

  private startStageIntro(): void {
    this.stageIntroPending = true;
    const targetY = this.player.sprite.y;
    this.player.sprite.y = stageIntroStartY(targetY);
    this.player.sprite.setAlpha(0.35);
    this.player.sprite.setScale(0.72, 1.25);
    syncArcadeBody(this.player.sprite);

    const warp = this.add
      .ellipse(this.player.sprite.x, targetY + 18, 72, 18, 0x6ffcff, 0.14)
      .setStrokeStyle(3, 0xffffff, 0.65)
      .setDepth(18);
    this.tweens.add({
      targets: warp,
      alpha: 0,
      scaleX: 1.85,
      scaleY: 1.5,
      duration: STAGE_INTRO_WARP_DURATION_MS,
      ease: 'Sine.easeOut',
      onComplete: () => warp.destroy(),
    });
    this.tweens.add({
      targets: this.player.sprite,
      y: targetY,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: STAGE_INTRO_WARP_DURATION_MS,
      ease: 'Cubic.easeOut',
      onUpdate: () => syncArcadeBody(this.player.sprite),
      onComplete: () => {
        this.player.sprite.y = targetY;
        this.player.sprite.setAlpha(1);
        this.player.sprite.setScale(1);
        syncArcadeBody(this.player.sprite);
        this.stageIntroPending = false;
      },
    });
  }

  private handleGameOverReturnInput(): void {
    const pad = firstActiveGamepad(
      this.input.gamepad?.pad1,
      navigator.getGamepads?.() ?? [],
    );
    const keyboardConfirm = this.keys.ENTER.isDown;
    const pointerConfirm = this.input.activePointer.isDown;
    const gamepadConfirm = gamepadConfirmPressed(pad);

    if (
      this.gameOverKeyboardGate.accepts(keyboardConfirm) ||
      this.gameOverPointerGate.accepts(pointerConfirm) ||
      this.gameOverGamepadGate.accepts(gamepadConfirm)
    ) {
      this.returnToTitleFromGameOver();
    }
  }

  private returnToTitleFromGameOver(): void {
    this.gameOverReturnTimer?.remove(false);
    this.gameOverReturnTimer = null;
    getSharedAudioManager().stop();
    this.input.keyboard?.resetKeys();
    this.scene.start('TitleScene');
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
