import { describe, expect, it } from 'vitest';
import {
  CLEAR_RESULT_RETURN_DELAY_MS,
  resultPromptText,
  resultReturnsToTitleAutomatically,
} from './resultFlow';

describe('result flow', () => {
  it('returns clear results to the title automatically after a readable delay', () => {
    expect(resultReturnsToTitleAutomatically('clear')).toBe(true);
    expect(CLEAR_RESULT_RETURN_DELAY_MS).toBeGreaterThanOrEqual(2500);
  });

  it('keeps game-over results on the retry screen', () => {
    expect(resultReturnsToTitleAutomatically('gameover')).toBe(false);
  });

  it('keeps the original retry prompt text on clear and game-over results', () => {
    expect(resultPromptText('clear')).toBe('Enter / Click / Gamepad Start: Retry');
    expect(resultPromptText('gameover')).toBe('Enter / Click / Gamepad Start: Retry');
  });
});
