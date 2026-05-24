import { describe, expect, it } from 'vitest';
import {
  STAGE_INTRO_WARP_DURATION_MS,
  STAGE_INTRO_WARP_START_OFFSET_Y,
  stageIntroStartY,
} from './stageIntro';

describe('stage intro', () => {
  it('starts the player below the combat position and eases into the stage', () => {
    expect(STAGE_INTRO_WARP_START_OFFSET_Y).toBeGreaterThanOrEqual(80);
    expect(STAGE_INTRO_WARP_DURATION_MS).toBeGreaterThanOrEqual(900);
    expect(stageIntroStartY(650)).toBe(650 + STAGE_INTRO_WARP_START_OFFSET_Y);
  });
});
