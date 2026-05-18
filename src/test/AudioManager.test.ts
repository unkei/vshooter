import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AudioManager,
  CLEAR_MUSIC_LAYER_COUNT,
  MUSIC_LAYER_COUNT,
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
});
