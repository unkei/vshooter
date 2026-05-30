import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import {
  createPhaserExternalAudioPlayback,
  getSharedAudioManager,
} from '../systems/AudioManager';
import { arcadeHeadingTextStyle, UI_FONT_FAMILY } from './screenTextStyles';
import { buildEndingStaffLines, endingMessageLines } from './endingContent';

export type EndingSceneData = {
  score: number;
  maxCombo: number;
  highScore: number;
};

const ENDING_MESSAGE_HOLD_MS = 3200;
const ENDING_STAFF_SCROLL_DURATION_MS = 9200;
const ENDING_RETURN_DELAY_MS = 600;

export class EndingScene extends Phaser.Scene {
  private dataFromRun: EndingSceneData = {
    score: 0,
    maxCombo: 0,
    highScore: 0,
  };

  constructor() {
    super('EndingScene');
  }

  init(data: EndingSceneData): void {
    this.dataFromRun = data;
  }

  create(): void {
    this.input.keyboard?.resetKeys();
    this.cameras.main.setBackgroundColor(0x050710);
    const audio = getSharedAudioManager();
    audio.setExternalPlayback(createPhaserExternalAudioPlayback(this));
    void audio.start('clear');
    this.addStarfield();

    this.add
      .text(
        GAME_WIDTH / 2,
        110,
        'MISSION COMPLETE',
        arcadeHeadingTextStyle('#6ffcff', '34px'),
      )
      .setOrigin(0.5);

    const message = this.add
      .text(GAME_WIDTH / 2, 245, endingMessageLines(), {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 700,
      ease: 'Sine.easeOut',
    });

    const scoreText = this.add
      .text(
        GAME_WIDTH / 2,
        405,
        [
          `SCORE ${this.dataFromRun.score}`,
          `MAX COMBO ${this.dataFromRun.maxCombo}`,
          `HIGH SCORE ${this.dataFromRun.highScore}`,
        ],
        {
          fontFamily: UI_FONT_FAMILY,
          fontSize: '18px',
          color: '#fff06a',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0.9);

    const staffText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT + 90, buildEndingStaffLines(), {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 22,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    this.time.delayedCall(ENDING_MESSAGE_HOLD_MS, () => {
      this.tweens.add({
        targets: [message, scoreText],
        alpha: 0,
        duration: 900,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: staffText,
        y: -staffText.height - 30,
        duration: ENDING_STAFF_SCROLL_DURATION_MS,
        ease: 'Linear',
        onComplete: () => {
          this.time.delayedCall(ENDING_RETURN_DELAY_MS, () => this.returnToTitle());
        },
      });
    });
  }

  private addStarfield(): void {
    for (let i = 0; i < 110; i += 1) {
      this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.7, 2.1),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.85),
      );
    }
  }

  private returnToTitle(): void {
    getSharedAudioManager().stop();
    this.input.keyboard?.resetKeys();
    this.scene.start('TitleScene');
  }
}
