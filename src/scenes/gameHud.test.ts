import { describe, expect, it } from 'vitest';
import { buildGameplayHudLine } from './gameHud';

describe('game HUD', () => {
  it('formats the gameplay HUD as one compact top-row line', () => {
    const line = buildGameplayHudLine({
      stageNumber: 2,
      lives: 3,
      maxLives: 5,
      shotLevel: 4,
      score: 12345,
      combo: 9,
    });

    expect(line).toBe('STAGE 2  LIFE [III..]  SHOT 4  SCORE 12345  COMBO 9');
    expect(line).not.toContain('\n');
  });
});
