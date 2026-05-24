export type RenderableState = {
  active?: boolean;
  visible?: boolean;
};

export const BOSS_MAX_HP = 1890;
export const BOSS_HIT_FEEDBACK_MODE = 'tint-flash';
export const BOSS_HIT_FLASH_DURATION_MS = 90;
export const BOSS_HIT_FLASH_MIN_INTERVAL_MS = 170;
export const BOSS_HIT_FLASH_OVERLAY_ALPHA = 0.48;
export const BOSS_LOCKS_VISUAL_STATE_ON_HIT = true;
export const BOSS_PRESERVES_BASE_SPRITE_DURING_HIT_FLASH = true;
export const BOSS_USES_CAMERA_FLASH = false;
export const BOSS_DEFEAT_FADES_SPRITE = false;
export const BOSS_CLEAR_OVERLAY_FADES_DEFEAT_BODY = true;
export const BOSS_PRE_WARNING_GRACE_MS = 650;
export const BOSS_ENTRANCE_TRAVEL_MS = 900;
export const BOSS_ENTRY_START_Y = -150;
export const BOSS_ENTRY_TARGET_Y = 120;
export const BOSS_ENTRANCE_DELAY_MS = 1700;
export const BOSS_DEFEAT_CLEAR_DELAY_MS = 1800;
export const BOSS_DEFEAT_SPRITE_DEPTH = 34;
export const BOSS_DEFEAT_SPRITE_DESTROY_DELAY_MS = BOSS_DEFEAT_CLEAR_DELAY_MS + 3000;
export const BOSS_DEFEAT_USES_DEDICATED_BODY = true;
export const BOSS_RUSH_ATTACK_ENABLED_BY_DEFAULT = false;
export const BOSS_RUSH_INTERVAL_MS = 5200;
export const BOSS_RUSH_DURATION_MS = 1200;
export const BOSS_RUSH_TARGET_Y = 260;

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

export function shouldStartBossHitFlash(
  lastFlashStartedAtMs: number,
  timeMs: number,
): boolean {
  return timeMs - lastFlashStartedAtMs >= BOSS_HIT_FLASH_MIN_INTERVAL_MS;
}

export function createBossDefeatBursts(x: number, y: number): BossDefeatBurst[] {
  return [
    { x, y, radius: 76, delayMs: 0 },
    { x: x - 46, y: y - 16, radius: 38, delayMs: 190 },
    { x: x + 48, y: y + 10, radius: 44, delayMs: 380 },
    { x: x - 12, y: y + 28, radius: 52, delayMs: 610 },
    { x: x + 8, y: y - 30, radius: 48, delayMs: 840 },
    { x: x - 56, y: y + 18, radius: 34, delayMs: 1110 },
    { x: x + 58, y: y - 18, radius: 36, delayMs: 1320 },
  ];
}

export function disableBossBody(body: DisableableBossBody | null | undefined): void {
  if (body !== null && body !== undefined) {
    body.enable = false;
  }
}
