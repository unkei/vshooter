type SoundName = 'shot' | 'enemyDown' | 'damage' | 'pickup' | 'boss';

export class AudioManager {
  private context: AudioContext | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;

  async start(): Promise<void> {
    if (this.context === null) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.startMusic();
  }

  play(name: SoundName): void {
    if (this.context === null || this.context.state !== 'running') {
      return;
    }

    const presets: Record<SoundName, [number, number, OscillatorType]> = {
      shot: [720, 0.04, 'square'],
      enemyDown: [180, 0.12, 'sawtooth'],
      damage: [90, 0.22, 'sawtooth'],
      pickup: [980, 0.1, 'triangle'],
      boss: [120, 0.5, 'square'],
    };
    const [frequency, duration, type] = presets[name];
    this.beep(frequency, duration, type);
  }

  stop(): void {
    this.musicOscillator?.stop();
    this.musicOscillator = null;
    this.musicGain = null;
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

  private beep(
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
  ): void {
    if (this.context === null) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + durationSeconds,
    );
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + durationSeconds);
  }
}

