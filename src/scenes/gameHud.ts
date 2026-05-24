export type GameplayHudLineInput = {
  stageNumber: number;
  lives: number;
  maxLives: number;
  shotLevel: number;
  score: number;
  combo: number;
};

export function buildGameplayHudLine(input: GameplayHudLineInput): string {
  return [
    `STAGE ${input.stageNumber}`,
    `LIFE ${formatLifeMarkers(input.lives, input.maxLives)}`,
    `SHOT ${input.shotLevel}`,
    `SCORE ${input.score}`,
    `COMBO ${input.combo}`,
  ].join('  ');
}

function formatLifeMarkers(lives: number, maxLives: number): string {
  const markerCount = Math.max(0, maxLives);
  const filled = Math.max(0, Math.min(markerCount, lives));
  return `[${'I'.repeat(filled)}${'.'.repeat(markerCount - filled)}]`;
}
