import { describe, expect, it } from 'vitest';
import {
  CLEAR_WARP_ORIGIN_X,
  CLEAR_WARP_ORIGIN_Y,
  PRE_CLEAR_PLAYER_ALIGN_SPEED,
  preClearPlayerAlignDurationMs,
  clearWarpOrigin,
  shouldAlignPlayerBeforeClearOverlay,
} from './clearWarp';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { PLAYER_SPEED } from '../game/constants';

describe('clear warp alignment', () => {
  it('targets the center-lower warp origin before the stage-clear overlay', () => {
    expect(clearWarpOrigin()).toEqual({
      x: CLEAR_WARP_ORIGIN_X,
      y: CLEAR_WARP_ORIGIN_Y,
    });
    expect(CLEAR_WARP_ORIGIN_X).toBe(GAME_WIDTH / 2);
    expect(CLEAR_WARP_ORIGIN_Y).toBeGreaterThan(GAME_HEIGHT * 0.8);
    expect(PRE_CLEAR_PLAYER_ALIGN_SPEED).toBe(PLAYER_SPEED);
    expect(shouldAlignPlayerBeforeClearOverlay()).toBe(true);
  });

  it('moves toward the clear warp origin at normal player speed', () => {
    expect(
      preClearPlayerAlignDurationMs(
        CLEAR_WARP_ORIGIN_X,
        CLEAR_WARP_ORIGIN_Y - PLAYER_SPEED,
      ),
    ).toBe(1000);
  });
});
