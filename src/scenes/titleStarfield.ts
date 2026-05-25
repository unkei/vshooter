export type TitleStarState = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
};

export const TITLE_STARFIELD_STAR_COUNT = 90;
export const TITLE_STARFIELD_MIN_SCROLL_SPEED = 18;
export const TITLE_STARFIELD_MAX_SCROLL_SPEED = 58;

export function advanceTitleStar(
  star: TitleStarState,
  deltaMs: number,
  width: number,
  height: number,
  randomX: () => number = () => Math.random() * width,
): TitleStarState {
  const nextY = star.y + star.speed * (deltaMs / 1000);

  if (nextY <= height + star.radius) {
    return { ...star, y: nextY };
  }

  return {
    ...star,
    x: randomX(),
    y: -star.radius,
  };
}
