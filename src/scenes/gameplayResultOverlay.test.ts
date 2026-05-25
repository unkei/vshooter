import { describe, expect, it } from 'vitest';
import {
  GAME_OVER_RETURN_TO_TITLE_DELAY_MS,
  STAGE_CLEAR_OVERLAY_DELAY_MS,
  gameplayResultOverlayConfig,
} from './gameplayResultOverlay';

describe('gameplay result overlay', () => {
  it('keeps game over on the gameplay screen for roughly five seconds', () => {
    expect(GAME_OVER_RETURN_TO_TITLE_DELAY_MS).toBeGreaterThanOrEqual(4_500);
    expect(GAME_OVER_RETURN_TO_TITLE_DELAY_MS).toBeLessThanOrEqual(5_500);
    expect(gameplayResultOverlayConfig('gameover')).toMatchObject({
      text: 'GAME OVER',
      color: '#ff4fd8',
      nextDelayMs: GAME_OVER_RETURN_TO_TITLE_DELAY_MS,
    });
  });

  it('does not add secondary return text to the game over overlay', () => {
    expect(gameplayResultOverlayConfig('gameover').subtext).toBeNull();
  });

  it('uses a longer readable stage clear overlay before bonus presentation', () => {
    expect(STAGE_CLEAR_OVERLAY_DELAY_MS).toBe(2_000);
    expect(gameplayResultOverlayConfig('clear')).toMatchObject({
      text: 'STAGE CLEAR',
      color: '#6ffcff',
      nextDelayMs: STAGE_CLEAR_OVERLAY_DELAY_MS,
    });
  });
});
