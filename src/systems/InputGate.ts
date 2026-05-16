import type { KeyboardInput } from './InputManager';

const RELEASED_KEYBOARD: KeyboardInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
  confirm: false,
};

export class KeyboardReleaseGate {
  private locked = true;

  filter(input: KeyboardInput): KeyboardInput {
    if (!this.locked) {
      return input;
    }

    if (!hasAnyGameplayInput(input)) {
      this.locked = false;
    }

    return RELEASED_KEYBOARD;
  }

  isLocked(): boolean {
    return this.locked;
  }
}

function hasAnyGameplayInput(input: KeyboardInput): boolean {
  return input.left || input.right || input.up || input.down || input.shoot;
}

