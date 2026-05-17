export type RenderableState = {
  active?: boolean;
  visible?: boolean;
};

export const BOSS_MAX_HP = 1890;
export const BOSS_HIT_FEEDBACK_MODE = 'none';
export const BOSS_ENTRANCE_DELAY_MS = 1700;
export const BOSS_DEFEAT_CLEAR_DELAY_MS = 1500;

export type BossDefeatBurst = {
  x: number;
  y: number;
  radius: number;
  delayMs: number;
};

type KinematicBossBody = {
  moves?: boolean;
  setImmovable?: (value: boolean) => unknown;
  setPushable?: (value: boolean) => unknown;
  setVelocity?: (x: number, y: number) => unknown;
  setAllowGravity?: (value: boolean) => unknown;
};

type DisableableBossBody = {
  enable?: boolean;
};

export function isRenderableBossSprite(sprite: RenderableState | null): boolean {
  return sprite?.active === true && sprite.visible === true;
}

export function configureBossBody(body: KinematicBossBody): void {
  body.setImmovable?.(true);
  body.setPushable?.(false);
  body.setVelocity?.(0, 0);
  body.setAllowGravity?.(false);
  body.moves = false;
}

export function createBossDefeatBursts(x: number, y: number): BossDefeatBurst[] {
  return [
    { x, y, radius: 76, delayMs: 0 },
    { x: x - 46, y: y - 16, radius: 38, delayMs: 120 },
    { x: x + 48, y: y + 10, radius: 44, delayMs: 210 },
    { x: x - 12, y: y + 28, radius: 52, delayMs: 330 },
    { x: x + 8, y: y - 30, radius: 48, delayMs: 460 },
    { x: x - 56, y: y + 18, radius: 34, delayMs: 610 },
    { x: x + 58, y: y - 18, radius: 36, delayMs: 760 },
  ];
}

export function disableBossBody(body: DisableableBossBody | null | undefined): void {
  if (body !== null && body !== undefined) {
    body.enable = false;
  }
}
