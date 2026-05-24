export type GameplayResultStatus = 'clear' | 'gameover';

export const STAGE_CLEAR_OVERLAY_DELAY_MS = 3000;
export const GAME_OVER_RETURN_TO_TITLE_DELAY_MS = 5000;

export type GameplayResultOverlayConfig = {
  text: string;
  color: string;
  nextDelayMs: number;
};

export function gameplayResultOverlayConfig(
  status: GameplayResultStatus,
): GameplayResultOverlayConfig {
  if (status === 'clear') {
    return {
      text: 'STAGE CLEAR',
      color: '#6ffcff',
      nextDelayMs: STAGE_CLEAR_OVERLAY_DELAY_MS,
    };
  }

  return {
    text: 'GAME OVER',
    color: '#ff4fd8',
    nextDelayMs: GAME_OVER_RETURN_TO_TITLE_DELAY_MS,
  };
}
