type SoundName = 'shot' | 'enemyDown' | 'explosion' | 'damage' | 'pickup' | 'boss';
type MusicMode = 'gameplay' | 'clear';

type SoundPreset = {
  frequency: number;
  durationSeconds: number;
  type: OscillatorType;
  gain: number;
};

type AudioContextConstructor = new () => AudioContext;

export const MUSIC_LAYER_COUNT = 3;
export const CLEAR_MUSIC_LAYER_COUNT = 3;

export const SOUND_PRESETS: Record<SoundName, SoundPreset> = {
  shot: {
    frequency: 640,
    durationSeconds: 0.022,
    type: 'triangle',
    gain: 0.08,
  },
  enemyDown: {
    frequency: 180,
    durationSeconds: 0.12,
    type: 'sawtooth',
    gain: 0.13,
  },
  explosion: {
    frequency: 72,
    durationSeconds: 0.48,
    type: 'sawtooth',
    gain: 0.2,
  },
  damage: {
    frequency: 90,
    durationSeconds: 0.22,
    type: 'sawtooth',
    gain: 0.16,
  },
  pickup: {
    frequency: 980,
    durationSeconds: 0.1,
    type: 'triangle',
    gain: 0.13,
  },
  boss: {
    frequency: 120,
    durationSeconds: 0.5,
    type: 'square',
    gain: 0.15,
  },
};

export class AudioManager {
  private context: AudioContext | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private musicMode: MusicMode | null = null;

  async start(mode: MusicMode = 'gameplay'): Promise<void> {
    if (this.context === null) {
      this.context = createAudioContext();
    }

    this.primeOutput();
    this.startMusic(mode);
    const resumePromise =
      this.context.state === 'suspended'
        ? this.context.resume().catch(() => undefined)
        : Promise.resolve();
    await resumePromise;
  }

  play(name: SoundName): void {
    if (this.context === null || this.context.state === 'closed') {
      return;
    }

    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => undefined);
    }
    this.beep(SOUND_PRESETS[name]);
  }

  stop(): void {
    for (const oscillator of this.musicOscillators) {
      oscillator.stop();
    }
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicOscillators = [];
    this.musicGains = [];
    this.musicStep = 0;
    this.musicMode = null;
  }

  private primeOutput(): void {
    if (this.context === null) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.00001,
      this.context.currentTime + 0.03,
    );
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.03);
  }

  private startMusic(mode: MusicMode): void {
    if (this.context === null) {
      return;
    }
    if (this.musicOscillators.length > 0) {
      if (this.musicMode === mode) {
        return;
      }
      this.stop();
    }

    const layers: Array<{
      type: OscillatorType;
      gain: number;
      frequencies: number[];
    }> = getMusicLayers(mode);

    for (const layer of layers) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = layer.type;
      oscillator.frequency.value = layer.frequencies[0];
      gain.gain.value = layer.gain;
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      this.musicOscillators.push(oscillator);
      this.musicGains.push(gain);
    }

    this.musicMode = mode;
    this.musicTimer = setInterval(() => this.advanceMusic(), 280);
  }

  private advanceMusic(): void {
    if (this.context === null || this.musicOscillators.length === 0) {
      return;
    }

    const sequences = getMusicLayers(this.musicMode ?? 'gameplay').map(
      (layer) => layer.frequencies,
    );
    this.musicStep = (this.musicStep + 1) % sequences[0].length;

    for (const [index, oscillator] of this.musicOscillators.entries()) {
      oscillator.frequency.setValueAtTime(
        sequences[index][this.musicStep],
        this.context.currentTime,
      );
    }
  }

  private beep(preset: SoundPreset): void {
    if (this.context === null) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = preset.type;
    oscillator.frequency.value = preset.frequency;
    gain.gain.setValueAtTime(preset.gain, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + preset.durationSeconds,
    );
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + preset.durationSeconds);
  }
}

function getMusicLayers(mode: MusicMode): Array<{
  type: OscillatorType;
  gain: number;
  frequencies: number[];
}> {
  if (mode === 'clear') {
    return [
      {
        type: 'triangle',
        gain: 0.045,
        frequencies: [130.81, 164.81, 196, 261.63, 246.94, 196, 164.81, 196],
      },
      {
        type: 'square',
        gain: 0.016,
        frequencies: [523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 659.25, 783.99],
      },
      {
        type: 'sine',
        gain: 0.026,
        frequencies: [261.63, 329.63, 392, 523.25, 493.88, 392, 329.63, 392],
      },
    ];
  }

  return [
    {
      type: 'triangle',
      gain: 0.04,
      frequencies: [110, 110, 130.81, 146.83, 98, 98, 130.81, 146.83],
    },
    {
      type: 'square',
      gain: 0.018,
      frequencies: [440, 493.88, 523.25, 659.25, 587.33, 523.25, 493.88, 392],
    },
    {
      type: 'sine',
      gain: 0.022,
      frequencies: [220, 246.94, 261.63, 329.63, 293.66, 261.63, 246.94, 196],
    },
  ];
}

const sharedAudioManager = new AudioManager();

export function getSharedAudioManager(): AudioManager {
  return sharedAudioManager;
}

function createAudioContext(): AudioContext {
  const globalScope = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };
  const ContextConstructor = globalScope.AudioContext ?? globalScope.webkitAudioContext;
  if (ContextConstructor === undefined) {
    throw new Error('Web Audio API is not available in this browser.');
  }

  return new ContextConstructor();
}
