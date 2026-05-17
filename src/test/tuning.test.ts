import { describe, expect, it } from 'vitest';
import { PLAYER_ACCELERATION } from '../game/constants';
import { PROJECTILE_RADIUS, PROJECTILE_SPEED_SCALE } from '../game/ProjectileManager';
import { SOUND_PRESETS } from '../systems/AudioManager';

describe('play tuning constants', () => {
  it('starts keyboard and gamepad movement with a responsive acceleration ramp', () => {
    expect(PLAYER_ACCELERATION).toBeGreaterThanOrEqual(780);
  });

  it('keeps the repeated player shot sound short, restrained, and audible', () => {
    expect(SOUND_PRESETS.shot.durationSeconds).toBeLessThanOrEqual(0.025);
    expect(SOUND_PRESETS.shot.gain).toBeGreaterThanOrEqual(0.07);
    expect(SOUND_PRESETS.shot.gain).toBeLessThanOrEqual(0.09);
    expect(SOUND_PRESETS.shot.type).not.toBe('square');
  });

  it('keeps alert and reward effects clearly audible over the BGM', () => {
    expect(SOUND_PRESETS.enemyDown.gain).toBeGreaterThanOrEqual(0.12);
    expect(SOUND_PRESETS.damage.gain).toBeGreaterThanOrEqual(0.14);
    expect(SOUND_PRESETS.pickup.gain).toBeGreaterThanOrEqual(0.12);
    expect(SOUND_PRESETS.boss.gain).toBeGreaterThanOrEqual(0.14);
  });

  it('uses larger and slower projectiles for readability', () => {
    expect(PROJECTILE_RADIUS).toBe(6);
    expect(PROJECTILE_SPEED_SCALE).toBe(0.7);
  });
});
