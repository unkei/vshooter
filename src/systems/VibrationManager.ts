export const POWER_UP_VIBRATION_PATTERN = [18, 35, 18] as const;

export type VibrationPattern = number | number[];

type VibratingNavigator = Navigator & {
  getGamepads?: () => Array<GamepadLike | null>;
  vibrate?: (pattern: VibrationPattern) => boolean;
};

type GamepadLike = {
  vibrationActuator?: {
    playEffect?: (
      type: 'dual-rumble',
      params: {
        duration: number;
        strongMagnitude: number;
        weakMagnitude: number;
      },
    ) => Promise<unknown>;
  };
};

type HapticPulse = {
  delayMs: number;
  durationMs: number;
  strongMagnitude: number;
  weakMagnitude: number;
};

export function createDamageVibrationPattern(
  remainingLives: number,
  maxLives: number,
): number[] {
  const safeMaxLives = Math.max(1, maxLives);
  const clampedLives = Math.max(0, Math.min(remainingLives, safeMaxLives));
  const severity = 1 - clampedLives / safeMaxLives;

  if (severity >= 1) {
    return [90, 40, 90];
  }
  if (severity >= 2 / 3) {
    return [70, 35, 70];
  }
  if (severity >= 1 / 3) {
    return [45, 25, 45];
  }

  return [35];
}

export class VibrationManager {
  damage(remainingLives: number, maxLives: number): void {
    const pattern = createDamageVibrationPattern(remainingLives, maxLives);
    this.vibrate(pattern, createHapticPulses(pattern, 0.8));
  }

  powerUp(): void {
    const pattern = [...POWER_UP_VIBRATION_PATTERN];
    this.vibrate(pattern, createHapticPulses(pattern, 0.5));
  }

  private vibrate(pattern: VibrationPattern, pulses: HapticPulse[]): void {
    const vibratingNavigator = globalThis.navigator as
      | VibratingNavigator
      | undefined;
    if (typeof vibratingNavigator?.vibrate === 'function') {
      vibratingNavigator.vibrate(pattern);
    }

    const gamepads = vibratingNavigator?.getGamepads?.() ?? [];
    for (const gamepad of gamepads) {
      const actuator = gamepad?.vibrationActuator;
      const playEffect = actuator?.playEffect;
      if (typeof playEffect !== 'function') {
        continue;
      }

      for (const pulse of pulses) {
        globalThis.setTimeout(() => {
          void playEffect.call(actuator, 'dual-rumble', {
            duration: pulse.durationMs,
            strongMagnitude: pulse.strongMagnitude,
            weakMagnitude: pulse.weakMagnitude,
          });
        }, pulse.delayMs);
      }
    }
  }
}

function createHapticPulses(
  pattern: readonly number[],
  weakMagnitude: number,
): HapticPulse[] {
  const pulses: HapticPulse[] = [];
  let delayMs = 0;

  pattern.forEach((durationMs, index) => {
    if (index % 2 === 0) {
      pulses.push({
        delayMs,
        durationMs,
        strongMagnitude: Math.min(1, weakMagnitude * 0.7),
        weakMagnitude,
      });
    }

    delayMs += durationMs;
  });

  return pulses;
}
