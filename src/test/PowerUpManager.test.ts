import { describe, expect, it } from 'vitest';
import {
  POWER_UP_BLINK_AFTER_MS,
  POWER_UP_LIFETIME_MS,
  POWER_UP_SCROLL_SPEED,
  applyPowerUp,
  computePowerUpAlpha,
  createPowerUpSpawnPoint,
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

  it('spawns drops near the defeated enemy instead of at one fixed point', () => {
    const first = createPowerUpSpawnPoint(240, 160, () => 0);
    const second = createPowerUpSpawnPoint(240, 160, () => 1);

    expect(first).not.toEqual(second);
    expect(first.x).toBeLessThan(240);
    expect(second.x).toBeGreaterThan(240);
  });

  it('scrolls, blinks near expiry, then expires power-up items', () => {
    expect(POWER_UP_SCROLL_SPEED).toBeGreaterThan(0);
    expect(POWER_UP_BLINK_AFTER_MS).toBeLessThan(POWER_UP_LIFETIME_MS);
    expect(computePowerUpAlpha(POWER_UP_BLINK_AFTER_MS - 1)).toBe(1);
    expect(computePowerUpAlpha(POWER_UP_BLINK_AFTER_MS + 100)).toBeLessThan(1);
    expect(computePowerUpAlpha(POWER_UP_LIFETIME_MS + 1)).toBe(0);
  });
});
