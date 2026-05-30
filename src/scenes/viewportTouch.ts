import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';

export type ViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ViewportPoint = {
  x: number;
  y: number;
};

export function viewportPointToGamePoint(
  point: ViewportPoint,
  rect: ViewportRect,
): ViewportPoint {
  return {
    x: ((point.x - rect.left) / rect.width) * GAME_WIDTH,
    y: ((point.y - rect.top) / rect.height) * GAME_HEIGHT,
  };
}
