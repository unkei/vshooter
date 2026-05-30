import type { ResultSceneData } from './ResultScene';

export const CLEAR_RESULT_RETURN_DELAY_MS = 3000;

export function newRunGameSceneData(): {
  stageNumber: 1;
  initialScore: 0;
  initialMaxCombo: 0;
} {
  return {
    stageNumber: 1,
    initialScore: 0,
    initialMaxCombo: 0,
  };
}

export function resultReturnsToTitleAutomatically(
  status: ResultSceneData['status'],
): boolean {
  return status === 'clear';
}

export function resultPromptText(_status: ResultSceneData['status']): string {
  return 'Enter / Click / Gamepad Start: Retry';
}
