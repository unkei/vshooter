import { describe, expect, it } from 'vitest';
import { PLAYER_ACCELERATION } from '../game/constants';
import { PROJECTILE_RADIUS, PROJECTILE_SPEED_SCALE } from '../game/ProjectileManager';
import { SOUND_PRESETS } from '../systems/AudioManager';
import {
  DEFAULT_HEAVY_BULLET_COUNT,
  DEFAULT_HEAVY_FIRE_INTERVAL_MS,
  FINAL_WAVE_HEAVY_BULLET_COUNT,
  FINAL_WAVE_HEAVY_FIRE_INTERVAL_MS,
  HEAVY_ENEMY_HP,
  STRAIGHT_ENEMY_HP,
  SWAY_ENEMY_HP,
} from '../game/enemyTuning';

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
    expect(SOUND_PRESETS.explosion.gain).toBeGreaterThanOrEqual(0.18);
  });

  it('reduces the final heavy wave bullet spread pressure', () => {
    expect(FINAL_WAVE_HEAVY_BULLET_COUNT).toBeLessThan(5);
  });

  it('keeps default heavy bullet pressure below the previous stronger tuning', () => {
    expect(DEFAULT_HEAVY_BULLET_COUNT).toBe(4);
    expect(DEFAULT_HEAVY_BULLET_COUNT).toBeLessThan(5);
  });

  it('keeps final heavy wave bullet pressure no higher than the reduced target', () => {
    expect(FINAL_WAVE_HEAVY_BULLET_COUNT).toBe(3);
    expect(FINAL_WAVE_HEAVY_BULLET_COUNT).toBeLessThanOrEqual(3);
  });

  it('slows heavy fire intervals from the previous strongest cadence', () => {
    expect(DEFAULT_HEAVY_FIRE_INTERVAL_MS).toBe(1050);
    expect(FINAL_WAVE_HEAVY_FIRE_INTERVAL_MS).toBe(1350);
    expect(DEFAULT_HEAVY_FIRE_INTERVAL_MS).toBeGreaterThan(900);
    expect(FINAL_WAVE_HEAVY_FIRE_INTERVAL_MS).toBeGreaterThan(900);
  });

  it('reduces heavy enemy durability without changing regular enemy HP here', () => {
    expect(HEAVY_ENEMY_HP).toBe(7);
    expect(STRAIGHT_ENEMY_HP).toBe(2);
    expect(SWAY_ENEMY_HP).toBe(3);
  });

  it('uses larger and slower projectiles for readability', () => {
    expect(PROJECTILE_RADIUS).toBe(6);
    expect(PROJECTILE_SPEED_SCALE).toBe(0.7);
  });
});
