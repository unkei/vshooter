import { describe, expect, it } from 'vitest';
import {
  firstActiveGamepad,
  gamepadAxisValue,
  gamepadConfirmPressed,
  gamepadShotPressed,
} from '../systems/GamepadInput';

describe('GamepadInput', () => {
  it('falls back to sparse browser gamepad slots when Phaser pad1 is unavailable', () => {
    const sparsePad = {
      axes: [0, 0],
      buttons: [{ pressed: false }, { pressed: false }],
    };

    expect(firstActiveGamepad(null, [null, sparsePad])).toBe(sparsePad);
  });

  it('detects start and primary button confirms', () => {
    expect(
      gamepadConfirmPressed({
        buttons: Array.from({ length: 10 }, (_, index) => ({
          pressed: index === 9,
        })),
      }),
    ).toBe(true);
    expect(gamepadConfirmPressed({ buttons: [{ pressed: true }] })).toBe(true);
  });

  it('detects primary and shoulder shot buttons', () => {
    expect(
      gamepadShotPressed({
        buttons: Array.from({ length: 8 }, (_, index) => ({
          pressed: index === 7,
        })),
      }),
    ).toBe(true);
  });

  it('reads both browser numeric axes and Phaser axis objects', () => {
    expect(gamepadAxisValue({ axes: [0.5] }, 0)).toBe(0.5);
    expect(gamepadAxisValue({ axes: [{ getValue: () => -0.25 }] }, 0)).toBe(
      -0.25,
    );
  });
});
