import { describe, expect, it } from 'vitest';
import {
  TITLE_STARFIELD_MIN_SCROLL_SPEED,
  TITLE_STARFIELD_STAR_COUNT,
  advanceTitleStar,
} from './titleStarfield';

describe('title starfield', () => {
  it('scrolls stars downward and wraps them back above the title screen', () => {
    expect(TITLE_STARFIELD_STAR_COUNT).toBeGreaterThanOrEqual(90);
    expect(TITLE_STARFIELD_MIN_SCROLL_SPEED).toBeGreaterThan(0);

    const moved = advanceTitleStar(
      { x: 120, y: 100, radius: 1.2, alpha: 0.7, speed: 40 },
      500,
      480,
      640,
      () => 220,
    );
    expect(moved).toMatchObject({ x: 120, y: 120 });

    const wrapped = advanceTitleStar(
      { x: 120, y: 650, radius: 1.2, alpha: 0.7, speed: 40 },
      500,
      480,
      640,
      () => 220,
    );
    expect(wrapped.x).toBe(220);
    expect(wrapped.y).toBeLessThan(0);
  });
});
