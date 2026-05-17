import { describe, expect, it } from 'vitest';
import {
  BOSS_TEXTURE_KEY,
  ENEMY_TEXTURE_KEYS,
  PLAYER_TEXTURE_KEY,
} from '../game/visualAssets';

describe('generated visual assets', () => {
  it('defines generated game-style textures for each character class', () => {
    expect(PLAYER_TEXTURE_KEY).toBe('vshooter.player.ship');
    expect(ENEMY_TEXTURE_KEYS).toEqual({
      straight: 'vshooter.enemy.straight',
      sway: 'vshooter.enemy.sway',
      heavy: 'vshooter.enemy.heavy',
    });
    expect(BOSS_TEXTURE_KEY).toBe('vshooter.boss.carrier');
  });
});
