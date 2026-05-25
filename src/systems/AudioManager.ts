type SoundName =
  | 'shot'
  | 'bossHit'
  | 'enemyDown'
  | 'explosion'
  | 'damage'
  | 'pickup'
  | 'boss';
type MusicMode = 'gameplay' | 'clear';
type ExternalAudioKey = MusicMode | SoundName;
type AudioSettingKey = 'master' | 'bgm' | 'sfx';

export type AudioSettings = {
  master: number;
  bgm: number;
  sfx: number;
  muted: boolean;
};

type SoundPreset = {
  frequency: number;
  durationSeconds: number;
  type: OscillatorType;
  gain: number;
};

type AudioContextConstructor = new () => AudioContext;

export const MUSIC_LAYER_COUNT = 3;
export const CLEAR_MUSIC_LAYER_COUNT = 3;
export const AUDIO_SETTINGS_STORAGE_KEY = 'vshooter.audioSettings';
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  master: 1,
  bgm: 1,
  sfx: 1,
  muted: false,
};

export const EXTERNAL_AUDIO_KEYS: Record<ExternalAudioKey, string> = {
  gameplay: 'vshooter.audio.music.gameplay',
  clear: 'vshooter.audio.music.clear',
  shot: 'vshooter.audio.sfx.shot',
  bossHit: 'vshooter.audio.sfx.bossHit',
  enemyDown: 'vshooter.audio.sfx.enemyDown',
  explosion: 'vshooter.audio.sfx.explosion',
  damage: 'vshooter.audio.sfx.damage',
  pickup: 'vshooter.audio.sfx.pickup',
  boss: 'vshooter.audio.sfx.boss',
};

export const EXTERNAL_AUDIO_ASSETS = [
  { key: EXTERNAL_AUDIO_KEYS.gameplay, path: 'assets/audio/gameplay-bgm.wav' },
  { key: EXTERNAL_AUDIO_KEYS.clear, path: 'assets/audio/clear-bgm.wav' },
  { key: EXTERNAL_AUDIO_KEYS.shot, path: 'assets/audio/shot.wav' },
  { key: EXTERNAL_AUDIO_KEYS.bossHit, path: 'assets/audio/boss-hit.wav' },
  { key: EXTERNAL_AUDIO_KEYS.enemyDown, path: 'assets/audio/enemy-down.wav' },
  { key: EXTERNAL_AUDIO_KEYS.explosion, path: 'assets/audio/boss-explosion.wav' },
  { key: EXTERNAL_AUDIO_KEYS.damage, path: 'assets/audio/damage.wav' },
  { key: EXTERNAL_AUDIO_KEYS.pickup, path: 'assets/audio/pickup.wav' },
  { key: EXTERNAL_AUDIO_KEYS.boss, path: 'assets/audio/boss-warning.wav' },
];

export type ExternalAudioPlayback = {
  playMusic: (mode: MusicMode, volume: number) => boolean;
  playSound: (name: SoundName, volume: number) => boolean;
  setMusicVolume?: (volume: number) => void;
  stopMusic: () => void;
};

