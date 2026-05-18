import { describe, expect, it, vi } from 'vitest';
import {
  compactGamepadsForShutdown,
  installGamepadShutdownGuard,
} from '../systems/GamepadShutdownGuard';

describe('GamepadShutdownGuard', () => {
  it('removes sparse gamepad slots before Phaser shutdown iterates them', () => {
    const pad = { removeAllListeners: vi.fn() };
    const plugin = {
      gamepads: [undefined, pad, undefined],
    };

    compactGamepadsForShutdown(plugin);

    expect(plugin.gamepads).toEqual([pad]);
  });

  it('patches Phaser GamepadPlugin shutdown without double-wrapping it or changing pad indexes', () => {
    const originalStopListeners = vi.fn(function (
      this: { gamepads: Array<unknown> },
    ) {
      for (const pad of this.gamepads) {
        (pad as { removeAllListeners: () => void }).removeAllListeners();
      }
    });
    const prototype = {
      stopListeners: originalStopListeners,
    };
    const phaserNamespace = {
      Input: {
        Gamepad: {
          GamepadPlugin: {
            prototype,
          },
        },
      },
    };
    const pad = { removeAllListeners: vi.fn() };
    const sparseGamepads = [undefined, pad];
    const plugin = {
      gamepads: sparseGamepads,
    };

    installGamepadShutdownGuard(phaserNamespace);
    const patchedOnce = prototype.stopListeners;
    installGamepadShutdownGuard(phaserNamespace);

    expect(prototype.stopListeners).toBe(patchedOnce);
    expect(() => prototype.stopListeners.call(plugin)).not.toThrow();
    expect(plugin.gamepads).toBe(sparseGamepads);
    expect(plugin.gamepads).toEqual([undefined, pad]);
    expect(pad.removeAllListeners).toHaveBeenCalledTimes(1);
  });
});
