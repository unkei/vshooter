export type RenderableState = {
  active?: boolean;
  visible?: boolean;
};

export const BOSS_MAX_HP = 210;

type KinematicBossBody = {
  setImmovable?: (value: boolean) => unknown;
  setPushable?: (value: boolean) => unknown;
  setVelocity?: (x: number, y: number) => unknown;
};

export function isRenderableBossSprite(sprite: RenderableState | null): boolean {
  return sprite?.active === true && sprite.visible === true;
}

export function configureBossBody(body: KinematicBossBody): void {
  body.setImmovable?.(true);
  body.setPushable?.(false);
  body.setVelocity?.(0, 0);
}
