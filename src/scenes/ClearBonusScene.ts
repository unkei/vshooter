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
import { buildClearBonusLines } from './clearBonusDisplay';

export type ClearBonusSceneData = {
  score: number;
  clearBonus: number;
  comboBonus: number;
  maxCombo: number;
  highScore: number;
};

export class ClearBonusScene extends Phaser.Scene {
  private dataFromRun: ClearBonusSceneData = {
    score: 0,
    clearBonus: 0,
    comboBonus: 0,
    maxCombo: 0,
    highScore: 0,
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
      .text(GAME_WIDTH / 2, 130, 'STAGE CLEAR', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '42px',
        color: '#6ffcff',
      })
      .setOrigin(0.5);

    const bonusCounter = {
      clearBonus: 0,
      comboBonus: 0,
    };
    const bonusText = this.add
      .text(GAME_WIDTH / 2, 255, buildClearBonusLines(this.dataFromRun, 0, 0), {
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12,
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
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT - 86, PLAYER_TEXTURE_KEY)
      .setDepth(20);
    playCharacterAnimation(player, CHARACTER_ANIMATION_KEYS.player);
    const warp = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 16, 110, 0x6ffcff, 0.24);
    warp.setDepth(10);

    this.tweens.add({
      targets: warp,
      height: GAME_HEIGHT,
      y: GAME_HEIGHT / 2,
      alpha: 0.55,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: player,
      y: -60,
      scaleX: 0.35,
      scaleY: 1.55,
      duration: 1450,
      delay: 650,
      ease: 'Cubic.easeIn',
    });

    this.time.delayedCall(2600, () => {
      this.scene.start('ResultScene', {
        status: 'clear',
        score: this.dataFromRun.score,
        maxCombo: this.dataFromRun.maxCombo,
        highScore: this.dataFromRun.highScore,
      });
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
