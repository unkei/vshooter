import { describe, expect, it } from 'vitest';
import {
  createDefaultStage,
  createStageDefinition,
  StageDirector,
} from '../systems/StageDirector';

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

  it('defines stage 1 as the approachable opening stage before stage 2', () => {
    const stage = createStageDefinition(1);

    expect(stage.stageNumber).toBe(1);
    expect(stage.nextStageNumber).toBe(2);
    expect(stage.boss.rushAttack).toBe(false);
    expect(stage.boss.maxHp).toBe(1260);
    expect(stage.boss.maxHp).toBeLessThan(createStageDefinition(2).boss.maxHp);
    expect(stage.events).toEqual(createDefaultStage());
  });

  it('defines stage 2 as the final stronger-pressure stage', () => {
    const stage = createStageDefinition(2);
    const waves = stage.events.filter((event) => event.type === 'wave');
    const drops = waves.flatMap((wave) => wave.drops ?? []);

    expect(stage.stageNumber).toBe(2);
    expect(stage.nextStageNumber).toBeNull();
    expect(stage.boss.rushAttack).toBe(true);
    expect(stage.boss.maxHp).toBe(1890);
    expect(waves).toHaveLength(6);
    expect(waves.map((event) => event.enemyType)).toEqual([
      'straight',
      'sway',
      'sway',
      'heavy',
      'heavy',
      'heavy',
    ]);
    expect(waves.filter((event) => event.pressure !== 'reduced')).toHaveLength(6);
    expect(drops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'shot' }),
        expect.objectContaining({ type: 'life' }),
      ]),
    );
  });

  it('places at least two shot upgrade drops before heavy waves dominate', () => {
    const waves = createDefaultStage();
    const firstHeavyWaveIndex = waves.findIndex((wave) => wave.enemyType === 'heavy');
    const earlyShotDrops = waves
      .slice(0, firstHeavyWaveIndex)
      .flatMap((wave) => wave.drops ?? [])
      .filter((drop) => drop.type === 'shot');

    expect(firstHeavyWaveIndex).toBeGreaterThan(0);
    expect(earlyShotDrops).toHaveLength(2);
  });

  it('keeps stage 1 heavy wave counts and lowers only the final heavy pressure', () => {
    const heavyWaves = createDefaultStage().filter(
      (event) => event.enemyType === 'heavy',
    );

    expect(heavyWaves).toHaveLength(2);
    expect(heavyWaves.map((event) => event.count)).toEqual([3, 4]);
    expect(heavyWaves[0].pressure).toBeUndefined();
    expect(heavyWaves[1].pressure).toBe('reduced');
  });

  it('marks specific enemies as deterministic power-up carriers', () => {
    const waves = createDefaultStage();
    const drops = waves.flatMap((wave) => wave.drops ?? []);

    expect(drops).toEqual(
      expect.arrayContaining([
        { enemyIndex: 2, type: 'shot' },
        { enemyIndex: 1, type: 'life' },
        { enemyIndex: 3, type: 'score' },
      ]),
    );
    expect(drops).toHaveLength(6);
  });
});
