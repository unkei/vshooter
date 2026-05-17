import { describe, expect, it } from 'vitest';
import {
  BOSS_DEFEAT_CLEAR_DELAY_MS,
  BOSS_ENTRANCE_DELAY_MS,
  BOSS_HIT_FEEDBACK_MODE,
  BOSS_MAX_HP,
  createBossDefeatBursts,
  configureBossBody,
  disableBossBody,
  isRenderableBossSprite,
} from '../game/bossState';

describe('isRenderableBossSprite', () => {
  it('rejects missing, inactive, and invisible boss sprites', () => {
    expect(isRenderableBossSprite(null)).toBe(false);
    expect(isRenderableBossSprite({ active: false, visible: true })).toBe(false);
    expect(isRenderableBossSprite({ active: true, visible: false })).toBe(false);
  });

  it('accepts an active and visible boss sprite', () => {
    expect(isRenderableBossSprite({ active: true, visible: true })).toBe(true);
  });

  it('keeps the boss body kinematic so bullet hits cannot nudge it', () => {
    const calls: string[] = [];
    const body = {
      set moves(value: boolean) {
        calls.push(`moves:${value}`);
      },
      setImmovable(value: boolean) {
        calls.push(`immovable:${value}`);
        return this;
      },
      setPushable(value: boolean) {
        calls.push(`pushable:${value}`);
        return this;
      },
      setVelocity(x: number, y: number) {
        calls.push(`velocity:${x},${y}`);
        return this;
      },
      setAllowGravity(value: boolean) {
        calls.push(`gravity:${value}`);
        return this;
      },
    };

    configureBossBody(body);

    expect(calls).toEqual([
      'immovable:true',
      'pushable:false',
      'velocity:0,0',
      'gravity:false',
      'moves:false',
    ]);
  });

  it('triples the boss health budget from the previous tuning value', () => {
    expect(BOSS_MAX_HP).toBe(1890);
  });

  it('holds boss spawn briefly after regular enemies are gone for an entrance reaction', () => {
    expect(BOSS_ENTRANCE_DELAY_MS).toBeGreaterThanOrEqual(1500);
  });

  it('leaves time for a boss defeat reaction before the clear screen', () => {
    expect(BOSS_DEFEAT_CLEAR_DELAY_MS).toBeGreaterThanOrEqual(1200);
  });

  it('keeps normal boss hits visually stable until the defeat reaction', () => {
    expect(BOSS_HIT_FEEDBACK_MODE).toBe('none');
  });

  it('creates several boss defeat bursts around the boss center', () => {
    const bursts = createBossDefeatBursts(240, 120);

    expect(bursts).toHaveLength(7);
    expect(bursts[0]).toMatchObject({ x: 240, y: 120, delayMs: 0 });
    expect(new Set(bursts.map((burst) => burst.delayMs)).size).toBeGreaterThan(1);
  });

  it('ignores missing boss bodies when disabling defeat collision', () => {
    expect(() => disableBossBody(undefined)).not.toThrow();
  });

  it('disables boss collision when a live body exists', () => {
    const body = { enable: true };

    disableBossBody(body);

    expect(body.enable).toBe(false);
  });
});
