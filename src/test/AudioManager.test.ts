import { describe, expect, it } from 'vitest';
import { AudioManager, getSharedAudioManager } from '../systems/AudioManager';

describe('AudioManager', () => {
  it('exposes one shared manager for gesture unlock and gameplay playback', () => {
    expect(getSharedAudioManager()).toBe(getSharedAudioManager());
    expect(getSharedAudioManager()).toBeInstanceOf(AudioManager);
  });
});
