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
  mode?: 'direct' | 'virtualStick';
  originX?: number;
  originY?: number;
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
const ANALOG_RESPONSE_CURVE = 1.5;
const VIRTUAL_STICK_RADIUS = 40;
export const TOUCH_POINTER_TARGET_OFFSET_Y = 58;

export function normalizeInput(raw: RawInputState): NormalizedInputState {
  const keyboardX =
    (raw.keyboard?.right ? 1 : 0) - (raw.keyboard?.left ? 1 : 0);
  const keyboardY =
    (raw.keyboard?.down ? 1 : 0) - (raw.keyboard?.up ? 1 : 0);

  const gamepadMove = applyRadialDeadZone({
    x: raw.gamepad?.axisX ?? 0,
    y: raw.gamepad?.axisY ?? 0,
  });
  const pointerMode = getPointerMode(raw.pointer);
  const pointerMove = getPointerMove(raw.pointer);
  const move = normalizeVector({
    x: pointerMove?.x ?? (isMoving(gamepadMove) ? gamepadMove.x : keyboardX),
    y: pointerMove?.y ?? (isMoving(gamepadMove) ? gamepadMove.y : keyboardY),
  });

  const pointerTarget =
    raw.pointer?.active === true && pointerMode !== 'virtualStick'
      ? {
          x: raw.pointer.x,
          y:
            raw.pointer.source === 'touch'
              ? raw.pointer.y - TOUCH_POINTER_TARGET_OFFSET_Y
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

function applyRadialDeadZone(vector: Vector2): Vector2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= DEAD_ZONE) {
    return { x: 0, y: 0 };
  }

  const clampedLength = Math.min(length, 1);
  const scaledLength = (clampedLength - DEAD_ZONE) / (1 - DEAD_ZONE);
  const curvedLength = scaledLength ** ANALOG_RESPONSE_CURVE;
  const directionX = vector.x / length;
  const directionY = vector.y / length;

  return {
    x: directionX * curvedLength,
    y: directionY * curvedLength,
  };
}

function getPointerMove(pointer: PointerInput | undefined): Vector2 | null {
  if (pointer?.active !== true || getPointerMode(pointer) !== 'virtualStick') {
    return null;
  }

  const originX = pointer.originX ?? pointer.x;
  const originY = pointer.originY ?? pointer.y;

  return normalizeVector({
    x: (pointer.x - originX) / VIRTUAL_STICK_RADIUS,
    y: (pointer.y - originY) / VIRTUAL_STICK_RADIUS,
  });
}

function getPointerMode(pointer: PointerInput | undefined): 'direct' | 'virtualStick' {
  return pointer?.mode ?? (pointer?.source === 'touch' ? 'virtualStick' : 'direct');
}

function isMoving(vector: Vector2): boolean {
  return vector.x !== 0 || vector.y !== 0;
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
