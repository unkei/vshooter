import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  VibrationManager,
  createDamageVibrationPattern,
  POWER_UP_VIBRATION_PATTERN,
  BOSS_ENTRANCE_VIBRATION_PATTERN,
  BOSS_DEFEAT_VIBRATION_PATTERN,
  WARP_VIBRATION_PATTERN,
} from '../systems/VibrationManager';

describe('VibrationManager', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('increases damage feedback as remaining lives decrease', () => {
    expect(createDamageVibrationPattern(3, 3)).toEqual([35]);
    expect(createDamageVibrationPattern(2, 3)).toEqual([45, 25, 45]);
    expect(createDamageVibrationPattern(1, 3)).toEqual([70, 35, 70]);
    expect(createDamageVibrationPattern(0, 3)).toEqual([90, 40, 90]);
  });

  it('uses a short double-click pattern for power-up pickups', () => {
    expect(POWER_UP_VIBRATION_PATTERN).toEqual([18, 35, 18]);
  });

  it('defines distinct haptic patterns for boss and warp events', () => {
    expect(BOSS_ENTRANCE_VIBRATION_PATTERN).toEqual([55]);
    expect(BOSS_DEFEAT_VIBRATION_PATTERN).toEqual([90, 45, 120]);
    expect(WARP_VIBRATION_PATTERN).toEqual([35, 25, 35, 25, 70]);
  });

  it('does nothing when the browser has no vibration support', () => {
    vi.stubGlobal('navigator', {});

    expect(() => new VibrationManager().damage(1, 3)).not.toThrow();
    expect(() => new VibrationManager().powerUp()).not.toThrow();
  });

  it('sends supported patterns to navigator.vibrate', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const vibration = new VibrationManager();

    vibration.damage(1, 3);
    vibration.powerUp();
    vibration.bossEntrance();
    vibration.bossDefeat();
    vibration.warp();

    expect(vibrate).toHaveBeenNthCalledWith(1, [70, 35, 70]);
    expect(vibrate).toHaveBeenNthCalledWith(2, POWER_UP_VIBRATION_PATTERN);
    expect(vibrate).toHaveBeenNthCalledWith(3, BOSS_ENTRANCE_VIBRATION_PATTERN);
    expect(vibrate).toHaveBeenNthCalledWith(4, BOSS_DEFEAT_VIBRATION_PATTERN);
    expect(vibrate).toHaveBeenNthCalledWith(5, WARP_VIBRATION_PATTERN);
  });

  it('uses available gamepad haptics for supported devices', () => {
    vi.useFakeTimers();
    const playEffect = vi.fn();
    vi.stubGlobal('navigator', {
      getGamepads: () => [
        {
          vibrationActuator: { playEffect },
        },
      ],
    });
    const vibration = new VibrationManager();

    vibration.powerUp();
    vi.advanceTimersByTime(53);

    expect(playEffect).toHaveBeenNthCalledWith(1, 'dual-rumble', {
      duration: 18,
      strongMagnitude: 0.35,
      weakMagnitude: 0.5,
    });
    expect(playEffect).toHaveBeenNthCalledWith(2, 'dual-rumble', {
      duration: 18,
      strongMagnitude: 0.35,
      weakMagnitude: 0.5,
    });
  });
});
