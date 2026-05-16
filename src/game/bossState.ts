export type RenderableState = {
  active?: boolean;
  visible?: boolean;
};

export function isRenderableBossSprite(sprite: RenderableState | null): boolean {
  return sprite?.active === true && sprite.visible === true;
}

