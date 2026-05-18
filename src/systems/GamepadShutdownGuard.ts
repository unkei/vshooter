type SparseGamepadPlugin = {
  gamepads?: unknown[];
  stopListeners?: () => void;
  __vshooterShutdownGuardInstalled?: boolean;
};

type PhaserWithGamepadPlugin = {
  Input?: {
    Gamepad?: {
      GamepadPlugin?: {
        prototype?: SparseGamepadPlugin;
      };
    };
  };
};

export function compactGamepadsForShutdown(plugin: SparseGamepadPlugin): void {
  if (!Array.isArray(plugin.gamepads)) {
    return;
  }

  plugin.gamepads = plugin.gamepads.filter(Boolean);
}

export function installGamepadShutdownGuard(
  phaserNamespace: PhaserWithGamepadPlugin,
): void {
  const prototype =
    phaserNamespace.Input?.Gamepad?.GamepadPlugin?.prototype;
  if (
    prototype === undefined ||
    prototype.__vshooterShutdownGuardInstalled === true ||
    typeof prototype.stopListeners !== 'function'
  ) {
    return;
  }

  const originalStopListeners = prototype.stopListeners;
  prototype.stopListeners = function guardedStopListeners(
    this: SparseGamepadPlugin,
  ): void {
    const originalGamepads = this.gamepads;
    if (Array.isArray(originalGamepads)) {
      this.gamepads = originalGamepads.filter(Boolean);
    }

    try {
      originalStopListeners.call(this);
    } finally {
      if (originalGamepads !== undefined) {
        this.gamepads = originalGamepads;
      }
    }
  };
  prototype.__vshooterShutdownGuardInstalled = true;
}
