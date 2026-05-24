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
import type { StageNumber } from '../systems/StageDirector';
import { buildClearBonusLines } from './clearBonusDisplay';
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
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT - 86, PLAYER_TEXTURE_KEY)
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
          GAME_HEIGHT - 112 + index * 42,
          72 - index * 12,
          20,
          0x6ffcff,
          0.1,
        )
        .setStrokeStyle(3, index === 1 ? 0xffffff : 0x6ffcff, 0.78),
    );
    const warpVisuals = [...warpRails, ...warpRings];
    for (const visual of warpVisuals) {
      visual.setDepth(10);
    }

    this.tweens.add({
      targets: warpRails,
      height: GAME_HEIGHT,
      y: GAME_HEIGHT / 2,
      alpha: 0.5,
      scaleX: 1.25,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: warpRings,
      scaleX: 1.85,
      scaleY: 1.45,
      y: '-=34',
      alpha: 0.72,
      duration: 900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 1,
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
      if (
        this.dataFromRun.nextStageNumber !== null &&
        this.dataFromRun.nextStageNumber !== undefined
      ) {
        this.scene.start('GameScene', {
          stageNumber: this.dataFromRun.nextStageNumber,
          initialScore: this.dataFromRun.score,
          initialMaxCombo: this.dataFromRun.maxCombo,
        });
        return;
      }

      getSharedAudioManager().stop();
      this.input.keyboard?.resetKeys();
      this.scene.start('TitleScene');
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
