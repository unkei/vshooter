import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import {
  createPhaserExternalAudioPlayback,
  getSharedAudioManager,
} from '../systems/AudioManager';
import { FreshPressGate } from '../systems/InputGate';
import {
  CLEAR_RESULT_RETURN_DELAY_MS,
  resultPromptText,
  resultReturnsToTitleAutomatically,
} from './resultFlow';

export type ResultSceneData = {
  status: 'clear' | 'gameover';
  score: number;
  maxCombo: number;
  highScore: number;
};

export class ResultScene extends Phaser.Scene {
  private enterKey: Phaser.Input.Keyboard.Key | null = null;
  private keyboardRetryGate = new FreshPressGate();
  private pointerRetryGate = new FreshPressGate();
  private gamepadRetryGate = new FreshPressGate();
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
    this.keyboardRetryGate = new FreshPressGate();
    this.pointerRetryGate = new FreshPressGate();
    this.gamepadRetryGate = new FreshPressGate();
    const audio = getSharedAudioManager();
    audio.setExternalPlayback(createPhaserExternalAudioPlayback(this));
    this.enterKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null;
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
      .text(
        GAME_WIDTH / 2,
        500,
        resultPromptText(this.dataFromRun.status),
        {
          fontSize: '18px',
          color: '#fff06a',
        },
      )
      .setOrigin(0.5);

    const audioStatus = this.add
      .text(GAME_WIDTH / 2, 540, this.audioStatusText(audio), {
        fontSize: '15px',
        color: '#9fffe0',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-M', () => {
      audio.toggleMute();
      audioStatus.setText(this.audioStatusText(audio));
    });

    if (resultReturnsToTitleAutomatically(this.dataFromRun.status)) {
      this.time.delayedCall(CLEAR_RESULT_RETURN_DELAY_MS, () => this.returnToTitle());
    }
  }

  update(): void {
    if (resultReturnsToTitleAutomatically(this.dataFromRun.status)) {
      return;
    }

    const pad = this.input.gamepad?.pad1;
    const keyboardConfirm = this.enterKey?.isDown ?? false;
    const pointerConfirm = this.input.activePointer.isDown;
    const gamepadConfirm = Boolean(
      pad?.buttons[9]?.pressed || pad?.buttons[0]?.pressed,
    );

    if (
      this.keyboardRetryGate.accepts(keyboardConfirm) ||
      this.pointerRetryGate.accepts(pointerConfirm) ||
      this.gamepadRetryGate.accepts(gamepadConfirm)
    ) {
      this.retry();
    }
  }

  private retry(): void {
    this.input.keyboard?.resetKeys();
    void getSharedAudioManager().start();
    this.scene.start('GameScene');
  }

  private returnToTitle(): void {
    getSharedAudioManager().stop();
    this.input.keyboard?.resetKeys();
    this.scene.start('TitleScene');
  }

  private audioStatusText(audio: ReturnType<typeof getSharedAudioManager>): string {
    return `M: Audio ${audio.getSettings().muted ? 'Muted' : 'On'}`;
  }
}
