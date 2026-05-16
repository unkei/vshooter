import type { EnemyType } from '../game/types';

export type StageEvent =
  | {
      atMs: number;
      type: 'wave';
      enemyType: EnemyType;
      count: number;
    }
  | {
      atMs: number;
      type: 'boss';
    };

export class StageDirector {
  private nextEventIndex = 0;
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
}

export function createDefaultStage(): StageEvent[] {
  return [
    { atMs: 0, type: 'wave', enemyType: 'straight', count: 4 },
    { atMs: 5000, type: 'wave', enemyType: 'sway', count: 4 },
    { atMs: 8500, type: 'boss' },
  ];
}
