import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import {
  CHARACTER_ANIMATION_KEYS,
  PLAYER_TEXTURE_KEY,
  createCharacterAnimations,
  ensureGameTextures,
  playCharacterAnimation,
  preloadExternalVisualAssets,
} from '../game/visualAssets';
import {
  createPhaserExternalAudioPlayback,
  getSharedAudioManager,
  preloadExternalAudioAssets,
} from '../systems/AudioManager';
import { VibrationManager } from '../systems/VibrationManager';
import type { StageNumber } from '../systems/StageDirector';
import { buildClearBonusLines } from './clearBonusDisplay';
import {
  CLEAR_WARP_RING_FADE_IN_DELAYS_MS,
  CLEAR_WARP_RING_FADE_IN_DURATION_MS,
  CLEAR_WARP_RING_EXPAND_DURATION_MS,
  CLEAR_WARP_RING_PASS_DELAYS_MS,
  CLEAR_WARP_RING_SHRINK_FADE_DURATION_MS,
  CLEAR_WARP_GATE_FADE_DURATION_MS,
  CLEAR_WARP_GATE_FADE_START_MS,
  CLEAR_BONUS_ROUTE_DELAY_MS,
  CLEAR_WARP_PLAYER_DELAY_MS,
  CLEAR_WARP_PLAYER_DURATION_MS,
} from './clearBonusTiming';
import { CLEAR_WARP_ORIGIN_X, CLEAR_WARP_ORIGIN_Y } from './clearWarp';
import { clearBonusNextScene } from './clearBonusRoute';
import { arcadeHeadingTextStyle } from './screenTextStyles';

export type ClearBonusSceneData = {
  score: number;
  clearBonus: number;
  comboBonus: number;
  maxCombo: number;
  highScore: number;
  nextStageNumber?: StageNumber | null;
};

export class ClearBonusScene extends Phaser.Scene {
  private vibration = new VibrationManager();
  private dataFromRun: ClearBonusSceneData = {
    score: 0,
    clearBonus: 0,
    comboBonus: 0,
    maxCombo: 0,
    highScore: 0,
    nextStageNumber: null,
  };

  constructor() {
    super('ClearBonusScene');
  }

  init(data: ClearBonusSceneData): void {
    this.dataFromRun = data;
  }

  preload(): void {
    preloadExternalVisualAssets(this);
    preloadExternalAudioAssets(this);
  }

  create(): void {
    this.input.keyboard?.resetKeys();
    this.cameras.main.setBackgroundColor(0x050710);
    const audio = getSharedAudioManager();
    audio.setExternalPlayback(createPhaserExternalAudioPlayback(this));
    void audio.start('clear');
    ensureGameTextures(this);
    createCharacterAnimations(this);
    this.addStarfield();

    this.add
      .text(GAME_WIDTH / 2, 130, 'CLEAR BONUS', arcadeHeadingTextStyle('#6ffcff'))
      .setOrigin(0.5);

    const bonusCounter = {
      clearBonus: 0,
      comboBonus: 0,
    };
    const bonusText = this.add
      .text(GAME_WIDTH / 2, 255, buildClearBonusLines(this.dataFromRun, 0, 0), {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center',
        lineSpacing: 16,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: bonusCounter,
      clearBonus: this.dataFromRun.clearBonus,
      comboBonus: this.dataFromRun.comboBonus,
      duration: 1300,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        bonusText.setText(
          buildClearBonusLines(
            this.dataFromRun,
            bonusCounter.clearBonus,
            bonusCounter.comboBonus,
          ),
        );
      },
      onComplete: () => {
        bonusText.setText(
          buildClearBonusLines(
            this.dataFromRun,
            this.dataFromRun.clearBonus,
            this.dataFromRun.comboBonus,
          ),
        );
      },
    });

    const player = this.add
      .sprite(CLEAR_WARP_ORIGIN_X, CLEAR_WARP_ORIGIN_Y, PLAYER_TEXTURE_KEY)
      .setDepth(20);
    playCharacterAnimation(player, CHARACTER_ANIMATION_KEYS.player);
    const warpRails = [
      this.add.rectangle(
        GAME_WIDTH / 2 - 22,
        GAME_HEIGHT - 60,
        5,
        118,
        0x6ffcff,
        0.28,
      ),
      this.add.rectangle(
        GAME_WIDTH / 2 + 22,
        GAME_HEIGHT - 60,
        5,
        118,
        0x6ffcff,
        0.28,
      ),
      this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 60,
        10,
        118,
        0xffffff,
        0.18,
      ),
    ];
    const warpRings = [0, 1, 2].map((index) =>
      this.add
        .ellipse(
          GAME_WIDTH / 2,
          GAME_HEIGHT - 266 + index * 58,
          54 - index * 6,
          20,
          0x6ffcff,
          0,
        )
        .setStrokeStyle(3, index === 1 ? 0xffffff : 0x6ffcff, 0.78)
        .setScale(0.62, 0.5),
    );
    const warpVisuals = [...warpRails, ...warpRings];
    for (const visual of warpVisuals) {
      visual.setDepth(10);
    }
    this.vibration.warp();

    this.tweens.add({
      targets: warpRails,
      height: GAME_HEIGHT,
      y: GAME_HEIGHT / 2,
      alpha: 0.5,
      scaleX: 1.25,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    warpRings.forEach((ring, index) => {
      this.tweens.add({
        targets: ring,
        scaleX: 1,
        scaleY: 1,
        alpha: 0.54,
        duration: CLEAR_WARP_RING_FADE_IN_DURATION_MS,
        delay: CLEAR_WARP_RING_FADE_IN_DELAYS_MS[index],
        ease: 'Sine.easeOut',
      });
      this.tweens.add({
        targets: ring,
        scaleX: 2.55,
        scaleY: 2,
        alpha: 0.88,
        duration: CLEAR_WARP_RING_EXPAND_DURATION_MS,
        delay: CLEAR_WARP_RING_PASS_DELAYS_MS[index],
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: ring,
            scaleX: 0.48,
            scaleY: 0.38,
            alpha: 0,
            duration: CLEAR_WARP_RING_SHRINK_FADE_DURATION_MS,
            ease: 'Sine.easeIn',
          });
        },
      });
    });
    this.tweens.add({
      targets: player,
      y: -60,
      scaleX: 0.35,
      scaleY: 1.55,
      duration: CLEAR_WARP_PLAYER_DURATION_MS,
      delay: CLEAR_WARP_PLAYER_DELAY_MS,
      ease: 'Cubic.easeIn',
    });
    this.tweens.add({
      targets: warpRails,
      alpha: 0,
      scaleX: '+=0.35',
      scaleY: '+=0.25',
      duration: CLEAR_WARP_GATE_FADE_DURATION_MS,
      delay: CLEAR_WARP_GATE_FADE_START_MS,
      ease: 'Sine.easeOut',
    });

    this.time.delayedCall(CLEAR_BONUS_ROUTE_DELAY_MS, () => {
      this.input.keyboard?.resetKeys();
      const route = clearBonusNextScene(this.dataFromRun);
      this.scene.start(route.key, route.data);
    });
  }

  private addStarfield(): void {
    for (let i = 0; i < 90; i += 1) {
      this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.7, 1.8),
        0xffffff,
        Phaser.Math.FloatBetween(0.25, 0.85),
      );
    }
  }
}
