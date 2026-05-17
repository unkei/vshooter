export type ArcadeBodyOwner = {
  body?: unknown;
};

type ManualArcadeBody = {
  moves?: boolean;
  setVelocity?: (x: number, y: number) => unknown;
  setAllowGravity?: (value: boolean) => unknown;
};

export function syncArcadeBody(object: ArcadeBodyOwner | null): void {
  const body = object?.body as
    | {
        updateFromGameObject?: () => void;
      }
    | null
    | undefined;
  body?.updateFromGameObject?.();
}

export function approachVelocity(
  current: number,
  target: number,
  acceleration: number,
  deceleration: number,
  deltaSeconds: number,
): number {
  const rate = target === 0 ? deceleration : acceleration;
  const step = rate * deltaSeconds;

  if (current < target) {
    return Math.min(current + step, target);
  }

  if (current > target) {
    return Math.max(current - step, target);
  }

  return target;
}

export function configureManualArcadeBody(body: ManualArcadeBody): void {
  body.setVelocity?.(0, 0);
  body.setAllowGravity?.(false);
  body.moves = false;
}
