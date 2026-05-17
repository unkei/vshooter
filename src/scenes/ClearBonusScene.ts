import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { PLAYER_TEXTURE_KEY, ensureGameTextures } from '../game/visualAssets';

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

  create(): void {
    this.input.keyboard?.resetKeys();
    this.cameras.main.setBackgroundColor(0x050710);
    ensureGameTextures(this);
    this.addStarfield();

    this.add
      .text(GAME_WIDTH / 2, 130, 'STAGE CLEAR', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '42px',
        color: '#6ffcff',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        255,
        [
          `SCORE ${this.dataFromRun.score}`,
          `CLEAR BONUS ${this.dataFromRun.clearBonus}`,
          `MAX COMBO BONUS ${this.dataFromRun.comboBonus}`,
          `MAX COMBO ${this.dataFromRun.maxCombo}`,
        ],
        {
          fontSize: '22px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 12,
        },
      )
      .setOrigin(0.5);

    const player = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT - 86, PLAYER_TEXTURE_KEY)
      .setDepth(20);
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
