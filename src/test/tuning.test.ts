import { describe, expect, it } from 'vitest';
import { PLAYER_ACCELERATION } from '../game/constants';
import { SOUND_PRESETS } from '../systems/AudioManager';

describe('play tuning constants', () => {
  it('starts keyboard and gamepad movement with a responsive acceleration ramp', () => {
    expect(PLAYER_ACCELERATION).toBeGreaterThanOrEqual(780);
  });

  it('keeps the repeated player shot sound short and quiet', () => {
    expect(SOUND_PRESETS.shot.durationSeconds).toBeLessThanOrEqual(0.025);
    expect(SOUND_PRESETS.shot.gain).toBeLessThanOrEqual(0.035);
    expect(SOUND_PRESETS.shot.type).not.toBe('square');
  });
});
