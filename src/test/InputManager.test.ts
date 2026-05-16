import { describe, expect, it } from 'vitest';
import { normalizeInput } from '../systems/InputManager';

describe('normalizeInput', () => {
  it('combines keyboard axes and clamps diagonal movement', () => {
    const input = normalizeInput({
      keyboard: {
        left: true,
        right: false,
        up: true,
        down: false,
        shoot: true,
        confirm: false,
      },
    });

    expect(input.shoot).toBe(true);
    expect(input.move.x).toBeCloseTo(-0.707, 3);
    expect(input.move.y).toBeCloseTo(-0.707, 3);
  });

  it('uses pointer target and gamepad buttons when available', () => {
    const input = normalizeInput({
      pointer: {
        active: true,
        x: 240,
        y: 560,
        shoot: true,
      },
      gamepad: {
        axisX: 0.1,
        axisY: 0.7,
        shoot: false,
        confirm: true,
      },
    });

    expect(input.pointerTarget).toEqual({ x: 240, y: 560 });
    expect(input.move).toEqual({ x: 0, y: 0.7 });
    expect(input.shoot).toBe(true);
    expect(input.confirm).toBe(true);
  });
});

