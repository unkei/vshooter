import { describe, expect, it } from 'vitest';
import { isRenderableBossSprite } from '../game/bossState';

describe('isRenderableBossSprite', () => {
  it('rejects missing, inactive, and invisible boss sprites', () => {
    expect(isRenderableBossSprite(null)).toBe(false);
    expect(isRenderableBossSprite({ active: false, visible: true })).toBe(false);
    expect(isRenderableBossSprite({ active: true, visible: false })).toBe(false);
  });

  it('accepts an active and visible boss sprite', () => {
    expect(isRenderableBossSprite({ active: true, visible: true })).toBe(true);
  });
});
