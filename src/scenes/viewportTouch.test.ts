import { describe, expect, it } from 'vitest';
import { viewportPointToGamePoint } from './viewportTouch';

describe('viewport touch mapping', () => {
  it('maps touches outside the rendered canvas into extended game coordinates', () => {
    const point = viewportPointToGamePoint(
      { x: 10, y: 860 },
      { left: 20, top: 80, width: 360, height: 720 },
    );

    expect(point.x).toBeCloseTo(-13.333, 3);
    expect(point.y).toBe(780);
  });
});
