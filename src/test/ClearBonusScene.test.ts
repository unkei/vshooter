import { describe, expect, it } from 'vitest';
import type { ClearBonusSceneData } from '../scenes/ClearBonusScene';

describe('ClearBonusSceneData', () => {
  it('carries score and bonus details before the final result scene', () => {
    const data: ClearBonusSceneData = {
      score: 5000,
      clearBonus: 1000,
      comboBonus: 250,
      maxCombo: 5,
      highScore: 5000,
    };

    expect(data.score).toBeGreaterThan(data.clearBonus + data.comboBonus);
  });
});
