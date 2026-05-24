import { describe, expect, it } from 'vitest';
import {
  STAGE_CLEAR_BASE_BONUS,
  STAGE_CLEAR_MAX_COMBO_BONUS,
  ScoreManager,
} from '../systems/ScoreManager';

describe('ScoreManager', () => {
  it('increases combo and applies a multiplier to enemy defeats', () => {
    const score = new ScoreManager({ comboTimeoutMs: 2000 });

    score.addEnemyDefeat(100, 0);
    score.addEnemyDefeat(100, 500);
    score.addEnemyDefeat(100, 1000);

    expect(score.snapshot()).toMatchObject({
      score: 330,
      combo: 3,
      maxCombo: 3,
      multiplier: 1.2,
    });
  });

  it('resets combo on damage and tracks high score through storage', () => {
    const storage = new Map<string, string>();
    const score = new ScoreManager({
      comboTimeoutMs: 2000,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    });

    score.addEnemyDefeat(100, 0);
    score.addScoreBonus(250);
    score.registerDamage();
    score.finishRun();

    expect(score.snapshot()).toMatchObject({
      score: 350,
      combo: 0,
      highScore: 350,
    });
    expect(storage.get('vshooter.highScore')).toBe('350');
  });

  it('adds stage clear base and max combo bonuses', () => {
    const score = new ScoreManager({ comboTimeoutMs: 2000 });
    score.addEnemyDefeat(100, 0);
    score.addEnemyDefeat(100, 500);

    const bonuses = score.addStageClearBonuses();

    expect(bonuses).toEqual({
      clearBonus: STAGE_CLEAR_BASE_BONUS,
      comboBonus: STAGE_CLEAR_MAX_COMBO_BONUS * 2,
    });
    expect(score.snapshot().score).toBe(210 + STAGE_CLEAR_BASE_BONUS + 100);
  });

  it('can continue a multi-stage run from an existing score and max combo', () => {
    const score = new ScoreManager({
      comboTimeoutMs: 2000,
      initialScore: 4200,
      initialMaxCombo: 7,
    });

    expect(score.snapshot()).toMatchObject({
      score: 4200,
      combo: 0,
      maxCombo: 7,
    });

    score.addEnemyDefeat(100, 0);

    expect(score.snapshot()).toMatchObject({
      score: 4300,
      maxCombo: 7,
    });
  });
});
