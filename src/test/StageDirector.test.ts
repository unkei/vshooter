import { describe, expect, it } from 'vitest';
import { createDefaultStage, StageDirector } from '../systems/StageDirector';

describe('StageDirector', () => {
  it('emits each scheduled wave once', () => {
    const stage = new StageDirector([
      { atMs: 1000, type: 'wave', enemyType: 'straight', count: 3 },
      { atMs: 2000, type: 'wave', enemyType: 'sway', count: 2 },
    ]);

    expect(stage.update(999)).toEqual([]);
    expect(stage.update(1000)).toEqual([
      { atMs: 1000, type: 'wave', enemyType: 'straight', count: 3 },
    ]);
    expect(stage.update(2500)).toEqual([
      { atMs: 2000, type: 'wave', enemyType: 'sway', count: 2 },
    ]);
    expect(stage.update(3500)).toEqual([]);
    expect(stage.update(5000)).toEqual([]);
    expect(stage.isTimelineComplete()).toBe(true);
  });

  it('starts the boss once all waves have been emitted and no regular enemies remain', () => {
    const stage = new StageDirector([
      { atMs: 1000, type: 'wave', enemyType: 'straight', count: 3 },
      { atMs: 2000, type: 'wave', enemyType: 'heavy', count: 2 },
    ]);

    stage.update(1000);
    expect(stage.consumeBossReady(0)).toBe(false);

    stage.update(2500);
    expect(stage.consumeBossReady(2)).toBe(false);
    expect(stage.consumeBossReady(0)).toBe(true);
    expect(stage.consumeBossReady(0)).toBe(false);
  });

  it('default stage builds pressure with several waves before boss readiness', () => {
    const events = createDefaultStage();
    const waves = events.filter((event) => event.type === 'wave');

    expect(waves).toHaveLength(6);
    expect(waves.map((event) => event.enemyType)).toEqual([
      'straight',
      'straight',
      'sway',
      'sway',
      'heavy',
      'heavy',
    ]);
    expect(events.every((event) => event.type === 'wave')).toBe(true);
  });
});
