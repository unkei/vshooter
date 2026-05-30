import type { StageNumber } from '../systems/StageDirector';

export type ClearBonusRouteData = {
  score: number;
  maxCombo: number;
  highScore: number;
  nextStageNumber?: StageNumber | null;
};

export type ClearBonusNextScene =
  | {
      key: 'GameScene';
      data: {
        stageNumber: StageNumber;
        initialScore: number;
        initialMaxCombo: number;
      };
    }
  | {
      key: 'EndingScene';
      data: {
        score: number;
        maxCombo: number;
        highScore: number;
      };
    };

export function clearBonusNextScene(
  data: ClearBonusRouteData,
): ClearBonusNextScene {
  if (data.nextStageNumber !== null && data.nextStageNumber !== undefined) {
    return {
      key: 'GameScene',
      data: {
        stageNumber: data.nextStageNumber,
        initialScore: data.score,
        initialMaxCombo: data.maxCombo,
      },
    };
  }

  return {
    key: 'EndingScene',
    data: {
      score: data.score,
      maxCombo: data.maxCombo,
      highScore: data.highScore,
    },
  };
}
