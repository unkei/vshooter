import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { getSharedAudioManager } from '../systems/AudioManager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    getSharedAudioManager().stop();
    this.cameras.main.setBackgroundColor(0x050710);
    this.addStarfield();

    this.add
      .text(GAME_WIDTH / 2, 180, 'VSHOOTER', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '52px',
        color: '#6ffcff',
        stroke: '#ffffff',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 280, 'Keyboard / Pointer / Gamepad', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const highScore = Number(localStorage.getItem('vshooter.highScore') ?? 0);
    this.add
      .text(GAME_WIDTH / 2, 330, `HIGH SCORE ${highScore}`, {
        fontSize: '20px',
        color: '#fff06a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 430, 'Press Enter / Click / Gamepad Start', {
        fontSize: '18px',
        color: '#ff4fd8',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  update(): void {
    const pad = this.input.gamepad?.pad1;
    if (pad?.buttons[9]?.pressed || pad?.buttons[0]?.pressed) {
      this.startGame();
    }
  }

  private startGame(): void {
    void getSharedAudioManager().start('gameplay');
    this.scene.start('GameScene');
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
