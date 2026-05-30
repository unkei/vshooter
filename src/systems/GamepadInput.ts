type GamepadButtonLike = {
  pressed?: boolean;
};

export type GamepadLike = {
  axes?: ReadonlyArray<number | { getValue?: () => number }>;
  buttons?: ReadonlyArray<GamepadButtonLike>;
};

export function gamepadAxisValue(
  gamepad: GamepadLike | null | undefined,
  index: number,
): number {
  const axis = gamepad?.axes?.[index];
  if (typeof axis === 'number') {
    return axis;
  }
  return axis?.getValue?.() ?? 0;
}

export function firstActiveGamepad(
  phaserPad: GamepadLike | null | undefined,
  browserGamepads: Array<GamepadLike | null | undefined> = [],
): GamepadLike | null {
  if (phaserPad !== null && phaserPad !== undefined) {
    return phaserPad;
  }

  return browserGamepads.find((pad) => pad !== null && pad !== undefined) ?? null;
}

export function gamepadConfirmPressed(gamepad: GamepadLike | null | undefined): boolean {
  return Boolean(gamepad?.buttons?.[9]?.pressed || gamepad?.buttons?.[0]?.pressed);
}

export function gamepadShotPressed(gamepad: GamepadLike | null | undefined): boolean {
  return Boolean(
    gamepad?.buttons?.[0]?.pressed ||
      gamepad?.buttons?.[6]?.pressed ||
      gamepad?.buttons?.[7]?.pressed,
  );
}
