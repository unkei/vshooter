import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';

export type ResultSceneData = {
  status: 'clear' | 'gameover';
  score: number;
  maxCombo: number;
  highScore: number;
};

export class ResultScene extends Phaser.Scene {
  private dataFromRun: ResultSceneData = {
    status: 'gameover',
    score: 0,
    maxCombo: 0,
    highScore: 0,
  };

  constructor() {
    super('ResultScene');
  }

  init(data: ResultSceneData): void {
    this.dataFromRun = data;
  }

  create(): void {
    this.input.keyboard?.resetKeys();
    this.cameras.main.setBackgroundColor(0x050710);
    const title = this.dataFromRun.status === 'clear' ? 'STAGE CLEAR' : 'GAME OVER';
    const color = this.dataFromRun.status === 'clear' ? '#6ffcff' : '#ff4fd8';

    this.add
      .text(GAME_WIDTH / 2, 180, title, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '42px',
        color,
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        300,
        [
          `SCORE ${this.dataFromRun.score}`,
          `MAX COMBO ${this.dataFromRun.maxCombo}`,
          `HIGH SCORE ${this.dataFromRun.highScore}`,
        ],
        {
          fontSize: '22px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 12,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 500, 'Enter / Click / Gamepad Start: Retry', {
        fontSize: '18px',
        color: '#fff06a',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.retry());
    this.input.once('pointerdown', () => this.retry());
  }

  update(): void {
    const pad = this.input.gamepad?.pad1;
    if (pad?.buttons[9]?.pressed || pad?.buttons[0]?.pressed) {
      this.retry();
    }
  }

  private retry(): void {
    this.input.keyboard?.resetKeys();
    this.scene.start('GameScene');
  }
}
