import { describe, expect, it } from 'vitest';
import {
  GAME_OVER_RETURN_TO_TITLE_DELAY_MS,
  STAGE_CLEAR_OVERLAY_DELAY_MS,
  gameplayResultOverlayConfig,
} from './gameplayResultOverlay';

describe('gameplay result overlay', () => {
  it('keeps game over on the gameplay screen for roughly ten seconds', () => {
    expect(GAME_OVER_RETURN_TO_TITLE_DELAY_MS).toBeGreaterThanOrEqual(9_000);
    expect(GAME_OVER_RETURN_TO_TITLE_DELAY_MS).toBeLessThanOrEqual(11_000);
    expect(gameplayResultOverlayConfig('gameover')).toMatchObject({
      text: 'GAME OVER',
      color: '#ff4fd8',
      nextDelayMs: GAME_OVER_RETURN_TO_TITLE_DELAY_MS,
    });
  });

  it('uses a short readable stage clear overlay before bonus presentation', () => {
    expect(STAGE_CLEAR_OVERLAY_DELAY_MS).toBeGreaterThanOrEqual(1_000);
    expect(gameplayResultOverlayConfig('clear')).toMatchObject({
      text: 'STAGE CLEAR',
      color: '#6ffcff',
      nextDelayMs: STAGE_CLEAR_OVERLAY_DELAY_MS,
    });
  });
});
