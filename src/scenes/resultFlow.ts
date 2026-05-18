import type { ResultSceneData } from './ResultScene';

export const CLEAR_RESULT_RETURN_DELAY_MS = 3600;

export function resultReturnsToTitleAutomatically(
  status: ResultSceneData['status'],
): boolean {
  return status === 'clear';
}

export function resultPromptText(_status: ResultSceneData['status']): string {
  return 'Enter / Click / Gamepad Start: Retry';
}
