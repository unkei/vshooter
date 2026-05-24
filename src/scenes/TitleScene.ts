import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import {
  createPhaserExternalAudioPlayback,
  getSharedAudioManager,
} from '../systems/AudioManager';
import { newRunGameSceneData } from './resultFlow';
import { UI_FONT_FAMILY, titleLayerTextStyle } from './screenTextStyles';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const audio = getSharedAudioManager();
    audio.setExternalPlayback(createPhaserExternalAudioPlayback(this));
    audio.stop();
    this.cameras.main.setBackgroundColor(0x050710);
    this.addStarfield();

    this.addTitleLockup();

    this.add
      .text(GAME_WIDTH / 2, 280, 'Keyboard / Pointer / Gamepad', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const highScore = Number(localStorage.getItem('vshooter.highScore') ?? 0);
    this.add
      .text(GAME_WIDTH / 2, 330, `HIGH SCORE ${highScore}`, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '20px',
        color: '#fff06a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 430, 'Press Enter / Click / Gamepad Start', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '18px',
        color: '#ff4fd8',
      })
      .setOrigin(0.5);

    const audioStatus = this.add
      .text(GAME_WIDTH / 2, 475, this.audioStatusText(audio), {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '15px',
        color: '#9fffe0',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-M', () => {
      audio.toggleMute();
      audioStatus.setText(this.audioStatusText(audio));
    });
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
    this.scene.start('GameScene', newRunGameSceneData());
  }

  private audioStatusText(audio: ReturnType<typeof getSharedAudioManager>): string {
    return `M: Audio ${audio.getSettings().muted ? 'Muted' : 'On'}`;
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

  private addTitleLockup(): void {
    const centerX = GAME_WIDTH / 2;
    const titleY = 176;
    const frame = this.add.graphics();

    frame.lineStyle(10, 0x1a4b6d, 0.28);
    this.strokeTitleFrame(frame, centerX, titleY);
    frame.lineStyle(4, 0x19d8ff, 0.85);
    this.strokeTitleFrame(frame, centerX, titleY);
    frame.lineStyle(1, 0xffffff, 0.95);
    this.strokeTitleFrame(frame, centerX, titleY);

    this.add
      .text(centerX + 5, titleY + 8, 'VSHOOTER', titleLayerTextStyle('shadow'))
      .setOrigin(0.5);

    this.add
      .text(centerX + 2, titleY + 3, 'VSHOOTER', titleLayerTextStyle('depth'))
      .setOrigin(0.5);

    this.add
      .text(centerX, titleY, 'VSHOOTER', titleLayerTextStyle('top'))
      .setOrigin(0.5);

    this.add
      .text(centerX, titleY + 48, 'NEON SKY DEFENSE', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '14px',
        color: '#fff06a',
        stroke: '#32124f',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  private strokeTitleFrame(
    frame: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
  ): void {
    frame.beginPath();
    frame.moveTo(centerX - 182, centerY - 20);
    frame.lineTo(centerX - 130, centerY - 48);
    frame.lineTo(centerX - 96, centerY - 48);
    frame.moveTo(centerX - 188, centerY + 15);
    frame.lineTo(centerX - 124, centerY + 46);
    frame.lineTo(centerX - 76, centerY + 46);
    frame.moveTo(centerX + 182, centerY - 20);
    frame.lineTo(centerX + 130, centerY - 48);
    frame.lineTo(centerX + 96, centerY - 48);
    frame.moveTo(centerX + 188, centerY + 15);
    frame.lineTo(centerX + 124, centerY + 46);
    frame.lineTo(centerX + 76, centerY + 46);
    frame.moveTo(centerX - 210, centerY);
    frame.lineTo(centerX - 154, centerY);
    frame.moveTo(centerX + 210, centerY);
    frame.lineTo(centerX + 154, centerY);
    frame.strokePath();
  }
}
