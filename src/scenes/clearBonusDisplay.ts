import type { ClearBonusSceneData } from './ClearBonusScene';

export function buildClearBonusLines(
  data: ClearBonusSceneData,
  animatedClearBonus: number,
  animatedComboBonus: number,
): string[] {
  const clearBonus = Math.round(animatedClearBonus);
  const comboBonus = Math.round(animatedComboBonus);
  const baseScore = data.score - data.clearBonus - data.comboBonus;
  return [
    `SCORE ${baseScore}`,
    `CLEAR BONUS ${clearBonus}`,
    `MAX COMBO BONUS ${comboBonus}`,
    `MAX COMBO ${data.maxCombo}`,
    `TOTAL ${baseScore + clearBonus + comboBonus}`,
  ];
}
