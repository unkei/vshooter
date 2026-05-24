import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AudioManager,
  CLEAR_MUSIC_LAYER_COUNT,
  EXTERNAL_AUDIO_ASSETS,
  MUSIC_LAYER_COUNT,
  preloadExternalAudioAssets,
  getSharedAudioManager,
} from '../systems/AudioManager';

class FakeAudioParam {
  value = 0;

  setValueAtTime(value: number): void {
    this.value = value;
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
  }
}

class FakeOscillator {
  type: OscillatorType = 'sine';
  frequency = new FakeAudioParam();
  started = false;
  stopped = false;

  connect(): void {}

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.stopped = true;
  }
}

class FakeGain {
  gain = new FakeAudioParam();

  connect(): void {}
}

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  oscillators: FakeOscillator[] = [];
  state: AudioContextState = 'suspended';
  resume = vi.fn(() => new Promise<void>(() => {}));

  createOscillator(): OscillatorNode {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    return new FakeGain() as unknown as GainNode;
  }
}

describe('AudioManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes one shared manager for gesture unlock and gameplay playback', () => {
    expect(getSharedAudioManager()).toBe(getSharedAudioManager());
    expect(getSharedAudioManager()).toBeInstanceOf(AudioManager);
  });

  it('falls back to webkitAudioContext for iOS Safari compatibility', () => {
    const contexts: FakeAudioContext[] = [];
    class WebkitAudioContext extends FakeAudioContext {
      constructor() {
        super();
        contexts.push(this);
      }
    }
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', WebkitAudioContext);

    void new AudioManager().start();

    expect(contexts).toHaveLength(1);
  });

  it('queues audio output synchronously before suspended resume resolves', () => {
    const context = new FakeAudioContext();
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );

    void new AudioManager().start();

    expect(context.resume).toHaveBeenCalled();
    expect(context.oscillators.some((oscillator) => oscillator.started)).toBe(true);
  });

  it('queues music before requesting resume for browser unlock compatibility', () => {
    const context = new FakeAudioContext();
    const callOrder: string[] = [];
    context.resume = vi.fn(() => {
      callOrder.push('resume');
      return new Promise<void>(() => {});
    });
    const originalCreateOscillator = context.createOscillator.bind(context);
    context.createOscillator = vi.fn(() => {
      callOrder.push('oscillator');
      return originalCreateOscillator();
    });
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );

    void new AudioManager().start();

    expect(callOrder[0]).toBe('oscillator');
    expect(callOrder).toContain('resume');
  });

  it('starts layered BGM instead of a single low drone', () => {
    const context = new FakeAudioContext();
    context.state = 'running';
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );

    void new AudioManager().start();

    expect(context.oscillators.filter((oscillator) => oscillator.started)).toHaveLength(
      MUSIC_LAYER_COUNT + 1,
    );
  });

  it('starts a distinct clear BGM with generated layers', () => {
    const context = new FakeAudioContext();
    context.state = 'running';
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );

    void new AudioManager().start('clear');

    expect(context.oscillators.filter((oscillator) => oscillator.started)).toHaveLength(
      CLEAR_MUSIC_LAYER_COUNT + 1,
    );
  });

  it('stops clear BGM before returning to a silent title', () => {
    const context = new FakeAudioContext();
    context.state = 'running';
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );
    const audio = new AudioManager();

    void audio.start('clear');
    audio.stop();

    const musicOscillators = context.oscillators.slice(1);
    expect(musicOscillators).toHaveLength(CLEAR_MUSIC_LAYER_COUNT);
    expect(musicOscillators.every((oscillator) => oscillator.stopped)).toBe(true);
  });

  it('defines stable external audio files for music and core sound effects', () => {
    expect(EXTERNAL_AUDIO_ASSETS).toEqual([
      { key: 'vshooter.audio.music.gameplay', path: 'assets/audio/gameplay-bgm.wav' },
      { key: 'vshooter.audio.music.clear', path: 'assets/audio/clear-bgm.wav' },
      { key: 'vshooter.audio.sfx.shot', path: 'assets/audio/shot.wav' },
      { key: 'vshooter.audio.sfx.enemyDown', path: 'assets/audio/enemy-down.wav' },
      { key: 'vshooter.audio.sfx.explosion', path: 'assets/audio/boss-explosion.wav' },
      { key: 'vshooter.audio.sfx.damage', path: 'assets/audio/damage.wav' },
      { key: 'vshooter.audio.sfx.pickup', path: 'assets/audio/pickup.wav' },
      { key: 'vshooter.audio.sfx.boss', path: 'assets/audio/boss-warning.wav' },
    ]);
  });

  it('queues external audio assets for Phaser preload', () => {
    const loaded: Array<{ key: string; path: string }> = [];
    const scene = {
      load: {
        audio: (key: string, path: string) => {
          loaded.push({ key, path });
        },
      },
    };

    preloadExternalAudioAssets(scene as Phaser.Scene);

    expect(loaded).toEqual(EXTERNAL_AUDIO_ASSETS);
  });

  it('uses external sound effects when a playback adapter accepts the sound', () => {
    const context = new FakeAudioContext();
    context.state = 'running';
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );
    const audio = new AudioManager();
    audio.setExternalPlayback({
      playMusic: () => false,
      playSound: () => true,
      stopMusic: () => undefined,
    });

    void audio.start();
    const oscillatorCountAfterStart = context.oscillators.length;
    audio.play('shot');

    expect(context.oscillators).toHaveLength(oscillatorCountAfterStart);
  });

  it('falls back to generated effects when external playback declines a sound', () => {
    const context = new FakeAudioContext();
    context.state = 'running';
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          return context;
        }
      },
    );
    const audio = new AudioManager();
    audio.setExternalPlayback({
      playMusic: () => false,
      playSound: () => false,
      stopMusic: () => undefined,
    });

    void audio.start();
    const oscillatorCountAfterStart = context.oscillators.length;
    audio.play('shot');

    expect(context.oscillators.length).toBeGreaterThan(oscillatorCountAfterStart);
  });
});
