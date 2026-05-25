import { GAME_HEIGHT, GAME_WIDTH, PLAYER_SPEED } from '../game/constants';

export const CLEAR_WARP_ORIGIN_X = GAME_WIDTH / 2;
export const CLEAR_WARP_ORIGIN_Y = GAME_HEIGHT - 86;
export const PRE_CLEAR_PLAYER_ALIGN_SPEED = PLAYER_SPEED;

export function clearWarpOrigin(): { x: number; y: number } {
  return {
    x: CLEAR_WARP_ORIGIN_X,
    y: CLEAR_WARP_ORIGIN_Y,
  };
}

export function shouldAlignPlayerBeforeClearOverlay(): boolean {
  return true;
}

export function preClearPlayerAlignDurationMs(fromX: number, fromY: number): number {
  const distance = Math.hypot(CLEAR_WARP_ORIGIN_X - fromX, CLEAR_WARP_ORIGIN_Y - fromY);
  return Math.round((distance / PRE_CLEAR_PLAYER_ALIGN_SPEED) * 1000);
}
