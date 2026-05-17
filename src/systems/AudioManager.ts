type SoundName = 'shot' | 'enemyDown' | 'explosion' | 'damage' | 'pickup' | 'boss';

type SoundPreset = {
  frequency: number;
  durationSeconds: number;
  type: OscillatorType;
  gain: number;
};

type AudioContextConstructor = new () => AudioContext;

export const MUSIC_LAYER_COUNT = 3;

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

  async start(): Promise<void> {
    if (this.context === null) {
      this.context = createAudioContext();
    }

    const resumePromise =
      this.context.state === 'suspended'
        ? this.context.resume().catch(() => undefined)
        : Promise.resolve();
    this.primeOutput();
    this.startMusic();
    await resumePromise;
  }

  play(name: SoundName): void {
    if (this.context === null || this.context.state !== 'running') {
      return;
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

  private startMusic(): void {
    if (this.context === null || this.musicOscillators.length > 0) {
      return;
    }

    const layers: Array<{
      type: OscillatorType;
      gain: number;
      frequencies: number[];
    }> = [
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

    this.musicTimer = setInterval(() => this.advanceMusic(), 280);
  }

  private advanceMusic(): void {
    if (this.context === null || this.musicOscillators.length === 0) {
      return;
    }

    const sequences = [
      [110, 110, 130.81, 146.83, 98, 98, 130.81, 146.83],
      [440, 493.88, 523.25, 659.25, 587.33, 523.25, 493.88, 392],
      [220, 246.94, 261.63, 329.63, 293.66, 261.63, 246.94, 196],
    ];
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
