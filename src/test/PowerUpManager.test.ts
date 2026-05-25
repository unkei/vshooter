import { describe, expect, it } from 'vitest';
import {
  POWER_UP_BLINK_AFTER_MS,
  POWER_UP_LIFETIME_MS,
  POWER_UP_SCROLL_SPEED,
  applyPowerUp,
  computePowerUpAlpha,
  createPowerUpPosition,
  powerUpCollectionEnabledDuringInvincibility,
  powerUpVisualStyle,
} from '../systems/PowerUpManager';

describe('applyPowerUp', () => {
  it('upgrades shot power with a cap', () => {
    expect(applyPowerUp({ lives: 2, shotLevel: 3, score: 0 }, 'shot')).toEqual({
      lives: 2,
      shotLevel: 4,
      score: 0,
    });
    expect(applyPowerUp({ lives: 2, shotLevel: 4, score: 0 }, 'shot')).toEqual({
      lives: 2,
      shotLevel: 4,
      score: 0,
    });
  });

  it('recovers life and grants score bonuses with caps', () => {
    expect(applyPowerUp({ lives: 2, shotLevel: 1, score: 0 }, 'life')).toEqual({
      lives: 3,
      shotLevel: 1,
      score: 0,
    });
    expect(applyPowerUp({ lives: 3, shotLevel: 1, score: 0 }, 'life')).toEqual({
      lives: 4,
      shotLevel: 1,
      score: 0,
    });
    expect(applyPowerUp({ lives: 5, shotLevel: 1, score: 0 }, 'life')).toEqual({
      lives: 5,
      shotLevel: 1,
      score: 0,
    });
    expect(applyPowerUp({ lives: 3, shotLevel: 1, score: 100 }, 'score')).toEqual({
      lives: 3,
      shotLevel: 1,
      score: 600,
    });
  });

  it('spawns deterministic drops at the defeated enemy position', () => {
    const first = createPowerUpPosition(240, 160);
    const second = createPowerUpPosition(240, 160);

    expect(first).toEqual({ x: 240, y: 160 });
    expect(second).toEqual(first);
  });

  it('scrolls, blinks near expiry, then expires power-up items', () => {
    expect(POWER_UP_SCROLL_SPEED).toBeGreaterThan(0);
    expect(POWER_UP_BLINK_AFTER_MS).toBeLessThan(POWER_UP_LIFETIME_MS);
    expect(computePowerUpAlpha(POWER_UP_BLINK_AFTER_MS - 1)).toBe(1);
    expect(computePowerUpAlpha(POWER_UP_BLINK_AFTER_MS + 100)).toBeLessThan(1);
    expect(computePowerUpAlpha(POWER_UP_LIFETIME_MS + 1)).toBe(0);
  });

  it('provides deterministic readable visual styles for each item type', () => {
    expect(powerUpVisualStyle('shot')).toEqual({
      color: 0x6ffcff,
      strokeColor: 0x102a3a,
      label: 'P',
    });
    expect(powerUpVisualStyle('life')).toEqual({
      color: 0x61ff77,
      strokeColor: 0x123819,
      label: 'L',
    });
    expect(powerUpVisualStyle('score')).toEqual({
      color: 0xfff06a,
      strokeColor: 0x3a3008,
      label: '$',
    });
  });

  it('allows power-up collection during post-hit invincibility', () => {
    expect(powerUpCollectionEnabledDuringInvincibility()).toBe(true);
  });
});
