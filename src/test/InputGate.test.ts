import { describe, expect, it } from 'vitest';
import { FreshPressGate, KeyboardReleaseGate } from '../systems/InputGate';
import type { KeyboardInput } from '../systems/InputManager';

const released: KeyboardInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
  confirm: false,
};

describe('KeyboardReleaseGate', () => {
  it('suppresses held gameplay input until all keys are released', () => {
    const gate = new KeyboardReleaseGate();

    expect(
      gate.filter({
        ...released,
        right: true,
        shoot: true,
      }),
    ).toEqual(released);
    expect(gate.isLocked()).toBe(true);

    expect(gate.filter(released)).toEqual(released);
    expect(gate.isLocked()).toBe(false);
  });

  it('passes new keyboard input after the release has been observed', () => {
    const gate = new KeyboardReleaseGate();

    gate.filter({ ...released, left: true });
    gate.filter(released);

    expect(gate.filter({ ...released, shoot: true })).toEqual({
      ...released,
      shoot: true,
    });
  });
});

describe('FreshPressGate', () => {
  it('requires a release before accepting a held confirm press', () => {
    const gate = new FreshPressGate();

    expect(gate.accepts(true)).toBe(false);
    expect(gate.accepts(false)).toBe(false);
    expect(gate.accepts(true)).toBe(true);
  });

  it('requires another release after accepting a press', () => {
    const gate = new FreshPressGate();

    gate.accepts(false);
    expect(gate.accepts(true)).toBe(true);
    expect(gate.accepts(true)).toBe(false);
    expect(gate.accepts(false)).toBe(false);
    expect(gate.accepts(true)).toBe(true);
  });
});
