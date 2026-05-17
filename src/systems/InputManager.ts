import type { Vector2 } from '../game/types';

export type KeyboardInput = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  confirm: boolean;
};

export type PointerInput = {
  active: boolean;
  x: number;
  y: number;
  shoot: boolean;
  source?: 'mouse' | 'touch';
};

export type GamepadInput = {
  axisX: number;
  axisY: number;
  shoot: boolean;
  confirm: boolean;
};

export type RawInputState = {
  keyboard?: KeyboardInput;
  pointer?: PointerInput;
  gamepad?: GamepadInput;
};

export type NormalizedInputState = {
  move: Vector2;
  pointerTarget: Vector2 | null;
  shoot: boolean;
  confirm: boolean;
};

const DEAD_ZONE = 0.2;
export const TOUCH_PLAYER_Y_OFFSET = 72;

export function normalizeInput(raw: RawInputState): NormalizedInputState {
  const keyboardX =
    (raw.keyboard?.right ? 1 : 0) - (raw.keyboard?.left ? 1 : 0);
  const keyboardY =
    (raw.keyboard?.down ? 1 : 0) - (raw.keyboard?.up ? 1 : 0);

  const gamepadX = applyDeadZone(raw.gamepad?.axisX ?? 0);
  const gamepadY = applyDeadZone(raw.gamepad?.axisY ?? 0);
  const move = normalizeVector({
    x: gamepadX !== 0 ? gamepadX : keyboardX,
    y: gamepadY !== 0 ? gamepadY : keyboardY,
  });

  const pointerTarget =
    raw.pointer?.active === true
      ? {
          x: raw.pointer.x,
          y:
            raw.pointer.source === 'touch'
              ? raw.pointer.y - TOUCH_PLAYER_Y_OFFSET
              : raw.pointer.y,
        }
      : null;

  return {
    move,
    pointerTarget,
    shoot: Boolean(raw.keyboard?.shoot || raw.pointer?.shoot || raw.gamepad?.shoot),
    confirm: Boolean(raw.keyboard?.confirm || raw.gamepad?.confirm),
  };
}

function applyDeadZone(value: number): number {
  return Math.abs(value) < DEAD_ZONE ? 0 : value;
}

function normalizeVector(vector: Vector2): Vector2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 1) {
    return vector;
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}
