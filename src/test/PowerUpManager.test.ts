import { describe, expect, it } from 'vitest';
import { applyPowerUp } from '../systems/PowerUpManager';

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
});