export const SOUND_PRESETS: Record<SoundName, SoundPreset> = {
  shot: {
    frequency: 640,
    durationSeconds: 0.022,
    type: 'triangle',
    gain: 0.08,
  },
  bossHit: {
    frequency: 1280,
    durationSeconds: 0.035,
    type: 'square',
    gain: 0.0175,
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
  private readonly storage: Storage | null;
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private musicMode: MusicMode | null = null;
  private externalMusicMode: MusicMode | null = null;
  private externalPlayback: ExternalAudioPlayback | null = null;

  constructor(options: { storage?: Storage | null } = {}) {
    this.storage = options.storage === undefined ? getDefaultStorage() : options.storage;
    this.settings = loadAudioSettings(this.storage);
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setSettings(nextSettings: Partial<AudioSettings>): void {
    this.settings = normalizeAudioSettings({
      ...this.settings,
      ...nextSettings,
    });
    persistAudioSettings(this.storage, this.settings);
    this.applyGeneratedMusicVolume();
    if (this.externalMusicMode !== null) {
      this.externalPlayback?.setMusicVolume?.(
        this.getEffectiveVolume('bgm', getExternalMusicBaseVolume(this.externalMusicMode)),
      );
    }
  }

  toggleMute(): AudioSettings {
    this.setSettings({ muted: !this.settings.muted });
    return this.getSettings();
  }

  setExternalPlayback(playback: ExternalAudioPlayback | null): void {
    if (this.externalMusicMode !== null) {
      this.externalPlayback?.stopMusic();
      this.externalMusicMode = null;
    }
    this.externalPlayback = playback;
  }

  async start(mode: MusicMode = 'gameplay'): Promise<void> {
    if (this.context === null) {
      this.context = createAudioContext();
    }

    this.primeOutput();
    if (!this.startExternalMusic(mode)) {
      this.startMusic(mode);
    }
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
    if (
      this.externalPlayback?.playSound(
        name,
        this.getEffectiveVolume('sfx', getExternalSoundBaseVolume(name)),
      ) === true
    ) {
      return;
    }
    this.beep(SOUND_PRESETS[name]);
  }

  stop(): void {
    this.externalPlayback?.stopMusic();
    this.externalMusicMode = null;
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
      gain.gain.value = layer.gain * this.getEffectiveVolume('bgm');
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      this.musicOscillators.push(oscillator);
      this.musicGains.push(gain);
    }

    this.musicMode = mode;
    this.musicTimer = setInterval(() => this.advanceMusic(), 280);
  }

  private startExternalMusic(mode: MusicMode): boolean {
    if (this.externalMusicMode !== null) {
      this.externalPlayback?.stopMusic();
      this.externalMusicMode = null;
    }
    if (
      this.externalPlayback?.playMusic(
        mode,
        this.getEffectiveVolume('bgm', getExternalMusicBaseVolume(mode)),
      ) !== true
    ) {
      return false;
    }
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
    this.musicMode = mode;
    this.externalMusicMode = mode;
    return true;
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
    const effectiveVolume = this.getEffectiveVolume('sfx');
    if (effectiveVolume <= 0) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = preset.type;
    oscillator.frequency.value = preset.frequency;
    gain.gain.setValueAtTime(
      preset.gain * effectiveVolume,
      this.context.currentTime,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001 * effectiveVolume,
      this.context.currentTime + preset.durationSeconds,
    );
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + preset.durationSeconds);
  }

  private getEffectiveVolume(kind: AudioSettingKey, baseVolume = 1): number {
    if (this.settings.muted) {
      return 0;
    }
    return baseVolume * this.settings.master * this.settings[kind];
  }

  private applyGeneratedMusicVolume(): void {
    if (this.musicMode === null || this.musicGains.length === 0) {
      return;
    }
    const layers = getMusicLayers(this.musicMode);
    for (const [index, gain] of this.musicGains.entries()) {
      gain.gain.value = layers[index].gain * this.getEffectiveVolume('bgm');
    }
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

export function preloadExternalAudioAssets(scene: Phaser.Scene): void {
  for (const asset of EXTERNAL_AUDIO_ASSETS) {
    scene.load.audio(asset.key, asset.path);
  }
}

export function createPhaserExternalAudioPlayback(
  scene: Phaser.Scene,
): ExternalAudioPlayback {
  let activeMusicKey: string | null = null;

  return {
    playMusic: (mode, volume) => {
      const key = EXTERNAL_AUDIO_KEYS[mode];
      if (!hasCachedAudio(scene, key)) {
        return false;
      }
      try {
        if (activeMusicKey !== null && activeMusicKey !== key) {
          scene.sound.stopByKey(activeMusicKey);
        }
        activeMusicKey = key;
        return scene.sound.play(key, {
          loop: true,
          volume,
        });
      } catch {
        activeMusicKey = null;
        return false;
      }
    },
    playSound: (name, volume) => {
      const key = EXTERNAL_AUDIO_KEYS[name];
      if (!hasCachedAudio(scene, key)) {
        return false;
      }
      try {
        return scene.sound.play(key, {
          volume,
        });
      } catch {
        return false;
      }
    },
    setMusicVolume: (volume) => {
      if (activeMusicKey === null) {
        return;
      }
      for (const sound of scene.sound.getAll(activeMusicKey)) {
        (sound as Phaser.Sound.BaseSound & { volume: number }).volume = volume;
      }
    },
    stopMusic: () => {
      if (activeMusicKey !== null) {
        scene.sound.stopByKey(activeMusicKey);
        activeMusicKey = null;
      }
    },
  };
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

function getDefaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function loadAudioSettings(storage: Storage | null): AudioSettings {
  if (storage === null) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
  try {
    return normalizeAudioSettings(
      JSON.parse(storage.getItem(AUDIO_SETTINGS_STORAGE_KEY) ?? '{}') as Partial<AudioSettings>,
    );
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

function persistAudioSettings(
  storage: Storage | null,
  settings: AudioSettings,
): void {
  try {
    storage?.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can fail in private browsing or constrained test environments.
  }
}

function normalizeAudioSettings(settings: Partial<AudioSettings>): AudioSettings {
  return {
    master: normalizeVolume(settings.master, DEFAULT_AUDIO_SETTINGS.master),
    bgm: normalizeVolume(settings.bgm, DEFAULT_AUDIO_SETTINGS.bgm),
    sfx: normalizeVolume(settings.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
    muted:
      typeof settings.muted === 'boolean'
        ? settings.muted
        : DEFAULT_AUDIO_SETTINGS.muted,
  };
}

function normalizeVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
}

function hasCachedAudio(scene: Phaser.Scene, key: string): boolean {
  return scene.cache.audio.exists(key);
}

function getExternalMusicBaseVolume(mode: MusicMode): number {
  return mode === 'clear' ? 0.36 : 0.3;
}

function getExternalSoundBaseVolume(name: SoundName): number {
  if (name === 'shot') {
    return 0.42;
  }
  if (name === 'bossHit') {
    return 0.12;
  }
  if (name === 'explosion') {
    return 0.78;
  }
  if (name === 'boss' || name === 'damage') {
    return 0.68;
  }
  return 0.6;
}
