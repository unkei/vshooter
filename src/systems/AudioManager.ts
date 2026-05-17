type SoundName = 'shot' | 'enemyDown' | 'damage' | 'pickup' | 'boss';

type SoundPreset = {
  frequency: number;
  durationSeconds: number;
  type: OscillatorType;
  gain: number;
};

type AudioContextConstructor = new () => AudioContext;

export const SOUND_PRESETS: Record<SoundName, SoundPreset> = {
  shot: {
    frequency: 640,
    durationSeconds: 0.022,
    type: 'triangle',
    gain: 0.045,
  },
  enemyDown: {
    frequency: 180,
    durationSeconds: 0.12,
    type: 'sawtooth',
    gain: 0.08,
  },
  damage: {
    frequency: 90,
    durationSeconds: 0.22,
    type: 'sawtooth',
    gain: 0.08,
  },
  pickup: {
    frequency: 980,
    durationSeconds: 0.1,
    type: 'triangle',
    gain: 0.08,
  },
  boss: {
    frequency: 120,
    durationSeconds: 0.5,
    type: 'square',
    gain: 0.08,
  },
};

export class AudioManager {
  private context: AudioContext | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;

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
    this.musicOscillator?.stop();
    this.musicOscillator = null;
    this.musicGain = null;
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
    if (this.context === null || this.musicOscillator !== null) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 55;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    this.musicOscillator = oscillator;
    this.musicGain = gain;
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
