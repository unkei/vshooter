import { describe, expect, it } from 'vitest';
import type { ClearBonusSceneData } from '../scenes/ClearBonusScene';
import {
  CLEAR_BONUS_ROUTE_DELAY_MS,
  CLEAR_WARP_PLAYER_DELAY_MS,
  CLEAR_WARP_PLAYER_DURATION_MS,
} from '../scenes/clearBonusTiming';
import { buildClearBonusLines } from '../scenes/clearBonusDisplay';
import { STAGE_CLEAR_OVERLAY_DELAY_MS } from '../scenes/gameplayResultOverlay';

describe('ClearBonusSceneData', () => {
  it('carries score and bonus details before the next route', () => {
    const data: ClearBonusSceneData = {
      score: 5000,
      clearBonus: 1000,
      comboBonus: 250,
      maxCombo: 5,
      highScore: 5000,
      nextStageNumber: 2,
    };

    expect(data.score).toBeGreaterThan(data.clearBonus + data.comboBonus);
    expect(data.nextStageNumber).toBe(2);
  });

  it('can mark a clear bonus scene as the final clear presentation', () => {
    const data: ClearBonusSceneData = {
      score: 7000,
      clearBonus: 1000,
      comboBonus: 500,
      maxCombo: 10,
      highScore: 7000,
      nextStageNumber: null,
    };

    expect(data.nextStageNumber).toBeNull();
  });

  it('formats clear bonus lines with animated bonus values and a stable total', () => {
    const data: ClearBonusSceneData = {
      score: 6250,
      clearBonus: 1000,
      comboBonus: 250,
      maxCombo: 5,
      highScore: 6250,
    };

    expect(buildClearBonusLines(data, 0, 0)).toEqual([
      'SCORE 5000',
      'CLEAR BONUS 0',
      'MAX COMBO BONUS 0',
      'MAX COMBO 5',
      'TOTAL 5000',
    ]);
    expect(buildClearBonusLines(data, 1000, 250)).toContain('TOTAL 6250');
  });

  it('keeps the clear bonus scene visible after the player warp animation', () => {
    const warpCompleteAtMs = CLEAR_WARP_PLAYER_DELAY_MS + CLEAR_WARP_PLAYER_DURATION_MS;

    expect(CLEAR_BONUS_ROUTE_DELAY_MS).toBeGreaterThanOrEqual(
      4_500,
    );
    expect(CLEAR_BONUS_ROUTE_DELAY_MS).toBeGreaterThan(STAGE_CLEAR_OVERLAY_DELAY_MS);
  });
});
