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

  it('uses mouse pointer target and gamepad buttons when available', () => {
    const input = normalizeInput({
      pointer: {
        active: true,
        x: 240,
        y: 560,
        shoot: true,
        source: 'mouse',
        mode: 'direct',
      },
      gamepad: {
        axisX: 0,
        axisY: 0.7,
        shoot: false,
        confirm: true,
      },
    });

    expect(input.pointerTarget).toEqual({ x: 240, y: 560 });
    expect(input.move.x).toBe(0);
    expect(input.move.y).toBeCloseTo(0.494, 3);
    expect(input.shoot).toBe(true);
    expect(input.confirm).toBe(true);
  });

  it('scales gamepad movement radially beyond the deadzone for fine positioning', () => {
    const input = normalizeInput({
      gamepad: {
        axisX: 0.24,
        axisY: 0,
        shoot: false,
        confirm: false,
      },
    });

    expect(input.move.x).toBeGreaterThan(0);
    expect(input.move.x).toBeLessThan(0.1);
    expect(input.move.y).toBe(0);
  });

  it('normalizes diagonal gamepad movement to a maximum magnitude of one', () => {
    const input = normalizeInput({
      gamepad: {
        axisX: 1,
        axisY: 1,
        shoot: false,
        confirm: false,
      },
    });

    expect(Math.hypot(input.move.x, input.move.y)).toBeLessThanOrEqual(1);
    expect(input.move.x).toBeCloseTo(0.707, 3);
    expect(input.move.y).toBeCloseTo(0.707, 3);
  });

  it('converts touch virtual stick offset into movement without a pointer target', () => {
    const input = normalizeInput({
      pointer: {
        active: true,
        x: 200,
        y: 460,
        shoot: true,
        source: 'touch',
        mode: 'virtualStick',
        originX: 200,
        originY: 500,
      },
    });

    expect(input.pointerTarget).toBeNull();
    expect(input.move).toEqual({ x: 0, y: -1 });
    expect(input.shoot).toBe(true);
  });

  it('defaults touch pointer input to virtual stick mode', () => {
    const input = normalizeInput({
      pointer: {
        active: true,
        x: 230,
        y: 500,
        shoot: true,
        source: 'touch',
        originX: 200,
        originY: 500,
      },
    });

    expect(input.pointerTarget).toBeNull();
    expect(input.move.x).toBeCloseTo(0.75, 3);
    expect(input.move.y).toBe(0);
  });
});
