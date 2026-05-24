import type { EnemyType, PowerUpType } from '../game/types';

export type StagePowerUpDrop = {
  enemyIndex: number;
  type: PowerUpType;
};

export type StageEvent =
  {
    atMs: number;
    type: 'wave';
    enemyType: EnemyType;
    count: number;
    pressure?: 'normal' | 'reduced';
    drops?: StagePowerUpDrop[];
  };

export type StageNumber = 1 | 2;

export type StageDefinition = {
  stageNumber: StageNumber;
  events: StageEvent[];
  nextStageNumber: StageNumber | null;
  boss: {
    rushAttack: boolean;
  };
};

export class StageDirector {
  private nextEventIndex = 0;
  private bossStarted = false;
  private readonly events: StageEvent[];

  constructor(events: StageEvent[]) {
    this.events = [...events].sort((a, b) => a.atMs - b.atMs);
  }

  update(elapsedMs: number): StageEvent[] {
    const due: StageEvent[] = [];

    while (
      this.nextEventIndex < this.events.length &&
      this.events[this.nextEventIndex].atMs <= elapsedMs
    ) {
      due.push(this.events[this.nextEventIndex]);
      this.nextEventIndex += 1;
    }

    return due;
  }

  isTimelineComplete(): boolean {
    return this.nextEventIndex >= this.events.length;
  }

  consumeBossReady(activeEnemyCount: number): boolean {
    if (this.bossStarted || !this.isTimelineComplete() || activeEnemyCount > 0) {
      return false;
    }

    this.bossStarted = true;
    return true;
  }
}

export function createDefaultStage(): StageEvent[] {
  return createStage1Events();
}

export function createStageDefinition(stageNumber: StageNumber): StageDefinition {
  if (stageNumber === 2) {
    return {
      stageNumber,
      events: createStage2Events(),
      nextStageNumber: null,
      boss: {
        rushAttack: true,
      },
    };
  }

  return {
    stageNumber,
    events: createStage1Events(),
    nextStageNumber: 2,
    boss: {
      rushAttack: false,
    },
  };
}

function createStage1Events(): StageEvent[] {
  return [
    { atMs: 0, type: 'wave', enemyType: 'straight', count: 4 },
    {
      atMs: 4200,
      type: 'wave',
      enemyType: 'straight',
      count: 5,
      drops: [{ enemyIndex: 2, type: 'shot' }],
    },
    { atMs: 8200, type: 'wave', enemyType: 'sway', count: 4 },
    {
      atMs: 12400,
      type: 'wave',
      enemyType: 'sway',
      count: 5,
      drops: [
        { enemyIndex: 1, type: 'life' },
        { enemyIndex: 2, type: 'shot' },
        { enemyIndex: 3, type: 'score' },
      ],
    },
    {
      atMs: 16800,
      type: 'wave',
      enemyType: 'heavy',
      count: 3,
      drops: [{ enemyIndex: 1, type: 'shot' }],
    },
    {
      atMs: 21200,
      type: 'wave',
      enemyType: 'heavy',
      count: 4,
      pressure: 'reduced',
      drops: [{ enemyIndex: 2, type: 'score' }],
    },
  ];
}

function createStage2Events(): StageEvent[] {
  return [
    { atMs: 0, type: 'wave', enemyType: 'straight', count: 5 },
    {
      atMs: 3600,
      type: 'wave',
      enemyType: 'sway',
      count: 5,
      drops: [{ enemyIndex: 2, type: 'shot' }],
    },
    {
      atMs: 7600,
      type: 'wave',
      enemyType: 'sway',
      count: 6,
      drops: [{ enemyIndex: 3, type: 'life' }],
    },
    {
      atMs: 11800,
      type: 'wave',
      enemyType: 'heavy',
      count: 3,
      drops: [{ enemyIndex: 1, type: 'score' }],
    },
    {
      atMs: 16200,
      type: 'wave',
      enemyType: 'heavy',
      count: 4,
      drops: [{ enemyIndex: 2, type: 'shot' }],
    },
    {
      atMs: 20600,
      type: 'wave',
      enemyType: 'heavy',
      count: 4,
      drops: [{ enemyIndex: 3, type: 'score' }],
    },
  ];
}
