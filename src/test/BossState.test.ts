import { describe, expect, it } from 'vitest';
import { BOSS_MAX_HP, configureBossBody, isRenderableBossSprite } from '../game/bossState';

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
    };

    configureBossBody(body);

    expect(calls).toEqual(['immovable:true', 'pushable:false', 'velocity:0,0']);
  });

  it('gives the boss at least triple the original health budget', () => {
    expect(BOSS_MAX_HP).toBeGreaterThanOrEqual(180);
  });
});
