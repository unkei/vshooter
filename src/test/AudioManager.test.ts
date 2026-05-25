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
  setCalls: number[] = [];

  setValueAtTime(value: number): void {
    this.value = value;
    this.setCalls.push(value);
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
  gains: FakeGain[] = [];
  state: AudioContextState = 'suspended';
  resume = vi.fn(() => new Promise<void>(() => {}));

  createOscillator(): OscillatorNode {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }
}

function createMemoryStorage(entries: Array<[string, string]> = []): Storage {
  const storage = new Map<string, string>(entries);
  return {
    get length() {
      return storage.size;
    },
    clear: () => storage.clear(),
    getItem: (key) => storage.get(key) ?? null,
    key: (index) => Array.from(storage.keys())[index] ?? null,
    removeItem: (key) => storage.delete(key),
    setItem: (key, value) => storage.set(key, value),
  };
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
      { key: 'vshooter.audio.sfx.bossHit', path: 'assets/audio/boss-hit.wav' },
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

  it('loads default persisted audio settings when storage is empty', () => {
    const audio = new AudioManager({ storage: createMemoryStorage() });

    expect(audio.getSettings()).toEqual({
      master: 1,
      bgm: 1,
      sfx: 1,
      muted: false,
    });
  });

  it('persists clamped audio settings', () => {
    const storage = createMemoryStorage();
    const audio = new AudioManager({ storage });

    audio.setSettings({
      master: 1.4,
      bgm: -0.5,
      sfx: 0.25,
      muted: true,
    });

    expect(audio.getSettings()).toEqual({
      master: 1,
      bgm: 0,
      sfx: 0.25,
      muted: true,
    });
    expect(storage.getItem('vshooter.audioSettings')).toBe(
      JSON.stringify({ master: 1, bgm: 0, sfx: 0.25, muted: true }),
    );
  });

  it('uses valid persisted audio settings and ignores malformed values', () => {
    const storage = createMemoryStorage([
      [
        'vshooter.audioSettings',
        JSON.stringify({ master: 0.7, bgm: 'loud', sfx: 0.4, muted: true }),
      ],
    ]);

    const audio = new AudioManager({ storage });

    expect(audio.getSettings()).toEqual({
      master: 0.7,
      bgm: 1,
      sfx: 0.4,
      muted: true,
    });
  });

  it('applies master and BGM settings to generated music layers', () => {
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
    const audio = new AudioManager({ storage: createMemoryStorage() });
    audio.setSettings({ master: 0.5, bgm: 0.25 });

    void audio.start();

    const musicGains = context.gains.slice(1);
    expect(musicGains.map((gain) => gain.gain.value)).toEqual([
      0.005,
      0.00225,
      0.00275,
    ]);
  });

  it('updates active generated music gains when settings change', () => {
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
    const audio = new AudioManager({ storage: createMemoryStorage() });

    void audio.start();
    audio.setSettings({ master: 0.5, bgm: 0.5 });

    const musicGains = context.gains.slice(1);
    expect(musicGains.map((gain) => gain.gain.value)).toEqual([
      0.01,
      0.0045,
      0.0055,
    ]);
  });

  it('applies master and SFX settings to generated sound effects', () => {
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
    const audio = new AudioManager({ storage: createMemoryStorage() });
    audio.setSettings({ master: 0.5, sfx: 0.5 });

    void audio.start();
    audio.play('shot');

    const shotGain = context.gains.at(-1);
    expect(shotGain?.gain.setCalls[0]).toBe(0.02);
  });

  it('does not queue generated sound effects while muted', () => {
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
    const audio = new AudioManager({ storage: createMemoryStorage() });
    audio.setSettings({ muted: true });

    void audio.start();
    const oscillatorCountAfterStart = context.oscillators.length;
    audio.play('shot');

    expect(context.oscillators).toHaveLength(oscillatorCountAfterStart);
  });

  it('passes effective volumes to external playback', () => {
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
    const playedMusic: number[] = [];
    const playedSounds: number[] = [];
    const updatedMusic: number[] = [];
    const audio = new AudioManager({ storage: createMemoryStorage() });
    audio.setSettings({ master: 0.5, bgm: 0.5, sfx: 0.25 });
    audio.setExternalPlayback({
      playMusic: (_mode, volume) => {
        playedMusic.push(volume);
        return true;
      },
      playSound: (_name, volume) => {
        playedSounds.push(volume);
        return true;
      },
      setMusicVolume: (volume) => updatedMusic.push(volume),
      stopMusic: () => undefined,
    });

    void audio.start();
    audio.play('shot');
    audio.play('bossHit');
    audio.toggleMute();

    expect(playedMusic).toEqual([0.075]);
    expect(playedSounds).toEqual([0.0525, 0.015]);
    expect(updatedMusic).toEqual([0]);
  });

  it('stops external music owned by the previous scene adapter when replacing it', () => {
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
    const firstStopMusic = vi.fn();
    const audio = new AudioManager();
    audio.setExternalPlayback({
      playMusic: () => true,
      playSound: () => false,
      stopMusic: firstStopMusic,
    });

    void audio.start();
    audio.setExternalPlayback({
      playMusic: () => true,
      playSound: () => false,
      stopMusic: vi.fn(),
    });

    expect(firstStopMusic).toHaveBeenCalledTimes(1);
  });

  it('replaces an existing external music loop before starting the same mode again', () => {
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
    const stopMusic = vi.fn();
    const audio = new AudioManager();
    audio.setExternalPlayback({
      playMusic: () => true,
      playSound: () => false,
      stopMusic,
    });

    void audio.start();
    void audio.start();

    expect(stopMusic).toHaveBeenCalledTimes(1);
  });
});
