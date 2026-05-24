export const STAGE_INTRO_WARP_START_OFFSET_Y = 96;
export const STAGE_INTRO_WARP_DURATION_MS = 1100;

export function stageIntroStartY(targetY: number): number {
  return targetY + STAGE_INTRO_WARP_START_OFFSET_Y;
}
