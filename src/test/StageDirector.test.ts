import { describe, expect, it } from 'vitest';
import { StageDirector } from '../systems/StageDirector';

describe('StageDirector', () => {
  it('emits each scheduled wave once and then emits boss start', () => {
    const stage = new StageDirector([
      { atMs: 1000, type: 'wave', enemyType: 'straight', count: 3 },
      { atMs: 2000, type: 'wave', enemyType: 'sway', count: 2 },
      { atMs: 3000, type: 'boss' },
    ]);

    expect(stage.update(999)).toEqual([]);
    expect(stage.update(1000)).toEqual([
      { atMs: 1000, type: 'wave', enemyType: 'straight', count: 3 },
    ]);
    expect(stage.update(2500)).toEqual([
      { atMs: 2000, type: 'wave', enemyType: 'sway', count: 2 },
    ]);
    expect(stage.update(3500)).toEqual([{ atMs: 3000, type: 'boss' }]);
    expect(stage.update(5000)).toEqual([]);
    expect(stage.isTimelineComplete()).toBe(true);
  });
});

