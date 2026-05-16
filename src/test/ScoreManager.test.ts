import { describe, expect, it } from 'vitest';
import { ScoreManager } from '../systems/ScoreManager';

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
});

